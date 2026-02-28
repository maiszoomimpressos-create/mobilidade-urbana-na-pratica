# 📸 GUIA VISUAL - Supabase Passo a Passo

## 🎯 Objetivo
Conectar o projeto ao Supabase (PostgreSQL na nuvem) em vez de PostgreSQL local.

---

## 📝 PASSO 1: Criar Conta no Supabase

1. Acesse: **https://supabase.com**
2. Clique em **"Start your project"** (canto superior direito)
3. Escolha uma forma de login:
   - GitHub (recomendado)
   - Google
   - Email

---

## 🆕 PASSO 2: Criar Novo Projeto

1. Após fazer login, clique em **"New Project"**
2. Preencha os dados:

   ```
   Name: mobilidade-urbana
   Database Password: [Crie uma senha forte e ANOTE!]
   Region: South America (São Paulo) [ou mais próxima]
   Pricing Plan: Free
   ```

3. Clique em **"Create new project"**
4. ⏳ Aguarde 2-3 minutos enquanto o projeto é criado

---

## 🔗 PASSO 3: Obter Connection String

1. No dashboard do projeto, clique no **ícone de engrenagem** (⚙️) no menu lateral
2. Clique em **"Database"**
3. Role a página até encontrar **"Connection string"**
4. Clique na aba **"URI"**
5. Você verá algo assim:

   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```

   **OU**

   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

6. **COPIE essa string** (Ctrl+C / Cmd+C)

---

## 📝 PASSO 4: Configurar .env

### 4.1 Criar arquivo .env

**Windows PowerShell:**
```powershell
Copy-Item env.example .env
```

**Linux/Mac:**
```bash
cp env.example .env
```

### 4.2 Editar o .env

Abra o arquivo `.env` e cole a connection string que você copiou.

**IMPORTANTE:** Substitua `[YOUR-PASSWORD]` pela senha que você criou no Passo 2!

**Exemplo:**
```env
# ANTES (do Supabase)
postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmnop.supabase.co:5432/postgres

# DEPOIS (no seu .env)
DATABASE_URL="postgresql://postgres:MinhaSenh@123@db.abcdefghijklmnop.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

**💡 Dica:** Adicione `?pgbouncer=true&connection_limit=1` no final para melhor performance.

### 4.3 Adicionar NEXTAUTH_SECRET

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Linux/Mac:**
```bash
openssl rand -base64 32
```

Cole o resultado no `.env`:
```env
NEXTAUTH_SECRET="cole-o-secret-gerado-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### 4.4 Arquivo .env Final

Seu `.env` deve ficar assim:

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:SUA_SENHA_AQUI@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-gerado-aqui"

# App
NODE_ENV="development"
PORT=3000
```

---

## ⚙️ PASSO 5: Configurar Prisma

### 5.1 Gerar Prisma Client

```bash
npm run db:generate
```

**O que faz:** Gera o cliente Prisma baseado no schema.

### 5.2 Criar Tabelas no Supabase

```bash
npm run db:push
```

**O que faz:** Cria todas as tabelas no banco do Supabase.

Você verá algo como:
```
✔ Generated Prisma Client
✔ Pushed database schema to Supabase
```

### 5.3 Popular Dados Iniciais (Opcional)

```bash
npm run db:seed
```

**O que faz:** Cria roles, permissions e planos padrão.

---

## ✅ PASSO 6: Testar Conexão

```bash
npm run db:test
```

**Resultado esperado:**
```
🔄 Testando conexão com o banco de dados...
✅ Conexão estabelecida com sucesso!
✅ Query de teste executada com sucesso!
📊 Tabelas encontradas: 24
```

---

## 👀 PASSO 7: Verificar no Supabase

1. Volte ao dashboard do Supabase
2. No menu lateral, clique em **"Table Editor"**
3. Você verá todas as tabelas criadas:
   - users
   - tenants
   - roles
   - plans
   - etc.

---

## 🚀 PASSO 8: Testar a Aplicação

```bash
npm run dev
```

1. Acesse: http://localhost:3000/register
2. Crie uma conta
3. Volte ao Supabase → Table Editor → users
4. Você verá o usuário criado! 🎉

---

## 🎯 Resumo dos Comandos

```bash
# 1. Gerar Prisma Client
npm run db:generate

# 2. Criar tabelas no Supabase
npm run db:push

# 3. Popular dados (opcional)
npm run db:seed

# 4. Testar conexão
npm run db:test

# 5. Iniciar aplicação
npm run dev
```

---

## 🆘 Problemas Comuns

### ❌ "password authentication failed"

**Solução:**
1. Verifique se substituiu `[YOUR-PASSWORD]` pela senha real
2. Confirme a senha no Supabase → Settings → Database

### ❌ "Can't reach database server"

**Solução:**
1. Verifique se copiou a connection string correta
2. Confirme que o projeto está ativo no Supabase

### ❌ "relation does not exist"

**Solução:**
```bash
npm run db:push
```

### ❌ "Prisma Client not generated"

**Solução:**
```bash
npm run db:generate
```

---

## 📚 Documentação Completa

Para mais detalhes, veja: [CONFIGURAR_SUPABASE.md](./CONFIGURAR_SUPABASE.md)

---

## ✅ Checklist Final

- [ ] Conta criada no Supabase
- [ ] Projeto criado
- [ ] Senha do banco anotada
- [ ] Connection string copiada
- [ ] Arquivo `.env` criado
- [ ] `DATABASE_URL` configurada (com senha)
- [ ] `NEXTAUTH_SECRET` gerado
- [ ] `npm run db:generate` executado
- [ ] `npm run db:push` executado
- [ ] `npm run db:test` passa
- [ ] Tabelas visíveis no Supabase Dashboard

---

## 🎉 Pronto!

Agora você está usando Supabase! Muito mais fácil que PostgreSQL local! 🚀

