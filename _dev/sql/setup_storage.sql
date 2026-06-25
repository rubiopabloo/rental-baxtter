-- ============================================================
-- SCRIPT DE CONFIGURACIÓN DE STORAGE (FOTOS)
-- ============================================================
-- Este script crea el bucket 'fotos_pedidos' para almacenar
-- las fotos subidas por los pasajeros y les da permisos
-- para que puedan subir fotos y los administradores puedan verlas.
-- 
-- IMPORTANTE: Ejecutar esto en el SQL Editor de Supabase.
-- ============================================================

-- 1. Crear el bucket si no existe (Habilitar acceso público)
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos_pedidos', 'fotos_pedidos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Permitir lectura pública (para poder ver las fotos en el dashboard)
DROP POLICY IF EXISTS "permite_lectura_fotos" ON storage.objects;
CREATE POLICY "permite_lectura_fotos" ON storage.objects
  FOR SELECT USING (bucket_id = 'fotos_pedidos');

-- 3. Permitir inserción pública (para que el formulario web pueda subir fotos)
DROP POLICY IF EXISTS "permite_escritura_fotos" ON storage.objects;
CREATE POLICY "permite_escritura_fotos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'fotos_pedidos');

-- 4. Opcional: Permitir borrar fotos si hace falta (admins)
DROP POLICY IF EXISTS "permite_borrado_fotos" ON storage.objects;
CREATE POLICY "permite_borrado_fotos" ON storage.objects
  FOR DELETE USING (bucket_id = 'fotos_pedidos');
