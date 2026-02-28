# ⚙️ CONFIGURAR .env COM SUPABASE

## 🎯 Passo a Passo Rápido

### 1. Criar arquivo .env

**Windows PowerShell:**
```powershell
Copy-Item env.example .env
```

**Linux/Mac:**
```bash
cp env.example .env
```

---

### 2. Editar o arquivo .env

Abra o arquivo `.env` e cole este conteúdo:

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:SUA_SENHA_AQUI@db.thuisonoxhInfjctfidq.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gere-um-secret-aqui"

# App
NODE_ENV="development"
PORT=3000
```

---

### 3. Substituir os valores

#### 3.1 Substituir SUA_SENHA_AQUI

No `DATABASE_URL`, substitua `SUA_SENHA_AQUI` pela senha do banco que você criou.

**Exemplo:**
Se sua senha é `MinhaSenh@123`, fica assim:

```env
DATABASE_URL="postgresql://postgres:MinhaSenh@123@db.thuisonoxhInfjctfidq.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

**⚠️ ATENÇÃO:** Se sua senha tiver caracteres especiais como `@`, `#`, `$`, etc., você pode precisar codificar (URL encode). Mas tente primeiro sem codificar.

#### 3.2 Gerar NEXTAUTH_SECRET

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Linux/Mac:**
```bash
openssl rand -base64 32
```

Cole o resultado no lugar de `gere-um-secret-aqui`.

**Exemplo:**
```env
NEXTAUTH_SECRET="aBc123XyZ456DeF789GhI012JkL345MnO678PqR901StU234VwX567YzA890="
```

---

### 4. Arquivo .env Final

Seu `.env` deve ficar assim (exemplo):

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:MinhaSenh@123@db.thuisonoxhInfjctfidq.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="aBc123XyZ456DeF789GhI012JkL345MnO678PqR901StU234VwX567YzA890="

# App
NODE_ENV="development"
PORT=3000
```

---

### 5. Testar a Conexão

```bash
npm run db:test
```

Se tudo estiver OK, você verá:
```
✅ Conexão estabelecida com sucesso!
✅ Query de teste executada com sucesso!
```

---

## ⚠️ Problemas Comuns

### Erro: "password authentication failed"

**Causa:** Senha incorreta ou caracteres especiais não codificados.

**Solução:**
1. Verifique se a senha está correta
2. Se tiver caracteres especiais, tente codificar:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `&` → `%26`

**Exemplo:**
Se sua senha é `Senh@123`, tente:
```env
DATABASE_URL="postgresql://postgres:Senh%40123@db.thuisonoxhInfjctfidq.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

### Erro: "Can't reach database server"

**Causa:** Connection string incorreta.

**Solução:**
1. Verifique se o Project ID está correto: `thuisonoxhInfjctfidq`
2. Verifique se a senha está correta
3. Confirme que o projeto está ativo no Supabase

---

## ✅ Próximos Passos

Depois de configurar o `.env`:

1. **Gerar Prisma Client:**
   ```bash
   npm run db:generate
   ```

2. **Criar tabelas no Supabase:**
   ```bash
   npm run db:push
   ```

3. **Popular dados iniciais (opcional):**
   ```bash
   npm run db:seed
   ```

4. **Testar conexão:**
   ```bash
   npm run db:test
   ```

5. **Iniciar aplicação:**
   ```bash
   npm run dev
   ```

---

## 🎉 Pronto!

Agora você está conectado ao Supabase! 🚀

