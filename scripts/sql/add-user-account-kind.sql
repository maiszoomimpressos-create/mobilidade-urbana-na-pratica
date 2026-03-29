-- Tipo global de usuário (complementa roles por central).
-- Use no Supabase SQL Editor se não rodar `npx prisma db push` (porta 5432 recomendada).
-- Idempotente: pode rodar mais de uma vez.

DO $$
BEGIN
  CREATE TYPE "UserAccountKind" AS ENUM (
    'STANDARD',
    'ADMIN_MASTER',
    'PASSENGER',
    'DRIVER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "accountKind" "UserAccountKind" NOT NULL DEFAULT 'STANDARD';

-- Opcional: promover um admin master já existente
-- UPDATE users SET "accountKind" = 'ADMIN_MASTER'
-- WHERE lower(email) = 'maiszoomimpressos@gmail.com';
