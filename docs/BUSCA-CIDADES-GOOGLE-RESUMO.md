# Busca de cidades no Google (Geocoding) – resumo para suporte

## O que a funcionalidade deve fazer

- Na página **Admin > Cidades** (`/admin/cidades`), há um campo **"Buscar Cidade para Mapear"**.
- O usuário digita o nome da cidade (ex.: "doi", "dois", "Dois Vizinhos").
- A partir de **3 letras**, o sistema deve:
  1. Chamar a API do Google Geocoding.
  2. Mostrar uma **lista de cidades** no dropdown (ex.: Dois Vizinhos – PR, Dois Irmãos – RS).
  3. Ao clicar em uma cidade, rolar a página até o **mapa**, mostrar a localização e o botão **"Adicionar e abrir editor"**.

## Problema atual

- Com **3 letras** (ex.: "doi"): **não aparece lista de cidades**; às vezes só uma sugestão "dois" ou mensagem de configurar a API.
- Com **4 letras** (ex.: "dois"): em alguns casos aparece **Rio Fortuna, SC** em vez de cidades cujo nome contém "dois" (ex.: Dois Vizinhos, Dois Irmãos). Ou seja, resultados incoerentes com o termo digitado.

## O que já foi implementado (código)

### 1. Frontend – componente `CitySearch`

- **Arquivo:** `src/components/admin/CitySearch.tsx`
- Busca no **Google** só a partir de **3 caracteres** (`query.length >= 3`).
- Debounce de **280 ms** antes de chamar a API.
- Chama: `GET /api/admin/cities/geocode?q=<termo>` (sem estado) ou `?q=<termo>&state=UF`.
- Recebe um **array de cidades** e exibe no dropdown (lista com botão "Criar").
- Se a resposta for array vazio, mostra: "Nenhuma sugestão do Google para esse nome."
- Callback `onGoogleSuggestionPreview(geo)`: ao clicar em uma cidade, o pai define `previewGeo` e rola até o mapa (`document.getElementById("map-card")?.scrollIntoView(...)`).
- **Busca no banco** continua em paralelo; resultados do banco vão para o card **"Cidades já cadastradas"** ao lado (não misturados com o Google).

### 2. Backend – API de geocode

- **Arquivo:** `src/app/api/admin/cities/geocode/route.ts`
- **Rota:** `GET /api/admin/cities/geocode?q=<termo>&state=<UF opcional>`
- Lê a chave do Google (tenant ou global em Admin > Mapas).
- **Se vier `state`:** uma única requisição ao Google: `"<termo>, <UF>, Brasil"`.
- **Se não vier `state`:** uma única requisição: `"<termo>, Brasil"`.
- Resposta do Google é tratada assim:
  - Extrai `locality` e `administrative_area_level_1` dos `address_components`.
  - Filtro opcional: só inclui cidades cujo **nome** (normalizado, sem acento) **contém** o termo buscado (`minLenToFilter = 3`).
  - Se após o filtro sobrar **0 resultados**, usa a **mesma** resposta do Google **sem** o filtro e adiciona até 5 localidades.
- Retorna: `NextResponse.json(results.slice(0, 20))` (array de `{ name, state, country, latitude, longitude }`).
- **Normalização:** `normalizeForMatch(s)` = minúsculas + NFD + remoção de acentos (`[\u0300-\u036f]`).

### 3. Página Cidades

- **Arquivo:** `src/app/admin/cidades/page.tsx`
- Usa `CitySearch` com `onGoogleSuggestionPreview`, `onGoogleResultsLoaded`, `onGeocodeError`, `onDbResultsLoaded`.
- Card do **mapa** tem `id="map-card"` para o scroll ao clicar na sugestão.
- Texto do card de busca: "Busca apenas no Google (3+ letras). Clique em uma cidade na lista; o mapa rola para baixo..."

### 4. Teste da chave do Google

- **Rota:** `GET /api/admin/cities/geocode/test`
- **Arquivo:** `src/app/api/admin/cities/geocode/test/route.ts`
- Na página há botão **"Testar chave do Google"**; quando a chave está OK, aparece algo como: "chave configurada (global). Geocoding API respondeu OK."

## Possíveis causas do problema

1. **API retorna array vazio**
   - Geocode com `"doi, Brasil"` ou `"dois, Brasil"` pode estar retornando `ZERO_RESULTS` ou resultados sem `locality` no formato esperado.
   - O filtro por nome pode estar removendo todos os itens (ex.: Google devolve "Rio Fortuna" e o filtro exige nome contendo "dois").
   - O fallback “sem filtro” usa a mesma resposta já lida; conferir se não há bug ao processar `singleData.results` na segunda passagem.

2. **Frontend não exibe a lista**
   - Verificar se a resposta da API é **200** com **body = array** (e não `{ error: "..." }`).
   - No componente: `const list = Array.isArray(errBody) ? errBody : []` — se a API devolver objeto em vez de array, `list` fica `[]`.
   - O dropdown só aparece quando `isOpen && searchTerm.trim().length >= 3 && googleResults.length > 0`. Se `googleResults` estiver sempre vazio, a lista não aparece.

3. **Chave do Google**
   - Geocoding API precisa estar **ativada** no Google Cloud para o projeto da chave.
   - Se o **teste** (botão "Testar chave do Google") mostra OK mas a busca não, o problema é na lógica da busca (filtro, parsing, ou uso da resposta), não na chave em si.

## Como debugar

1. **Rede (F12 > Network):**
   - Ao digitar "doi" ou "dois", localizar a requisição para `geocode?q=doi` ou `geocode?q=dois`.
   - Ver **Status** (200?) e **Response** (array com objetos ou vazio `[]`? algum `error`?).

2. **Console do navegador:**
   - Em `CitySearch.tsx` há `console.error` em catch da busca Google; ver se aparece algum erro.

3. **Backend (logs do Next):**
   - Em `geocode/route.ts` há `console.error('Erro no geocode:', error)` no catch; ver se a API está lançando exceção.

4. **Testar a API direto no navegador (logado):**
   - Abrir: `http://localhost:3000/api/admin/cities/geocode?q=dois`
   - Ver o JSON retornado (array de cidades ou vazio).

## Arquivos principais

| Arquivo | Função |
|--------|--------|
| `src/components/admin/CitySearch.tsx` | Input de busca, chamada à API geocode, dropdown com resultados Google, callbacks |
| `src/app/api/admin/cities/geocode/route.ts` | GET geocode: chama Google, filtra por nome, fallback sem filtro, retorna array |
| `src/app/admin/cidades/page.tsx` | Página Cidades, uso do CitySearch, mapa com id "map-card", scroll ao selecionar |
| `src/app/api/admin/cities/geocode/test/route.ts` | Teste da chave do Google |

## Resumo em uma frase

A busca com 3+ letras chama `/api/admin/cities/geocode?q=<termo>`, que faz uma requisição ao Google com `"<termo>, Brasil"`, filtra por nome contendo o termo e, se sobrar zero, usa a mesma resposta sem filtro; o frontend deveria exibir esse array no dropdown, mas com 3 letras não aparece lista e com 4 letras às vezes aparece cidade errada (ex.: Rio Fortuna para "dois") — é preciso garantir que a API retorne cidades corretas e que o frontend trate a resposta como array e exiba o dropdown.
