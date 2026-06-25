-- ============================================================
-- SCRIPT PARA AGREGAR COLUMNAS FALTANTES EN PASAJEROS
-- ============================================================
-- Si recibes el error "column pasajeros_1.lider_coordinador does not exist",
-- significa que tu base de datos fue creada con una versión antigua
-- y le faltan estas dos columnas.
--
-- IMPORTANTE: Ejecuta esto en el SQL Editor de Supabase.
-- ============================================================

ALTER TABLE pasajeros 
ADD COLUMN IF NOT EXISTS lider_coordinador VARCHAR(100),
ADD COLUMN IF NOT EXISTS fecha_entrega_ropa DATE;
