-- =============================================================
-- 001_schema.sql  —  Ferramenta de Apoio a Compromissos Pessoais
-- Run this in Supabase SQL Editor
-- =============================================================

-- Enums
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'frequencia_tipo') THEN
        CREATE TYPE frequencia_tipo AS ENUM ('diaria', 'diasSemana', 'xVezesSemana');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'check_status') THEN
        CREATE TYPE check_status AS ENUM ('cumprido', 'naoCumprido', 'pausado');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sensacao_tipo') THEN
        CREATE TYPE sensacao_tipo AS ENUM ('tedio', 'ansiedade', 'indiferenca', 'satisfacao', 'cansaco');
    END IF;
END$$;

-- ─────────────────────────────────────────────
-- categorias
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  cor        TEXT NOT NULL DEFAULT '#7C9A8A',
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- compromissos
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compromissos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome              TEXT NOT NULL,
  meta              TEXT,
  unidade_minima    TEXT NOT NULL,           -- obrigatório (RN01.1)
  frequencia_tipo   frequencia_tipo NOT NULL DEFAULT 'diaria',
  frequencia_dias   INT[],                   -- [0..6] para 'diasSemana'
  frequencia_vezes  INT,                     -- para 'xVezesSemana'
  categoria_id      UUID REFERENCES categorias(id) ON DELETE SET NULL,
  dia_revisao       INT NOT NULL DEFAULT 0,  -- 0=Dom … 6=Sáb
  gatilho           TEXT,
  frase_ancoragem   TEXT,
  streak_atual      INT NOT NULL DEFAULT 0,
  streak_estado     TEXT NOT NULL DEFAULT 'ativo', -- 'ativo' | 'pendente' | 'zerado'
  xp_total          INT NOT NULL DEFAULT 0,  -- nunca diminui (RN04.2)
  pausado_ate       DATE,                    -- NULL = ativo
  ativo             BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- checks
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  compromisso_id   UUID NOT NULL REFERENCES compromissos(id) ON DELETE CASCADE,
  data             DATE NOT NULL,
  status           check_status NOT NULL,
  contexto         TEXT,                     -- opcional (RF06.1)
  sensacao         sensacao_tipo,            -- opcional (US15)
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (compromisso_id, data)              -- impede duplicata; possibilita upsert (RF03.2)
);

-- ─────────────────────────────────────────────
-- diario (US17 — diário de uma linha)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS diario (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data      DATE NOT NULL,
  conteudo  TEXT NOT NULL CHECK (char_length(conteudo) <= 280),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, data)                     -- um por dia
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_checks_compromisso_data ON checks (compromisso_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_compromissos_user       ON compromissos (user_id);
CREATE INDEX IF NOT EXISTS idx_checks_user_data        ON checks (user_id, data DESC);
