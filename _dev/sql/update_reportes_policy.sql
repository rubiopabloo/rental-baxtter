-- SQL Patch: Habilitar eliminación de reportes en la tabla reportes_semanales para administradores
-- Copiar y ejecutar esta instrucción en el SQL Editor de su Dashboard de Supabase.

DROP POLICY IF EXISTS "solo_admin_borra_reportes" ON reportes_semanales;
CREATE POLICY "solo_admin_borra_reportes" ON reportes_semanales
  FOR DELETE USING (auth.role() = 'authenticated');
