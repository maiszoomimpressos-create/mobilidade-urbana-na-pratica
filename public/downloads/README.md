# Downloads — APK do app

Depois de gerar o APK com o script `scripts/gerar-apk-passageiro.ps1` (ou com `eas build` na pasta `apps/passenger`):

1. **Opção A — Usar link do EAS**  
   O EAS mostra um link para baixar o .apk. Configure no Vercel a variável:
   - `NEXT_PUBLIC_PASSENGER_APP_APK_URL` = esse link

2. **Opção B — Hospedar no nosso site**  
   Baixe o .apk pelo link do EAS, renomeie para `mai-drive-passenger.apk`, coloque nesta pasta (`public/downloads/`), faça commit e deploy.  
   A URL será: `https://seu-dominio.com/downloads/mai-drive-passenger.apk`  
   Configure no Vercel: `NEXT_PUBLIC_PASSENGER_APP_APK_URL` = essa URL.

Depois disso, a página **/baixar** do site mostrará o botão "Baixar para Android (APK)" apontando para o app.
