# Guia: Configurar chaves dos provedores de mapa

Este guia explica como obter e configurar as chaves de API para **Google Maps**, **Mapbox** e **OpenStreetMap**.

---

## Visão geral

O sistema usa **fallback automático**: tenta primeiro o provedor com maior prioridade (menor número). Se atingir o limite mensal, passa para o próximo.

| Provedor       | Prioridade | Precisa de chave? | Limite gratuito (exemplo) |
|----------------|------------|-------------------|---------------------------|
| Google Maps    | 0 (primeiro) | Sim             | ~28.000 requisições/mês   |
| Mapbox         | 1          | Sim               | ~50.000 requisições/mês   |
| OpenStreetMap  | 2          | **Não**           | Ilimitado                 |

---

## Passo 1: Acessar a tela de configuração

1. Faça login como **Admin Master**
2. No menu lateral, clique em **Mapas**
3. Você verá 3 cards: Google Maps, Mapbox e OpenStreetMap

---

## Passo 2: Google Maps (se ainda não configurou)

### 2.1 Criar projeto no Google Cloud

1. Acesse: https://console.cloud.google.com/
2. Crie um projeto ou selecione um existente
3. Vá em **APIs e Serviços** → **Credenciais**
4. Clique em **Criar credenciais** → **Chave de API**
5. Copie a chave gerada

### 2.2 Ativar APIs necessárias

1. Vá em **APIs e Serviços** → **Biblioteca**
2. Ative:
   - **Geocoding API** (para busca de cidades)
   - **Places API** (para Autocomplete e Place Details)
   - **Maps JavaScript API** (se usar mapas do Google no app)

### 2.3 Configurar no Mai Drive

1. Na tela **Mapas**, clique em **Configurar** no card **Google Maps**
2. Cole a chave no campo **API Key**
3. Defina **Prioridade** (0 = usado primeiro)
4. Defina **Limite mensal** (ex.: 28000 para o crédito gratuito)
5. Marque **Provedor ativo**
6. Clique em **Salvar**

---

## Passo 3: Mapbox

### 3.1 Criar conta e obter token

1. Acesse: https://account.mapbox.com/
2. Crie uma conta gratuita (se não tiver)
3. Vá em **Access tokens**: https://account.mapbox.com/access-tokens/
4. Use o token **Default public token** ou crie um novo
5. Copie o token (começa com `pk.`)

### 3.2 Configurar no Mai Drive

1. Na tela **Mapas**, clique em **Configurar** no card **Mapbox**
2. Cole o token no campo **API Key**
3. Defina **Prioridade** (1 = usado após Google Maps)
4. Defina **Limite mensal** (ex.: 50000 para o plano gratuito)
5. Marque **Provedor ativo**
6. Clique em **Salvar**

---

## Passo 4: OpenStreetMap

**Não precisa de chave.** O OpenStreetMap é gratuito e ilimitado.

1. Na tela **Mapas**, clique em **Configurar** no card **OpenStreetMap**
2. Não há campo de API Key
3. Defina **Prioridade** (2 = usado por último, como fallback)
4. **Limite mensal**: 0 = ilimitado
5. Marque **Provedor ativo**
6. Clique em **Salvar**

---

## Passo 5: Garantir que os provedores existem no banco

Se os cards **não aparecem** na tela de Mapas, rode o seed:

```powershell
npm run db:seed
```

Isso cria os registros de Google Maps, Mapbox e OpenStreetMap na tabela `map_providers`.

---

## Resumo rápido

| Ação                    | Onde fazer                          |
|-------------------------|-------------------------------------|
| Obter chave Google      | https://console.cloud.google.com/apis/credentials |
| Obter token Mapbox      | https://account.mapbox.com/access-tokens/         |
| Configurar no sistema   | Admin → Mapas → Configurar (em cada card)        |

---

## Ordem de uso (fallback)

1. **Google Maps** (prioridade 0) – tenta primeiro
2. **Mapbox** (prioridade 1) – se Google atingir limite
3. **OpenStreetMap** (prioridade 2) – fallback gratuito

A busca de cidades (geocoding) usa atualmente apenas **Google Maps**. Mapbox e OpenStreetMap são usados para exibir mapas no app (quando implementado).
