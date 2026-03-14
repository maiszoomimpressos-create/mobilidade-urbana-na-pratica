# App do Passageiro — Modelo simplificado

Sempre usamos **nossa logo, nossas cores e nosso APK**. O gestor pode personalizar apenas o **subnome da sua central**.

## O que é fixo (Mai Drive)

- Logo
- Cores
- APK (mesmo para todos)
- App nas lojas (Play Store, App Store)

## O que o gestor pode alterar

- **Nome da sua central (subnome)** — ex.: "Central Transporte XYZ"
  - Aparece no app do passageiro quando o usuário acessa pelo link do tenant
  - Aparece na página de download: "Baixe o app Mai Drive — Central Transporte XYZ"

## Como funciona

### Nossa bandeira
- URL: `https://seu-dominio.com/baixar`
- App mostra **Mai Drive** em todas as telas

### Tenant (central do gestor)
- URL: `https://seu-dominio.com/baixar?tenant=slug-do-tenant`
- Ex.: `/baixar?tenant=transporte-xyz`
- Página mostra: "Baixe o app Mai Drive" + "Central Transporte XYZ"
- App usa nossa logo e cores, mas exibe o nome da central (ex.: "Central Transporte XYZ") nas telas

### Deep link (maidrive://tenant/xyz)

Quando o usuário abre o app por `maidrive://tenant/slug-do-tenant`:
- O app armazena o slug do tenant
- Busca o nome da central na API
- Exibe o nome da central (ex.: "Central Transporte XYZ") nas telas, com nossa logo e cores

## Onde o gestor configura

O gestor pode editar o **nome da sua central** no **Dashboard**:
- Acesse o dashboard
- Seção "Configurações da sua central"
- Campo "Nome da sua central (subnome)"

## Resumo

| Cenário | URL | O que aparece no app |
|---------|-----|----------------------|
| Mai Drive | `/baixar` | Mai Drive (logo, cores, nome) |
| Tenant X | `/baixar?tenant=transporte-x` | Nossa logo, nossas cores, nome "Central Transporte XYZ" |

O **mesmo APK** serve para todos. O nome da central é definido em tempo de execução (tenant slug).
