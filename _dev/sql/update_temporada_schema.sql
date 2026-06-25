-- Eliminar tabla vieja si existe
DROP TABLE IF EXISTS configuracion_semana;

-- Crear tabla de configuración de temporada
CREATE TABLE IF NOT EXISTS temporada_config (
    id INT PRIMARY KEY DEFAULT 1,
    inicio_semana_1 DATE NOT NULL,
    fin_semana_1 DATE NOT NULL,
    temporada_pausada BOOLEAN DEFAULT false,
    colegios_semana TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Asegurar que solo exista el id 1
ALTER TABLE temporada_config ADD CONSTRAINT single_row_check CHECK (id = 1);

-- Insertar fila inicial por defecto
INSERT INTO temporada_config (id, inicio_semana_1, fin_semana_1, temporada_pausada, colegios_semana)
VALUES (1, '2026-06-20', '2026-06-27', true, '')
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE temporada_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public select for temporada_config" ON temporada_config FOR SELECT USING (true);
CREATE POLICY "Public update for temporada_config" ON temporada_config FOR UPDATE USING (true);
CREATE POLICY "Public insert for temporada_config" ON temporada_config FOR INSERT WITH CHECK (true);
