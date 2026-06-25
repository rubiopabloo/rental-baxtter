-- ============================================================
-- Migración: Agregar DNI a pasajeros + foto_url_3 a items
--            + motivo/observaciones por item (multi-prenda)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar columna DNI a pasajeros
ALTER TABLE pasajeros ADD COLUMN IF NOT EXISTS dni VARCHAR(15);

-- 2. Agregar foto_url_3 a items (para soportar 3 fotos por prenda)
ALTER TABLE items ADD COLUMN IF NOT EXISTS foto_url_3 TEXT;

-- 3. Agregar motivo y observaciones por item (para multi-prenda)
--    Cada prenda ahora tiene su propio motivo y observaciones
ALTER TABLE items ADD COLUMN IF NOT EXISTS motivo VARCHAR(100);
ALTER TABLE items ADD COLUMN IF NOT EXISTS observaciones TEXT;
