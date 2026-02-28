# 🗄️ GUIA COMPLETO - CONFIGURAÇÃO DO BANCO DE DADOS

## 📋 Índice

1. [Instalação do PostgreSQL](#1-instalação-do-postgresql)
2. [Criação do Banco de Dados](#2-criação-do-banco-de-dados)
3. [Configuração do .env](#3-configuração-do-env)
4. [Configuração do Prisma](#4-configuração-do-prisma)
5. [Verificação](#5-verificação)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Instalação do PostgreSQL

### Windows

1. **Baixar PostgreSQL:**
   - Acesse: https://www.postgresql.org/download/windows/
   - Baixe o instalador (ex: PostgreSQL 15 ou 16)
   - Execute o instalador

2. **Durante a instalação:**
   - Anote a senha do usuário `postgres` (você vai precisar!)
   - Porta padrão: `5432` (deixe assim)
   - Deixe marcado "Install Stack Builder" (não é necessário, mas não faz mal)

3. **Verificar instalação:**
   - Abra o **pgAdmin** (vem junto com PostgreSQL)
   - Ou use o **SQL Shell (psql)** no menu Iniciar

### Linux (Ubuntu/Debian)

```bash
# Atualizar pacotes
sudo apt update

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar status
sudo systemctl status postgresql
```

### Mac (Homebrew)

```bash
# Instalar PostgreSQL
brew install postgresql@15

# Iniciar serviço
brew services start postgresql@15
```

---

## 2. Criação do Banco de Dados

### Opção A: Usando pgAdmin (Interface Gráfica)

1. Abra o **pgAdmin**
2. Conecte-se ao servidor (senha do usuário `postgres`)
3. Clique com botão direito em **Databases** → **Create** → **Database**
4. Nome: `mobilidade_urbana`
5. Clique em **Save**

### Opção B: Usando SQL Shell (psql)

1. Abra o **SQL Shell (psql)** ou terminal
2. Digite a senha do usuário `postgres` quando solicitado
3. Execute:

```sql
CREATE DATABASE mobilidade_urbana;
```

4. Verifique se foi criado:

```sql
\l
```

### Opção C: Usando linha de comando (Linux/Mac)

```bash
# Conectar como usuário postgres
sudo -u postgres psql

# Criar banco
CREATE DATABASE mobilidade_urbana;

# Sair
\q
```

### Opção D: Criar usuário específico (Recomendado para produção)

```sql
-- Conectar ao PostgreSQL
psql -U postgres

-- Criar usuário
CREATE USER mobilidade_user WITH PASSWORD 'sua_senha_segura_aqui';

-- Criar banco
CREATE DATABASE mobilidade_urbana OWNER mobilidade_user;

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE mobilidade_urbana TO mobilidade_user;

-- Sair
\q
```

---

## 3. Configuração do .env

### Passo 1: Criar arquivo .env

**Windows PowerShell:**
```powershell
Copy-Item env.example .env
```

**Linux/Mac:**
```bash
cp env.example .env
```

### Passo 2: Editar o .env

Abra o arquivo `.env` e configure:

#### **Se você usou o usuário padrão `postgres`:**
```env
DATABASE_URL="postgresql://postgres:SUA_SENHA_POSTGRES@localhost:5432/mobilidade_urbana?schema=public"
```

#### **Se você criou um usuário específico:**
```env
DATABASE_URL="postgresql://mobilidade_user:SUA_SENHA@localhost:5432/mobilidade_urbana?schema=public"
```

#### **Formato completo:**
```env
DATABASE_URL="postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO?schema=public"
```

### Passo 3: Gerar NEXTAUTH_SECRET

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**Ou use um gerador online:**
- https://generate-secret.vercel.app/32

Cole o resultado no `.env`:
```env
NEXTAUTH_SECRET="cole-o-secret-gerado-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### Exemplo de .env completo:

```env
# Database
DATABASE_URL="postgresql://postgres:minhasenha123@localhost:5432/mobilidade_urbana?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="aBc123XyZ456DeF789GhI012JkL345MnO678PqR901StU234VwX567YzA890="

# App
NODE_ENV="development"
PORT=3000
```

---

## 4. Configuração do Prisma

### Passo 1: Gerar Prisma Client

```bash
npm run db:generate
```

**O que faz:** Gera o cliente Prisma baseado no schema.

### Passo 2: Criar as tabelas no banco

**Opção A: Usando `db:push` (Desenvolvimento - mais rápido)**
```bash
npm run db:push
```

**Opção B: Usando `db:migrate` (Produção - versionado)**
```bash
npm run db:migrate
```

**Qual usar?**
- **`db:push`**: Desenvolvimento rápido, não cria histórico de migrações
- **`db:migrate`**: Produção, cria histórico de migrações

### Passo 3: Popular com dados iniciais (Opcional)

```bash
npm run db:seed
```

**O que faz:** Cria roles, permissions e planos padrão.

---

## 5. Verificação

### Verificar conexão

```bash
# Abrir Prisma Studio (interface visual)
npm run db:studio
```

Isso abrirá uma interface web em `http://localhost:5555` onde você pode ver todas as tabelas.

### Verificar tabelas criadas

**Usando psql:**
```sql
-- Conectar ao banco
psql -U postgres -d mobilidade_urbana

-- Listar tabelas
\dt

-- Ver estrutura de uma tabela
\d users

-- Sair
\q
```

**Tabelas esperadas:**
- users
- accounts
- sessions
- verification_tokens
- tenants
- tenant_users
- roles
- permissions
- role_permissions
- plans
- features
- plan_features
- plan_limits
- tenant_plans
- drivers
- passengers
- vehicles
- driver_positions
- cities
- rides
- ride_status_history
- tenant_ride_types
- ratings
- driver_availability

---

## 6. Troubleshooting

### ❌ Erro: "Can't reach database server"

**Causa:** PostgreSQL não está rodando.

**Solução:**
- **Windows:** Verifique no Gerenciador de Serviços se o PostgreSQL está rodando
- **Linux:** `sudo systemctl start postgresql`
- **Mac:** `brew services start postgresql@15`

### ❌ Erro: "password authentication failed"

**Causa:** Senha incorreta no `.env`.

**Solução:**
1. Verifique a senha do usuário PostgreSQL
2. Teste a conexão manualmente:
   ```bash
   psql -U postgres -d mobilidade_urbana
   ```
3. Se não conseguir, redefina a senha:
   ```sql
   ALTER USER postgres WITH PASSWORD 'nova_senha';
   ```

### ❌ Erro: "database does not exist"

**Causa:** Banco de dados não foi criado.

**Solução:**
```sql
CREATE DATABASE mobilidade_urbana;
```

### ❌ Erro: "relation already exists"

**Causa:** Tabelas já existem no banco.

**Solução:**
```bash
# Resetar banco (CUIDADO: apaga todos os dados!)
npm run db:push -- --force-reset
```

### ❌ Erro: "Prisma Client not generated"

**Causa:** Prisma Client não foi gerado.

**Solução:**
```bash
npm run db:generate
```

### ❌ Erro: "Port 5432 is already in use"

**Causa:** Outra instância do PostgreSQL está rodando.

**Solução:**
- Verifique se há múltiplas instalações
- Use uma porta diferente (não recomendado)
- Pare a instância que está usando a porta

### ❌ Erro de permissão

**Causa:** Usuário não tem permissões.

**Solução:**
```sql
GRANT ALL PRIVILEGES ON DATABASE mobilidade_urbana TO seu_usuario;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO seu_usuario;
```

---

## ✅ Checklist Final

Antes de continuar, verifique:

- [ ] PostgreSQL instalado e rodando
- [ ] Banco `mobilidade_urbana` criado
- [ ] Arquivo `.env` criado e configurado
- [ ] `DATABASE_URL` está correta
- [ ] `NEXTAUTH_SECRET` foi gerado
- [ ] `npm run db:generate` executado com sucesso
- [ ] `npm run db:push` executado com sucesso
- [ ] `npm run db:seed` executado (opcional)
- [ ] `npm run db:studio` abre sem erros

---

## 🚀 Próximos Passos

Após configurar o banco:

1. **Testar autenticação:**
   ```bash
   npm run dev
   ```
   Acesse: http://localhost:3000/register

2. **Criar um usuário de teste**

3. **Verificar no Prisma Studio:**
   ```bash
   npm run db:studio
   ```

---

## 📚 Comandos Úteis

```bash
# Gerar Prisma Client
npm run db:generate

# Criar tabelas (dev)
npm run db:push

# Criar migração (produção)
npm run db:migrate

# Popular dados iniciais
npm run db:seed

# Abrir Prisma Studio
npm run db:studio

# Resetar banco (CUIDADO!)
npm run db:push -- --force-reset
```

---

## 💡 Dicas

1. **Use Prisma Studio** para visualizar dados facilmente
2. **Mantenha backups** do banco em produção
3. **Use migrações** em produção, não `db:push`
4. **Teste a conexão** antes de rodar a aplicação
5. **Documente** suas mudanças no schema

---

## 🆘 Precisa de Ajuda?

Se ainda tiver problemas:

1. Verifique os logs do PostgreSQL
2. Teste a conexão manualmente com `psql`
3. Verifique se as portas estão abertas
4. Confirme que o usuário tem permissões

Boa sorte! 🚀

