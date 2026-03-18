-- Execute no Supabase SQL Editor
-- Adiciona colunas extras na tabela plan_features

ALTER TABLE plan_features 
  ADD COLUMN IF NOT EXISTS "extraValue" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "extraValueFormat" "PlanValueFormat";
