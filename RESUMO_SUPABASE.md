# ⚡ RESUMO RÁPIDO - Supabase

## 🚀 Setup em 5 Minutos

### 1. Criar Projeto no Supabase
- Acesse: https://supabase.com
- Crie conta → New Project
- Anote a senha do banco!

### 2. Obter Connection String
- Settings → Database → Connection string (URI)
- Copie a string

### 3. Configurar .env
```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
NEXTAUTH_SECRET="gere-um-secret"
NEXTAUTH_URL="http://localhost:3000"
```

**Substitua `[YOUR-PASSWORD]` pela senha do banco!**

### 4. Configurar Prisma
```bash
npm run db:generate
npm run db:push
npm run db:seed  # opcional
```

### 5. Testar
```bash
npm run db:test
```

---

## ✅ Checklist

- [ ] Projeto criado no Supabase
- [ ] Connection string copiada
- [ ] `.env` configurado
- [ ] `npm run db:generate` executado
- [ ] `npm run db:push` executado
- [ ] `npm run db:test` passa

---

## 🆘 Problemas?

| Erro | Solução |
|------|---------|
| "password authentication failed" | Verifique a senha no `.env` |
| "Can't reach database server" | Verifique a connection string |
| "relation does not exist" | Execute `npm run db:push` |

---

## 📚 Guia Completo

Veja: [CONFIGURAR_SUPABASE.md](./CONFIGURAR_SUPABASE.md)

