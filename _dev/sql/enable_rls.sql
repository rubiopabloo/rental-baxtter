-- SQL Snippet: Habilitación de Row Level Security (RLS) en Supabase
-- IMPORTANTE: Ejecutar en el SQL Editor de Supabase

-- 1. Habilitar RLS en todas las tablas activas
ALTER TABLE temporada_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE pasajeros ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lideres_semana ENABLE ROW LEVEL SECURITY;
ALTER TABLE lideres_operativo ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_semanales ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscripciones_push ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- 2. Crear políticas (Policies) para lectura/escritura anónima controlada
-- (Ajustar según necesidad si el Admin usa Auth. Si toda la app usa el Anon Key:)
CREATE POLICY "Permitir SELECT a anon" ON temporada_config FOR SELECT USING (true);
CREATE POLICY "Permitir INSERT a anon" ON temporada_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir UPDATE a anon" ON temporada_config FOR UPDATE USING (true);
CREATE POLICY "Permitir DELETE a anon" ON temporada_config FOR DELETE USING (true);

-- (Nota: Para un entorno de producción, las políticas de UPDATE, INSERT y DELETE 
-- deberían limitarse a usuarios autenticados si usas el sistema de Auth de Supabase.
-- Por ejemplo, reemplazando 'true' por 'auth.role() = ''authenticated''')
