# ⚙️ Variáveis de Ambiente na Vercel

O deploy falha sem estas variáveis. **Adicione-as no painel da Vercel:**

## Onde configurar

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto **mobilidade-urbana-na-pratica**
3. Clique em **Settings** → **Environment Variables**
4. Adicione cada variável abaixo (copie os valores do seu `.env` local)

---

## Variáveis obrigatórias

| Nome | Valor | Onde pegar |
|------|-------|------------|
| `DATABASE_URL` | Connection string do Supabase | Seu `.env` local ou Supabase → Settings → Database |
| `NEXTAUTH_SECRET` | Mesmo do `.env` |
| `NEXTAUTH_URL` | URL do app na Vercel (ex: `https://seu-projeto.vercel.app`) |

---

## E-mail master (admin total)

| Nome | Valor |
|------|-------|
| `NEXT_PUBLIC_MASTER_ADMIN_EMAIL` | E-mail que terá acesso de administrador master (ex: `seu-email@exemplo.com`) |

Se não definir, o padrão é `maiszoomimpressos@gmail.com`.

---

## Variáveis opcionais (Supabase Storage/Realtime)

| Nome | Valor |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Do seu `.env` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Do seu `.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | Do seu `.env` |

---

## Banco de dados em produção

O banco usado na Vercel é o que está em **DATABASE_URL**. As tabelas precisam existir nesse banco.

**Se aparecer "Erro ao criar usuário" ao se cadastrar:**

1. No seu computador, use a **mesma** connection string que está na Vercel (copie de **Settings → Environment Variables**).
2. No terminal, na pasta do projeto, rode (use a **mesma** URL que está na Vercel):
   ```bash
   npx prisma db push
   ```
   Antes, defina a variável: no PowerShell `$env:DATABASE_URL="sua_connection_string_do_supabase"` (a mesma que está na Vercel).
3. No Supabase: em **Settings → Database** use a **Connection string**. Se der erro com a URL de pool, tente a **Direct connection**.
4. Depois de rodar `prisma db push`, tente criar a conta de novo no site da Vercel.

---

## Importante

- **NEXTAUTH_URL**: na Vercel use a URL real do deploy, ex: `https://mobilidade-urbana-na-pratica.vercel.app`
- Marque **Production**, **Preview** e **Development** ao criar cada variável
- Após salvar, faça um **Redeploy** (Deployments → ⋮ → Redeploy)
