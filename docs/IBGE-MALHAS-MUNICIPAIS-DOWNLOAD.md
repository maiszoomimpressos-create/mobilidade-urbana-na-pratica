# Como baixar os dados de limites municipais do IBGE

O IBGE disponibiliza as **malhas digitais** (limites oficiais dos municípios) em Shapefile. Você pode baixar **todos os municípios do Brasil** em um único arquivo ou **por estado**.

---

## 1. Página oficial (recomendado)

Acesse a página de acesso ao produto e escolha o ano e o tipo de download:

- **Malhas – Acesso ao produto:**  
  https://www.ibge.gov.br/geociencias/organizacao-do-territorio/estrutura-territorial/15774-malhas.html?edicao=27733&t=acesso-ao-produto

Na página você encontra:

- **Brasil** – um único ZIP com todos os municípios.
- **Por estado** – um link por UF (AC, AL, AM, …), cada um com o ZIP daquele estado.

Clique em **Municípios** no Brasil ou no estado desejado; o download é um arquivo `.zip` contendo Shapefile (`.shp`, `.shx`, `.dbf`, `.prj`, etc.).

---

## 2. Download direto via FTP (URLs)

Os arquivos ficam no servidor FTP do IBGE. O padrão de URL é:

**Brasil (todos os municípios):**

- Base para 2019 (exemplo):  
  `https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2019/Brasil/BR/br_municipios_20200807.zip`

**Por estado (troque `XX` pela sigla em maiúscula e `xx` em minúscula):**

- Exemplo Paraná (PR):  
  `https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2019/UFs/PR/pr_municipios.zip`

- Exemplo São Paulo (SP):  
  `https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2019/UFs/SP/sp_municipios.zip`

**Versões mais recentes:** o IBGE pode publicar malhas em pastas como `municipio_2022`, `municipio_2024`, etc. A estrutura costuma ser a mesma; confira no link oficial da seção 1 qual ano está disponível e, se quiser FTP, navegue em:

- https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/

e entre na pasta do ano (ex.: `municipio_2024`).

---

## 3. Conteúdo do Shapefile (Municípios)

Cada polígono é um município. Atributos típicos:

| Campo    | Descrição                          |
|----------|------------------------------------|
| `CD_MUN` | Geocódigo do município (7 dígitos) |
| `NM_MUN` | Nome do município                  |
| `SIGLA`  | Sigla da UF (ex.: PR, SP)          |
| `AREA_KM2` | Área em km²                      |

- Sistema de referência: **SIRGAS 2000**, coordenadas geográficas (lat/lon).
- Escala de origem: 1:250.000.

---

## 4. Depois do download: como usar

1. **Descompactar** o ZIP – você terá arquivos `.shp`, `.dbf`, `.shx`, `.prj`, etc.
2. **Converter para GeoJSON** (se o seu sistema usa GeoJSON):
   - QGIS: abrir o SHP e exportar como GeoJSON.
   - Linha de comando: `ogr2ogr` (GDAL), ex.:  
     `ogr2ogr -f GeoJSON br_municipios.json br_municipios.shp`
3. **No sistema:** você pode:
   - guardar o GeoJSON/Shape em um repositório ou storage e servir por API;
   - importar para um banco com suporte espacial (ex.: PostGIS) e consultar por nome/UF ou geocódigo;
   - para uma cidade cadastrada no seu sistema (nome + UF), localizar o polígono pelo `NM_MUN` + `SIGLA` e usar o polígono para desenhar o limite no mapa ou fazer “ponto dentro do polígono”.

---

## 5. Resumo rápido

| O que você quer              | Onde fazer |
|-----------------------------|------------|
| Ver anos e links oficiais   | [IBGE – Malhas – Acesso ao produto](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/estrutura-territorial/15774-malhas.html?edicao=27733&t=acesso-ao-produto) |
| Baixar Brasil inteiro       | Na mesma página: Brasil → Municípios (ou usar a URL FTP do ano desejado) |
| Baixar só um estado         | Na mesma página: estado (ex.: PR) → Municípios (ou URL FTP `.../UFs/PR/pr_municipios.zip`) |
| Entender atributos e uso    | Documentação técnica na própria página do produto e neste doc (seção 3 e 4). |

Não é necessário cadastro para download; os dados são de uso livre (ver termos na página do IBGE).

---

## 6. Usar os dados no mapa

Depois de baixar e extrair, use no sistema para **ver os limites no mapa**: veja **`docs/IBGE-LIMITES-NO-MAPA.md`** (inclui o script `npm run ibge:build-boundaries` e o fluxo na tela Mapear).
