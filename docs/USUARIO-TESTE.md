# Usuário de teste para desenvolvimento

Para criar um usuário de teste e prosseguir com o desenvolvimento:

## 1. Configure o .env (raiz do projeto)

No `.env` da **raiz** do projeto (não o de apps/passenger), certifique-se de ter:

```
NEXT_PUBLIC_SUPABASE_URL="https://thuisonoxhlnfjctfidq.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-chave-anon"
SUPABASE_SERVICE_ROLE_KEY="sua-chave-service-role"
```

**Importante:** A URL deve ser exatamente `thuisonoxhlnfjctfidq` (com "hlnf", não "hinf").

A chave service_role está em: **Supabase Dashboard** → **Settings** → **API** → **service_role** (secret).

## 2. Rode o seed (se ainda não rodou)

```bash
npm run db:seed
```

## 3. Crie o usuário de teste

```bash
npm run usuario:teste
```

## 4. Credenciais do usuário de teste

| Campo | Valor |
|-------|-------|
| E-mail | `teste@mai.com` |
| Senha | `Teste123!` |

## 5. O que o script cria

- **Supabase Auth**: usuário com e-mail confirmado
- **Tenant**: "Central Teste" (slug: central-teste)
- **Prisma User**: usuário na tabela `users`
- **TenantUser**: vínculo como gestor da Central Teste

## 6. Uso

- **App**: faça login com `teste@mai.com` / `Teste123!`
- **Site**: http://localhost:3000/login
- **Dashboard**: após login, acesse /dashboard — você verá a Central Teste configurada

## Tela de boas-vindas

Após cadastro ou login, o usuário vê a tela **Início** com "Bem-vindo ao" + nome do app (Mai Drive ou da central).
