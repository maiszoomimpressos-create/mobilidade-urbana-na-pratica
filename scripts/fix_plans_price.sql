-- Execute no Supabase SQL Editor
-- Remove a coluna price que não é mais usada (ou torna nullable)

-- Opção 1: Tornar a coluna price nullable (mais seguro)
ALTER TABLE plans ALTER COLUMN "price" DROP NOT NULL;
ALTER TABLE plans ALTER COLUMN "price" SET DEFAULT 0;

-- Opção 2: Se quiser remover a coluna completamente (descomente abaixo)
-- ALTER TABLE plans DROP COLUMN IF EXISTS "price";
-- ALTER TABLE plans DROP COLUMN IF EXISTS "interval";
