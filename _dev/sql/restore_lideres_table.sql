-- Script para restaurar/crear la tabla lideres_semana y habilitar RLS
-- Ejecuta este script en el SQL Editor de Supabase si la tabla no se reconoce correctamente o para recargar el schema cache.

-- 1. Crear tabla lideres_semana si no existe
CREATE TABLE IF NOT EXISTS public.lideres_semana (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    whatsapp VARCHAR(30) NOT NULL,
    colegios_asignados TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar que la columna colegios_asignados exista si la tabla ya existía
ALTER TABLE public.lideres_semana ADD COLUMN IF NOT EXISTS colegios_asignados TEXT DEFAULT '';


-- 2. Asegurar que la tabla pedidos tenga la columna lider_id y la clave foránea
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'pedidos' 
          AND column_name = 'lider_id'
    ) THEN
        ALTER TABLE public.pedidos ADD COLUMN lider_id UUID REFERENCES public.lideres_semana(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Habilitar RLS en public.lideres_semana
ALTER TABLE public.lideres_semana ENABLE ROW LEVEL SECURITY;

-- 4. Definir políticas permisivas públicas de lectura, inserción y borrado para facilitar la integración directa por ahora
DROP POLICY IF EXISTS "permitir_todo_lideres" ON public.lideres_semana;
CREATE POLICY "permitir_todo_lideres" ON public.lideres_semana
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. Recargar la cache del esquema en Supabase (opcional/automático al correr DDL)
NOTIFY pgrst, 'reload schema';
