# Reglas Críticas de Codificación en Windows (Evitar Errores de Tildes y Ñ)

**EL PROBLEMA:**
Al editar archivos en este entorno (Windows PowerShell), las herramientas de escritura o reemplazo a veces asumen una codificación `ANSI` o `Windows-1252` en lugar de `UTF-8`. Esto provoca que todos los caracteres especiales en español (como `á`, `é`, `í`, `ó`, `ú`, `ñ`) se guarden de forma corrupta (ej: `Ã³` o ``).

Esta corrupción no solo arruina la estética visual (textos con "iconos raros"), sino que si se rompe una cadena de texto en JavaScript, **todo el archivo falla al cargar y los usuarios no pueden entrar al sistema** (pantalla en blanco o botones que no funcionan).

**LA SOLUCIÓN / REGLAS PARA AGENTES IA:**

1. **Evitar modificar líneas con tildes directamente:** Si necesitas insertar o modificar código que contiene texto en español, NO confíes en la codificación del script que estás ejecutando.
2. **Usar secuencias de escape:**
   - En **JavaScript**, usa secuencias Unicode para los strings:
     - `á` = `\u00e1`
     - `é` = `\u00e9`
     - `í` = `\u00ed`
     - `ó` = `\u00f3`
     - `ú` = `\u00fa`
     - `ñ` = `\u00f1`
     - `Á` = `\u00c1`
     - `Í` = `\u00cd`
   - En **HTML**, usa entidades HTML:
     - `á` = `&aacute;`
     - `é` = `&eacute;`
     - `í` = `&iacute;`
     - `ó` = `&oacute;`
     - `ú` = `&uacute;`
     - `ñ` = `&ntilde;`
3. **Escritura Segura:** Al usar scripts de PowerShell o Python para inyectar código masivo, SIEMPRE usar solo caracteres ASCII en el script inyector, y que el texto final se construya con las entidades mencionadas.
4. **Verificación:** Si el usuario reporta "no puedo entrar al sistema", lo primero que se debe comprobar es si una corrupción de codificación rompió la sintaxis de `js/admin.js`. Restaura el archivo a su último estado funcional en Git antes de intentar "arreglarlo" parcheando caracteres.
