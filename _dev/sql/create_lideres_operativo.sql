-- Crear tabla para almacenar el directorio general de líderes del operativo
CREATE TABLE IF NOT EXISTS public.lideres_operativo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    colegios_asignados TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Seguridad a Nivel de Fila)
ALTER TABLE public.lideres_operativo ENABLE ROW LEVEL SECURITY;

-- Crear políticas para permitir lectura/escritura anónima (ajustado a la arquitectura del proyecto local)
CREATE POLICY "Permitir select a todos en lideres_operativo"
    ON public.lideres_operativo FOR SELECT
    USING (true);

CREATE POLICY "Permitir insert a todos en lideres_operativo"
    ON public.lideres_operativo FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Permitir update a todos en lideres_operativo"
    ON public.lideres_operativo FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Permitir delete a todos en lideres_operativo"
    ON public.lideres_operativo FOR DELETE
    USING (true);
