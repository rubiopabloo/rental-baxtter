-- Esquema de Base de Datos PostgreSQL para Supabase (App Rental Baxtter)
-- IMPORTANTE: Ejecutar este SQL en el SQL Editor de Supabase Dashboard.

-- 1. Tabla de Operadores
CREATE TABLE IF NOT EXISTS operadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'Operador',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Pasajeros
CREATE TABLE IF NOT EXISTS pasajeros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    dni VARCHAR(15),
    colegio VARCHAR(100),
    hotel VARCHAR(100) NOT NULL,
    habitacion VARCHAR(20) NOT NULL,
    lider_coordinador VARCHAR(100),
    fecha_entrega_ropa DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 Tabla de Líderes de la Semana
CREATE TABLE IF NOT EXISTS lideres_semana (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    whatsapp VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pasajero_id UUID REFERENCES pasajeros(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
    motivo VARCHAR(100),
    observaciones TEXT,
    operador_id UUID REFERENCES operadores(id) ON DELETE SET NULL,
    lider_id UUID REFERENCES lideres_semana(id) ON DELETE SET NULL,
    semana_archivada BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabla de Items (Prendas del Pedido)
--    foto_url_1 y foto_url_2: URLs de imágenes en Supabase Storage (máximo 2 fotos por item)
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    tipo_prenda VARCHAR(50) NOT NULL,
    talle VARCHAR(20) NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    motivo VARCHAR(100),
    observaciones TEXT,
    foto_url_1 TEXT,
    foto_url_2 TEXT,
    foto_url_3 TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Índices de Búsqueda Rápida
CREATE INDEX IF NOT EXISTS idx_pedidos_pasajero ON pedidos(pasajero_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_operador ON pedidos(operador_id);
CREATE INDEX IF NOT EXISTS idx_items_pedido ON items(pedido_id);

-- 6. Configuración de Semanas
CREATE TABLE IF NOT EXISTS configuracion_semana (
    id INTEGER PRIMARY KEY DEFAULT 1,
    nombre_semana VARCHAR(100) NOT NULL DEFAULT 'Semana 1 / Vuelta 1',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO configuracion_semana (id, nombre_semana)
VALUES (1, 'Semana 1 / Vuelta 1')
ON CONFLICT (id) DO NOTHING;

-- 6.5 Tabla de Reportes Semanales (PDFs generados)
CREATE TABLE IF NOT EXISTS reportes_semanales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semana_nombre VARCHAR(100) NOT NULL,
    archivo_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Colegios de la Semana
CREATE TABLE IF NOT EXISTS colegios_semana (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    entregado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SEGURIDAD: Row Level Security (RLS)
-- Ref: SECURITY_GUIDE.md §3.2
-- ============================================================

-- Activar RLS en TODAS las tablas
ALTER TABLE operadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pasajeros ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_semana ENABLE ROW LEVEL SECURITY;
ALTER TABLE colegios_semana ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_semanales ENABLE ROW LEVEL SECURITY;
ALTER TABLE lideres_semana ENABLE ROW LEVEL SECURITY;

-- === Políticas para REPORTES SEMANALES ===
DROP POLICY IF EXISTS "solo_admin_lee_reportes" ON reportes_semanales;
CREATE POLICY "solo_admin_lee_reportes" ON reportes_semanales
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "solo_admin_inserta_reportes" ON reportes_semanales;
CREATE POLICY "solo_admin_inserta_reportes" ON reportes_semanales
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- === Políticas para PASAJEROS ===
DROP POLICY IF EXISTS "insert_publico_pasajeros" ON pasajeros;
CREATE POLICY "insert_publico_pasajeros" ON pasajeros
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "solo_admin_lee_pasajeros" ON pasajeros;
CREATE POLICY "solo_admin_lee_pasajeros" ON pasajeros
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "solo_admin_actualiza_pasajeros" ON pasajeros;
CREATE POLICY "solo_admin_actualiza_pasajeros" ON pasajeros
  FOR UPDATE USING (auth.role() = 'authenticated');

-- === Políticas para PEDIDOS ===
DROP POLICY IF EXISTS "insert_publico_pedidos" ON pedidos;
CREATE POLICY "insert_publico_pedidos" ON pedidos
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "solo_admin_lee_pedidos" ON pedidos;
CREATE POLICY "solo_admin_lee_pedidos" ON pedidos
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "solo_admin_actualiza_pedidos" ON pedidos;
CREATE POLICY "solo_admin_actualiza_pedidos" ON pedidos
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "solo_admin_borra_pedidos" ON pedidos;
CREATE POLICY "solo_admin_borra_pedidos" ON pedidos
  FOR DELETE USING (auth.role() = 'authenticated');

-- === Políticas para ITEMS ===
DROP POLICY IF EXISTS "insert_publico_items" ON items;
CREATE POLICY "insert_publico_items" ON items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "solo_admin_lee_items" ON items;
CREATE POLICY "solo_admin_lee_items" ON items
  FOR SELECT USING (auth.role() = 'authenticated');

-- === Políticas para OPERADORES ===
DROP POLICY IF EXISTS "solo_admin_lee_operadores" ON operadores;
CREATE POLICY "solo_admin_lee_operadores" ON operadores
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "solo_admin_inserta_operadores" ON operadores;
CREATE POLICY "solo_admin_inserta_operadores" ON operadores
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- === Políticas para CONFIGURACION_SEMANA ===
DROP POLICY IF EXISTS "lectura_publica_semana" ON configuracion_semana;
CREATE POLICY "lectura_publica_semana" ON configuracion_semana
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "solo_admin_actualiza_semana" ON configuracion_semana;
CREATE POLICY "solo_admin_actualiza_semana" ON configuracion_semana
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "solo_admin_inserta_semana" ON configuracion_semana;
CREATE POLICY "solo_admin_inserta_semana" ON configuracion_semana
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- === Políticas para COLEGIOS_SEMANA ===
DROP POLICY IF EXISTS "lectura_publica_colegios" ON colegios_semana;
CREATE POLICY "lectura_publica_colegios" ON colegios_semana
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "solo_admin_inserta_colegios" ON colegios_semana;
CREATE POLICY "solo_admin_inserta_colegios" ON colegios_semana
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "solo_admin_actualiza_colegios" ON colegios_semana;
CREATE POLICY "solo_admin_actualiza_colegios" ON colegios_semana
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "solo_admin_borra_colegios" ON colegios_semana;
CREATE POLICY "solo_admin_borra_colegios" ON colegios_semana
  FOR DELETE USING (auth.role() = 'authenticated');

-- === Políticas para LIDERES_SEMANA ===
DROP POLICY IF EXISTS "solo_admin_lee_lideres" ON lideres_semana;
CREATE POLICY "solo_admin_lee_lideres" ON lideres_semana
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "solo_admin_inserta_lideres" ON lideres_semana;
CREATE POLICY "solo_admin_inserta_lideres" ON lideres_semana
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "solo_admin_actualiza_lideres" ON lideres_semana;
CREATE POLICY "solo_admin_actualiza_lideres" ON lideres_semana
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "solo_admin_borra_lideres" ON lideres_semana;
CREATE POLICY "solo_admin_borra_lideres" ON lideres_semana
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE: Bucket para fotos de pedidos
-- NOTA: Crear el bucket 'fotos_pedidos' manualmente en Supabase
--       Dashboard > Storage > New Bucket > Nombre: fotos_pedidos
--       Marcar como "Public" para que las URLs sean accesibles.
--
-- Luego agregar esta policy de Storage en el SQL Editor:
-- ============================================================

-- Permitir a cualquiera subir archivos al bucket fotos_pedidos
-- (Ejecutar en Supabase SQL Editor después de crear el bucket)
/*
CREATE POLICY "upload_publico_fotos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'fotos_pedidos');

CREATE POLICY "lectura_publica_fotos" ON storage.objects
  FOR SELECT USING (bucket_id = 'fotos_pedidos');
*/

-- ============================================================
-- FUNCIÓN para sanitizar HTML (prevención XSS en backend)
-- Ref: SECURITY_GUIDE.md §2.2
-- ============================================================
CREATE OR REPLACE FUNCTION strip_html(input TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(input, '<[^>]*>', '', 'g');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- IMPORTANTE: EJECUTAR ESTO SI LA TABLA ITEMS YA EXISTÍA
-- (Asegura que las columnas de fotos existan para solucionar
-- el bug de imágenes no guardadas)
-- ============================================================
ALTER TABLE items ADD COLUMN IF NOT EXISTS foto_url_1 TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS foto_url_2 TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS foto_url_3 TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS motivo VARCHAR(100);
ALTER TABLE items ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE pasajeros ADD COLUMN IF NOT EXISTS dni VARCHAR(15);
