# Como gerar o APK do passageiro para o site

São **3 passos**. O Passo 1 (login na Expo) é só na primeira vez; depois basta repetir o Passo 2 e, se quiser atualizar o link no site, o Passo 3.

---

## Passo 1 — Login na Expo (só na primeira vez)

**Onde fazer o login:** no **Terminal** do próprio Cursor (não é em site nem em outro programa).

1. **Abrir o Terminal no Cursor**
   - Pressione **Ctrl + `** (a tecla crase, perto do 1), **ou**
   - No menu: **Terminal** → **New Terminal**.
   - Abre um painel em baixo com uma janela preta/escura onde você digita comandos.

2. **Rodar os comandos (cole um, dê Enter, depois o outro)**
   - Primeiro comando (entrar na pasta do app):
     ```bash
     cd "c:\Users\neoma\MOBILIDADE URBANA NA PRATICA\apps\passenger"
     ```
     Dê **Enter**. Não precisa colar o segundo ainda.
   - Segundo comando (pedir o login):
     ```bash
     npx eas-cli login
     ```
     Dê **Enter**.

3. **O que acontece**
   - Pode **abrir o navegador** com a página da Expo para você fazer login (e-mail e senha). Se não tiver conta, crie em [expo.dev](https://expo.dev).
   - **Ou** pode pedir no próprio terminal: “Log in with email and password” — aí você digita o e-mail e a senha ali mesmo.

4. **Quando terminar**
   - Quando aparecer algo como “Logged in” ou “Successfully logged in”, está feito. Pode fechar a aba do navegador (se abriu) e seguir para o Passo 2.

---

## Passo 2 — Gerar o APK

1. No terminal, volte para a **raiz do projeto** (pasta `MOBILIDADE URBANA NA PRATICA`). Se precisar, rode:

```bash
cd "c:\Users\neoma\MOBILIDADE URBANA NA PRATICA"
```

2. Rode:

```bash
npm run apk:passenger
```

3. Espere alguns minutos. No final o EAS mostra um **link para baixar o APK**. Copie esse link.

---

## Passo 3 — Colocar o link no site (Vercel)

1. Acesse o **Vercel** → seu projeto → **Settings** → **Environment Variables**.
2. Crie uma variável:
   - **Name:** `NEXT_PUBLIC_PASSENGER_APP_APK_URL`
   - **Value:** (cole o link do APK que o EAS mostrou)
3. Faça **Redeploy** do projeto.

Pronto. Na página **/baixar** do site o botão "Baixar para Android (APK)" vai levar ao download do app.
