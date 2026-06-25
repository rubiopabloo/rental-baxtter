-- ============================================================
-- FIX RLS: Permisos para inserción desde el formulario web
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Permitir lectura de pasajeros al insertar 
-- (Requerido por PostgREST cuando se hace un .insert().select())
DROP POLICY IF EXISTS "solo_admin_lee_pasajeros" ON pasajeros;
CREATE POLICY "pasajeros_select_publico" ON pasajeros
  FOR SELECT USING (true);

-- 2. Permitir a usuarios anónimos insertar el historial inicial 
-- (Sin esto, la transacción de pedido completo falla)
DROP POLICY IF EXISTS "historial_insert_admin" ON historial_estados;
CREATE POLICY "historial_insert_publico" ON historial_estados
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- FIN DEL FIX
-- ============================================================
