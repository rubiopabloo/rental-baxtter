-- Script para actualizar la base de datos de Rental Baxtter
-- IMPORTANTE: Ejecutar este SQL en el SQL Editor de Supabase Dashboard.

-- 1. Eliminar tablas relacionadas al seguimiento y notificaciones push
DROP TABLE IF EXISTS historial_estados CASCADE;
DROP TABLE IF EXISTS suscripciones_push CASCADE;

-- 2. Modificar tabla pasajeros
ALTER TABLE pasajeros DROP COLUMN IF EXISTS telefono;
ALTER TABLE pasajeros ADD COLUMN IF EXISTS lider_coordinador VARCHAR(100);
ALTER TABLE pasajeros ADD COLUMN IF EXISTS fecha_entrega_ropa DATE;

-- 3. Crear tabla lideres_semana
CREATE TABLE IF NOT EXISTS lideres_semana (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    whatsapp VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Modificar tabla pedidos
ALTER TABLE pedidos ADD COLUMN IF EXISTS lider_id UUID REFERENCES lideres_semana(id) ON DELETE SET NULL;
-- Limpiar columnas obsoletas de tracking
ALTER TABLE pedidos DROP COLUMN IF EXISTS access_token;
ALTER TABLE pedidos DROP COLUMN IF EXISTS estado_seguimiento;
ALTER TABLE pedidos DROP COLUMN IF EXISTS numero_pasajero;

-- 5. Habilitar RLS en lideres_semana
ALTER TABLE lideres_semana ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para lideres_semana
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

-- 7. Colegios de la semana (Opcional, los listamos dinamicamente pero dejamos la tabla para reportes historicos si fuera necesario, o la dejamos tal cual y solo no la usamos en frontend)
-- Se mantendrá la tabla colegios_semana sin uso activo en JS para no romper registros pasados.
