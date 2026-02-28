# 🚀 GUIA COMPLETO - Configuração com Supabase

## 📋 O que é Supabase?

Supabase é uma plataforma que oferece PostgreSQL gerenciado na nuvem, similar ao Firebase mas com banco de dados relacional. É gratuito para começar e muito fácil de usar!

---

## 🎯 Passo a Passo

### **PASSO 1: Criar Conta no Supabase**

1. Acesse: https://supabase.com
2. Clique em **"Start your project"** ou **"Sign Up"**
3. Faça login com GitHub, Google ou email
4. Confirme seu email (se necessário)

---

### **PASSO 2: Criar um Novo Projeto**

1. No dashboard do Supabase, clique em **"New Project"**
2. Preencha os dados:
   - **Name**: `mobilidade-urbana` (ou o nome que preferir)
   - **Database Password**: Crie uma senha forte (ANOTE ELA!)
   - **Region**: Escolha a região mais próxima (ex: `South America (São Paulo)`)
   - **Pricing Plan**: Free (para começar)

3. Clique em **"Create new project"**
4. Aguarde alguns minutos enquanto o projeto é criado (pode levar 2-3 minutos)

---

### **PASSO 3: Obter a Connection String**

1. No dashboard do seu projeto, vá em **Settings** (ícone de engrenagem no menu lateral)
2. Clique em **Database**
3. Role até a seção **"Connection string"**
4. Selecione a aba **"URI"**
5. Copie a connection string (ela será algo como):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

**⚠️ IMPORTANTE:** Substitua `[YOUR-PASSWORD]` pela senha que você criou no Passo 2!

---

### **PASSO 4: Configurar o .env**

1. **Criar arquivo .env** (se ainda não tiver):

   **Windows PowerShell:**
   ```powershell
   Copy-Item env.example .env
   ```

   **Linux/Mac:**
   ```bash
   cp env.example .env
   ```

2. **Editar o arquivo .env** e configurar:

   ```env
   # Database (Supabase)
   DATABASE_URL="postgresql://postgres:SUA_SENHA_AQUI@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="gere-um-secret-aqui"
   
   # App
   NODE_ENV="development"
   PORT=3000
   ```

   **Exemplo real:**
   ```env
   DATABASE_URL="postgresql://postgres:MinhaSenh@123@db.abcdefghijklmnop.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
   ```

   **💡 Dica:** Adicione `?pgbouncer=true&connection_limit=1` para melhor performance com Supabase.

3. **Gerar NEXTAUTH_SECRET:**

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
   ```

---

### **PASSO 5: Configurar Prisma**

1. **Gerar Prisma Client:**
   ```bash
   npm run db:generate
   ```

2. **Criar as tabelas no Supabase:**
   ```bash
   npm run db:push
   ```

   Isso vai criar todas as tabelas no banco do Supabase!

3. **Popular com dados iniciais (opcional):**
   ```bash
   npm run db:seed
   ```

---

### **PASSO 6: Testar a Conexão**

```bash
npm run db:test
```

Se tudo estiver OK, você verá:
```
✅ Conexão estabelecida com sucesso!
✅ Query de teste executada com sucesso!
📊 Tabelas encontradas: X
```

---

### **PASSO 7: Visualizar o Banco (Opcional)**

**Opção A: Prisma Studio**
```bash
npm run db:studio
```
Abre em: http://localhost:5555

**Opção B: Supabase Dashboard**
- No dashboard do Supabase, vá em **Table Editor**
- Você verá todas as tabelas criadas

---

## 🔐 Segurança e Boas Práticas

### **1. Não commitar .env**
O arquivo `.env` já está no `.gitignore`, mas confirme que não está sendo versionado.

### **2. Usar variáveis de ambiente em produção**
No Supabase, você pode configurar secrets:
- Vá em **Settings** → **API**
- Use as variáveis de ambiente do seu servidor

### **3. Connection Pooling**
O Supabase recomenda usar connection pooling. A URL já inclui `pgbouncer=true`.

### **4. Limites do Plano Free**
- **500 MB** de banco de dados
- **2 GB** de bandwidth
- **50,000** monthly active users
- **500 MB** file storage

---

## 🛠️ Comandos Úteis

```bash
# Gerar Prisma Client
npm run db:generate

# Criar/atualizar tabelas
npm run db:push

# Criar migração (produção)
npm run db:migrate

# Popular dados iniciais
npm run db:seed

# Testar conexão
npm run db:test

# Abrir Prisma Studio
npm run db:studio
```

---

## 🐛 Troubleshooting

### ❌ Erro: "Can't reach database server"

**Causa:** Connection string incorreta ou senha errada.

**Solução:**
1. Verifique a connection string no Supabase
2. Confirme que a senha está correta
3. Teste a conexão no Supabase Dashboard → Settings → Database

### ❌ Erro: "password authentication failed"

**Causa:** Senha incorreta no `.env`.

**Solução:**
1. Vá em Supabase → Settings → Database
2. Verifique a connection string
3. Se necessário, redefina a senha do banco

### ❌ Erro: "too many connections"

**Causa:** Muitas conexões simultâneas.

**Solução:**
- Use connection pooling (já incluído na URL)
- Adicione `?pgbouncer=true&connection_limit=1` na DATABASE_URL

### ❌ Erro: "relation does not exist"

**Causa:** Tabelas não foram criadas.

**Solução:**
```bash
npm run db:push
```

### ❌ Erro: "Prisma Client not generated"

**Causa:** Prisma Client não foi gerado.

**Solução:**
```bash
npm run db:generate
```

---

## 📊 Verificar Tabelas no Supabase

1. Acesse o dashboard do Supabase
2. Vá em **Table Editor** (menu lateral)
3. Você verá todas as tabelas criadas
4. Pode editar dados diretamente pela interface!

---

## 🔄 Sincronizar Schema

Se você alterar o `schema.prisma`:

```bash
# 1. Gerar Prisma Client
npm run db:generate

# 2. Aplicar mudanças no Supabase
npm run db:push

# Ou criar migração (recomendado para produção)
npm run db:migrate
```

---

## 🚀 Próximos Passos

Após configurar o Supabase:

1. **Testar autenticação:**
   ```bash
   npm run dev
   ```
   Acesse: http://localhost:3000/register

2. **Criar um usuário de teste**

3. **Verificar no Supabase Dashboard:**
   - Vá em **Table Editor**
   - Veja o usuário criado na tabela `users`

---

## 💡 Vantagens do Supabase

✅ **Gratuito** para começar  
✅ **PostgreSQL completo**  
✅ **Interface visual** para ver dados  
✅ **Backups automáticos**  
✅ **Escalável** (pode fazer upgrade depois)  
✅ **API REST automática** (bonus!)  
✅ **Realtime** (pode usar depois para WebSockets)  

---

## 📚 Recursos Adicionais

- **Documentação Supabase:** https://supabase.com/docs
- **Prisma + Supabase:** https://supabase.com/docs/guides/integrations/prisma
- **Dashboard:** https://app.supabase.com

---

## ✅ Checklist Final

- [ ] Conta no Supabase criada
- [ ] Projeto criado no Supabase
- [ ] Connection string copiada
- [ ] Arquivo `.env` configurado
- [ ] `DATABASE_URL` com senha correta
- [ ] `NEXTAUTH_SECRET` gerado
- [ ] `npm run db:generate` executado
- [ ] `npm run db:push` executado
- [ ] `npm run db:test` passa sem erros
- [ ] Tabelas visíveis no Supabase Dashboard

---

## 🎉 Pronto!

Agora você está usando Supabase! Muito mais fácil que configurar PostgreSQL local, não é? 🚀

Se tiver alguma dúvida, me avise!

