# 🚗 Sistema de Mobilidade Urbana

Sistema SaaS multi-tenant para gestão de transporte urbano (estilo Uber/99) com arquitetura white-label, controle de acesso granular e sistema de planos flexível.

## 🛠️ Stack Tecnológica

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript (strict mode)
- **Banco de Dados:** PostgreSQL + Prisma ORM
- **Autenticação:** NextAuth.js
- **Estilização:** Tailwind CSS
- **UI Components:** Radix UI
- **Tempo Real:** Socket.io
- **Validação:** Zod
- **Testes:** Jest + Playwright

## 📋 Pré-requisitos

- Node.js 18+ 
- npm 9+
- PostgreSQL 14+
- Git

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd mobilidade-urbana
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados

#### Opção A: Usando Supabase (Recomendado - Mais Fácil) 🚀

1. Crie uma conta em https://supabase.com
2. Crie um novo projeto
3. Copie a connection string (Settings → Database → Connection string → URI)
4. Siga o guia completo: [CONFIGURAR_SUPABASE.md](./CONFIGURAR_SUPABASE.md)

#### Opção B: PostgreSQL Local

1. Instale PostgreSQL localmente
2. Crie o banco: `CREATE DATABASE mobilidade_urbana;`
3. Siga o guia: [CONFIGURAR_BANCO.md](./CONFIGURAR_BANCO.md)

#### Configurar .env

Crie um arquivo `.env` na raiz do projeto:

```bash
cp env.example .env
```

Edite o `.env` e configure:

**Para Supabase:**
```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

**Para PostgreSQL Local:**
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/mobilidade_urbana?schema=public"
```

**Ambos precisam de:**
```env
NEXTAUTH_SECRET="gere-um-secret-com-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Configure o banco de dados

```bash
# Gerar o Prisma Client
npm run db:generate

# Executar as migrações
npm run db:migrate

# (Opcional) Popular com dados iniciais
npm run db:seed
```

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
/
├── prisma/
│   ├── schema.prisma      # Schema do banco de dados
│   └── seed.ts            # Dados iniciais
├── src/
│   ├── app/               # Next.js App Router
│   ├── components/        # Componentes React
│   ├── lib/               # Utilitários e configurações
│   ├── types/             # Tipos TypeScript
│   ├── hooks/             # React Hooks
│   └── utils/             # Funções utilitárias
├── public/                # Arquivos estáticos
└── tests/                 # Testes
```

## 🗄️ Banco de Dados

### Comandos úteis

```bash
# Visualizar banco no Prisma Studio
npm run db:studio

# Criar nova migração
npm run db:migrate

# Aplicar mudanças sem migração (dev)
npm run db:push
```

## 🧪 Testes

```bash
# Testes unitários
npm test

# Testes em modo watch
npm run test:watch

# Testes E2E
npm run test:e2e
```

## 📚 Documentação

- [Análise e Plano de Ação](./ANALISE_E_PLANO_DE_ACAO.md)
- [Arquitetura de APIs](./ARQUITETURA_API_E_PLANO_DEV.md)

## 🔐 Segurança

- ✅ Row Level Security (RLS) preparado
- ✅ Isolamento por tenant
- ✅ Autenticação JWT
- ✅ Validação de dados (Zod)
- ✅ TypeScript strict mode

## 📝 Licença

Este projeto é privado e proprietário.

## 👥 Contribuindo

Este é um projeto privado. Para contribuições, entre em contato com a equipe de desenvolvimento.

