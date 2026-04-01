-- Corrige: "The column users.accountKind does not exist" (sessão admin / getSessionForServer).
-- Mesmo projeto Supabase da DATABASE_URL na Vercel. Idempotente.

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

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS "accountKind" "UserAccountKind" NOT NULL DEFAULT 'STANDARD';

-- Opcional: garantir seu e-mail como master (descomente e ajuste o e-mail)
-- UPDATE public.users SET "accountKind" = 'ADMIN_MASTER'
-- WHERE lower(email) = 'seu-email@exemplo.com';
