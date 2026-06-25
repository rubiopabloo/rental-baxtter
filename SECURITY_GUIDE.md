# Guía de Seguridad — App Web Rental de Ropa (Egresados)

> **Contexto:** App pública con formulario de pedidos para ~1000 usuarios/semana. Backend en Supabase. Panel de administración con datos sensibles de pedidos. Sin autenticación en el frontend público.

---

## 1. Protección del Formulario Público

### 1.1 Rate Limiting (Límite de envíos)

Sin rate limiting, un atacante puede enviar miles de pedidos falsos en segundos y llenar la base de datos de basura.

**Implementar:**
- Máximo **5 envíos por IP cada 10 minutos** en el endpoint del formulario.
- Si usás Supabase Edge Functions o un backend propio (Node/Express), usar una librería como `express-rate-limit` o Cloudflare Rate Limiting si el sitio pasa por Cloudflare.
- En Supabase se puede hacer con un trigger o con una Edge Function que verifique frecuencia.

```js
// Ejemplo con Edge Function en Supabase
// Verificar timestamp del último pedido de esa IP antes de insertar
const { data: lastRequest } = await supabase
  .from('pedidos')
  .select('created_at')
  .eq('ip_address', clientIP)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

const minutesSinceLastRequest = (Date.now() - new Date(lastRequest?.created_at)) / 60000;
if (minutesSinceLastRequest < 10) {
  return new Response('Demasiados pedidos. Esperá unos minutos.', { status: 429 });
}
```

### 1.2 Validación de campos (frontend + backend)

**Nunca confiar solo en la validación del frontend.** Un atacante puede saltearla con herramientas como Postman o curl.

**Frontend (primera línea):**
- Campos requeridos marcados con `required`
- Longitud máxima en cada input (`maxlength="100"`)
- Tipo correcto (`type="text"`, `type="tel"`, etc.)
- Sin posibilidad de enviar el form vacío

**Backend / Supabase (línea definitiva):**
- Validar en Edge Function o en las reglas de la tabla que los campos no lleguen vacíos
- Definir longitud máxima en la columna de la base de datos (`VARCHAR(100)`)
- Rechazar y loguear cualquier envío que no cumpla el schema esperado

### 1.3 Honeypot anti-bots

Campo invisible para humanos pero visible para bots. Si viene con datos = es un bot.

```html
<!-- Agregar al formulario, oculto con CSS -->
<input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off">
```

```js
// En el backend, rechazar si ese campo viene con contenido
if (formData.website && formData.website !== '') {
  return { error: 'Bot detectado' }; // No informar al atacante qué pasó
}
```

### 1.4 CAPTCHA (opcional pero recomendado)

Si el honeypot no alcanza y aparecen envíos masivos, agregar **Cloudflare Turnstile** (gratis, no intrusivo, no hay que resolver puzzles).

- Documentación: https://developers.cloudflare.com/turnstile/
- Se integra con pocas líneas en el frontend y una verificación en el backend.

---

## 2. Prevención de Inyección de Código

### 2.1 SQL Injection

**Riesgo:** Un atacante escribe código SQL en los campos del formulario para manipular la base de datos.

**Con Supabase:** El cliente oficial de Supabase usa consultas parametrizadas por defecto, lo que previene SQL injection. **Nunca construyas queries concatenando strings con datos del usuario.**

```js
// ✅ CORRECTO — Supabase parametriza automáticamente
await supabase.from('pedidos').insert({
  nombre: formData.nombre,
  hotel: formData.hotel,
  habitacion: formData.habitacion,
  prenda: formData.prenda
});

// ❌ NUNCA HACER — Vulnerable
await supabase.rpc(`INSERT INTO pedidos WHERE nombre = '${formData.nombre}'`);
```

### 2.2 XSS — Cross-Site Scripting

**Riesgo:** Un usuario escribe `<script>alert('hack')</script>` en un campo, y ese texto se muestra en el panel de admin ejecutando código malicioso.

**Prevención:**
- Sanitizar todo texto del usuario antes de mostrarlo en el panel de admin.
- Usar funciones de escape HTML. En React, esto está activado por defecto (`{}` escapa HTML automáticamente). En HTML vanilla, usar `textContent` en vez de `innerHTML`.

```js
// ✅ Seguro en React
<td>{pedido.nombre}</td>

// ❌ Nunca hacer esto
<td dangerouslySetInnerHTML={{ __html: pedido.nombre }} />
```

```js
// Si usás JavaScript vanilla en el admin
function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}
// Usar siempre escapeHtml(pedido.nombre) antes de insertarlo en el DOM
```

- En Supabase, podés agregar una función de sanitización al momento de la inserción que elimine tags HTML:

```sql
-- Función simple en PostgreSQL para strip HTML
CREATE OR REPLACE FUNCTION strip_html(input TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(input, '<[^>]*>', '', 'g');
END;
$$ LANGUAGE plpgsql;
```

---

## 3. Seguridad del Panel de Administración

### 3.1 Autenticación obligatoria

El panel de admin es el activo más crítico. **Nunca debe ser accesible sin login.**

**Con Supabase Auth:**
- Crear un usuario admin con email/contraseña en Supabase Auth
- Proteger todas las rutas del panel verificando sesión activa
- Si el token expira, redirigir al login automáticamente

```js
// Al cargar el panel de admin
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.href = '/login'; // Redirigir si no está autenticado
}
```

### 3.2 Row Level Security (RLS) en Supabase — MUY IMPORTANTE

RLS es el firewall de tu base de datos. Sin él, **cualquiera que tenga la clave pública de Supabase puede leer y escribir todos los datos.**

**Activar RLS en todas las tablas:**

```sql
-- Activar RLS
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Política: cualquiera puede insertar (formulario público)
CREATE POLICY "insert_publico" ON pedidos
  FOR INSERT WITH CHECK (true);

-- Política: solo el admin autenticado puede leer y actualizar
CREATE POLICY "solo_admin_lee" ON pedidos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "solo_admin_actualiza" ON pedidos
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Nadie puede borrar desde la app (solo desde el dashboard de Supabase)
-- No crear política de DELETE
```

### 3.3 Contraseña segura y 2FA para el admin

- Contraseña de mínimo 16 caracteres, generada con un gestor de contraseñas (Bitwarden, 1Password)
- Activar autenticación de dos factores (2FA) en la cuenta de Supabase
- **No compartir** las credenciales de admin por WhatsApp o email sin cifrar

### 3.4 URL del panel de admin no predecible

Evitar rutas obvias como `/admin`, `/dashboard`, `/panel`.

Usar algo como `/gestion-egresados-2025` o similar. No es seguridad real, pero reduce el ruido de bots que escanean rutas comunes.

---

## 4. Protección de Claves y Variables de Entorno

### 4.1 Nunca exponer claves secretas en el frontend

Supabase tiene dos claves:
- `anon key` (pública) — puede usarse en el frontend, está diseñada para eso
- `service_role key` (secreta) — **NUNCA va en el frontend**, solo en servidores o Edge Functions

```js
// ✅ OK en el frontend
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ❌ NUNCA en el frontend
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
```

### 4.2 Variables de entorno

- Usar archivos `.env` para las claves
- Agregar `.env` al `.gitignore` para que nunca se suba a GitHub
- En producción, configurar las variables en la plataforma de deploy (Vercel, Netlify, etc.), no en el código

```bash
# .env (NUNCA subir a git)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

```bash
# .gitignore
.env
.env.local
.env.production
```

---

## 5. Headers de Seguridad HTTP

Los headers de seguridad son instrucciones que el servidor le da al navegador para proteger al usuario. Son fáciles de configurar y bloquean varios vectores de ataque.

**Si usás Vercel**, crear un archivo `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.supabase.co"
        }
      ]
    }
  ]
}
```

**Si usás Netlify**, crear `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

**Qué hace cada uno:**
- `X-Frame-Options: DENY` — impide que tu sitio sea incrustado en iframes (previene clickjacking)
- `X-Content-Type-Options: nosniff` — impide que el navegador ejecute archivos con tipo MIME incorrecto
- `Content-Security-Policy` — define desde dónde se pueden cargar scripts, estilos, etc.

---

## 6. Protección contra Abuso de Datos

### 6.1 No exponer datos innecesarios en el frontend público

El formulario público no debe saber nada sobre los otros pedidos. La respuesta al envío exitoso debe ser solo un mensaje de confirmación, nunca un ID de base de datos ni datos de otros usuarios.

```js
// ✅ Respuesta correcta al usuario tras el envío
{ success: true, message: "Tu pedido fue recibido. Te contactamos pronto." }

// ❌ No devolver esto
{ id: 1547, todos_los_pedidos: [...] }
```

### 6.2 Guardar IP de origen (para auditoría)

Al insertar el pedido, guardar la IP del cliente. Sirve para detectar abuso y bloquear si es necesario.

```js
// En la Edge Function o backend
const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip');
await supabase.from('pedidos').insert({
  ...formData,
  ip_origen: clientIP,
  created_at: new Date().toISOString()
});
```

### 6.3 Evitar enumerar pedidos por ID

No exponer URLs como `/pedido/1`, `/pedido/2` que permiten enumerar todos los pedidos. Si necesitás links para seguimiento, usar UUIDs (`/pedido/a3f1c2d4-...`).

Supabase genera UUIDs automáticamente si configurás la columna `id` como `uuid` con `default: gen_random_uuid()`.

---

## 7. Checklist de Seguridad — Antes de Lanzar

Pasar por esta lista antes de poner la app en producción:

- [ ] RLS activado en todas las tablas de Supabase
- [ ] `service_role key` nunca está en el frontend
- [ ] `.env` está en `.gitignore` y no se subió a ningún repositorio público
- [ ] El panel de admin requiere login para acceder
- [ ] El formulario tiene rate limiting (máximo N envíos por IP por período)
- [ ] Los campos del formulario tienen validación tanto en frontend como en backend
- [ ] El honeypot anti-bot está implementado
- [ ] Los datos del usuario se muestran en el admin con escape de HTML (sin `innerHTML`)
- [ ] Los headers de seguridad HTTP están configurados
- [ ] La URL del panel de admin no es `/admin` ni `/dashboard`
- [ ] La contraseña del admin es fuerte y tiene 2FA activado en Supabase
- [ ] No se devuelven datos sensibles ni IDs internos al formulario público

---

## 8. Qué hacer si hay un Ataque

1. **Flood de formularios (spam masivo):** Activar rate limiting más estricto y/o CAPTCHA. Si usás Cloudflare, activar "Under Attack Mode" temporalmente.

2. **Datos basura en la base de datos:** Agregar filtro de validación más estricto en la Edge Function. Limpiar registros falsos con una query desde el dashboard de Supabase.

3. **Alguien accedió al admin sin permiso:** Revocar sesiones activas desde Supabase Auth → Users → Invalidar sesiones. Cambiar contraseña inmediatamente. Revisar logs de acceso.

4. **Clave de Supabase expuesta (por ejemplo, subida a GitHub):** Ir a Supabase Dashboard → Settings → API → Regenerar la `anon key` inmediatamente. La vieja clave queda inválida.

---

*Este documento está pensado para ser entregado al agente de IA que construye la aplicación. Implementar todos los puntos del checklist antes del lanzamiento.*
