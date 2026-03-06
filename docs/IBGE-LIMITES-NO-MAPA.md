# Como ver os limites dos municípios no mapa

O sistema já permite **carregar e exibir o limite oficial do município** no mapa. Há duas formas de obter os dados: **API do IBGE** (online) ou **arquivo local** (malha que você baixou).

---

## 1. Onde ver os limites

1. Acesse **Admin → Cidades**.
2. Abra uma cidade (ou crie/selecione uma).
3. Vá em **Mapear** (ou acesse diretamente `/admin/cidades/[id]/mapear`).
4. No painel à direita, clique em **"Carregar limite (IBGE)"**.
5. O polígono do município aparece no mapa. Você pode ajustar manualmente se quiser e depois clicar em **"Salvar Área"**.

Assim você **vê os limites** do município e pode usá-los como área de cobertura.

---

## 2. De onde vêm os dados

### Opção A – API do IBGE (padrão)

- O backend chama a API oficial do IBGE:  
  `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/{código}`
- O **código IBGE** (7 dígitos) é obtido pelo **nome + UF** da cidade (e salvo no banco como `ibgeCode`).
- Funciona para qualquer município, desde que a cidade tenha nome e estado corretos. **Requer internet.**

### Opção B – Arquivo local (malha que você baixou)

- Se você tiver a malha **BR_Municipios_2024** (ou outra) em **`data/ibge/`** e tiver rodado o script de conversão, o sistema **prefere** o polígono local.
- Vantagens: mesma base (ex.: 2024), não depende da API na hora do uso, pode funcionar em ambiente sem acesso à API.

**Passos para usar o arquivo local:**

1. **Baixar e extrair** a malha do IBGE em `data/ibge/` (veja `docs/IBGE-MALHAS-MUNICIPAIS-DOWNLOAD.md`).
2. **Instalar dependência** (se ainda não tiver):  
   `npm install shapefile --save-dev`
3. **Rodar o script de conversão** (uma vez):  
   `npm run ibge:build-boundaries`  
   Isso gera um JSON por município em `data/ibge/by-code/{CD_MUN}.json`.
4. A partir daí, ao clicar em **"Carregar limite (IBGE)"**, o backend usa primeiro o arquivo local (por código IBGE da cidade); se não existir, usa a API do IBGE.

---

## 3. Fluxo técnico

- **Frontend (Mapear):** botão **"Carregar limite (IBGE)"** → `GET /api/admin/cities/[id]/boundary`.
- **Backend:** lê a cidade (nome, state, `ibgeCode`). Se não tiver `ibgeCode`, resolve pelo nome+UF na API de localidades do IBGE e grava no banco.
- **Polígono:** tenta ler `data/ibge/by-code/{ibgeCode}.json`; se existir, devolve esse polígono. Senão, chama a API de malhas do IBGE e devolve o polígono.
- **Resposta:** `{ geojson, polygon, source?: 'local' | 'api' }`. O `polygon` é um array `[[lng, lat], ...]` usado pelo editor para desenhar no Leaflet.

---

## 4. Resumo

| Objetivo                         | O que fazer |
|----------------------------------|-------------|
| Só **ver os limites** no mapa    | Admin → Cidades → [cidade] → Mapear → **Carregar limite (IBGE)**. |
| Usar **sempre a API** do IBGE    | Nada extra; já é o fallback quando não há arquivo local. |
| Usar a **malha que você baixou** | Extrair o ZIP em `data/ibge/`, rodar `npm run ibge:build-boundaries`, depois usar o mesmo botão no Mapear. |

A pasta `data/` está no `.gitignore`; os arquivos da malha e os JSON em `by-code/` não são versionados.
