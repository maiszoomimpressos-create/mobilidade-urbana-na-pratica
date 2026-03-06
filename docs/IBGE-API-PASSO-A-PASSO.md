# Como puxar os dados do IBGE para os filtros – Passo a passo

A API do IBGE **não exige cadastro nem chave**. São apenas requisições **GET** em URLs públicas. Abaixo está a ordem lógica para obter estados, regiões e municípios e usar nos filtros.

---

## Base da API

- **URL base:** `https://servicodados.ibge.gov.br/api/v1/localidades`
- **Método:** GET (abrir no navegador ou usar `fetch` no código).
- **Resposta:** JSON.

---

## Passo 1: Listar todos os estados (UFs)

**Objetivo:** Ter a lista de estados para o filtro por UF (PR, SP, etc.).

**URL:**
```
GET https://servicodados.ibge.gov.br/api/v1/localidades/estados
```

**O que você recebe:** Um array de objetos. Cada um tem, por exemplo:
- `id` (número) – código do estado (ex.: 41 = Paraná)
- `sigla` (texto) – ex.: `"PR"`
- `nome` (texto) – ex.: `"Paraná"`

**Exemplo de uso no sistema:** Montar os botões de estado (Todos, PR, SP, …) usando `sigla` e, se quiser, `nome`.

---

## Passo 2: Regiões intermediárias de um estado

**Objetivo:** Saber as “regiões intermediárias” daquele estado (ex.: Paraná tem várias, como Curitiba, Londrina, Cascavel…). Serve para um filtro “por região intermediária”.

**URL:** (troque `{id}` pelo `id` do estado do passo 1)
```
GET https://servicodados.ibge.gov.br/api/v1/localidades/estados/{id}/regioes-intermediarias
```

**Exemplo:** Paraná tem `id` 41:
```
GET https://servicodados.ibge.gov.br/api/v1/localidades/estados/41/regioes-intermediarias
```

**O que você recebe:** Array de regiões intermediárias. Cada item tem, em geral:
- `id` (número)
- `nome` (texto) – ex.: `"Curitiba"`, `"Londrina"`
- `UF` (objeto com id, sigla, nome do estado)

**Exemplo de uso:** Ao usuário escolher um estado, você pode carregar esse endpoint e exibir um segundo filtro: “Região intermediária” (dropdown ou lista).

---

## Passo 3: Regiões imediatas de uma região intermediária

**Objetivo:** Dentro de uma região intermediária, listar as “regiões imediatas”. Assim você pode filtrar por região imediata (nível mais fino).

**URL:** (troque `{id}` pelo `id` da região intermediária do passo 2)
```
GET https://servicodados.ibge.gov.br/api/v1/localidades/regioes-intermediarias/{id}/regioes-imediatas
```

**Exemplo:** Se a região intermediária “Curitiba” tiver id 4101:
```
GET https://servicodados.ibge.gov.br/api/v1/localidades/regioes-intermediarias/4101/regioes-imediatas
```

**O que você recebe:** Array de regiões imediatas. Cada item tem, em geral:
- `id` (número)
- `nome` (texto)
- `regiao-intermediaria` (objeto com id e nome da região intermediária)

**Exemplo de uso:** Depois que o usuário escolhe “Região intermediária”, você chama essa URL e mostra um terceiro filtro: “Região imediata”.

---

## Passo 4: Municípios de um estado

**Objetivo:** Listar todos os municípios do estado (para resolver nome da cidade → código IBGE, ou para exibir lista).

**URL:** (troque `{id}` pelo `id` do estado)
```
GET https://servicodados.ibge.gov.br/api/v1/localidades/estados/{id}/municipios
```

**Exemplo:**
```
GET https://servicodados.ibge.gov.br/api/v1/localidades/estados/41/municipios
```

**O que você recebe:** Array de municípios. Cada item tem, em geral:
- `id` (número) – **código IBGE do município** (7 dígitos)
- `nome` (texto)

**Exemplo de uso:** Na busca de cidade por nome + UF, você usa essa lista para achar o `id` (código IBGE) do município.

---

## Passo 5: Detalhe de um município (com região)

**Objetivo:** Para um município já identificado pelo `id` (código IBGE), obter **região imediata** e **região intermediária**. Isso permite guardar a região da cidade e filtrar por ela depois.

**URL:** (troque `{id}` pelo código IBGE do município, ex.: 4100103)
```
GET https://servicodados.ibge.gov.br/api/v1/localidades/municipios/{id}
```

**Exemplo:**
```
GET https://servicodados.ibge.gov.br/api/v1/localidades/municipios/4100103
```

**O que você recebe:** Um objeto com vários campos, entre eles (nomes podem variar levemente na documentação):
- `id`, `nome`
- `regiao-imediata` – objeto com `id` e `nome` da região imediata
- `regiao-intermediaria` – objeto com `id` e `nome` da região intermediária
- `microrregiao`, `mesorregiao`, `UF`, etc.

**Exemplo de uso:** Quando você descobre o código IBGE de uma cidade (nome + UF), chama essa URL, lê `regiao-imediata` e `regiao-intermediaria` e grava no banco (ou usa direto para filtrar).

---

## Ordem resumida para “puxar” os dados

| Ordem | O que puxar | URL (exemplo) |
|-------|-------------|----------------|
| 1 | Estados | `/estados` |
| 2 | Regiões intermediárias do estado | `/estados/41/regioes-intermediarias` |
| 3 | Regiões imediatas da região intermediária | `/regioes-intermediarias/4101/regioes-imediatas` |
| 4 | Municípios do estado | `/estados/41/municipios` |
| 5 | Detalhe do município (com regiões) | `/municipios/4100103` |

---

## Como usar no navegador (testar sem código)

1. Abra o Chrome ou Edge.
2. Na barra de endereço, cole por exemplo:  
   `https://servicodados.ibge.gov.br/api/v1/localidades/estados`
3. Dê Enter. A página deve mostrar o JSON com todos os estados.
4. Troque o final da URL para testar outros endpoints (ex.: `.../estados/41/municipios`).

---

## Como usar no código (JavaScript/Next.js)

Exemplo em uma função assíncrona:

```js
const base = 'https://servicodados.ibge.gov.br/api/v1/localidades'

// 1) Estados
const estadosRes = await fetch(`${base}/estados`)
const estados = await estadosRes.json()

// 2) Regiões intermediárias do Paraná (id 41)
const regInterRes = await fetch(`${base}/estados/41/regioes-intermediarias`)
const regioesIntermediarias = await regInterRes.json()

// 3) Regiões imediatas de uma região intermediária (ex.: id 4101)
const regImedRes = await fetch(`${base}/regioes-intermediarias/4101/regioes-imediatas`)
const regioesImediatas = await regImedRes.json()

// 4) Municípios do Paraná
const munRes = await fetch(`${base}/estados/41/municipios`)
const municipios = await munRes.json()

// 5) Detalhe de um município (regiões)
const detalheRes = await fetch(`${base}/municipios/4100103`)
const municipio = await detalheRes.json()
// municipio['regiao-imediata'], municipio['regiao-intermediaria']
```

No sistema, você pode:
- **Filtro por estado:** usar o passo 1 (já temos os botões) e o passo 4 para listar municípios do estado.
- **Filtro por região intermediária:** passo 2 para montar o dropdown; ao salvar a cidade, usar passo 5 e guardar `regiao-intermediaria.id` e `nome` no banco para filtrar depois.
- **Filtro por região imediata:** passo 3 para listar as opções; guardar `regiao-imediata.id` e `nome` a partir do passo 5.

---

## Documentação oficial

- **API de localidades:** https://servicodados.ibge.gov.br/api/docs/localidades  
Lá você confere os nomes exatos dos campos em cada resposta e outros parâmetros (por exemplo, `orderBy`).

Com isso você já sabe “como puxar” os dados do IBGE passo a passo; o próximo passo é decidir em que tela colocar cada filtro (estado, região intermediária, região imediata) e se quer guardar região no banco ou buscar na hora.
