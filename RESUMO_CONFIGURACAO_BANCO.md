# ⚡ RESUMO RÁPIDO - Configuração do Banco

## 🚀 Passo a Passo Rápido

### 1. Instalar PostgreSQL
- Windows: https://www.postgresql.org/download/windows/
- Linux: `sudo apt install postgresql`
- Mac: `brew install postgresql@15`

### 2. Criar Banco de Dados

**Opção A: Usando SQL Shell (psql)**
```sql
CREATE DATABASE mobilidade_urbana;
```

**Opção B: Usando pgAdmin**
- Abra pgAdmin → Databases → Create → Database
- Nome: `mobilidade_urbana`

### 3. Configurar .env

```bash
# Windows
Copy-Item env.example .env

# Linux/Mac
cp env.example .env
```

Edite o `.env`:
```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/mobilidade_urbana?schema=public"
NEXTAUTH_SECRET="gere-um-secret-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

**Gerar NEXTAUTH_SECRET:**
- Windows: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))`
- Linux/Mac: `openssl rand -base64 32`

### 4. Configurar Prisma

```bash
# Gerar Prisma Client
npm run db:generate

# Criar tabelas
npm run db:push

# Popular dados iniciais (opcional)
npm run db:seed
```

### 5. Testar

```bash
# Testar conexão
npm run db:test

# Abrir Prisma Studio
npm run db:studio
```

---

## 🎯 Scripts Automáticos

### Windows (PowerShell)
```powershell
.\scripts\setup-database.ps1
```

### Linux/Mac (Bash)
```bash
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

---

## ✅ Checklist

- [ ] PostgreSQL instalado e rodando
- [ ] Banco `mobilidade_urbana` criado
- [ ] Arquivo `.env` configurado
- [ ] `npm run db:generate` executado
- [ ] `npm run db:push` executado
- [ ] `npm run db:test` passa sem erros

---

## 🆘 Problemas Comuns

| Erro | Solução |
|------|---------|
| "Can't reach database server" | PostgreSQL não está rodando |
| "password authentication failed" | Senha incorreta no `.env` |
| "database does not exist" | Crie o banco primeiro |
| "Prisma Client not generated" | Execute `npm run db:generate` |

---

## 📚 Documentação Completa

Veja o guia detalhado em: [CONFIGURAR_BANCO.md](./CONFIGURAR_BANCO.md)

