# 🏗️ ARQUITETURA DE APIs E PLANO DE DESENVOLVIMENTO PARALELO

## 📱 ARQUITETURA MOBILE (CONFIRMADA)

### **Apps Mobile Independentes**
- ✅ Apps nativos/React Native **independentes**
- ✅ Consomem **APIs REST/GraphQL** do backend central
- ✅ Mesma API serve: Web, Mobile (Passageiro), Mobile (Motorista), Mobile (Gestor)
- ✅ Autenticação via JWT/Bearer Token
- ✅ WebSockets para atualizações em tempo real

### **Estrutura de Comunicação**

```
┌─────────────────┐
│  App Mobile     │
│  (Passageiro)   │
└────────┬────────┘
         │ HTTP/WebSocket
         │
┌────────▼─────────────────────────────────┐
│         API CENTRAL (Next.js)            │
│  ┌────────────────────────────────────┐  │
│  │  REST API / GraphQL                │  │
│  │  - /api/auth                       │  │
│  │  - /api/rides                      │  │
│  │  - /api/drivers                    │  │
│  │  - /api/location                   │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  WebSocket Server                  │  │
│  │  - Real-time updates               │  │
│  │  - Location tracking               │  │
│  └────────────────────────────────────┘  │
└────────┬─────────────────────────────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │
│   (Multi-tenant)│
└─────────────────┘
```

---

## 🚀 PLANO DE DESENVOLVIMENTO PARALELO

### **ESTRATÉGIA: Desenvolvimento Incremental com Testes**

**Filosofia:** Construir feature completa (API + Tela + Testes) antes de passar para próxima.

---

## 📅 SPRINT 1: FUNDAÇÃO (Semana 1-2)

### **Objetivo:** Setup completo + Autenticação funcional

#### **Backend (API)**
- [ ] Setup Next.js com TypeScript strict
- [ ] Configuração Prisma + PostgreSQL
- [ ] Schema inicial (users, tenants, tenant_users, roles, permissions)
- [ ] NextAuth.js configurado
- [ ] Endpoints de autenticação:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- [ ] Middleware de autenticação
- [ ] Middleware de tenant context

#### **Frontend (Telas)**
- [ ] Setup Tailwind + Design System base
- [ ] Tela de Login
- [ ] Tela de Registro
- [ ] Layout base com navegação
- [ ] Proteção de rotas (middleware)

#### **Testes**
- [ ] Testes de API (Jest + Supertest):
  - Registro de usuário
  - Login
  - Validação de token
- [ ] Testes E2E (Playwright):
  - Fluxo de login completo
  - Fluxo de registro completo

**✅ Critério de Aceite:** Usuário consegue se registrar, fazer login e acessar área autenticada.

---

## 📅 SPRINT 2: MULTI-TENANT E ROLES (Semana 3-4)

### **Objetivo:** Sistema multi-tenant funcional + troca de contexto

#### **Backend (API)**
- [ ] Endpoints de tenants:
  - `GET /api/tenants` (lista tenants do usuário)
  - `POST /api/tenants` (criar tenant)
  - `GET /api/tenants/:id`
  - `PUT /api/tenants/:id`
  - `POST /api/tenants/:id/switch` (trocar contexto)
- [ ] Endpoints de roles:
  - `GET /api/roles`
  - `GET /api/permissions`
- [ ] Middleware de autorização (verificar role/permission)
- [ ] Row Level Security básico

#### **Frontend (Telas)**
- [ ] Tela de seleção de tenant
- [ ] Componente de troca de tenant (header)
- [ ] Tela de criação de tenant
- [ ] Tela de gestão de roles (admin)
- [ ] Indicador visual de tenant ativo

#### **Testes**
- [ ] Testes de API:
  - Criação de tenant
  - Troca de contexto
  - Isolamento de dados entre tenants
- [ ] Testes E2E:
  - Fluxo completo de criação de tenant
  - Troca de tenant e verificação de isolamento

**✅ Critério de Aceite:** Usuário pode criar tenant, trocar entre tenants e dados ficam isolados.

---

## 📅 SPRINT 3: GESTÃO DE USUÁRIOS (Semana 5-6)

### **Objetivo:** CRUD completo de usuários com papéis

#### **Backend (API)**
- [ ] Endpoints de usuários:
  - `GET /api/users` (listar - com filtros)
  - `GET /api/users/:id`
  - `PUT /api/users/:id`
  - `DELETE /api/users/:id`
  - `POST /api/users/:id/assign-role`
  - `POST /api/users/:id/assign-tenant`
- [ ] Validação de permissões por endpoint
- [ ] Filtros e paginação

#### **Frontend (Telas)**
- [ ] Tela de listagem de usuários
- [ ] Tela de criação/edição de usuário
- [ ] Modal de atribuição de roles
- [ ] Modal de atribuição de tenants
- [ ] Filtros e busca

#### **Testes**
- [ ] Testes de API:
  - CRUD completo
  - Validação de permissões
  - Atribuição de roles
- [ ] Testes E2E:
  - Fluxo completo de criação de usuário
  - Atribuição de papel e tenant

**✅ Critério de Aceite:** Gestor pode criar, editar e gerenciar usuários com diferentes papéis.

---

## 📅 SPRINT 4: GESTÃO DE MOTORISTAS E PASSAGEIROS (Semana 7-8)

### **Objetivo:** CRUD de motoristas e passageiros

#### **Backend (API)**
- [ ] Schema: `drivers`, `passengers`, `vehicles`
- [ ] Endpoints de motoristas:
  - `GET /api/drivers`
  - `POST /api/drivers`
  - `GET /api/drivers/:id`
  - `PUT /api/drivers/:id`
  - `POST /api/drivers/:id/status` (online/offline)
- [ ] Endpoints de passageiros:
  - `GET /api/passengers`
  - `POST /api/passengers`
  - `GET /api/passengers/:id`
  - `PUT /api/passengers/:id`
- [ ] Endpoints de veículos:
  - `GET /api/vehicles`
  - `POST /api/vehicles`
  - `PUT /api/vehicles/:id`

#### **Frontend (Telas)**
- [ ] Tela de listagem de motoristas
- [ ] Tela de cadastro/edição de motorista
- [ ] Tela de listagem de passageiros
- [ ] Tela de cadastro/edição de passageiro
- [ ] Tela de gestão de veículos
- [ ] Status visual (online/offline)

#### **Testes**
- [ ] Testes de API:
  - CRUD motoristas
  - CRUD passageiros
  - Mudança de status
- [ ] Testes E2E:
  - Cadastro completo de motorista
  - Cadastro completo de passageiro

**✅ Critério de Aceite:** Gestor pode cadastrar e gerenciar motoristas e passageiros.

---

## 📅 SPRINT 5: GEOLOCALIZAÇÃO BÁSICA (Semana 9-10)

### **Objetivo:** Sistema de localização e rastreamento

#### **Backend (API)**
- [ ] Schema: `driver_positions`
- [ ] Endpoints de localização:
  - `POST /api/location/update` (atualizar posição)
  - `GET /api/location/drivers` (listar motoristas próximos)
  - `GET /api/location/drivers/:id` (posição específica)
- [ ] Cálculo de distância (Haversine)
- [ ] WebSocket para atualizações em tempo real
- [ ] Endpoint de detecção de cidade:
  - `POST /api/location/detect-city`

#### **Frontend (Telas)**
- [ ] Mapa básico (Leaflet ou Google Maps)
- [ ] Visualização de motoristas no mapa
- [ ] Atualização de posição em tempo real
- [ ] Tela de configuração de cidade

#### **Testes**
- [ ] Testes de API:
  - Atualização de posição
  - Cálculo de distância
  - Detecção de cidade
- [ ] Testes E2E:
  - Atualização de posição em tempo real
  - Visualização no mapa

**✅ Critério de Aceite:** Sistema rastreia motoristas e calcula distâncias corretamente.

---

## 📅 SPRINT 6: SOLICITAÇÃO DE CORRIDA (Semana 11-12)

### **Objetivo:** Passageiro solicita corrida, sistema encontra motorista

#### **Backend (API)**
- [ ] Schema: `rides`, `ride_status_history`
- [ ] Estados: `PENDING`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
- [ ] Endpoints de corridas:
  - `POST /api/rides` (solicitar)
  - `GET /api/rides/:id`
  - `GET /api/rides` (listar - com filtros)
  - `POST /api/rides/:id/cancel`
- [ ] Engine de dispatch básico:
  - Motorista online
  - Mesma cidade
  - Menor distância
- [ ] WebSocket: notificação para motorista

#### **Frontend (Telas)**
- [ ] Tela de solicitação de corrida (passageiro)
- [ ] Mapa com origem e destino
- [ ] Tela de acompanhamento de corrida
- [ ] Notificação de motorista encontrado
- [ ] Tela de histórico de corridas

#### **Testes**
- [ ] Testes de API:
  - Solicitação de corrida
  - Engine de dispatch
  - Cancelamento
- [ ] Testes E2E:
  - Fluxo completo: solicitar → encontrar → aceitar
  - Cancelamento de corrida

**✅ Critério de Aceite:** Passageiro solicita corrida e sistema encontra motorista automaticamente.

---

## 📅 SPRINT 7: ACEITE E GERENCIAMENTO DE CORRIDA (Semana 13-14)

### **Objetivo:** Motorista aceita/recusa, atualização de status em tempo real

#### **Backend (API)**
- [ ] Endpoints adicionais:
  - `POST /api/rides/:id/accept` (motorista aceita)
  - `POST /api/rides/:id/reject` (motorista recusa)
  - `POST /api/rides/:id/start` (iniciar corrida)
  - `POST /api/rides/:id/complete` (finalizar)
- [ ] Reatribuição automática se motorista recusar
- [ ] Timeout de aceite (30s)
- [ ] WebSocket: atualizações de status em tempo real

#### **Frontend (Telas)**
- [ ] Tela de corridas pendentes (motorista)
- [ ] Modal de aceite/recusa
- [ ] Tela de corrida em andamento
- [ ] Atualização de status em tempo real
- [ ] Tela de finalização

#### **Testes**
- [ ] Testes de API:
  - Aceite/recusa
  - Reatribuição
  - Timeout
  - Transições de estado
- [ ] Testes E2E:
  - Fluxo completo: aceitar → iniciar → finalizar
  - Recusa e reatribuição

**✅ Critério de Aceite:** Motorista aceita corrida, inicia e finaliza com atualizações em tempo real.

---

## 📅 SPRINT 8: PLANOS E FEATURES (Semana 15-16)

### **Objetivo:** Sistema de planos e feature flags

#### **Backend (API)**
- [ ] Schema: `plans`, `plan_features`, `plan_limits`, `tenant_plans`
- [ ] Endpoints de planos:
  - `GET /api/plans`
  - `POST /api/plans`
  - `GET /api/plans/:id`
  - `PUT /api/plans/:id`
  - `POST /api/tenants/:id/subscribe`
- [ ] Middleware de verificação de features
- [ ] Middleware de verificação de limites

#### **Frontend (Telas)**
- [ ] Tela de listagem de planos
- [ ] Tela de criação/edição de plano
- [ ] Tela de assinatura de plano
- [ ] Dashboard de uso (limites)
- [ ] Indicadores de features ativas

#### **Testes**
- [ ] Testes de API:
  - CRUD de planos
  - Assinatura
  - Verificação de features
  - Aplicação de limites
- [ ] Testes E2E:
  - Fluxo de assinatura
  - Bloqueio por limite atingido

**✅ Critério de Aceite:** Empresas podem assinar planos e limites são aplicados automaticamente.

---

## 📅 SPRINT 9: PAINEL ADMINISTRATIVO (Semana 17-18)

### **Objetivo:** Dashboards e gestão completa

#### **Backend (API)**
- [ ] Endpoints de analytics:
  - `GET /api/analytics/dashboard`
  - `GET /api/analytics/rides`
  - `GET /api/analytics/drivers`
  - `GET /api/analytics/revenue`
- [ ] Endpoints de gestão:
  - `GET /api/admin/tenants`
  - `PUT /api/admin/tenants/:id`
  - `GET /api/admin/users`

#### **Frontend (Telas)**
- [ ] Dashboard principal (métricas)
- [ ] Gráficos de corridas
- [ ] Gráficos de receita
- [ ] Tela de gestão de tenants (super admin)
- [ ] Tela de logs de auditoria

#### **Testes**
- [ ] Testes de API:
  - Endpoints de analytics
  - Permissões de admin
- [ ] Testes E2E:
  - Visualização de dashboards
  - Gestão de tenants

**✅ Critério de Aceite:** Gestores visualizam métricas e administram o sistema.

---

## 📅 SPRINT 10: POLIMENTO E OTIMIZAÇÕES (Semana 19-20)

### **Objetivo:** Melhorias, testes e documentação

#### **Backend (API)**
- [ ] Rate limiting
- [ ] Cache strategy (Redis)
- [ ] Otimizações de queries
- [ ] Documentação Swagger/OpenAPI
- [ ] Logs estruturados

#### **Frontend (Telas)**
- [ ] Loading states
- [ ] Error handling
- [ ] Responsividade completa
- [ ] Acessibilidade básica

#### **Testes**
- [ ] Cobertura de testes > 80%
- [ ] Testes de performance
- [ ] Testes de carga

**✅ Critério de Aceite:** Sistema robusto, testado e documentado.

---

## 📋 ESTRUTURA DE APIs PARA MOBILE

### **Base URL**
```
Production: https://api.seudominio.com
Development: http://localhost:3000
```

### **Autenticação**
```
Header: Authorization: Bearer <token>
```

### **Endpoints Principais**

#### **Autenticação**
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Dados do usuário logado

#### **Corridas (Passageiro)**
- `POST /api/rides` - Solicitar corrida
- `GET /api/rides/:id` - Detalhes da corrida
- `GET /api/rides` - Histórico
- `POST /api/rides/:id/cancel` - Cancelar

#### **Corridas (Motorista)**
- `GET /api/rides/pending` - Corridas pendentes
- `POST /api/rides/:id/accept` - Aceitar
- `POST /api/rides/:id/reject` - Recusar
- `POST /api/rides/:id/start` - Iniciar
- `POST /api/rides/:id/complete` - Finalizar

#### **Localização**
- `POST /api/location/update` - Atualizar posição
- `GET /api/location/drivers` - Motoristas próximos
- `POST /api/location/detect-city` - Detectar cidade

#### **WebSocket**
- `wss://api.seudominio.com/ws` - Conexão WebSocket
  - Eventos: `ride:new`, `ride:status`, `location:update`

---

## 🧪 ESTRATÉGIA DE TESTES

### **Pirâmide de Testes**

```
        /\
       /E2E\        (10%) - Fluxos críticos
      /------\
     /Integração\   (30%) - APIs e serviços
    /------------\
   /   Unitários   \ (60%) - Funções e componentes
  /----------------\
```

### **Ferramentas**
- **Unitários:** Jest + React Testing Library
- **Integração:** Jest + Supertest
- **E2E:** Playwright
- **Performance:** k6 ou Artillery

---

## 📝 PRÓXIMOS PASSOS IMEDIATOS

1. ✅ **Confirmar stack específica:**
   - Prisma ou TypeORM?
   - NextAuth ou Clerk?
   - PostgreSQL ou outro?

2. ✅ **Criar estrutura inicial do projeto**

3. ✅ **Configurar ambiente de desenvolvimento**

4. ✅ **Iniciar Sprint 1**

---

## 💡 OBSERVAÇÕES IMPORTANTES

- **Mobile será desenvolvido depois** (quando APIs estiverem estáveis)
- **APIs devem ser versionadas** (`/api/v1/...`)
- **Documentação OpenAPI** é essencial para mobile
- **WebSocket** será crucial para experiência em tempo real
- **Testes devem ser escritos junto** com o código (TDD quando possível)

