# Dados regionais do IBGE para filtro

O IBGE disponibiliza **divisões regionais** que podem ser usadas para filtrar cidades além do estado (UF).

---

## O que a API de Localidades oferece

Na **API de Localidades** (v1), ao consultar um município ou a lista de municípios por estado, a resposta em JSON pode incluir:

| Campo | Descrição |
|-------|-----------|
| **Região Imediata** | ID e Nome – agrupamento de municípios com vínculos cotidianos (trabalho, serviços etc.) |
| **Região Intermediária** | ID e Nome – agrupamento de regiões imediatas em torno de um centro maior |
| **Microrregião** | ID e Nome – divisão antiga, em substituição progressiva pelas Regiões Imediatas |
| **Mesorregião** | ID e Nome – divisão antiga, em substituição progressiva pelas Regiões Intermediárias |

As **Regiões Geográficas Imediatas** e **Intermediárias** são as divisões atuais recomendadas pelo IBGE.

---

## Endpoints úteis

- **Documentação:** https://servicodados.ibge.gov.br/api/docs/localidades  
- **Município por ID:** `GET /v1/localidades/municipios/{id}` – retorna, entre outros, `regiao-imediata` e `regiao-intermediaria`.  
- **Regiões Imediatas:** `GET /v1/localidades/regioes-imediatas` (ou por estado, se disponível).  
- **Regiões Intermediárias:** `GET /v1/localidades/regioes-intermediarias` (ou por estado).

Consulte a documentação oficial para a estrutura exata do JSON e parâmetros (ex.: `orderBy`, `view`).

---

## Como usar no sistema (filtro regional)

Para permitir **filtrar cidades por região** (além do estado):

1. **Ao resolver o código IBGE** da cidade (nome + UF), chamar também o endpoint do município por ID e obter `regiao-imediata` e `regiao-intermediaria`.  
2. **Persistir** no banco (ex.: campos `ibgeRegiaoImediataId`, `ibgeRegiaoImediataNome`, `ibgeRegiaoIntermediariaId`, `ibgeRegiaoIntermediariaNome` na tabela de cidades, ou em uma tabela auxiliar).  
3. **Na tela de Cidades**, além do filtro por estado, oferecer um filtro opcional por **Região Imediata** ou **Região Intermediária** (dropdown ou lista), usando esses dados.

Se as cidades já tiverem apenas `ibgeCode` e não tiverem região salva, é possível buscar a região sob demanda pela API (por exemplo, ao abrir o filtro) ou rodar um script único para preencher os campos a partir do código IBGE.

---

## Referência

- [Divisões regionais do Brasil – IBGE](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/divisao-regional/15778-divisoes-regionais-do-brasil.html)  
- [API de Localidades – documentação](https://servicodados.ibge.gov.br/api/docs/localidades)
