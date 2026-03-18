-- Script para criar a tabela de anúncios/publicidade
-- Execute no Supabase SQL Editor

-- 1. Criar enum para posição do anúncio
DO $$ BEGIN
  CREATE TYPE "AdPosition" AS ENUM ('PASSENGER_HOME', 'PASSENGER_RIDE', 'DRIVER_HOME', 'SITE_BANNER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Criar tabela de anúncios
CREATE TABLE IF NOT EXISTS advertisements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "linkUrl" TEXT,
  position "AdPosition" NOT NULL DEFAULT 'PASSENGER_HOME',
  priority INTEGER NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS advertisements_tenantId_idx ON advertisements("tenantId");
CREATE INDEX IF NOT EXISTS advertisements_position_isActive_idx ON advertisements(position, "isActive");
CREATE INDEX IF NOT EXISTS advertisements_startDate_endDate_idx ON advertisements("startDate", "endDate");

-- 4. Verificação
SELECT 'Tabela advertisements criada com sucesso!' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'advertisements'
ORDER BY ordinal_position;
