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

---

### 2026-03-20 — Encerramento de sessão: deploy Vercel + produção alinhada

- **Objetivo**: registrar o que foi feito e o que falta **testar** na próxima retomada.

- **Operacional (Vercel / Supabase)** — feito nesta sessão:
  - Variável **`DATABASE_URL`** cadastrada na Vercel (valor **sem aspas** no campo).
  - Demais chaves já existentes conferidas (`NEXT_PUBLIC_SUPABASE_*`, etc.).
  - **Supabase → Database → Network Restrictions**: uso de **Allow all access** para permitir conexões externas (ex.: IPs da Vercel); antes: `FATAL: Address not in tenant allow_list`.
  - Após isso, **Admin → Cidades** passou a listar dados no deploy.

- **Git** — feito nesta sessão:
  - **`main`** atualizada com o conteúdo da **`staging`** (resolve **404** em `www.maidrive.com.br/admin/parceiros` — rota ausente na `main` antiga).
  - Push **`main`** e **`staging`** alinhadas (incl. worklog).
  - **Commits de referência**: correções de build (`seed` Plan, permissões, planos, rotas API); merge produção; worklog `f431a32` na `main`.

- **Segurança (pendente quando possível)**:
  - Rotacionar **senha do Postgres** / revisar chaves se URLs sensíveis foram expostas em canal inseguro.
  - Produção: revisar **`NEXTAUTH_URL`** = `https://www.maidrive.com.br` (ou domínio real), não só `localhost`.

- **PRÓXIMA SESSÃO — checklist de testes (rodar em `www.maidrive.com.br` após deploy Production Ready)**:
  1. `/admin` — dashboard abre; menus novos (**Centrais**, **Nova Central**, **Aprovações**, etc.).
  2. `/admin/parceiros` — **Criar central**, multi-cidade, lista de cidades (igual localhost).
  3. `/admin/cidades` — busca, **Testar chave do Google**, listagens.
  4. `/admin/funcionalidades` — carregar centrais (sem erro de API).
  5. `/admin/permissoes` — buscar usuário, grant/revoke extra.
  6. `/admin/planos` — abrir e salvar sem erro.
  7. `/admin/centrais` e detalhe `[id]` — carregar dados da central.
  8. `/painel` (parceiro logado) — tenant e cidades.
  9. Login Google / sessão em **HTTPS** se aplicável.
  10. Comparar com **`localhost`** apenas para divergências inesperadas.

- **Próximo passo**: quando retornar, executar o checklist acima e anotar falhas (URL + mensagem de erro, sem colar segredos).

---

### 2026-03-28 — Alinhamento API dos apps (passageiro + motorista) para produção

- **Objetivo**: uma forma única de apontar o Next.js (Mai Drive) a partir dos apps Expo.
- **Implementado (frontend apps)**:
  - `apps/passenger/lib/apiBaseUrl.ts`: `getApiBaseUrl()` com `EXPO_PUBLIC_APP_API_URL` ou `EXPO_PUBLIC_API_URL`, fallback `https://maidrive.com.br`, ajuste `localhost` → `10.0.2.2` no emulador Android.
  - Passageiro: `branding.ts`, `AdBanner.tsx`, `esqueci-senha.tsx` passam a usar `getApiBaseUrl()`.
  - Motorista: `apiBaseUrl.ts` aceita também `EXPO_PUBLIC_APP_API_URL` e fallback `https://maidrive.com.br`.
  - `apps/passenger/env.example` e `apps/driver/.env.example` atualizados com `maidrive.com.br`.
- **Pendente (operacional)**:
  - No **EAS** (preview/production), definir as mesmas variáveis para cada app: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, e URL da API (`EXPO_PUBLIC_APP_API_URL` no passageiro e/ou `EXPO_PUBLIC_API_URL` no motorista) = `https://maidrive.com.br` (ou `https://www.maidrive.com.br` se for o canônico).
  - **Supabase Auth → URL Configuration**: incluir `https://maidrive.com.br/redefinir-senha` e `https://www.maidrive.com.br/redefinir-senha` em redirect URLs se usar fluxo de recuperação de senha.
- **Próximo passo**: novo `eas build` após configurar env no EAS; testar login, branding e “esqueci senha” no aparelho.

---

### 2026-03-28 — Cadastro: telefone + e-mail (passageiro e motorista)

- **Objetivo**: exigir telefone e e-mail nos formulários de cadastro dos apps.
- **Passageiro** (`apps/passenger/app/(auth)/register.tsx`): campo **Telefone**, validação (mín. 10 dígitos numéricos) e e-mail; `signUp` envia `full_name`, `phone` e `user_type: 'passenger'` em `user_metadata` (Supabase).
- **Motorista** (`apps/driver/app/(auth)/register.tsx`): já tinha nome, e-mail e telefone; adicionadas validações de formato de e-mail e telefone, `autoComplete`, placeholders alinhados e `trim` no envio.
- **Backend**: `drivers` / `passengers` no Prisma continuam sem colunas de telefone; telefone fica em **metadata do Auth** (como já no fluxo do motorista em `/api/app/driver/register`). Persistência em tabela pode vir depois.
- **Pendente**: testar cadastro nos dois apps; se quiser telefone no banco, migration + APIs de sync.

---

### 2026-03-28 — Cadastro sem confirmação de e-mail (fluxo nos apps)

- **Supabase (obrigatório no painel)**: **Authentication → Providers → Email** → desativar **“Confirm email”** (ou equivalente) para o usuário receber **sessão na hora** após `signUp`.
- **Passageiro** (`register.tsx`): se não vier `session`, alerta pede **login** (sem texto de “confirme o e-mail”).
- **Motorista** (`AuthContext` + `register.tsx`): `signUp` devolve `session`; com sessão → `router.replace('/(tabs)')`; sem sessão → alerta para fazer login.
- **Pendente**: aplicar a opção no projeto Supabase de produção e testar cadastro nos dois apps.

---

### 2026-03-28 — Tipo de corrida padrão ao criar / aprovar central

- **Objetivo**: toda central (nossa bandeira ou white-label) passa a ter **TenantRideType** padrão ao nascer.
- **Implementado (backend)**:
  - `src/lib/tenant-default-ride-types.ts`: `ensureDefaultRideTypesForTenant` — se o tenant ainda não tem tipos, cria **“Corrida padrão”** (base R$ 5, R$ 2,50/km, R$ 0,45/min); **sem cidades** → um registro `slug: padrao`, `cityId` null; **com cidades** → um por cidade, `slug: padrao-<cityId>`.
  - `POST /api/admin/tenants`: após vincular cidades, chama o helper na mesma transação.
  - `POST /api/partner/register`: após `tenantCity`, chama o helper com a cidade do parceiro.
  - `PATCH /api/admin/tenants/pending` (aprovar): garante tipos pendentes para centrais que ainda não tinham (idempotente se já existir tipo).
- **Pendente**: centrais **antigas** sem tipo continuam sem até alguém criar manualmente ou rodar script; testar criação no admin e fluxo parceiro + aprovação.

---

### 2026-03-28 — Backfill: tipos de corrida em centrais antigas + após atualização do sistema

- **Objetivo**: após mudanças no sistema, alinhar **todas** as centrais que ainda não têm `TenantRideType`.
- **Implementado**:
  - `backfillAllTenantsMissingDefaultRideTypes` em `src/lib/tenant-default-ride-types.ts` (lista tenants com `rideTypes: none`, aplica a mesma lógica de padrão por cidade).
  - Script: `npm run db:backfill-ride-types` → `scripts/backfill-tenant-ride-types.ts` (usa `DATABASE_URL` do `.env`).
  - API master: `POST /api/admin/backfill/ride-types` — mesmo efeito, para disparar do browser logado como admin master após deploy.
- **Processo sugerido em cada release** que altere dados padrão de central: rodar o script na pipeline ou chamar a API uma vez em produção.
- **Apps mobile**: passam a “ver” dados novos quando o backend e as APIs responderem; **binário** do app só precisa de novo build se mudar código nativo ou variáveis embutidas no APK.

---

### 2026-03-28 — Painel parceiro: listar tipos de corrida (dados reais)

- **Problema**: `/painel/tipos-de-corrida` era só `PartnerModulePlaceholder` — não lia `tenant_ride_types`.
- **Implementado**:
  - `GET /api/partner/ride-types` — mesmo auth que `/api/partner/me`, retorna tipos da central com cidade (ou “Todas as cidades”).
  - Página `painel/tipos-de-corrida` em modo cliente: lista cards com bandeirada / km / min; estado vazio explica backfill para centrais antigas.

---

### 2026-03-28 — Painel parceiro: editar tipo de corrida

- **Objetivo**: permitir ao parceiro ajustar nome, descrição, preços e status ativo de cada `TenantRideType`.
- **Implementado (backend)**:
  - `PATCH /api/partner/ride-types/[id]` — auth igual ao GET; só atualiza se o registro pertence ao `tenantId` do usuário; campos: `name`, `description`, `basePrice`, `pricePerKm`, `pricePerMin`, `isActive`. **Não** altera `slug` nem `cityId`.
- **Implementado (frontend)**:
  - `painel/tipos-de-corrida`: botão **Editar** por card; modal com formulário e Switch de ativo; lista atualizada após salvar com sucesso.
- **Pendente**: validar no browser (parceiro logado) que salvar reflete no banco e que valores decimais com vírgula/ponto se comportam como esperado.

---

### 2026-03-28 — Painel parceiro: adicionar nova corrida (tipo)

- **Objetivo**: criar novos `TenantRideType` pelo painel do parceiro, sem depender só do padrão/backfill.
- **Implementado (backend)**:
  - `POST /api/partner/ride-types` — mesmo fluxo de auth que o GET (helper compartilhado no arquivo da rota); cria registro com `slug` único derivado do nome; `cityId` conforme cidades ativas da central (0 → null; 1 → obrigatório implícito ou explícito; 2+ → body deve trazer `cityId` null = todas ou id de cidade da central).
- **Implementado (frontend)**:
  - Botão **Nova corrida** no topo; no estado vazio, **Adicionar nova corrida**; modal unificado (criar vs editar) com select de cidade quando há 2+ cidades; padrões de preço iguais ao tipo automático (5 / 2,50 / 0,45).
- **Pendente**: testar multi-cidade e central sem cidades; confirmar que apps listam o novo tipo quando esperado.

---

### 2026-03-28 — Imagem do tipo de corrida (painel + app passageiro)

- **Objetivo**: permitir URL/imagem por `TenantRideType` e exibir no app do passageiro na escolha da modalidade.
- **Banco**: `TenantRideType.imageUrl` (`String?`, `@db.Text`). Aplicar com `npx prisma db push` ou migration na pipeline.
- **Backend**:
  - `GET/PATCH` e `POST` em `/api/partner/ride-types` passam a incluir `imageUrl`; validação http(s), até 2048 caracteres (`parseRideTypeImageUrlField`).
  - `POST /api/partner/ride-types/image-upload` — upload WebP no bucket público **`ride-type-images`** (Supabase admin, mesmo padrão da logo).
  - `GET /api/app/ride-types?slug=...&cityId=` — lista tipos **ativos** da central aprovada; resposta com `imageUrl`, preços, `cityLabel` (público, para o app).
  - `src/lib/partner-tenant-auth.ts` — auth do parceiro reutilizável; rotas de ride-types `[id]` passam a usar isso.
- **Painel** (`tipos-de-corrida`): campo URL, upload, pré-visualização, miniatura no card; “Remover imagem” zera no PATCH.
- **App passageiro**: `lib/rideTypes.ts` + `RideTypeCarousel` na home; filtro opcional por `cityId` quando o usuário tem **uma** central com cidade vinculada em `availableTenants`.
- **Pendente**: rodar `npx prisma generate` (e `db push`) após fechar processos que bloqueiem o DLL no Windows; criar bucket `ride-type-images` em produção se o primeiro upload não criar automaticamente; testar imagem HTTPS no dispositivo real.

---

### 2026-03-29 — Erro ao salvar tipo com imagem (banco sem coluna)

- **Causa provável**: `PATCH` falhava com **P2022** quando `tenant_ride_types` ainda não tinha a coluna `imageUrl` (schema Prisma atualizado, banco não).
- **Implementado**: `src/lib/prisma-http-error.ts` — em **P2022** as APIs de ride-types retornam **503** com texto orientando `npx prisma db push` ou SQL `ALTER TABLE tenant_ride_types ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;` no Supabase.
- **Operacional**: se `db push` no pooler (6543) travar, usar **connection string direta** (porta 5432) no `.env` só para o push, como já documentado no projeto.
- **Ajuste 2026-03-29**: tratamento de `PrismaClientValidationError` (ex.: **Unknown arg `imageUrl`**) com mensagem pedindo `npx prisma generate`; em `NODE_ENV=development` o 500 genérico passa a incluir o texto do erro na resposta JSON para depuração.
- **Ajuste 2026-03-29 (sem trocar env / generate)**: `imageUrl` passa a ser lida/gravada com **`$queryRaw` / `$executeRaw`** em `src/lib/tenant-ride-type-image-raw.ts` — o `update`/`create` tipado do Prisma **não** envia mais `imageUrl`, evitando client desatualizado; nome/preços salvam sempre; imagem só persiste se a coluna existir no banco.
- **Ajuste 2026-03-29 (lista / miniatura)**: após **Salvar** na edição, o painel chama **`loadList()`** de novo (evita estado local desatualizado); leitura/gravação da imagem tenta coluna **`"imageUrl"`** e fallback **`image_url`** no Postgres.
- **Correção 2026-03-29**: removido cache **`absent`** que fazia o mapa de imagens ficar **vazio para sempre** após a primeira falha (miniatura não aparecia mesmo com coluna criada depois); GET lista usa **`imageUrl` do SQL ou do Prisma**; headers **`Cache-Control: no-store`** na API e **`no-cache`** no `fetch` do painel.

---

### 2026-03-28 — Feedback de salvamento + tenant determinístico + `imagePersistFailed`

- **Objetivo**: deixar claro quando o painel **realmente salvou** preços/texto e quando a **imagem** não entrou no banco; evitar `findFirst` em `tenantUser` sem ordem (usuário com várias centrais ativas).
- **Implementado (backend)**:
  - `getPartnerTenantIdOrError` e `GET /api/partner/me`: `orderBy: { createdAt: 'asc' }` em `tenantUser` (mesma central escolhida de forma estável).
  - `POST /api/partner/ride-types` e `PATCH /api/partner/ride-types/[id]`: resposta com **`imagePersistFailed: true`** quando `setRideTypeImageUrlRaw` retorna `false` (coluna ausente ou erro no UPDATE).
- **Implementado (frontend)**:
  - `painel/tipos-de-corrida`: após criar/editar, faixa verde **“Salvo com sucesso”** / **“Tipo criado…”** ou âmbar se `imagePersistFailed`; some sozinha em ~12s; normalização de `imageUrl` vazia na lista.
- **Pendente**: testar com parceiro que tenha **uma** central; na Rede, conferir JSON do PATCH/POST; no Supabase, confirmar coluna `imageUrl` em `tenant_ride_types` se a faixa âmbar aparecer.
- **Próximo passo**: se ainda houver ambiguidade com várias centrais, persistir **tenant ativo** no cookie após escolha no painel.

---

### 2026-03-28 — Parceiro: “já tem central” após excluir (soft delete)

- **Causa**: `POST /api/partner/register` bloqueava se existisse **qualquer** linha em `tenant_users`, mesmo com `tenants.isActive = false` (central “excluída” no painel).
- **Regra no banco**: só considera central existente se **`tenant_users.isActive`** e **`tenants.isActive`** são **true** (`src/lib/partner-active-central.ts`: `findActivePartnerCentralForUser` / `userHasActivePartnerCentral`).
- **Ajustes**: `GET /api/partner/me`, `getPartnerTenantIdOrError` também exigem `tenant_users.isActive`. `POST /api/partner/tenant/remove` agora desativa o vínculo (`tenant_users`) junto com a central.
- **SQL de conferência** (Supabase): `SELECT * FROM tenant_users tu JOIN tenants t ON t.id = tu."tenantId" WHERE tu."userId" = '<id prisma do user>';` — se a central foi desativada, `t."isActive"` deve ser false e, após novo remove, `tu."isActive"` false.

---

### 2026-03-28 — Tipo de corrida padrão ao criar/vincular central

- **Problema**: `ensureDefaultRideTypesForTenant` fazia `return` se a central já tivesse **qualquer** tipo — ao só existir `padrao` global (`cityId` null) ou ao vincular **cidades depois** (admin capabilities / parceiro “adicionar cidade”), **não** criava modalidade por cidade.
- **Correção** (`src/lib/tenant-default-ride-types.ts`):
  - Sem cidades: mantém regra “só cria `padrao` global se **zero** tipos”.
  - Com cidades: para cada `cityId`, cria tipo padrão **se não existir** tipo para aquela cidade.
- **Onde passa a rodar de novo**:
  - `PATCH /api/admin/tenants/[id]/capabilities` após atualizar `tenant_cities`.
  - `POST /api/partner/tenant/cities/add` após criar/reativar vínculo (transação única).
- **Já existia** em: criação admin `POST /api/admin/tenants`, parceiro `POST /api/partner/register`, aprovação `PATCH /api/admin/tenants/pending`.
- **Pendente**: centrais antigas sem tipo — `npm run db:backfill-ride-types` ou regravar cidades no admin.

---

### 2026-03-28 — Regra de cadastro: passageiro vs motorista + perfil duplo

- **Supabase `user_metadata.user_type`**: `passenger` | `driver` | `partner` — usado para alinhar `users.accountKind` em `getSessionForServer` (`src/lib/user-account-kind-sync.ts`).
- **Padrão**: sem tipo ou `passenger` → **PASSENGER**; `driver` → **DRIVER**; `partner` → **STANDARD**. Não rebaixa **ADMIN_MASTER**; não troca **DRIVER** para **PASSENGER** só pelo metadata (JWT fixo ao trocar de app).
- **Web `/register`**: envia `user_type: passenger` por padrão; **`/register?intent=driver`** para link da central direcionando motorista.
- **Apps**: passageiro e motorista já enviam `user_type` no signUp.
- **`POST /api/app/driver/register`**: cria **`passengers`** se ainda não existir (mesmo `userId` Supabase e `tenantId`), para o motorista poder pedir corrida no app passageiro com a mesma conta; atualiza `users.accountKind` = **DRIVER** (exceto master).
- **Parceiro** (`/api/partner/register`): cria `User` com **STANDARD** explícito.

---

### 2026-03-28 — `User.accountKind` (enum) + admin master no banco

- **Banco**: enum Prisma `UserAccountKind` (`STANDARD`, `ADMIN_MASTER`, `PASSENGER`, `DRIVER`) e coluna **`users.accountKind`** (default `STANDARD`).
- **`isMasterAdmin()`**: continua aceitando e-mails da env; **também** retorna true se `accountKind === ADMIN_MASTER`.
- **Sessão**: `getSessionForServer` promove para `ADMIN_MASTER` quando o e-mail está na lista da env (create/update), sem rebaixar quem já é master.
- **API** `GET /api/auth/me`: passa a expor `accountKind`.
- **Script** `npm run db:list-admin-access` lista usuários com `ADMIN_MASTER`.
- **SQL manual**: `scripts/sql/add-user-account-kind.sql` (Supabase).
- **Pendente**: `npx prisma generate` (e `db push` ou SQL) — no Windows, fechar processos que seguram o engine se der EPERM.

---

### 2026-03-28 — Produção: 403 no admin em `/api/admin/tenants/*` (sessão no servidor)

- **Sintoma**: após configurar env na Vercel, ainda **403** em `GET .../tenants/:id` e `.../editable-fields` (UI: “Erro ao carregar dados da central”).
- **Causas possíveis**: (1) e-mail do login não está em `NEXT_PUBLIC_MASTER_ADMIN_EMAIL` / `..._EMAILS` ou deploy antigo sem redeploy; (2) em **API routes**, `supabase.auth.getSession()` pode não refletir o usuário de forma confiável — Supabase recomenda **`getUser()`** no servidor para validar o JWT.
- **Implementado**: `getSessionForServer` passa a usar **`getUser()`** primeiro, com fallback para `getSession()`.

---

### 2026-03-28 — Script: listar e-mails com acesso admin (`list-admin-access`)

- **Script**: `scripts/list-admin-access.ts` — `npm run db:list-admin-access`
- **Mostra**: e-mails em `NEXT_PUBLIC_MASTER_ADMIN_EMAIL` / `..._EMAILS`; roles no banco; `tenant_users` com role `master`; usuários com permissão `manage_tenants` (papel + extras).

---

### 2026-03-28 — Admin master: `isMasterAdmin` e fetch da tela de central

- **`isMasterAdmin`**: comparação de e-mail **case-insensitive**; suporte opcional a **`NEXT_PUBLIC_MASTER_ADMIN_EMAILS`** (vários e-mails separados por vírgula), além de `NEXT_PUBLIC_MASTER_ADMIN_EMAIL`.
- **Página `/admin/centrais/[id]`**: `fetch` das três APIs com **`credentials: 'include'`** e **`cache: 'no-store'`** para sessão Supabase e evitar respostas antigas em cache.

---

### 2026-03-28 — Admin master: tela `/admin/centrais/[id]` (405 + 403)

- **Sintoma** (produção): `GET /api/admin/tenants/:id` retornava **405**; `GET .../editable-fields` retornava **403**; página ficava em loading ou “Erro ao carregar dados da central”.
- **Causa**:
  - A rota `src/app/api/admin/tenants/[id]/route.ts` só exportava **PATCH** e **DELETE** — o front chama **GET** para montar o formulário.
  - `editable-fields` usava `canAccessTenant`, que exige role **`master`** em `tenant_users`; o admin master definido por **`isMasterAdmin()`** (e-mail em `NEXT_PUBLIC_MASTER_ADMIN_EMAIL`) muitas vezes **não** tem esse vínculo → 403.
- **Correção**:
  - Implementado **GET** em `/api/admin/tenants/[id]` com `isMasterAdmin()`, retornando os campos esperados pela página (incl. `linkedCity` da primeira `tenant_city` ativa).
  - Em `editable-fields`, se `isMasterAdmin()`, retornar todos os campos editáveis como `true` (igual ao fluxo das demais APIs admin de tenant).

---

### 2026-03-28 — Diagnóstico: central sem cidades no painel (ex.: “banana”)

- **Consulta no banco** (`npm run db:diagnose-tenant -- banana`): central **banana** (`slug: banana`, tipo **brand**, aprovada e ativa) tem **1** `tenant_user` (owner `maiszoomimpressos1@gmail.com`) e **0** linhas em **`tenant_cities`**.
- **Conclusão**: o login já está correto na central; o mapa/lista de cidades fica vazio porque **nunca houve vínculo cidade↔central** nessa tabela (ou foi removido no admin). Não é falha de “e-mail × central”.
- **Correção**: no painel, **Editar central** → adicionar cidade (nome + UF), ou no **admin → Parceiros** salvar **cidades da central** para esse tenant; a cidade precisa existir na tabela `cities`.
- **Script**: `scripts/diagnose-tenant.ts` + script npm `db:diagnose-tenant`.

---

### 2026-03-28 — SQL Supabase: coluna `imageUrl` em `tenant_ride_types`

- **SQL aplicado** (Supabase SQL Editor):

```sql
ALTER TABLE tenant_ride_types
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
```

- **Status**: executado com sucesso no projeto Supabase do usuário; imagens de tipo de corrida passam a poder persistir após novo **Salvar** no painel.
- **Pendente**: validar no painel que a miniatura aparece e que `imagePersistFailed` não volta mais ao salvar com URL/upload.

---

### 2026-03-28 — Parceiro: 409 “já tem central” + alinhamento admin / vínculos

- **Sintoma**: `/parceiro` ainda mostra **“Você já tem uma central”** (409) mesmo após “excluir” — a API só libera novo cadastro quando **não** há par `tenant_users.isActive` **e** `tenants.isActive` ambos **true**.
- **Diagnóstico**: novo endpoint **`GET /api/partner/register-eligibility`** (Bearer ou cookie) devolve `canRegister`, `reason` e `links` (cada linha com `blocksNewRegistration`).
- **`findActivePartnerCentralForUser`**: deixa de fazer segundo `findFirst` no Prisma; monta o objeto a partir de `listPartnerCentralLinksForUser`.
- **Consistência de soft delete**:
  - `src/lib/tenant-deactivate.ts` — `deactivateTenantAndAllMemberLinks` (central + todos os `tenant_users` da central).
  - `DELETE /api/admin/tenants/[id]` passou a usar a mesma função (antes só setava `tenants.isActive`, deixando vínculos ativos no banco).
  - `PATCH /api/admin/tenants/pending` (aprovar/rejeitar): em transação, atualiza também **`tenant_users.isActive`** alinhado ao `isActive` do tenant (rejeitar desliga vínculos; aprovar religa).
- **Dados legados**: se a central estiver inativa e o vínculo ainda ativo, rodar `scripts/sql/reconcile-partner-tenant-links.sql` no Supabase.
- **Pendente**: deploy na Vercel; se `canRegister` continuar false, conferir no JSON de `links` qual central ainda bloqueia e ajustar no SQL ou excluir de novo pelo painel após o deploy.

---

### 2026-03-28 — Painel: central aprovada não aparecia (preview Vercel / sessão)

- **Sintoma**: `/painel` mostrava “não possui central” com usuário logado no header; URL de **preview** `.vercel.app`.
- **Causa**: `GET /api/partner/me` no servidor dependia de **cookies** Supabase; em muitos previews o cliente tem sessão (localStorage/header) mas a **API route** não recebe o cookie → `email` null → `{ tenant: null }`.
- **Correção**: `partnerMeFetchInit()` em `src/lib/partner-me-client.ts` — envia **`Authorization: Bearer <access_token>`** + `credentials: 'include'` (igual `/parceiro`). Uso em `painel/page.tsx`, `painel/layout.tsx`, `PartnerApprovedGate.tsx`.
- **Se ainda falhar**: aí é dado no Postgres (`tenants` / `tenant_users` inativos); conferir `GET /api/partner/register-eligibility` ou SQL em `scripts/sql/reconcile-partner-tenant-links.sql`.

---

### 2026-03-28 — Cidades no painel (staging), exclusão completa e Mapas real

- **Problema**: central aprovada sem cidades na visão geral; “Mapas & Cobertura” era só placeholder — cidade só em **Editar central**, e `POST /api/partner/tenant/cities/add` falhava no preview Vercel (só cookie, sem Bearer).
- **Correção auth**: `getPartnerDbUserIdFromRequest` em `partner-tenant-auth.ts`; uso em `cities/add`, `tenant/remove`. `GET /api/partner/cities` exige o mesmo usuário (remove bypass inseguro por `tenantId`); filtra `tenant_users` + `tenants` ativos.
- **Cliente**: `partnerJsonPostInit` / `partnerFormDataPostInit` / `partnerPatchJsonInit`; `PartnerCentralActions`, `painel` (reload cidades), `tipos-de-corrida` (ride-types + upload + PATCH/POST).
- **Exclusão central** (`tenant-deactivate`): desativa `tenant_cities`, cancela `tenant_plans`, arquiva `slug` (`…-arq-{tenantId}`) para liberar nome em novo cadastro; `POST /api/partner/register` só bloqueia slug se `tenants.isActive = true`.
- **UI**: `/painel/mapas` com lista de cidades + mesmo fluxo **Editar central** (adicionar cidade).
- **Legado**: centrais inativas com slug antigo ainda podem gerar erro UNIQUE ao recriar — comentário no SQL de reconciliação.

---

### 2026-03-28 — Staging: 500 em `/api/auth/me` e upload de imagem (tipos de corrida)

- **Causas**: (1) `getSessionForServer` antes do Prisma em `/api/auth/me` — falha de schema (ex.: `accountKind`) ou cookie fraco no preview; (2) upload usa Storage com `SUPABASE_SERVICE_ROLE_KEY` — se ausente na Vercel, erro genérico 500; (3) `sharp` pode falhar ao empacotar no serverless.
- **Implementado**: `GET /api/auth/me` tenta **Bearer** primeiro; fallback de select sem `accountKind` + `STANDARD`; mensagens **503** para schema / Supabase; clientes (`AuthProvider`, `Header`, `MapasConfig`, `dashboard`, `gestor`) enviam Bearer.
- **Upload**: checagem explícita de `SUPABASE_SERVICE_ROLE_KEY` → **503** com texto para Vercel; erro do **sharp** → **400**; `next.config.js` — `experimental.serverComponentsExternalPackages: ['sharp']`.
- **Mensagem de erro no painel**: upload exibe `detail` da API quando existir.

---

### 2026-03-28 — Corrida base obrigatória + aprovação atômica (admin)

- **Problema**: em `PATCH /api/admin/tenants/pending` (aprovar), a central e o plano eram gravados em transações **anteriores** à `ensureDefaultRideTypesForTenant`; se a criação do tipo padrão falhasse, a central podia ficar **aprovada sem** `TenantRideType`.
- **Correção**: fluxo **approve** em **uma** única `$transaction`: update tenant, `tenant_users`, `tenant_plan` → `ensureDefaultRideTypesForTenant` no mesmo `tx`.
- **`ensureDefaultRideTypesForTenant`**: ao final, `count` de tipos do tenant deve ser **≥ 1**; senão lança erro (falha a transação inteira).
- **Produção `maidrive.com.br`**: deploy “Production” na Vercel costuma seguir a branch **`main`**; commits só em **`staging`** não atualizam o site público até **merge staging → main** (ou mudar a branch de produção nas Settings do projeto).
- **Correção de dados antigos**: `POST /api/admin/backfill/ride-types` (master) ou `npm run db:backfill-ride-types` para centrais já aprovadas sem tipo.

---

### 2026-03-28 — Vercel: 500 em tipos de corrida / URL `partner-ride-type`

- **Rewrites** em `next.config.js`: `/api/partner-ride-type` e `.../:path*` → `/api/partner/ride-types` (compatível com path errado ou resumo no DevTools).
- **`PATCH` `[id]`**: `resolveDynamicRouteParam` — `params` síncrono (Next 14) ou `Promise` (Next 15+).

---

### 2026-03-28 — Upload imagem tipo de corrida: sharp + listBuckets na Vercel

- **Problema**: 500 em `/api/partner/ride-types/image-upload` mesmo com `SUPABASE_SERVICE_ROLE_KEY` — **sharp** costuma falhar em serverless; **`listBuckets`** pode falhar em alguns projetos Supabase.
- **Correção**: `runtime = 'nodejs'`; **sharp** só via `import()`; se falhar, envia **JPEG/PNG/WebP original** (até 5MB); bucket com **`createBucket` idempotente** (ignora “já existe”), sem depender de `listBuckets`; respostas **502** com `detail` vindo do Storage; **500** com `detail` truncado do erro.

---

### 2026-03-28 — Motorista: corridas multi-central + taxas da central da corrida

- **Objetivo**: motorista permanece vinculado à **central de cadastro** (`drivers.tenantId`), mas pode **ver e aceitar** corridas de **qualquer** central ativa; o valor exibido segue o que já está na corrida (`estimatedPrice` / tipo ligado a `ride.tenantId`).
- **Implementado (backend)**:
  - `src/lib/app-driver-bearer-auth.ts` — autenticação Bearer + motorista ativo.
  - `GET /api/app/driver/rides/available` — `PENDING`, sem `driverId`, **sem** filtro por `driver.tenantId`; só centrais `isActive` + `approvalStatus: approved`; resposta inclui `rideCentralName` / `rideCentralSlug` / `rideTenantId`.
  - `POST /api/app/driver/rides/[id]/accept` — aceite **sem** exigir igualdade de tenant; `updateMany` atômico + `ride_status_history`; bloqueio se já existir corrida `ACCEPTED` ou `IN_PROGRESS` para o motorista; exige motorista `online`.
  - `GET /api/app/driver/rides/history` — histórico do motorista com central da corrida.
  - `GET /api/app/driver/me` — campo `linkedCentral` (id, name, slug) espelhando a central de vínculo; documentação no comentário da rota.
- **Implementado (frontend app motorista)**:
  - `rides.tsx` — linha “Taxas: {central}”; `history.tsx` — “Central: …”; `index.tsx` — “Central: …” no header; `AuthContext` tipos para `tenantName` / `linkedCentral`.
- **SQL aplicado**: nenhum (modelo já tinha `Ride.tenantId` e preços na corrida).
- **Pendente**: testar E2E com corridas criadas no banco (ainda não há `POST` passageiro criando `Ride` no repo); quando existir, garantir que o cálculo de preço na criação use sempre o tenant da solicitação.
- **Próximo passo**: endpoint passageiro para criar corrida (se ainda faltar) e fluxo iniciar/concluir corrida no app motorista.

---

### 2026-03-28 — Passageiro: sugestão de endereço (GPS) + central mais próxima

- **Objetivo**: (1) sugerir endereços enquanto o passageiro digita, com **viés pela localização**; (2) escolher automaticamente a **central** cuja cidade de atuação está **mais próxima** do GPS (tipos de corrida e slug alinhados), sem sobrescrever **override** manual do seletor de central.
- **Implementado (backend)**:
  - `src/lib/geo-haversine.ts` — distância em km entre coordenadas.
  - `GET /api/app/tenants/nearest?latitude=&longitude=` — centrais ativas/aprovadas com cidade georreferenciada, ordenadas pela menor distância até o ponto; inclui `primaryCityId` da cidade mais próxima de cada central.
  - `GET /api/app/address-autocomplete?input=&latitude=&longitude=&tenantSlug=` — Bearer Supabase obrigatório; usa `MapProviderManager` (Google Places Autocomplete `geocode` + bias `location`/`radius`, ou Mapbox forward + `proximity`, fallback Nominatim com **User-Agent** configurável via `NOMINATIM_USER_AGENT`).
- **Implementado (frontend passageiro)**:
  - `BrandingContext`: `brandingReady` após hidratar override/slug do AsyncStorage.
  - `DestinoComSugestoes` + `lib/addressAutocomplete.ts` / `lib/nearestTenant.ts`.
  - `app/(tabs)/index.tsx` — GPS para nearest central + `cityId` dos tipos de corrida; campos de destino com lista de sugestões; coordenadas reutilizadas em “Sem destino”.
- **Pendente**: testar com chave Google/Mapbox ativa e política de uso do Nominatim em produção; modal `RideRequestCard` ainda sem autocomplete (só tela inicial).
- **Próximo passo**: Place Details ao selecionar sugestão Google (se precisar lat/lng exatos na criação da corrida).

---

### 2026-03-28 — Tarifa por central, rota no mapa e rastreamento passageiro ↔ motorista

- **Objetivo**: calcular valor da corrida com **TenantRideType** (bandeira + km + min) a partir de **rota real**; desenhar **trajeto** no mapa; motorista mais próximo (se online com posição); **acompanhar** motorista (rota aproximação + posição) no app passageiro e **mesma rota + embarque/destino** no app motorista.
- **Banco**: `rides.tripRouteCoords` (JSON, lista `{ latitude, longitude }`). **Aplicar**: `npx prisma db push` (ou migração equivalente) no ambiente.
- **Backend**:
  - `src/lib/polyline-decode.ts`, `src/lib/maps/directions-route.ts` — Google Directions / Mapbox Directions / fallback **OSRM** público.
  - `src/lib/ride-pricing.ts`, `src/lib/dispatch-nearest-driver.ts`, `src/lib/tenant-resolve-app.ts`.
  - `POST /api/app/rides/estimate` — preço + `tripRouteCoords` (público).
  - `POST /api/app/rides` — cria corrida, grava rota/preço, **atribui** motorista online com última posição em até **50 km** (status `ACCEPTED` + `acceptedAt`); senão `PENDING`.
  - `POST /api/app/passenger/ensure` — garante `Passenger` para o tenant (slug / `mai-drive` → primeira central).
  - `GET /api/app/rides/[id]/track` — passageiro: status, `tripRouteCoords`, `approachRouteCoords` (motorista→embarque, cache ~12s), `driverPosition`.
  - `POST /api/app/driver/location` — grava `driver_positions`.
  - `GET /api/app/driver/rides/active` — corrida `ACCEPTED` | `IN_PROGRESS` do motorista.
- **App passageiro**: destinos com **lat/lng** ao escolher sugestão; `CityMap` com **Polyline** (viagem azul, aproximação laranja) + marcador motorista; polling **4s** em corrida ativa; botão chamar chama `POST /api/app/rides`.
- **App motorista**: `watchPosition` ao **online** envia localização à API; tela **`/ride-map`** (modal) com rota + embarque + destino; aba **Corridas** com banner de corrida ativa; após **aceitar**, navega ao mapa.
- **Pendente**: fluxo `IN_PROGRESS`/`COMPLETED` (iniciar/finalizar); Place Details Google para sugestões só com texto; volume OSRM / política de uso em produção.
- **Próximo passo**: WebSocket ou Supabase Realtime para posição em tempo real (substituir ou complementar polling).

---

### 2026-03-29 — Builds: Next + EAS Android (passageiro e motorista)

- **Objetivo**: validar produção web/API e gerar APKs preview nos dois apps Expo.
- **Implementado (CI local)**:
  - Raiz: `npm run build` (`prisma generate` + `next build`) — sucesso; avisos apenas de CSR em `/parceiro` e `/esqueci-senha`.
  - `apps/passenger`: `npx eas-cli build --platform android --profile preview --non-interactive` — sucesso.
  - `apps/driver`: mesmo comando — sucesso.
- **Links de instalação (Expo)**:
  - Passageiro: https://expo.dev/accounts/maiszoom/projects/passenger/builds/116ad062-abc5-4143-9dc5-25903ddb8519
  - Motorista: https://expo.dev/accounts/maiszoom/projects/driver/builds/17d83fa7-9c58-4e97-b4b9-2b19f78a0cb0
- **Observações**: EAS avisou que `cli.appVersionSource` será obrigatório no futuro; build **driver** não carregou variáveis do ambiente `preview` no EAS (diferente do passageiro) — conferir se `.env` / secrets locais cobrem o necessário no aparelho.
- **Pendente**: instalar os dois APKs e smoke test (login, mapa, corrida); aplicar `rides.tripRouteCoords` no banco de produção se ainda não aplicado.
- **Próximo passo**: configurar `appVersionSource` no `eas.json` quando for prioridade; alinhar env `preview` do projeto **driver** no dashboard EAS se faltar chave pública.

---

### 2026-03-28 — Cadastro web (/register): telefone (DDD), endereço e central

- **Objetivo**: no cadastro de **passageiro**, exigir **celular com DDD** (máscara), **endereço** com sugestões (Nominatim), identificar **centrais** que atendem o município; se não houver, permitir cadastro e **sugerir a central mais próxima** (ou primeira central ativa como último recurso).
- **Implementado (banco)**: `users.phone`, `users.homeAddress`, `users.homeLatitude`, `users.homeLongitude` (opcionais). **Aplicar**: `npx prisma db push` (ou migração) no ambiente.
- **Implementado (backend)**:
  - `src/lib/tenants-nearest.ts` — lógica compartilhada de “centrais próximas”; `GET /api/app/tenants/nearest` refatorado para usar isso.
  - `GET /api/public/geocode-search?q=` — busca de endereço (Brasil) para o formulário.
  - `POST /api/public/tenants-at-address` — corpo `{ latitude, longitude }`: cruza município (reverse Nominatim + cidades no banco) com `tenant_cities`; responde `tenantsAtLocation`, `nearestTenants`, `suggestedTenant`, `suggestionReason`.
  - `POST /api/auth/sync-passenger-registration` — Bearer: grava telefone/endereço no `User`, cria `User` se ainda não existir, `ensurePassengerForTenant` com `preferred_tenant_slug` (metadata ou body).
- **Implementado (frontend)**:
  - `src/app/register/page.tsx` — passageiro: telefone mascarado, endereço com lista, bloco de centrais; metadata Supabase `phone`, `home_address`, `home_lat`, `home_lng`, `preferred_tenant_slug`; motorista (`?intent=driver`): só telefone extra.
  - `src/app/login/page.tsx` — após login, chama sync para aplicar metadata (ex.: cadastro com confirmação por e-mail).
- **Pendente**: política de uso Nominatim em produção (debounce já no cliente; configurar `NOMINATIM_USER_AGENT`); eventual Place Details Google para endereços mais precisos.
- **Próximo passo**: exibir telefone/endereço no admin do usuário, se desejado.

---

### 2026-03-28 — Cadastro: localização (GPS) + CEP (ViaCEP)

- **Objetivo**: além do endereço por texto, permitir **“Usar minha localização”** (GPS do navegador) e **CEP** (ViaCEP) para identificar cidade/UF e sugerir centrais sem digitar o endereço completo.
- **Implementado**:
  - `POST /api/public/tenants-resolve-region` — aceita `{ latitude, longitude }`, `{ cep }` ou `{ cityName, stateUf }`; responde com o mesmo payload de centrais + `addressLabel` e `source`.
  - `src/lib/tenants-at-address.ts` — `resolveTenantsFromCityAndUf` (geocodifica centro do município via Nominatim e reutiliza `resolveTenantsAtAddress`).
  - `src/lib/viacep-public.ts`, `src/lib/cep-br.ts` — consulta ViaCEP e máscara de CEP.
  - `PassengerAddressFields` — botão GPS, campo CEP + “Buscar CEP”, texto explicativo; fluxo de endereço completo mantido.
- **Pendente**: HTTPS obrigatório para geolocalização em produção; política de uso ViaCEP/Nominatim.

---

### 2026-03-28 — App motorista: estabilidade no Android (mapa + tipos)

- **Objetivo**: reduzir **fechamentos** do Mai Drive Motorista no Android (falhas ao abrir corrida no mapa ou ao renderizar dados da API).
- **Implementado (Expo/Android)**:
  - `apps/driver/app.config.js` — injeta `android.config.googleMaps.apiKey` a partir de `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (necessário para `react-native-maps` em release); aviso no build se a variável estiver vazia.
  - `apps/driver/app.json` — removidos `ACCESS_BACKGROUND_LOCATION` e permissão “sempre” do plugin `expo-location` (fluxo em primeiro plano).
- **Implementado (app)**:
  - `apps/driver/lib/numbers.ts` — `formatMoney`, `formatKm`, `formatRating`, etc., tolerantes a string/`Decimal` da API.
  - Telas `index`, `profile`, `rides`, `history`, `ride-map` — deixam de chamar `.toFixed()` em valores que podem não ser `number`.
  - `AuthContext` — `Driver.rating` como `number | null` e normalização ao carregar `/me` e após registro.
- **SQL aplicado**: nenhum.
- **Status atual**: `npx expo config` em `apps/driver` confirma merge do `googleMaps.apiKey` quando a env está definida localmente.
- **Pendente**: definir **`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`** no projeto **driver** no EAS (preview/production), gerar **novo** build Android e testar login → abas → **Corrida no mapa** após aceitar; se ainda fechar, capturar stack com “Ver resumo” / `adb logcat`.
- **Próximo passo**: alinhar variáveis `preview` do motorista ao passageiro no dashboard Expo; smoke test completo no APK novo.

---

### 2026-03-30 — App motorista: env no EAS + tentativa de build

- **Objetivo**: garantir que o build `driver` (profile `preview`) inclua `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` e demais envs públicas necessárias.
- **Implementado (backend)**: n/a
- **Implementado (frontend)**: n/a
- **SQL aplicado**: nenhum.
- **Status atual**: tentativa de `eas build` falhou por **limite do plano Free Android** (quota do mês); `apps/driver/eas.json` atualizado para injetar envs no profile `preview`.
- **Pendente**: quando o quota resetar (ou com plano pago), gerar novo APK `preview` do motorista e validar login → mapa da corrida.
- **Próximo passo**: você re-dispara o build no dia do reset e, se quiser evitar espera, considerar upgrade do plano EAS para builds Android.

---

### 2026-03-30 — EAS conta `maiszoom2`: APKs preview (motorista + passageiro)

- **Objetivo**: gerar builds Android `preview` sem depender da quota da conta `maiszoom`; projetos Expo novos em **maiszoom2**.
- **Implementado**:
  - `apps/driver`: `eas init` → `@maiszoom2/driver` (project ID `07d1720e-f176-470a-b02e-ae5ed36aca16`); `updates.url` + `owner` em `app.json`; envs do profile `preview` em `eas.json` (como antes).
  - `apps/passenger`: removido `projectId` fixo antigo de `app.config.js`; projeto `@maiszoom2/passenger` (ID `2b0cc7e0-849f-46bc-bb6a-44602e11b7e5`); `app.json` + `app.config.js` alinhados; envs em `eas.json` profile `preview`.
- **Builds concluídos (APK)**:
  - Motorista — página: https://expo.dev/accounts/maiszoom2/projects/driver/builds/74497c55-e078-4599-b769-8733e1d49b54 — artefato: https://expo.dev/artifacts/eas/fmRLoXBS4SxFJFXva2bZfC.apk
  - Passageiro — página: https://expo.dev/accounts/maiszoom2/projects/passenger/builds/c517a5f6-25e5-423b-ab9e-11c29f2cf6a5 — artefato: https://expo.dev/artifacts/eas/qkAoaUw1XZsPRgzHxyBdpF.apk
- **Observação**: keystores Android gerados na nuvem pela Expo para estes projetos (conta nova); builds anteriores da conta `maiszoom` não se misturam com esses APKs.
- **Próximo passo**: instalar os dois APKs e smoke test; se o site usar `NEXT_PUBLIC_PASSENGER_APP_APK_URL`, atualizar para o link novo do passageiro.

---

### 2026-03-30 — App motorista: mapa na home + carregamento do nome

- **Objetivo**: mapa real na tela inicial (em vez de placeholder cinza); menos “Carregando...”; nome vindo também do `User` Prisma quando metadata Supabase está vazia.
- **Implementado (app)**: `apps/driver/app/(tabs)/index.tsx` — `MapView` + marcador e círculo de precisão; `apps/driver/app.config.js` — plugin `react-native-maps` com mesma API key; `apps/driver/contexts/AuthContext.tsx` — `getSession` aguarda `fetchDriver` antes de `setLoading(false)`; fallback de nome via metadata Supabase no cliente.
- **Implementado (backend)**: `GET /api/app/driver/me` — fallback de `name` com `prisma.user` (`name`) e e-mail.
- **Pendente**: novo build EAS do motorista para incluir o plugin nativo do Maps; publicar API (Vercel) para a rota `/me` atualizada.

---

### 2026-03-30 — App motorista: home — Online só texto + lucros um pouco maiores

- **Objetivo**: pill superior **Online/Offline** sem bolinha (apenas texto com cor); chip **Lucros do dia** e painel expandido com tipografia e área um pouco maiores.
- **Implementado (app)**: `apps/driver/app/(tabs)/index.tsx` — removido `onlineTopDot`; texto usa `colors.online` / `colors.textSecondary`; `profitChip` `maxWidth` 180, labels 10px / valor 13px; popover com padding e fontes levemente maiores; ícones carteira/chevron/olho +1px.
- **SQL aplicado**: nenhum.
- **Pendente**: validar em aparelho pequeno se foto + chip + Online + menu não quebram linha.
- **Próximo passo**: smoke test na home após `npx expo start` no app motorista.

---

### 2026-03-30 — App motorista: home — Online junto ao menu + olho maior

- **Objetivo**: reduzir o espaço entre **Online** e o **menu**; aumentar o botão **olho** (privacidade dos valores).
- **Implementado (app)**: `index.tsx` — `Online` e menu hambúrguer agrupados em `topBarRight` (gap 8); chip de lucros permanece só na área central; olho com área **44×44**, ícone **22px**, borda e cantos alinhados ao botão do menu.

---

### 2026-03-30 — App motorista: home — sem olho; lucros sempre visíveis

- **Objetivo**: remover o botão **olho**; exibir sempre o chip **Lucros do dia** com valores; aproximar **Online** do menu.
- **Implementado (app)**: `apps/driver/app/(tabs)/index.tsx` — removidos estado `earningsVisible`, `moneyLine` mascarado e `profitEyeBtn`; chip inteiro é um `TouchableOpacity` (carteira + texto + chevron); `formatMoneyBrl` via `formatMoney` de `lib/numbers`; chip um pouco maior (`maxWidth` 220, label 11px, valor 15px); `topBarRight` gap **4**.

---

### 2026-03-30 — App motorista: home — olho dentro do retângulo (privacidade)

- **Objetivo**: voltar a ocultar valores com o **olho**, mantendo o mesmo tamanho do chip (`maxWidth` 220, `minHeight` 46).
- **Implementado (app)**: `index.tsx` — `View` com `profitChip` envolve área principal (`profitChipMain` = expandir) + `profitEyeBtn` (32×36, ícone 18) à direita **dentro** do retângulo; `moneyLine` no chip e no popover.

---

### 2026-03-30 — App motorista: foto + menu hambúrguer em todas as abas

- **Objetivo**: manter **foto do perfil** (atalho para Perfil) e **menu** (dropdown com Corridas, Histórico, Ganhos, Perfil, Sair) em todas as telas principais, além da **tab bar** inferior.
- **Implementado (app)**:
  - `components/DriverAppTopBar.tsx` — avatar, título ou `centerSlot`/`rightSlot`, botão menu + `DriverAppMenuModal`.
  - `components/DriverAppMenuModal.tsx` — modal extraído da home.
  - `lib/profileDisplay.ts` — `driverDisplayName`, `avatarUri` compartilhados.
  - `(tabs)/_layout.tsx` — `headerShown: false` nas abas que passam a usar a barra customizada.
  - `rides`, `history`, `earnings`, `profile` — barra com título; `index` — `DriverAppTopBar` com slots (lucros + Online); `ride-map` — barra absoluta com título “Corrida”, botão fechar antes do menu.

---

### 2026-03-30 — App motorista: menu na tela Perfil

- **Objetivo**: no menu hambúrguer, **não** mostrar “Perfil” quando o usuário já está em Perfil; mostrar **Início** no lugar.
- **Implementado (app)**: `components/DriverAppMenuModal.tsx` — `useSegments()` + `segments.includes('profile')`; item “Perfil” trocado por “Início” (`home-outline`, `router.push('/(tabs)')`).

---

### 2026-03-30 — App motorista: menu na tela Corridas

- **Objetivo**: na aba **Corridas**, não mostrar “Corridas” no menu; mostrar **Início** no lugar (mesmo padrão do Perfil).
- **Implementado (app)**: `DriverAppMenuModal.tsx` — `segments.includes('rides')`; primeira linha: “Início” em vez de “Corridas”.

---

### 2026-03-30 — App motorista: menu na aba Histórico

- **Objetivo**: na aba **Histórico**, não mostrar “Histórico” no menu; mostrar **Início** no lugar.
- **Implementado (app)**: `DriverAppMenuModal.tsx` — `segments.includes('history')`; segunda linha: “Início” em vez de “Histórico”.

---

### 2026-03-30 — App motorista: menu na aba Ganhos

- **Objetivo**: na aba **Ganhos**, não mostrar “Ganhos” no menu; mostrar **Início** no lugar.
- **Implementado (app)**: `DriverAppMenuModal.tsx` — `segments.includes('earnings')`; terceira linha: “Início” em vez de “Ganhos”.

---

### 2026-03-30 — App motorista: ordem do menu + toggle On-line/Off-line

- **Objetivo**: ordem fixa **Início → Corridas → Histórico → Ganhos → Perfil** → separador → **status** → separador → **Sair**; rótulo do status: **Off-line** quando está on-line (ação para ficar off), **On-line** quando está off; **não repetir** o item da aba atual (omitir linha).
- **Implementado (app)**: `DriverAppMenuModal.tsx` — `useDriverStatus` (`toggleOnlineStatus`); ícones `moon-outline` / `sunny-outline`; loading “Atualizando status…” enquanto `isUpdating`.

---

### 2026-03-30 — App motorista: menu sem “Início” na aba Início

- **Objetivo**: na **página Início** (mapa), não mostrar o item **Início** no menu.
- **Implementado (app)**: `DriverAppMenuModal.tsx` — `isHomeTab` quando não há segmento `rides`/`history`/`earnings`/`profile` nem `ride-map`.

---

### 2026-03-30 — App motorista: home sem painel inferior (nome + status)

- **Objetivo**: remover o **retângulo flutuante** inferior (nome, central, pill Online/Offline, cartão “Você está offline” + “Ficar online”, texto “Aguardando corridas…”); status on/off permanece no **menu** e no **pill do topo**.
- **Implementado (app)**: `apps/driver/app/(tabs)/index.tsx` — removido `bottomDock` e estilos associados; aviso “Cadastro em análise” reposicionado acima da tab bar (`bottom` dinâmico).

---

### 2026-03-30 — App motorista: FAB no mapa (estilo passageiro “Sem destino”)

- **Objetivo**: botão flutuante no mapa da home, **mesmo padrão visual** do passageiro (`ModalPedirCorrida`: círculo 52px, borda, sombra, label), com **ícone diferente** de `navigate` (passageiro).
- **Implementado (app)**:
  - `components/DriverHomeMapFab.tsx` — FAB reutilizável (`label` + `iconName`).
  - `index.tsx` — label **“Área”**, ícone **`car-outline`**; ao toque: nova leitura GPS + `animateToRegion` + atualização do marcador.

---

### 2026-03-30 — App motorista: tab bar sem ícones (faixa preta)

- **Objetivo**: remover os ícones/textos da barra inferior e deixar apenas uma **faixa preta**.
- **Implementado (app)**: `apps/driver/app/(tabs)/_layout.tsx` refeito com `tabBarShowLabel: false`, `tabBarIcon: () => null`, `tabBarStyle` preto (`backgroundColor`/`borderTopColor` `#000`) e altura reduzida (`18`).

---

### 2026-03-31 — App motorista: faixa da tab bar um pouco mais larga

- **Objetivo**: aumentar a altura da faixa preta inferior (antes ~18px) para melhor área tátil/visual.
- **Implementado (app)**:
  - `apps/driver/constants/tabBar.ts` — `DRIVER_TAB_BAR_STRIPE_HEIGHT = 40`.
  - `(tabs)/_layout.tsx` — altura da tab bar `40 + safe area inferior`; `paddingTop` ajustado.
  - `index.tsx` — FAB e avisos usam `DRIVER_TAB_BAR_STRIPE_HEIGHT + insets.bottom` para não sobrepor a faixa.

---

### 2026-03-31 — App motorista: aceitar corrida na home (chamada)

- **Objetivo**: quando houver corrida disponível e o motorista estiver on-line, mostrar oferta na **Início** (mapa) com **Aceitar** / **Recusar**, além da lista na aba Corridas.
- **Implementado (backend)**: sem rota nova — `POST /api/app/driver/rides/[id]/accept` já existente.
- **Implementado (app)**:
  - `lib/availableRide.ts` — `fetchAvailableRides` → `GET /api/app/driver/rides/available`.
  - `components/DriverIncomingRideModal.tsx` — modal “Nova corrida” (origem/destino, valor, km, Recusar, Aceitar).
  - `(tabs)/index.tsx` — polling ~8s quando on-line; não abre se já houver corrida ativa; Recusar descarta localmente o id; Aceitar chama accept e navega para `/ride-map`.
- **Pendente**: testar em dispositivo com corrida `PENDING`; opcional — endpoint de “recusar” no servidor (hoje só dismiss local).
- **Próximo passo**: validar fluxo ponta a ponta com passageiro solicitando corrida.

---

### 2026-03-31 — App motorista: botão Aceitar acima da faixa preta

- **Objetivo**: oferta de corrida visível em um **dock central** logo acima da faixa preta, com botão principal **Aceitar corrida**, sem depender do modal em tela cheia.
- **Implementado (app)**:
  - `components/DriverIncomingRideDock.tsx` — card flutuante (valor, km, passageiro, X para recusar, botão verde **Aceitar corrida**, link **Ver detalhes**).
  - `(tabs)/index.tsx` — dock com `bottom: tabBar + safe area + 8`; FAB e aviso “cadastro em análise” sobem quando há oferta; modal de detalhes **não abre sozinho** (só por “Ver detalhes”).
  - `DriverIncomingRideModal.tsx` — toque fora / botão voltar do SO: `onDismiss` (só fecha o modal); **Recusar** continua com `onDecline`.
- **Pendente**: testar no dispositivo com corrida disponível.

---

### 2026-03-31 — App motorista: botão central simplificado para aceitar corrida

- **Objetivo**: usar o espaço central acima da faixa preta com um botão único e direto para **Aceitar corrida**.
- **Implementado (app)**:
  - `(tabs)/index.tsx` — substituído dock por CTA central simplificado (`Aceitar corrida`) + link `Ver detalhes`.
  - CTA posicionado no centro (`left/right` simétricos) com `bottom` baseado em `tabBar + safe area`.
  - FAB “Área” e aviso de cadastro continuam com reposicionamento automático quando há corrida.
- **Pendente**: validar em aparelho real o toque e espaçamento visual no Android/iOS.

---

### 2026-03-31 — App motorista: CTA central sempre visível

- **Objetivo**: evitar sensação de “botão sumiu” no espaço acima da faixa preta.
- **Implementado (app)**:
  - `(tabs)/index.tsx` — botão central agora fica **sempre visível**.
  - Sem corrida: estado desabilitado com texto **“Aguardando corrida...”**.
  - Com corrida: estado ativo **“Aceitar corrida”** + link **“Ver detalhes”**.
- **Pendente**: validar contraste/legibilidade em tema claro/escuro no dispositivo.

---

### 2026-03-31 — App motorista: botão redondo e centralizado

- **Objetivo**: deixar o botão de chamada visualmente destacado, redondo e centralizado acima da faixa preta.
- **Implementado (app)**:
  - `(tabs)/index.tsx` — CTA alterado para formato circular (`80x80`, `borderRadius: 40`).
  - Wrapper ajustado para centralização real (`left: 0`, `right: 0`, `alignItems: center`).
  - Rótulos do círculo simplificados para caber bem: **“Aceitar”** / **“Aguardando”**.
- **Pendente**: validar tamanho final do círculo no aparelho (ergonomia de toque e sobreposição com FAB).

---

### 2026-03-31 — App motorista: lock de chamada após aceitar

- **Objetivo**: ao aceitar a corrida, indicar estado ocupado (botão vermelho) e bloquear novas ofertas para o motorista.
- **Implementado (app)**:
  - `(tabs)/index.tsx` — novo estado `hasActiveRide` baseado em `GET /api/app/driver/rides/active`.
  - Após clique em aceitar: lock imediato (`hasActiveRide = true`) para evitar novas chamadas na UI.
  - CTA central muda para vermelho com rótulo **“Ocupado”** quando há corrida ativa.
  - Enquanto `hasActiveRide = true`, botão de aceitar e link “Ver detalhes” de novas ofertas ficam bloqueados.
- **Implementado (backend já existente)**:
  - `POST /api/app/driver/rides/:id/accept` já impede aceite duplicado (`409` se motorista já estiver em `ACCEPTED/IN_PROGRESS`).
- **Status atual**: proteção cliente + servidor alinhadas para não receber/aceitar outra chamada durante corrida ativa.

---

### 2026-03-31 — Dispatch: 25s + ondas + rota até embarque

- **Objetivo**: motorista mais próximo tem **25s** para aceitar; depois a oferta passa para **até 3** motoristas mais próximos (em paralelo, primeiro a aceitar leva); repetir ondas excluindo quem já recebeu. Ao aceitar, calcular **melhor rota (Directions) motorista → embarque** e exibir no mapa.
- **Implementado (banco / Prisma)**:
  - `Ride`: `pickupRouteCoords`, `pendingOfferDriverIds`, `offerExpiresAt`, `dispatchExcludedDriverIds`, `dispatchWave`; índice `(status, offerExpiresAt)`.
  - SQL manual: `scripts/sql/add-ride-dispatch-and-pickup-route.sql`.
- **Implementado (backend)**:
  - `src/lib/ride-dispatch-config.ts` — `DISPATCH_OFFER_DURATION_MS = 25_000`, 1 motorista na 1ª onda, **3** nas seguintes (`DISPATCH_NEXT_WAVE_DRIVER_COUNT`).
  - `src/lib/ride-dispatch.ts` — `scheduleRideDispatch`, `expireAndAdvanceRideOffers`, `tryAssignPendingRidesWithoutOffers`.
  - `src/lib/dispatch-nearest-driver.ts` — `findNearestOnlineDriverIds` (ordenado por distância, exclusões).
  - `POST /api/app/rides` — não atribui mais automaticamente; cria `PENDING` e agenda 1ª oferta.
  - `GET /api/app/driver/rides/available` — expira ofertas, tenta reagendar corridas sem oferta, filtra só motoristas na lista da rodada (corrida antiga sem JSON = todos, compatível).
  - `POST .../accept` — valida oferta; exige última posição do motorista; grava `pickupRouteCoords` via `fetchDrivingRoute`.
  - `GET .../rides/active` — retorna `pickupRouteCoords`.
- **Implementado (app motorista)**:
  - `lib/activeRide.ts` — tipo com `pickupRouteCoords`.
  - `ride-map.tsx` — em `ACCEPTED` prioriza polyline verde até embarque; em `IN_PROGRESS` usa rota passageiro→destino.
- **Pendente**: rodar `npx prisma generate` / migração no ambiente (pode falhar se o engine estiver em uso); testar fluxo com 2+ motoristas online e passageiro pedindo corrida.
- **Sugestão de produto**: número **3** na 2ª+ onda é padrão equilibrado (não lota o app); ajuste fino via `ride-dispatch-config.ts` ou variável de ambiente no futuro.

---

### 2026-03-31 — App passageiro: simulador + Babel (Reanimated)

- **Objetivo**: reduzir crash / tela branca no dev e documentar por que o simulador/emulador “não abre”.
- **Implementado (app)**:
  - `apps/passenger/babel.config.js` — `babel-preset-expo` + plugin **`react-native-reanimated/plugin`** (último na lista).
  - `package.json` — `ios` passa a usar `expo start --ios` (dev no Simulator); `ios:prebuild` = `expo run:ios`.
  - `docs/BUILD-ANDROID-MAPA.md` — seção **Simulador / emulador não abre o app** (AVD antes, tecla `a`, cache, caminho com espaços, iOS só no Mac).
- **Pendente**: usuário rodar `npm run start:clear` e `npm run android` com emulador já ligado; se ainda falhar, checar mensagem exata do Metro/Gradle.

---

### 2026-03-31 — App motorista: EAS build Android (preview)

- **Objetivo**: gerar APK do app motorista via EAS (`preview`).
- **Comando**: `eas build --platform android --profile preview --non-interactive` na pasta `apps/driver` (CLI global `eas`).
- **Build EAS**: [expo.dev – driver build 8398f256](https://expo.dev/accounts/maiszoom2/projects/driver/builds/8398f256-d3dc-44cf-af50-f4334656ccf1) (status em tempo real no painel).
- **Implementado (app)**: `apps/driver/package.json` — script `build:android` com o mesmo comando.
- **Pendente**: aguardar conclusão no Expo; baixar APK pelo link quando status = finished.

---

### 2026-03-31 — Admin master: API `/api/admin/centrais` + lista de centrais

- **Problema**: painel Centrais com 500; console pedia `GET /api/admin/centrais` enquanto o código só expunha `/api/admin/tenants`.
- **Implementado (backend)**:
  - `src/app/api/admin/centrais/route.ts` — reexporta `GET`/`POST` de `tenants` (alias estável).
  - `GET /api/admin/tenants` — remove filtro `isActive: true` (master vê ativas e inativas); inclui `_count` de motoristas e passageiros.
- **Implementado (frontend)**:
  - `src/app/admin/centrais/page.tsx` — `fetch('/api/admin/centrais')`.
- **Pendente**: fazer deploy; se 500 continuar, checar logs Vercel (erro Prisma = migração/coluna faltando no Postgres).

---

### 2026-03-31 — Admin: diagnóstico de erro em GET/POST tenants

- **Objetivo**: facilitar descobrir a causa do 500 em `/api/admin/centrais` e `/api/admin/tenants`.
- **Implementado (backend)**: `src/app/api/admin/tenants/route.ts` — `console.error` com objeto `{ message, name, stack?, code?, meta? }`; corpo JSON inclui `details: { message, code?, name }` quando `NODE_ENV=development`, `VERCEL_ENV=preview`, ou `ADMIN_API_ERROR_DETAILS=1` (produção Vercel sem essa env não expõe detalhes na resposta).
