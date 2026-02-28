# ⚡ QUICK START - Supabase (5 minutos)

## 🎯 Setup Rápido

### 1️⃣ Criar Projeto no Supabase
- Acesse: https://supabase.com
- New Project → Preencha → Create
- **ANOTE A SENHA DO BANCO!**

### 2️⃣ Copiar Connection String
- Settings (⚙️) → Database
- Connection string → URI → **COPIE**

### 3️⃣ Configurar .env
```bash
# Windows
Copy-Item env.example .env

# Linux/Mac
cp env.example .env
```

Edite `.env`:
```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
NEXTAUTH_SECRET="gere-com-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

**⚠️ Substitua `SUA_SENHA` pela senha do banco!**

### 4️⃣ Configurar Prisma
```bash
npm run db:generate
npm run db:push
npm run db:seed  # opcional
```

### 5️⃣ Testar
```bash
npm run db:test
npm run dev
```

---

## ✅ Pronto!

Acesse: http://localhost:3000/register

---

## 📚 Guias Completos

- **Passo a passo visual:** [PASSO_A_PASSO_SUPABASE.md](./PASSO_A_PASSO_SUPABASE.md)
- **Guia detalhado:** [CONFIGURAR_SUPABASE.md](./CONFIGURAR_SUPABASE.md)

