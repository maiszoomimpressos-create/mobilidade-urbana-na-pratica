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
