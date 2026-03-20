## 📘 Worklog — Gestão de Passageiros

Documento para registrar, em ordem cronológica, tudo que for implementado relacionado a **passageiros** (API, telas, regras de negócio, integrações, etc.).  
Use este arquivo para sabermos exatamente **onde paramos** e **qual é o próximo passo**.

---

### 2026-03-17 — Análise inicial e planejamento da busca por passageiro

- **Contexto**: revisão do projeto para entender o estado atual da funcionalidade de passageiros.
- **O que já existe**:
  - Modelo `Passenger` definido no `prisma/schema.prisma` e relacionado com `Ride` (`passengerId`, índice em `passengerId`).
  - Seeds de `Role` e `Permission` para passageiros em `prisma/seed.ts` (`slug: 'passenger'` e permissão `passenger:manage`).
  - App do passageiro em `apps/passenger` (Expo), incluindo autenticação com Supabase e configuração de branding.
- **O que está apenas planejado (ainda não implementado)**:
  - Endpoints de API para passageiros (`GET /api/passengers`, `POST /api/passengers`, `GET /api/passengers/:id`, `PUT /api/passengers/:id`) descritos em `ARQUITETURA_API_E_PLANO_DEV.md`.
  - Telas do admin para **listagem** e **cadastro/edição** de passageiros.
- **Decisão de hoje**:
  - Criar e manter este `docs/WORKLOG-PASSAGEIROS.md` como fonte de verdade das atividades relacionadas a passageiros.
- **Próximos passos sugeridos** (ainda não iniciados):
  - Implementar endpoint `GET /api/passengers?query=` para busca paginada/filtrada por nome, telefone ou e-mail.
  - Criar página no admin para listagem de passageiros com campo de busca consumindo essa API.

---

### 2026-03-17 — Preparação de ambiente real (app ↔ API ↔ banco)

- **Objetivo**: validar comunicação real do app com backend e banco do Supabase.
- **Ações executadas**:
  - Executado `npm run db:generate` com sucesso.
  - Tentativas de `npm run db:push`/`npm run db:seed` inicialmente falharam por credencial inválida no `DATABASE_URL`.
  - Ajustada configuração de conexão com pooler/direct no `.env` para alinhar com padrão Supabase.
- **Status técnico atual**:
  - Erro de autenticação foi superado.
  - `db:seed` passou a falhar por ausência da tabela `app_brands` (`P2021`), indicando divergência entre schema atual do Prisma e banco existente.
- **Próximo passo definido**:
  - Criar `app_brands` via SQL manual no Supabase (mudança pontual e segura), depois reexecutar `npm run db:seed`.

---

### 2026-03-17 — Pronto para teste via APK (EAS Preview)

- **Validação de configuração**:
  - `apps/passenger/eas.json` já está com profile `preview` em `distribution: internal` e `android.buildType: apk`.
  - `apps/passenger/.env` está apontando API pública (`https://mobilidade-urbana-na-pratica.vercel.app`), adequado para teste em celular físico.
- **Status**:
  - Fluxo recomendado confirmado: baixar o APK do build `preview` no Expo/EAS e validar no aparelho real.
- **Próximo passo operacional**:
  - Instalar o APK no Android e executar checklist de teste (login, carregamento inicial e chamadas de API).

---

### 2026-03-17 — Controle de funcionalidade por central (Publicidade)

- **Objetivo**: habilitar/desabilitar funções por central (nossa bandeira + white-label), começando por **Publicidade** no app passageiro.
- **Implementado**:
  - Novo item no menu admin: **Funcionalidades** (`/admin/funcionalidades`).
  - Nova tela de gestão por central:
    - bloco da bandeira **Mai Drive**;
    - lista de centrais white-label;
    - checkbox para ativar/desativar **Publicidade**.
  - Nova API master: `GET/PATCH /api/admin/tenant-features`.
    - GET lista status atual por central.
    - PATCH salva `showPassengerAds` para bandeira ou tenant.
  - API do app atualizada: `GET /api/app/tenant-config` agora retorna `showPassengerAds`.
  - App passageiro atualizado:
    - `BrandingConfig` ganhou `showPassengerAds`.
    - Área "Espaço publicitário" da tela inicial só renderiza quando `showPassengerAds = true`.
- **Banco/modelagem**:
  - `AppBrand.showPassengerAds` (boolean, default false).
  - `Tenant.showPassengerAds` (boolean, default false).
- **Pendência operacional**:
  - Aplicar no banco as duas colunas novas (o `db:push` no pooler ficou travado; recomendado aplicar via SQL direto no Supabase).

---

### 2026-03-18 — Criação de centrais (parceiros)

- **Objetivo**: iniciar gestão de cadastro de centrais pelo admin master.
- **Implementado**:
  - Nova API admin para centrais:
    - `GET /api/admin/tenants`: lista centrais.
    - `POST /api/admin/tenants`: cria central white-label com `name`, `slug` e `logo` (opcional).
  - Nova tela em `admin/parceiros`:
    - formulário para criação de central;
    - seletor de tipo (nossa bandeira / white-label);
    - mensagem orientativa para bandeira fixa;
    - listagem de centrais com busca por nome/slug.
- **Validação local**:
  - `GET /api/admin/tenants` respondendo `200`.
  - Página `/admin/parceiros` respondendo `200`.

---

### 2026-03-18 — Correção de travamento na tela de funcionalidades

- **Sintoma reportado**:
  - Clique em botões sem mudança visual/funcional (aparente travamento).
- **Causa raiz confirmada por log**:
  - API `GET /api/admin/tenant-features` quebrando por colunas ausentes no banco:
    - `app_brands.showPassengerAds`
    - `tenants.showPassengerAds`
- **Evidência**:
  - Erros Prisma `P2022` no servidor local durante requests da tela.
- **Ação corretiva aplicada**:
  - Criado script `scripts/add_show_passenger_ads.sql`.
  - Executado com sucesso via `prisma db execute` usando `DIRECT_URL`.
- **Resultado**:
  - `GET /api/admin/tenant-features` voltou a responder `200` com payload válido.
  - Tela `/admin/funcionalidades` voltou a carregar.

---

### 2026-03-18 — Ajuste de navegação no Admin (cliques travando)

- **Sintoma reportado**:
  - Clique em itens como `Parceiros` sem navegação perceptível.
- **Diagnóstico**:
  - Backend saudável (`/api/health` = OK).
  - Rotas e APIs de parceiros funcionando (`/admin/parceiros` e `/api/admin/tenants` = 200).
  - Hipótese principal: transição client-side do menu não confiável no estado atual do app local.
- **Ajuste aplicado**:
  - Menu lateral admin trocado para navegação por `<a href>` (full navigation), evitando travas de transição client-side.
  - Dashboard admin recebeu atalho explícito para `"/admin/parceiros"` em Ações Rápidas.

---

### 2026-03-18 — Vínculo de central com cidade + funções por central na tela de Parceiros

- **Objetivo**:
  - Vincular central a uma cidade específica.
  - Atribuir função por central (checkbox de Publicidade).
- **Implementado (backend)**:
  - `GET /api/admin/tenants` agora retorna:
    - `showPassengerAds`
    - cidade vinculada (`linkedCity`) via `tenant_cities`.
  - `POST /api/admin/tenants` agora aceita:
    - `cityId` (opcional, vínculo inicial de cidade),
    - `showPassengerAds` (opcional).
  - Novo endpoint `GET /api/admin/tenants/city-options` para listar cidades disponíveis.
  - Novo endpoint `PATCH /api/admin/tenants/[id]` para:
    - vincular/desvincular cidade da central,
    - atualizar `showPassengerAds` por central.
- **Implementado (frontend)**:
  - `admin/parceiros` passou a ter:
    - seletor de cidade na criação da central,
    - checkbox de Publicidade na criação,
    - por central já criada: seletor de cidade + botão “Vincular cidade”,
    - checkbox de Publicidade por central com atualização imediata.
- **Validação local**:
  - `GET /api/admin/tenants/city-options` = `200`.
  - `GET /admin/parceiros` = `200`.

---

### 2026-03-18 — Melhoria de fluxo em etapas (selecionar central → cidade → funcionalidades)

- **Objetivo**:
  - Evitar lista fixa poluída e operar por seleção de central.
  - Fluxo orientado: buscar central, vincular cidade, salvar funcionalidades.
- **Implementado**:
  - `admin/parceiros` foi reorganizado para:
    1) buscar e selecionar central;
    2) salvar cidade de atuação da central;
    3) marcar e salvar funcionalidades por central.
  - A listagem completa de centrais não fica fixa; aparece conforme busca.
  - As funcionalidades agora são carregadas como catálogo por central (inclui `passenger_advertising`).
- **Novas APIs**:
  - `GET/PATCH /api/admin/tenants/[id]/capabilities`
    - GET: retorna central + cidade vinculada + funcionalidades com `enabled`.
    - PATCH: salva `cityId` e/ou `featureSlugs`.
  - `GET /api/admin/tenants/city-options` (reutilizado no fluxo de seleção de cidade).
- **Regra aplicada**:
  - Ao salvar funcionalidades, a flag `showPassengerAds` da central é sincronizada com a feature `passenger_advertising`.

---

### 2026-03-18 — Sistema de Gestão de Planos (Nossa Bandeira / White-label)

- **Objetivo**:
  - Criar sistema flexível de planos com dois tipos: Nossa Bandeira (Mai Drive) e White-label.
  - Permitir configurar tipo de cobrança (por corrida ou mensal) e formato de valor (porcentagem ou fixo).
  - Suportar planos customizáveis ("Do Seu Jeito").

- **Implementado (banco de dados)**:
  - Novos tipos enum no Prisma:
    - `PlanTargetType`: BRAND (Nossa Bandeira) | WHITE_LABEL
    - `PlanChargeType`: PER_RIDE (por corrida) | MONTHLY (mensal)
    - `PlanValueFormat`: PERCENTAGE (%) | FIXED (R$)
  - Novos campos no modelo `Plan`:
    - `targetType`: define se é plano Nossa Bandeira ou White-label
    - `chargeType`: por corrida ou mensal
    - `valueFormat`: porcentagem ou valor fixo
    - `value`: valor numérico da cobrança
    - `isCustomizable`: flag para plano "Do Seu Jeito"
    - `sortOrder`: ordem de exibição
  - Novos campos no modelo `PlanFeature`:
    - `extraValue`: valor adicional por funcionalidade (para planos customizáveis)
    - `extraValueFormat`: formato do valor adicional

- **SQL aplicado** (`scripts/update_plans_quick.sql`):
  ```sql
  CREATE TYPE "PlanTargetType" AS ENUM ('BRAND', 'WHITE_LABEL');
  CREATE TYPE "PlanChargeType" AS ENUM ('PER_RIDE', 'MONTHLY');
  CREATE TYPE "PlanValueFormat" AS ENUM ('PERCENTAGE', 'FIXED');
  
  ALTER TABLE plans 
    ADD COLUMN "targetType" "PlanTargetType" DEFAULT 'BRAND',
    ADD COLUMN "chargeType" "PlanChargeType" DEFAULT 'PER_RIDE',
    ADD COLUMN "valueFormat" "PlanValueFormat" DEFAULT 'FIXED',
    ADD COLUMN "value" DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN "isCustomizable" BOOLEAN DEFAULT false,
    ADD COLUMN "sortOrder" INTEGER DEFAULT 0;
  ```

- **Implementado (backend)**:
  - Nova API: `GET /api/admin/plans` - lista todos os planos
  - Nova API: `POST /api/admin/plans` - cria novo plano
  - Nova API: `GET /api/admin/plans/[id]` - busca plano específico
  - Nova API: `PATCH /api/admin/plans/[id]` - atualiza plano
  - Nova API: `DELETE /api/admin/plans/[id]` - exclui plano
  - Todas as APIs usam `isMasterAdmin()` para autenticação

- **Implementado (frontend)**:
  - Nova página `/admin/planos`:
    - Dois cards principais: "Nossa Bandeira" e "White-label"
    - Ao clicar em um card, abre popup com lista de planos daquele tipo
    - Botão "Novo Plano" para criar planos
  - Popup de criação/edição de plano com:
    - Nome e slug
    - Descrição
    - Tipo de cobrança (Por Corrida / Mensal) via tabs visuais
    - Formato do valor (Valor Fixo R$ / Porcentagem %) via tabs visuais
    - Campo de valor numérico
    - Checkbox "Plano customizável (Do Seu Jeito)"
    - Checkbox "Plano ativo"
    - Lista de funcionalidades para incluir no plano

- **Status atual**:
  - Schema Prisma atualizado ✓
  - SQL executado no Supabase ✓
  - APIs criadas ✓
  - Página admin criada ✓
  - Criar plano ✓
  - Editar plano ✓
  - Listar planos ✓

- **SQLs executados para corrigir erros**:
  ```sql
  -- Adicionar colunas extras em plan_features
  ALTER TABLE plan_features 
    ADD COLUMN IF NOT EXISTS "extraValue" DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS "extraValueFormat" "PlanValueFormat";
  
  -- Remover colunas antigas não usadas
  ALTER TABLE plans DROP COLUMN IF EXISTS "price";
  ALTER TABLE plans DROP COLUMN IF EXISTS "interval";
  ```

- **Funcionalidade completa** ✓

---

### 2026-03-18 — Página pública de planos dinâmica

- **Objetivo**: Fazer a página `/planos` puxar os planos do banco de dados

- **Implementado**:
  - Nova API pública: `GET /api/public/plans` - lista planos ativos por tipo
  - Página `/planos` atualizada para buscar planos do banco
  - Exibe valor formatado (R$ ou %)
  - Indica tipo de cobrança (por corrida ou mensal)
  - Mostra funcionalidades vinculadas ao plano
  - Botão "Começar Agora" direciona para `/parceiro?plano=slug`
  - Layout responsivo adapta ao número de planos

- **Status**: ✓ Funcionando

---

### 2026-03-18 — App do Motorista (estrutura inicial)

- **Objetivo**: Criar a base do app do motorista seguindo o mesmo padrão do app passageiro

- **Estrutura criada** (`apps/driver/`):
  - `package.json` - dependências (Expo, React Native, Supabase, Maps)
  - `app.json` - configuração do Expo (nome: Mai Drive Motorista, package: com.maidrive.driver)
  - `eas.json` - configuração de build
  - `tsconfig.json` - TypeScript config

- **Libs criadas**:
  - `lib/supabase.ts` - cliente Supabase
  - `lib/api.ts` - funções para chamadas API

- **Contextos criados**:
  - `contexts/AuthContext.tsx` - autenticação e dados do motorista
  - `contexts/DriverStatusContext.tsx` - controle de status online/offline

- **Telas de autenticação**:
  - `app/(auth)/login.tsx` - login
  - `app/(auth)/register.tsx` - cadastro de motorista
  - `app/(auth)/forgot-password.tsx` - recuperação de senha

- **Telas principais (tabs)**:
  - `app/(tabs)/index.tsx` - Home com status online/offline, estatísticas do dia
  - `app/(tabs)/rides.tsx` - Lista de corridas disponíveis para aceitar
  - `app/(tabs)/history.tsx` - Histórico de corridas realizadas
  - `app/(tabs)/earnings.tsx` - Resumo de ganhos (hoje, semana, mês)
  - `app/(tabs)/profile.tsx` - Perfil, veículo, documentos, logout

- **Funcionalidades implementadas**:
  - Toggle online/offline
  - Localização em tempo real
  - Lista de corridas disponíveis (atualiza a cada 10s)
  - Aceitar corrida
  - Histórico com status (concluída/cancelada)
  - Resumo de ganhos por período
  - Aviso de cadastro em análise

- **Próximos passos**:
  - Criar APIs no backend para o motorista (`/api/app/driver/*`)
  - Instalar dependências (`npm install` na pasta driver)
  - Testar o app

---

### 2026-03-19 — Multi-cidade em centrais + cadastro por cityId

- **Objetivo**: eliminar ambiguidade de cidade por nome/UF e consolidar vínculo por ID para suportar cenário multi-tenant com múltiplas cidades por central.
- **Implementado (backend)**:
  - `PATCH /api/admin/tenants/[id]/capabilities` agora aceita `cityIds: string[]` (com compatibilidade para `cityId` legado).
  - `GET /api/admin/tenants/[id]/capabilities` passou a retornar `tenant.linkedCities` (mantendo `linkedCity` para compatibilidade).
  - `POST /api/admin/tenants` passou a aceitar `cityIds` no cadastro da central.
  - `GET /api/admin/tenants` passou a retornar `linkedCities` além de `linkedCity`.
  - `POST /api/partner/register` agora aceita `cityId` (fallback para `cityName/cityState` mantido temporariamente).
  - `POST /api/partner/tenant/cities/add` agora aceita `cityId` (fallback para `cityName/cityState` mantido).
  - Nova API `GET /api/partner/cities/options?q=` para seleção de cidade no cadastro público do parceiro.
- **Implementado (frontend)**:
  - `admin/parceiros` atualizado para seleção e salvamento de **múltiplas cidades** por central.
  - Cadastro de central no admin agora envia `cityIds`.
  - Página pública `/parceiro` passou a selecionar cidade por lista (`cityId`) com busca e prévia no mapa.
  - `admin/cidades`: exibição do **`id` da cidade** (fonte monoespaçada + copiar) na busca “cidades já cadastradas”, na lista “mapeadas por estado” e nos cards “sem área mapeada”.
  - `admin/cidades`: correção do botão **Configurar** e ícone **Editar** nos cards “sem área mapeada” — ambos passam a abrir `/admin/cidades/[id]/mapear` (antes `Configurar` não tinha ação).
  - `admin/cidades`: reforço de navegação nos cards “sem área mapeada” com `router.push` no card e nos botões de ação (evita falhas de clique em áreas com sobreposição visual/scroll).
  - `admin/cidades`: lista **“Cidades mapeadas por estado”** e **“Cidades já cadastradas”** passam a abrir o editor via `router.push` na linha inteira (ícone sem `opacity-0`); bloco de copiar ID usa `stopPropagation` para não disparar navegação.
  - `admin/cidades`: navegação para o editor passou a usar **âncoras HTML (`<a href>`)** + `cityEditorHref()` (e `window.location.assign` após criar cidade / ao escolher na busca), com card “sem mapeamento” usando link em tela cheia + ilhas `pointer-events-auto` para copiar ID e botões — contorna falhas de `router.push`/client navigation.

---

### 2026-03-19 — Editor de mapeamento: dados da cidade + botões rebaixados

- **Objetivo**: dar espaço visual entre estatísticas e ações e exibir cadastro da cidade na lateral do editor.
- **Implementado (frontend)**:
  - Novo componente `src/components/admin/CityDataEditorCard.tsx` (edição de cadastro + ID com copiar).
  - `admin/cidades/[id]/mapear`: card **Dados da cidade** entre **Estatísticas** e a faixa de botões; bloco de ações com `border-t` + `pt-6` para separar dos dados.
  - Carregamento via `GET /api/admin/cities/[id]/coverage` já existente (`ibgeCode`, `isActive`).
- **Implementado (backend)**: `PATCH /api/admin/cities/[id]` para atualizar nome, UF, país, lat/lng, IBGE e `isActive`.
- **Próximo passo**: opcional — exibir regiões IBGE no card quando estiverem preenchidas no banco.
- **Atualização**: card **Estatísticas** com texto explicando “Pontos” e “Status”; dados da cidade com formulário editável e `PATCH /api/admin/cities/[id]`.
- **Layout**: cards **Instruções** e **Estatísticas** abaixo do mapa, lado a lado (`md:grid-cols-2`); coluna direita só com dados da cidade e botões de ação.

---

### 2026-03-19 — Correção build Vercel: seed de Plan alinhado ao Prisma

- **Objetivo**: corrigir falha de typecheck em `npm run build` na Vercel (`prisma/seed.ts`: propriedade `price` inexistente no modelo `Plan`).
- **Implementado (backend/seed)**:
  - `prisma/plan.upsert` para `basic`, `pro` e `enterprise` passou a usar `targetType`, `chargeType`, `valueFormat`, `value` e `sortOrder` (mensalidade fixa em R$), com `update` espelhando `create` para re-seed idempotente.
- **SQL aplicado**: nenhum (apenas script de seed).
- **Status atual**: tipos do seed compatíveis com `Plan` no `schema.prisma`.
- **Pendente**: novo deploy na Vercel após `commit`/`push` em `staging`; validar `npm run build` no CI.
- **Próximo passo**: fazer push da branch `staging` e conferir o deploy.

---

### 2026-03-19 — Correção typecheck: UserWithPermissions em admin/permissoes

- **Objetivo**: build Vercel falhava em `UserWithPermissions`: uso de `userId` vs tipo com `id`.
- **Implementado (frontend)**:
  - `src/app/admin/permissoes/page.tsx`: interface alinhada à resposta de `GET /api/admin/user-permissions` (campo `userId`).
- **Pendente**: novo deploy na Vercel após push em `staging`.

---

### 2026-03-19 — Correção typecheck: admin/planos imports não usados

- **Objetivo**: build Vercel falhava com `noUnusedLocals` em `src/app/admin/planos/page.tsx` (imports `Select*` e `TabsContent`; constante `VALUE_FORMAT_LABELS`).
- **Implementado (frontend)**:
  - Removidos imports não utilizados e a constante órfã.
- **Pendente**: novo deploy na Vercel após push em `staging`.

---

### 2026-03-19 — Correção typecheck: parâmetros não usados em rotas API + painel

- **Objetivo**: build Vercel (`noUnusedParameters`) em handlers e narrowing de `tenant` no painel do parceiro.
- **Implementado**:
  - `api/admin/advertisements/[id]`: `_request` em `GET` e `DELETE`.
  - `api/admin/plans/[id]`: `_req` em `GET` e `DELETE`.
  - `api/admin/roles/[id]`: `_request` em `GET` e `DELETE`.
  - `api/admin/tenants/[id]/editable-fields`: `_request` em `GET`.
  - `painel/page.tsx`: variável local `tenant` após guard para usar `tenant.id` com tipo seguro.

---

### 2026-03-20 — Produção (main): merge staging + 404 /admin/parceiros

- **Contexto**: `www.maidrive.com.br/admin/parceiros` retornava **404** porque a rota existia só na `staging`; a `main` estava desatualizada.
- **Ação**: `staging` foi incorporada na `main` (fast-forward até o commit com correções de build e `src/app/admin/parceiros/page.tsx`).
- **Pós-deploy**: aguardar deploy de **Production** na Vercel e validar `/admin/parceiros` e variáveis (`DATABASE_URL`, Supabase, rede liberada).

