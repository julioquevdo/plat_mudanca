-- =============================================================
-- 002_rls.sql  —  Row Level Security: 4 policies per table
-- Run AFTER 001_schema.sql
-- =============================================================

-- ─────────────────────────────────────────────
-- Enable RLS on all tables
-- ─────────────────────────────────────────────
ALTER TABLE categorias    ENABLE ROW LEVEL SECURITY;
ALTER TABLE compromissos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE checks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE diario        ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- CATEGORIAS
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS categorias_select_own ON categorias;
CREATE POLICY categorias_select_own ON categorias
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS categorias_insert_own ON categorias;
CREATE POLICY categorias_insert_own ON categorias
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS categorias_update_own ON categorias;
CREATE POLICY categorias_update_own ON categorias
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS categorias_delete_own ON categorias;
CREATE POLICY categorias_delete_own ON categorias
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- COMPROMISSOS
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS compromissos_select_own ON compromissos;
CREATE POLICY compromissos_select_own ON compromissos
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS compromissos_insert_own ON compromissos;
CREATE POLICY compromissos_insert_own ON compromissos
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS compromissos_update_own ON compromissos;
CREATE POLICY compromissos_update_own ON compromissos
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS compromissos_delete_own ON compromissos;
CREATE POLICY compromissos_delete_own ON compromissos
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- CHECKS
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS checks_select_own ON checks;
CREATE POLICY checks_select_own ON checks
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS checks_insert_own ON checks;
CREATE POLICY checks_insert_own ON checks
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS checks_update_own ON checks;
CREATE POLICY checks_update_own ON checks
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS checks_delete_own ON checks;
CREATE POLICY checks_delete_own ON checks
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- DIARIO
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS diario_select_own ON diario;
CREATE POLICY diario_select_own ON diario
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS diario_insert_own ON diario;
CREATE POLICY diario_insert_own ON diario
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS diario_update_own ON diario;
CREATE POLICY diario_update_own ON diario
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS diario_delete_own ON diario;
CREATE POLICY diario_delete_own ON diario
  FOR DELETE USING (user_id = auth.uid());
