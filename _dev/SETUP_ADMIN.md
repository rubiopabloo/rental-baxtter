# Setup del Login Admin (Supabase Auth real)

El login del panel ahora usa **Supabase Auth real** (sin contraseñas en el código).
Para que funcione hay que crear los usuarios en Supabase **una sola vez**.

## 1. Desactivar confirmación por email
En el dashboard de Supabase:
- **Authentication → Providers → Email**
- Desactivar **"Confirm email"** (Enable email confirmations = OFF)
- Guardar.

> Si esto queda activado, los usuarios nuevos no podrán entrar hasta confirmar un mail que no existe.

## 2. Crear los usuarios admin
En **Authentication → Users → Add user → Create new user**, crear uno por persona
con su **email real** y una **contraseña distinta** cada uno. Marcar **"Auto Confirm User"**.

Emails en uso actualmente:
- `rubiopablolionel@gmail.com`
- `aristidesscarafia@gmail.com`
- `usuariorental@rental.com`

## 3. Cómo se loguean
En `admin.html` cada persona escribe **su email completo** (el mismo que está en Supabase)
y **su contraseña**. El login valida directo contra Supabase Auth (sin transformar nada),
así que sirve cualquier email — no hay nada cableado en el código.

## 4. (Recomendado) Endurecer la base de datos
Aplicar `_dev/sql/rls_hardening_auth.sql` en el SQL Editor para que:
- el formulario público solo pueda **leer hoteles/líderes** e **insertar pedidos**, y
- toda edición/borrado del panel requiera **estar logueado**.

Probar el formulario público **y** el panel después de aplicarlo.

## 5. Cambiar / agregar usuarios después
Se hace 100% desde **Authentication → Users** en Supabase. No hay que tocar el código.
