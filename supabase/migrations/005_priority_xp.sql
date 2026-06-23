-- =============================================================
-- 005_priority_xp.sql
-- Adds a priority rank to commitments, used to weight XP per check
-- (1 = highest priority = more XP; weighted average stays = XP_POR_CHECK)
-- =============================================================

ALTER TABLE compromissos
  ADD COLUMN IF NOT EXISTS prioridade INT;

-- Backfill: rank existing ACTIVE commitments per user by creation order
-- (oldest = highest priority by default, user can reorder afterwards).
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY criado_em ASC) AS rn
  FROM compromissos
  WHERE ativo = TRUE
)
UPDATE compromissos c
SET prioridade = ranked.rn
FROM ranked
WHERE c.id = ranked.id
  AND c.prioridade IS NULL;

-- Inactive / edge-case rows get pushed to the bottom so they never
-- interfere with active ranking.
UPDATE compromissos SET prioridade = 999 WHERE prioridade IS NULL;

ALTER TABLE compromissos
  ALTER COLUMN prioridade SET NOT NULL,
  ALTER COLUMN prioridade SET DEFAULT 999;

CREATE INDEX IF NOT EXISTS idx_compromissos_user_prioridade
  ON compromissos (user_id, prioridade);

-- No RLS changes needed: the existing compromissos_update_own policy
-- (002_rls.sql) already allows the owner to update any column, including
-- this new one.