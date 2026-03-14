# Build Android com mapa (Google Maps)

O mapa no Android precisa de uma **chave do Google Maps** e de um **build de desenvolvimento** (não funciona no Expo Go).

A chave já está configurada no `.env` do projeto (`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`). Não commite o `.env` no git.

## Opção 1: EAS Build (recomendado – build na nuvem)

Não exige Java/Gradle no seu PC e evita problemas de caminho com espaços.

### 1. Instalar e fazer login

```bash
npm install -g eas-cli
eas login
```

(Crie uma conta em https://expo.dev se ainda não tiver.)

### 2. Configurar a chave do Google Maps no EAS

A chave já está no seu `.env`. Para o build na nuvem usá-la, crie a variável no EAS (uma vez):

**Opção A – Script (PowerShell, na pasta `apps/passenger`):**
```powershell
.\scripts\configurar-eas-mapa.ps1
```

**Opção B – Manual:**
```bash
cd apps/passenger
npx eas-cli login
npx eas-cli build:configure
npx eas-cli env:create EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --environment preview --visibility secret
```
Quando pedir o valor, cole a chave do Google Maps (a mesma do `.env`).

### 3. Gerar o APK

```bash
cd apps/passenger
eas build --platform android --profile preview
```

O perfil `preview` gera um **APK** para instalar no celular. No fim do build, a Expo mostra um link para baixar o APK.

### 4. Instalar no celular

- Baixe o APK pelo link e instale no Android, ou  
- Escaneie o QR code que a EAS mostrar após o build.

---

## Opção 2: Build local (`expo run:android`)

Só funciona bem se:

- **JAVA_HOME** estiver apontando para o JDK (ex.: `C:\Program Files\Android\Android Studio\jbr`).
- O projeto estiver em um **caminho sem espaços** (ex.: `C:\projetos\mobilidade`). O caminho "MOBILIDADE URBANA NA PRATICA" costuma quebrar o Gradle no Windows.

Com isso ok:

1. Coloque a chave no `.env`:  
   `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_aqui`
2. Conecte o celular por USB (depuração USB ativada) ou use um emulador.
3. Rode:

```bash
cd apps/passenger
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
npx expo run:android
```

---

## Resumo

- **Expo Go:** mapa não usa sua chave → costuma ficar em branco no Android.  
- **EAS Build (preview):** usa sua chave e gera APK com mapa funcionando.  
- **Build local:** possível se Java estiver certo e o projeto estiver em pasta sem espaços.
