-- ============================================================
-- MIGRACION: Actualizar check constraints de estados (Con limpieza de datos)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Eliminar restricciones de chequeo existentes temporalmente
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_estado_seguimiento_check;
ALTER TABLE historial_estados DROP CONSTRAINT IF EXISTS historial_estados_estado_check;

-- 2. Actualizar/Migrar filas existentes que tengan estados viejos a los nuevos estados
UPDATE pedidos 
SET estado_seguimiento = CASE 
  WHEN estado_seguimiento = 'preparacion' THEN 'evaluacion'
  WHEN estado_seguimiento = 'en_camino' THEN 'aprobado'
  WHEN estado_seguimiento = 'con_problema' THEN 'rechazado'
  ELSE 'recibido'
END
WHERE estado_seguimiento NOT IN ('recibido', 'evaluacion', 'aprobado', 'rechazado', 'entregado');

UPDATE historial_estados 
SET estado = CASE 
  WHEN estado = 'preparacion' THEN 'evaluacion'
  WHEN estado = 'en_camino' THEN 'aprobado'
  WHEN estado = 'con_problema' THEN 'rechazado'
  ELSE 'recibido'
END
WHERE estado NOT IN ('recibido', 'evaluacion', 'aprobado', 'rechazado', 'entregado');

-- 3. Agregar las nuevas restricciones de chequeo actualizadas
ALTER TABLE pedidos ADD CONSTRAINT pedidos_estado_seguimiento_check
  CHECK (estado_seguimiento IN ('recibido', 'evaluacion', 'aprobado', 'rechazado', 'entregado'));

ALTER TABLE historial_estados ADD CONSTRAINT historial_estados_estado_check
  CHECK (estado IN ('recibido', 'evaluacion', 'aprobado', 'rechazado', 'entregado'));

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================
