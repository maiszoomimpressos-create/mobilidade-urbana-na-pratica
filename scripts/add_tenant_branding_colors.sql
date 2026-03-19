-- Adiciona colunas de branding no tenant (cores/tema)
-- Executar no Supabase SQL Editor

ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "primaryColor" TEXT,
  ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT;

