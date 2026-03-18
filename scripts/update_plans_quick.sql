-- Execute no Supabase SQL Editor

-- Criar tipos enum
CREATE TYPE "PlanTargetType" AS ENUM ('BRAND', 'WHITE_LABEL');
CREATE TYPE "PlanChargeType" AS ENUM ('PER_RIDE', 'MONTHLY');
CREATE TYPE "PlanValueFormat" AS ENUM ('PERCENTAGE', 'FIXED');

-- Adicionar colunas na tabela plans
ALTER TABLE plans 
  ADD COLUMN "targetType" "PlanTargetType" DEFAULT 'BRAND',
  ADD COLUMN "chargeType" "PlanChargeType" DEFAULT 'PER_RIDE',
  ADD COLUMN "valueFormat" "PlanValueFormat" DEFAULT 'FIXED',
  ADD COLUMN "value" DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN "isCustomizable" BOOLEAN DEFAULT false,
  ADD COLUMN "sortOrder" INTEGER DEFAULT 0;

-- Copiar valor de price para value nos planos existentes
UPDATE plans SET "value" = COALESCE(price, 0);

-- Criar índice
CREATE INDEX IF NOT EXISTS plans_target_type_active_idx ON plans ("targetType", "isActive");
