-- Script para atualizar schema de planos
-- Execute no Supabase SQL Editor

-- Criar tipos enum se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlanTargetType') THEN
        CREATE TYPE "PlanTargetType" AS ENUM ('BRAND', 'WHITE_LABEL');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlanChargeType') THEN
        CREATE TYPE "PlanChargeType" AS ENUM ('PER_RIDE', 'MONTHLY');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlanValueFormat') THEN
        CREATE TYPE "PlanValueFormat" AS ENUM ('PERCENTAGE', 'FIXED');
    END IF;
END $$;

-- Adicionar novas colunas na tabela plans se não existirem
ALTER TABLE plans 
  ADD COLUMN IF NOT EXISTS "targetType" "PlanTargetType" DEFAULT 'BRAND',
  ADD COLUMN IF NOT EXISTS "chargeType" "PlanChargeType" DEFAULT 'PER_RIDE',
  ADD COLUMN IF NOT EXISTS "valueFormat" "PlanValueFormat" DEFAULT 'FIXED',
  ADD COLUMN IF NOT EXISTS "value" DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "isCustomizable" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER DEFAULT 0;

-- Renomear price para value se a coluna price existir (migração)
-- UPDATE plans SET "value" = COALESCE(price, 0) WHERE "value" = 0 AND price IS NOT NULL;

-- Adicionar colunas extras na tabela plan_features
ALTER TABLE plan_features 
  ADD COLUMN IF NOT EXISTS "extraValue" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "extraValueFormat" "PlanValueFormat";

-- Criar índice para busca por targetType
CREATE INDEX IF NOT EXISTS plans_target_type_active_idx ON plans ("targetType", "isActive");

-- Comentários para documentação
COMMENT ON COLUMN plans."targetType" IS 'Tipo de operação: BRAND = Nossa Bandeira, WHITE_LABEL = Marca própria';
COMMENT ON COLUMN plans."chargeType" IS 'Tipo de cobrança: PER_RIDE = Por corrida, MONTHLY = Mensal';
COMMENT ON COLUMN plans."valueFormat" IS 'Formato do valor: PERCENTAGE = %, FIXED = R$';
COMMENT ON COLUMN plans."value" IS 'Valor da cobrança (pode ser % ou R$ conforme valueFormat)';
COMMENT ON COLUMN plans."isCustomizable" IS 'Se true, é um plano "Do Seu Jeito" onde usuário escolhe funcionalidades';
COMMENT ON COLUMN plans."sortOrder" IS 'Ordem de exibição do plano';
COMMENT ON COLUMN plan_features."extraValue" IS 'Valor adicional para funcionalidade em planos customizáveis';
COMMENT ON COLUMN plan_features."extraValueFormat" IS 'Formato do valor adicional (herda do plano se null)';

-- Inserir planos de exemplo para Nossa Bandeira
INSERT INTO plans (id, name, slug, description, "targetType", "chargeType", "valueFormat", "value", "isCustomizable", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid()::text, 'Básico', 'basico-mai-drive', 'Plano básico com funcionalidades essenciais', 'BRAND', 'PER_RIDE', 'PERCENTAGE', 10.00, false, 1, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Intermediário', 'intermediario-mai-drive', 'Plano intermediário com mais recursos', 'BRAND', 'PER_RIDE', 'PERCENTAGE', 8.00, false, 2, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Full', 'full-mai-drive', 'Plano completo com todas as funcionalidades', 'BRAND', 'PER_RIDE', 'PERCENTAGE', 6.00, false, 3, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Do Seu Jeito', 'custom-mai-drive', 'Monte seu plano escolhendo as funcionalidades', 'BRAND', 'PER_RIDE', 'PERCENTAGE', 5.00, true, 4, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Inserir planos de exemplo para White-label
INSERT INTO plans (id, name, slug, description, "targetType", "chargeType", "valueFormat", "value", "isCustomizable", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid()::text, 'Básico', 'basico-whitelabel', 'Plano básico white-label', 'WHITE_LABEL', 'MONTHLY', 'FIXED', 499.00, false, 1, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Intermediário', 'intermediario-whitelabel', 'Plano intermediário white-label', 'WHITE_LABEL', 'MONTHLY', 'FIXED', 799.00, false, 2, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Full', 'full-whitelabel', 'Plano completo white-label', 'WHITE_LABEL', 'MONTHLY', 'FIXED', 1299.00, false, 3, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Do Seu Jeito', 'custom-whitelabel', 'Monte seu plano white-label', 'WHITE_LABEL', 'MONTHLY', 'FIXED', 299.00, true, 4, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;
