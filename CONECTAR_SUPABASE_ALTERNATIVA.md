# 🔧 CONECTAR SUPABASE - Método Alternativo

## 🎯 Se não aparecer "Database" no menu

A interface do Supabase pode variar. Vamos usar métodos alternativos:

---

## 📍 MÉTODO 1: Via API Keys (Mais Comum)

1. No menu lateral, clique em **"API Keys"** (está na lista PROJECT SETTINGS)
2. Você verá várias seções:
   - **Project API keys**
   - **Database** (aqui está!)
   - **Connection string** (aqui está a string!)

3. Na seção **"Connection string"**, você verá:
   - Aba **"URI"** ou **"Connection pooling"**
   - Copie a string que começa com `postgresql://`

---

## 📍 MÉTODO 2: Construir Manualmente

Se você tem o **Project ID** (vi que é `thuisonoxhInfjctfidq`), podemos construir:

### Passo 1: Obter a senha do banco

A senha foi definida quando você criou o projeto. Se não lembra:

1. Vá em **Settings → General**
2. Procure por **"Database password"** ou **"Reset database password"**
3. Ou use a senha que você anotou ao criar o projeto

### Passo 2: Construir a connection string

Com base no seu Project ID (`thuisonoxhInfjctfidq`), a connection string será:

```
postgresql://postgres:SUA_SENHA@db.thuisonoxhInfjctfidq.supabase.co:5432/postgres
```

**Substitua `SUA_SENHA` pela senha do banco!**

### Passo 3: Adicionar ao .env

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@db.thuisonoxhInfjctfidq.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

---

## 📍 MÉTODO 3: Via URL Direta

Tente acessar diretamente:

```
https://supabase.com/dashboard/project/thuisonoxhInfjctfidq/settings/database
```

Ou:

```
https://supabase.com/dashboard/project/thuisonoxhInfjctfidq/settings/api
```

---

## 📍 MÉTODO 4: Procurar no Menu Principal

Às vezes a connection string está em:

1. **Menu lateral principal** (não dentro de Settings)
   - Procure por **"Database"** ou **"SQL Editor"**
   - Às vezes tem um ícone de banco de dados (🗄️)

2. **Na página inicial do projeto**
   - Quando você entra no projeto, pode ter cards com informações
   - Procure por **"Connection string"** ou **"Database URL"**

---

## 🔍 Onde Mais Procurar

### Opções no Menu Lateral Principal (fora de Settings):

- **Table Editor** - Às vezes tem link para connection string
- **SQL Editor** - Pode ter informações de conexão
- **Database** (ícone de banco) - Se aparecer no menu principal

### Dentro de Settings:

- **API Keys** → Role a página → Seção **Database**
- **General** → Role a página → Pode ter link para Database
- **Infrastructure** → Pode ter informações de conexão

---

## ✅ Solução Rápida (Recomendada)

Como você tem o **Project ID** (`thuisonoxhInfjctfidq`), use esta connection string:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA_AQUI@db.thuisonoxhInfjctfidq.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

**Só precisa:**
1. Substituir `SUA_SENHA_AQUI` pela senha que você criou ao fazer o projeto
2. Se não lembra a senha, vá em **Settings → General** e procure por **"Reset database password"**

---

## 🧪 Testar a Conexão

Depois de configurar o `.env`, teste:

```bash
npm run db:test
```

Se der erro de senha, você precisará resetar a senha do banco.

---

## 🆘 Se Nada Funcionar

1. **Tente criar um novo projeto** no Supabase (só para testar)
2. Durante a criação, **anote a senha do banco**
3. Use o Project ID do novo projeto

Ou me diga:
- O que aparece quando você clica em **"API Keys"**?
- Há algum menu com ícone de banco de dados (🗄️) no menu lateral principal?

