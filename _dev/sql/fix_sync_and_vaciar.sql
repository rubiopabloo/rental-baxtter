-- ============================================================
-- FIX: Data sync across devices + Vaciar Todo button
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add columns for WhatsApp template and hotels list to temporada_config
--    so they sync across all devices (instead of using localStorage)
ALTER TABLE temporada_config ADD COLUMN IF NOT EXISTS wsp_template TEXT DEFAULT '';
ALTER TABLE temporada_config ADD COLUMN IF NOT EXISTS hoteles_list TEXT DEFAULT '';

-- 2. Add missing DELETE policy for items table
--    (Without this, Vaciar Todo fails silently because items can't be deleted)
DROP POLICY IF EXISTS "solo_admin_borra_items" ON items;
CREATE POLICY "solo_admin_borra_items" ON items
  FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Add missing DELETE policy for pasajeros table
--    (Vaciar Todo should also clean up orphaned pasajeros)
DROP POLICY IF EXISTS "solo_admin_borra_pasajeros" ON pasajeros;
CREATE POLICY "solo_admin_borra_pasajeros" ON pasajeros
  FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Add missing DELETE policy for reportes_semanales (if not already present)
DROP POLICY IF EXISTS "solo_admin_borra_reportes" ON reportes_semanales;
CREATE POLICY "solo_admin_borra_reportes" ON reportes_semanales
  FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Add UPDATE policy for items (needed for some operations)
DROP POLICY IF EXISTS "solo_admin_actualiza_items" ON items;
CREATE POLICY "solo_admin_actualiza_items" ON items
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================
-- 6. FIJACIÓN CRÍTICA: PERMISOS PARA PASAJEROS
-- ============================================================
-- Garantizar que los usuarios públicos (sin cuenta) puedan enviar solicitudes
DROP POLICY IF EXISTS "insert_publico_pasajeros" ON pasajeros;
CREATE POLICY "insert_publico_pasajeros" ON pasajeros FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "insert_publico_pedidos" ON pedidos;
CREATE POLICY "insert_publico_pedidos" ON pedidos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "insert_publico_items" ON items;
CREATE POLICY "insert_publico_items" ON items FOR INSERT WITH CHECK (true);

-- ============================================================
-- 7. FIJACIÓN CRÍTICA: BUCKET DE FOTOS
-- ============================================================
-- Crear automáticamente el bucket "fotos_pedidos" si no existe y hacerlo público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('fotos_pedidos', 'fotos_pedidos', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir que CUALQUIERA (público) pueda subir fotos al bucket
DROP POLICY IF EXISTS "Permitir_Subir_Fotos_Publico" ON storage.objects;
CREATE POLICY "Permitir_Subir_Fotos_Publico" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'fotos_pedidos');

-- Permitir que CUALQUIERA pueda ver las fotos del bucket
DROP POLICY IF EXISTS "Permitir_Leer_Fotos_Publico" ON storage.objects;
CREATE POLICY "Permitir_Leer_Fotos_Publico" ON storage.objects
FOR SELECT USING (bucket_id = 'fotos_pedidos');

-- ============================================================
-- 8. FIJACIÓN CRÍTICA: COLUMNAS FALTANTES EN PASAJEROS
-- ============================================================
-- Estas columnas fueron agregadas al formulario pero faltaban en la base de datos real,
-- lo que causaba un error 42703 (columna no existe) y bloqueaba toda la aplicación,
-- forzando a la app a usar el almacenamiento local.
ALTER TABLE pasajeros ADD COLUMN IF NOT EXISTS lider_coordinador VARCHAR(100);
ALTER TABLE pasajeros ADD COLUMN IF NOT EXISTS fecha_entrega_ropa DATE;
