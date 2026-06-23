-- =============================================================
-- 004_rewards_and_exceptions.sql
-- Clinical rewards, bad-day mode, and spontaneous small wins
-- =============================================================

ALTER TABLE compromissos
  ADD COLUMN IF NOT EXISTS unidade_emergencia TEXT;

ALTER TABLE checks
  ADD COLUMN IF NOT EXISTS dia_ruim BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS vitorias_pequenas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data       DATE NOT NULL,
  conteudo   TEXT NOT NULL CHECK (char_length(conteudo) <= 120),
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vitorias_pequenas_user_data
  ON vitorias_pequenas (user_id, data DESC);

ALTER TABLE vitorias_pequenas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vitorias_pequenas_select_own ON vitorias_pequenas;
CREATE POLICY vitorias_pequenas_select_own ON vitorias_pequenas
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS vitorias_pequenas_insert_own ON vitorias_pequenas;
CREATE POLICY vitorias_pequenas_insert_own ON vitorias_pequenas
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS vitorias_pequenas_update_own ON vitorias_pequenas;
CREATE POLICY vitorias_pequenas_update_own ON vitorias_pequenas
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS vitorias_pequenas_delete_own ON vitorias_pequenas;
CREATE POLICY vitorias_pequenas_delete_own ON vitorias_pequenas
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));
