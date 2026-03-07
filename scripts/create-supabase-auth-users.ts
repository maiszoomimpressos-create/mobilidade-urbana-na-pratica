/**
 * Script ONE-TIME: cria os usuários no Supabase Auth para poderem fazer login.
 * Rode com: npx tsx scripts/create-supabase-auth-users.ts
 * Requer no .env: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 *
 * Após rodar, você pode apagar ou comentar os dados abaixo por segurança.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Carregar .env da raiz do projeto
const envPath = resolve(process.cwd(), '.env')
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8')
  content.split('\n').forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const USERS_TO_CREATE = [
  { email: 'maiszoomimpressos@gmail.com', password: '123456' },
  { email: 'maiszoomimpressos1@gmail.com', password: '123456' },
]

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  for (const { email, password } of USERS_TO_CREATE) {
    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) {
      if (error.message.includes('already been registered')) {
        console.log(`✓ ${email} já existe no Supabase Auth.`)
      } else {
        console.error(`✗ ${email}:`, error.message)
      }
    } else {
      console.log(`✓ ${email} criado no Supabase Auth.`)
    }
  }

  console.log('\nConcluído. Esses usuários já podem fazer login no app.')
}

main()
