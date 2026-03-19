-- Adiciona campos de white-label na tabela tenants
-- Executar no Supabase SQL Editor

ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'brand',
  ADD COLUMN IF NOT EXISTS "wlAppName" TEXT,
  ADD COLUMN IF NOT EXISTS "wlAppPackage" TEXT,
  ADD COLUMN IF NOT EXISTS "wlAppIcon" TEXT,
  ADD COLUMN IF NOT EXISTS "wlSplashImage" TEXT,
  ADD COLUMN IF NOT EXISTS "wlPassengerApkUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "wlDriverApkUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "wlBuildStatus" TEXT NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS "wlBuildMessage" TEXT,
  ADD COLUMN IF NOT EXISTS "wlLastBuildAt" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "tenants_type_idx" ON "tenants" ("type");
