-- Adiciona campo de status de aprovação na tabela tenants
-- Executar no Supabase SQL Editor

ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "approvalStatus" TEXT NOT NULL DEFAULT 'approved';
