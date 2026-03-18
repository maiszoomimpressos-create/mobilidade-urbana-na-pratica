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

