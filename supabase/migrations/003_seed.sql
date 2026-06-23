-- =============================================================
-- 003_seed.sql  —  Default categories (inserted per user on signup)
-- These are templates — actual insert happens via app trigger or
-- the AuthService after first login.
-- =============================================================

-- Example: the app inserts these for a new user via AuthService.createDefaultCategories()
-- Keeping this here as documentation / manual seed reference.

-- INSERT INTO categorias (user_id, nome, cor) VALUES
--   ('<user_id>', 'Saúde', '#6A9F7E'),
--   ('<user_id>', 'Estudo', '#9B8BB4'),
--   ('<user_id>', 'Projetos', '#D4A853'),
--   ('<user_id>', 'Relações', '#7CA8C0');
