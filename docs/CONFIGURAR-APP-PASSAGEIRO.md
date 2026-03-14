# Configurar o App do Passageiro (Mai Drive)

## 0. Migration (uma vez)

Para que o master possa configurar cores e logo da bandeira Mai Drive, atualize o banco:

```bash
npx prisma migrate dev
```

Ou use `npx prisma db push` para sincronizar o schema sem criar arquivos de migration.

Depois, rode o seed para criar o registro padrão da marca:

```bash
npx prisma db seed
```

---

Para o app funcionar com login, cadastro e "Continuar sem conta", é necessário configurar o Supabase e as variáveis de ambiente.

---

## 1. Variáveis de ambiente (.env)

Na pasta **`apps/passenger`**, crie um arquivo **`.env`** (ou copie de `env.example`):

```bash
cd apps/passenger
copy env.example .env
```

Edite o `.env` e preencha com os mesmos valores do site (raiz do projeto):

| Variável | Onde pegar |
|----------|------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public |
| `EXPO_PUBLIC_APP_API_URL` | URL do seu site (ex.: `https://mobilidade-urbana-na-pratica.vercel.app`). Usada para branding e para o link de recuperar senha. |

Exemplo:

```
EXPO_PUBLIC_SUPABASE_URL="https://abc123.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
EXPO_PUBLIC_APP_API_URL="https://seu-dominio.vercel.app"
```

---

## 2. Recuperar senha (Esqueci a senha)

O app envia o link de redefinição para a página web do site. No **Supabase Dashboard** → **Authentication** → **URL Configuration** → **Redirect URLs**, adicione:

```
https://mobilidade-urbana-na-pratica.vercel.app/redefinir-senha
```

(Use o domínio do seu site. Veja `docs/SUPABASE-REDIRECT-RECUPERAR-SENHA.md`.)

---

## 3. Habilitar login anônimo no Supabase

Para o botão **"Continuar sem conta"** funcionar:

1. Acesse o **Supabase Dashboard** do seu projeto
2. Vá em **Authentication** → **Providers**
3. Encontre **Anonymous sign-ins**
4. Ative a opção **Enable Anonymous sign-ins**
5. Salve

---

## 4. Reiniciar o app

Após alterar o `.env`, reinicie o app:

```bash
cd apps/passenger
npm run android
```

---

## Resumo

| Etapa | O que fazer |
|-------|-------------|
| 1 | Criar `apps/passenger/.env` com `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_APP_API_URL` |
| 2 | Adicionar URL do site + `/redefinir-senha` em Supabase Redirect URLs |
| 3 | Habilitar "Anonymous sign-ins" no Supabase (Auth → Providers) |
| 4 | Reiniciar o app |
