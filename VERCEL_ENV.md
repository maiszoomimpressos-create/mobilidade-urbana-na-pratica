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

## Variáveis opcionais (Supabase Storage/Realtime)

| Nome | Valor |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Do seu `.env` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Do seu `.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | Do seu `.env` |

---

## Importante

- **NEXTAUTH_URL**: na Vercel use a URL real do deploy, ex: `https://mobilidade-urbana-na-pratica.vercel.app`
- Marque **Production**, **Preview** e **Development** ao criar cada variável
- Após salvar, faça um **Redeploy** (Deployments → ⋮ → Redeploy)
