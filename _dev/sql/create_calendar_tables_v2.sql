-- Script para crear las tablas dedicadas del calendario operativo
-- Ejecuta esto en el editor SQL de Supabase

-- 1. Crear tabla de categorías
CREATE TABLE IF NOT EXISTS calendar_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de eventos
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME,
    categoria_id UUID REFERENCES calendar_categories(id) ON DELETE CASCADE,
    descripcion TEXT,
    semana_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Políticas de seguridad (RLS) - Permite acceso total a usuarios anónimos/públicos (según tu configuración actual)
ALTER TABLE calendar_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access calendar_categories" ON calendar_categories FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access calendar_events" ON calendar_events FOR ALL USING (true) WITH CHECK (true);

-- Insertar categorías por defecto si la tabla está vacía
INSERT INTO calendar_categories (nombre, color)
SELECT 'Llegada Colegio', '#3b82f6'
WHERE NOT EXISTS (SELECT 1 FROM calendar_categories LIMIT 1);

INSERT INTO calendar_categories (nombre, color)
SELECT 'Operativo', '#ef4444'
WHERE NOT EXISTS (SELECT 1 FROM calendar_categories LIMIT 1);

INSERT INTO calendar_categories (nombre, color)
SELECT 'Reunión Líderes', '#10b981'
WHERE NOT EXISTS (SELECT 1 FROM calendar_categories LIMIT 1);
