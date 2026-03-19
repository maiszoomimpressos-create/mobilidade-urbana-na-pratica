#!/usr/bin/env node

/**
 * Script de build white-label para um tenant específico.
 *
 * Uso:
 *   node scripts/build-whitelabel.js --tenant=slug-da-central
 *   node scripts/build-whitelabel.js --tenant=slug-da-central --app=passenger
 *   node scripts/build-whitelabel.js --tenant=slug-da-central --app=driver
 *
 * O que faz:
 * 1. Busca as configurações white-label do tenant na API
 * 2. Gera um app.json temporário com nome, package, ícone do parceiro
 * 3. Dispara o build via EAS
 * 4. Atualiza o banco com o link do APK quando o build terminar
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const API_URL = process.env.API_URL || 'http://localhost:3000'

const args = process.argv.slice(2)
const tenantSlug = args.find(a => a.startsWith('--tenant='))?.split('=')[1]
const appType = args.find(a => a.startsWith('--app='))?.split('=')[1] || 'both'

if (!tenantSlug) {
  console.error('Uso: node scripts/build-whitelabel.js --tenant=slug-da-central [--app=passenger|driver|both]')
  process.exit(1)
}

async function main() {
  console.log(`\n🔧 Build white-label para: ${tenantSlug}`)
  console.log(`   Apps: ${appType}\n`)

  const apps = appType === 'both'
    ? ['passenger', 'driver']
    : [appType]

  for (const app of apps) {
    console.log(`\n📱 Gerando build: ${app}`)

    const appDir = path.resolve(__dirname, '..', 'apps', app)
    const appJsonPath = path.join(appDir, 'app.json')
    const appJsonBackup = path.join(appDir, 'app.json.backup')

    if (!fs.existsSync(appJsonPath)) {
      console.error(`   ❌ app.json não encontrado em ${appDir}`)
      continue
    }

    const originalAppJson = fs.readFileSync(appJsonPath, 'utf-8')
    fs.writeFileSync(appJsonBackup, originalAppJson)

    try {
      const appJson = JSON.parse(originalAppJson)

      // Configuração white-label (ajustar conforme dados do tenant)
      // Por enquanto usa os argumentos. Futuramente buscar da API.
      const wlName = process.env.WL_APP_NAME || tenantSlug
      const wlPackage = process.env.WL_APP_PACKAGE || `com.${tenantSlug.replace(/-/g, '')}.${app}`

      appJson.expo.name = wlName
      appJson.expo.slug = `${tenantSlug}-${app}`
      appJson.expo.android.package = wlPackage

      if (appJson.expo.ios) {
        appJson.expo.ios.bundleIdentifier = wlPackage
      }

      fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2))
      console.log(`   ✅ app.json atualizado: ${wlName} (${wlPackage})`)

      console.log(`   🚀 Iniciando EAS build...`)
      const result = execSync(
        'npx eas-cli build --platform android --profile preview --no-wait --json',
        { cwd: appDir, encoding: 'utf-8', timeout: 120000 }
      )

      const buildInfo = JSON.parse(result)
      const buildId = buildInfo?.[0]?.id || buildInfo?.id
      console.log(`   ✅ Build enviado! ID: ${buildId}`)
      console.log(`   📋 Acompanhe em: https://expo.dev/accounts/maiszoom/projects/${tenantSlug}-${app}/builds/${buildId}`)
    } catch (err) {
      console.error(`   ❌ Erro no build:`, err.message || err)
    } finally {
      fs.writeFileSync(appJsonPath, originalAppJson)
      if (fs.existsSync(appJsonBackup)) fs.unlinkSync(appJsonBackup)
      console.log(`   🔄 app.json restaurado`)
    }
  }

  console.log('\n✅ Processo finalizado!\n')
  console.log('Após os builds terminarem, atualize os links de APK na central via admin.')
}

main().catch(console.error)
