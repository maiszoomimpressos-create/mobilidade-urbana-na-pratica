-- Alinha a tabela `tenants` com `prisma/schema.prisma` (evita 500 no admin quando colunas faltam).
-- Executar no SQL Editor do Supabase do MESMO projeto usado em DATABASE_URL na Vercel.

ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "primaryColor" TEXT,
  ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT,
  ADD COLUMN IF NOT EXISTS "showPassengerAds" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "mapUsageDashboardUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "approvalStatus" TEXT NOT NULL DEFAULT 'approved',
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
