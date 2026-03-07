# Redirecionamento ao recuperar senha (Supabase)

Para o link "Esqueci a senha" levar o usuário para a tela de **redefinir senha** (e não para a home com erro), é obrigatório configurar as URLs no Supabase.

## Passo a passo

1. Acesse o **Supabase Dashboard** do seu projeto.
2. Vá em **Authentication** → **URL Configuration**.
3. Em **Redirect URLs**, adicione **uma linha por URL** (exatamente como abaixo, trocando o domínio se for outro):

   ```
   http://localhost:3000/redefinir-senha
   https://mobilidade-urbana-na-pratica.vercel.app/redefinir-senha
   ```

   Se usar outros ambientes (preview, outro domínio), adicione também, por exemplo:

   ```
   https://*.vercel.app/redefinir-senha
   ```

4. Em **Site URL**, deixe a URL principal do app, por exemplo:

   ```
   https://mobilidade-urbana-na-pratica.vercel.app
   ```

5. Salve.

## O que acontece se não configurar

- O Supabase envia o email com o link de redefinir senha.
- Ao clicar, o Supabase não redireciona para `/redefinir-senha` (URL não permitida).
- O usuário cai na **Site URL** (ex.: home) com parâmetros de erro na URL (`error=access_denied`, `otp expired`, etc.).
- O app agora redireciona esse caso para **Esqueci a senha** com a mensagem "Link expirado ou inválido. Solicite um novo link abaixo."

## Resumo

| Onde              | O que colocar |
|-------------------|----------------|
| **Redirect URLs** | `http://localhost:3000/redefinir-senha` e `https://mobilidade-urbana-na-pratica.vercel.app/redefinir-senha` |
| **Site URL**      | `https://mobilidade-urbana-na-pratica.vercel.app` (ou sua URL principal) |

Depois de salvar, peça um **novo** link de redefinição (o antigo pode ter expirado) e teste de novo.
