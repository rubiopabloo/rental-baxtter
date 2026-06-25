-- Script para agregar columnas de eventos de calendario a la tabla temporada_config
-- Ejecuta esto en el editor SQL de Supabase

ALTER TABLE temporada_config ADD COLUMN IF NOT EXISTS cal_events TEXT DEFAULT '[]';
ALTER TABLE temporada_config ADD COLUMN IF NOT EXISTS cal_categories TEXT DEFAULT '[]';
