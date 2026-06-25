-- ============================================================
-- RLS HARDENING — Rental Baxtter (para login con Supabase Auth real)
-- ============================================================
-- Objetivo:
--   * El formulario PÚBLICO (anon key) solo puede hacer lo mínimo:
--       - leer hoteles/colegios (temporada_config) y líderes (lideres_semana)
--       - insertar su pedido (pasajeros, pedidos, items)
--       - registrar suscripción push
--   * Toda EDICIÓN/BORRADO y la gestión (colegios, líderes, reportes,
--     calendario, config) requiere usuario AUTENTICADO (el admin logueado).
--
-- IMPORTANTE:
--   1. Ejecutar en el SQL Editor de Supabase.
--   2. Antes, crear los 3 usuarios admin en Authentication → Users
--      (ver guía SETUP_ADMIN.md) y desactivar "Confirm email".
--   3. Probar el formulario público Y el panel admin después de aplicar.
-- ============================================================

-- Habilitar RLS (idempotente)
ALTER TABLE temporada_config     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pasajeros            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE items                ENABLE ROW LEVEL SECURITY;
ALTER TABLE lideres_semana       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lideres_operativo    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_semanales   ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscripciones_push   ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events      ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Helper: limpiar políticas viejas "todo público" si existen
-- (Ajustá los nombres si tus políticas se llaman distinto)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Permitir SELECT a anon" ON temporada_config;
DROP POLICY IF EXISTS "Permitir INSERT a anon" ON temporada_config;
DROP POLICY IF EXISTS "Permitir UPDATE a anon" ON temporada_config;
DROP POLICY IF EXISTS "Permitir DELETE a anon" ON temporada_config;

-- ============================================================
-- LECTURA PÚBLICA (lo que el formulario necesita mostrar)
-- ============================================================
CREATE POLICY "pub_select_temporada"  ON temporada_config  FOR SELECT USING (true);
CREATE POLICY "pub_select_lideres"    ON lideres_semana    FOR SELECT USING (true);
-- PostgREST puede requerir SELECT al insertar pasajeros:
CREATE POLICY "pub_select_pasajeros"  ON pasajeros         FOR SELECT USING (true);

-- ============================================================
-- ALTA PÚBLICA (envío del formulario)
-- ============================================================
CREATE POLICY "pub_insert_pasajeros"  ON pasajeros          FOR INSERT WITH CHECK (true);
CREATE POLICY "pub_insert_pedidos"    ON pedidos            FOR INSERT WITH CHECK (true);
CREATE POLICY "pub_insert_items"      ON items              FOR INSERT WITH CHECK (true);
CREATE POLICY "pub_insert_push"       ON suscripciones_push FOR INSERT WITH CHECK (true);

-- ============================================================
-- ADMIN AUTENTICADO: control total
-- (auth.role() = 'authenticated' => solo con sesión de Supabase Auth)
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'temporada_config','pasajeros','pedidos','items',
    'lideres_semana','lideres_operativo','reportes_semanales',
    'suscripciones_push','calendar_categories','calendar_events'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "admin_all_%1$s" ON %1$I FOR ALL
         USING (auth.role() = ''authenticated'')
         WITH CHECK (auth.role() = ''authenticated'');', t);
  END LOOP;
END $$;

-- ============================================================
-- NOTA STORAGE:
-- Para el bucket "fotos_pedidos" (fotos del formulario) y
-- "reportes_semanales" (PDFs), configurar políticas equivalentes
-- en Storage → Policies: INSERT público en fotos_pedidos,
-- y DELETE/ALL solo authenticated.
-- ============================================================
