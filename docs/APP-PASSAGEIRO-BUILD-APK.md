# App do Passageiro — Gerar APK e disponibilizar no site

O app Mai Drive fica em **`apps/passenger`** (Expo). Para o botão "Baixar app" no site levar ao **download do nosso APK**, siga estes passos.

---

## Passo 1: Gerar o APK (Android)

### Opção A: EAS Build (recomendado — gera APK na nuvem)

1. **Instalar EAS CLI e fazer login** (uma vez no PC):
   ```bash
   npm install -g eas-cli
   eas login
   ```
   Crie uma conta em [expo.dev](https://expo.dev) se ainda não tiver.

2. **Configurar o projeto** (uma vez por projeto):
   ```bash
   cd apps/passenger
   eas build:configure
   ```
   Aceite o padrão se perguntar algo.

3. **Gerar o APK**:
   ```bash
   cd apps/passenger
   eas build --platform android --profile preview
   ```
   Ou use o script: `npm run android:build`

4. **Pegar o link do APK**: quando o build terminar, o EAS mostra um **link para baixar o arquivo .apk**. Copie essa URL — você vai usar no passo 2.

### Opção B: Build local (Android Studio)

1. Gerar o projeto Android:
   ```bash
   cd apps/passenger
   npx expo prebuild --platform android
   ```
2. Abrir a pasta `android` no **Android Studio** → **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
3. O APK fica em `android/app/build/outputs/apk/debug/` ou `release/`. Você precisará hospedar esse arquivo em um link público (passo 2).

---

## Passo 2: Hospedar o APK (link público)

O site precisa de uma **URL direta** para o arquivo .apk. Algumas opções:

- **Link do EAS**: se usou EAS Build, use a URL que o EAS mostrou ao final do build. Ela já é pública e estável por um tempo.
- **Vercel / nosso site**: coloque o APK em **`public/downloads/mai-drive-passenger.apk`** no repositório do Next.js e faça deploy. O link será:  
  `https://seu-dominio.vercel.app/downloads/mai-drive-passenger.apk`
- **Outro servidor/CDN**: subir o .apk em qualquer hospedagem que permita download direto e copiar a URL.

---

## Passo 3: Configurar o site para “Baixar app”

1. No **Vercel** (ou onde o site está): **Project** → **Settings** → **Environment Variables**.
2. Crie a variável:
   - **Nome:** `NEXT_PUBLIC_PASSENGER_APP_APK_URL`
   - **Valor:** a URL do APK (ex.: link do EAS ou `https://seu-dominio.vercel.app/downloads/mai-drive-passenger.apk`)
3. Faça um **redeploy** do site para carregar a variável.

Pronto: na página **/baixar**, o botão Android passa a mostrar **“Baixar para Android (APK)”** e levará ao download do nosso app.

---

## Resumo rápido

| Etapa | O que fazer |
|-------|-------------|
| 1 | `cd apps/passenger` → `eas build --platform android --profile preview` (ou build local) |
| 2 | Obter URL pública do .apk (EAS ou public/downloads ou CDN) |
| 3 | Definir `NEXT_PUBLIC_PASSENGER_APP_APK_URL` no Vercel e redeployar |

A página **`src/app/baixar/page.tsx`** já está preparada: se `NEXT_PUBLIC_PASSENGER_APP_APK_URL` estiver definida, o botão Android usa esse link; caso contrário, usa o link da Play Store (se configurado).
