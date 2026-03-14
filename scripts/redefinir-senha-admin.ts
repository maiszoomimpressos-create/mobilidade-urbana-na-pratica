/**
 * Redefine a senha de um usuário no Supabase Auth (via admin/service role).
 * Use quando não lembrar a senha e o "Esqueci a senha" não funcionar.
 *
 * Uso:
 *   npx tsx scripts/redefinir-senha-admin.ts "email@exemplo.com" "NovaSenha123"
 *
 * Requer no .env: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 *
 * A chave service_role está em: Supabase Dashboard → Settings → API → service_role (secret)
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

async function main() {
  const email = process.argv[2]?.trim()
  const newPassword = process.argv[3]

  if (!email || !newPassword) {
    console.error('Uso: npx tsx scripts/redefinir-senha-admin.ts "email@exemplo.com" "NovaSenha123"')
    process.exit(1)
  }

  if (newPassword.length < 6) {
    console.error('A senha deve ter no mínimo 6 caracteres.')
    process.exit(1)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env')
    console.error('A chave service_role está em: Supabase Dashboard → Settings → API → service_role (secret)')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  console.log('Buscando usuário por email...')
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (listError) {
    console.error('Erro ao listar usuários:', listError.message)
    process.exit(1)
  }

  const user = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) {
    console.error('Nenhum usuário encontrado com o email:', email)
    process.exit(1)
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword })
  if (updateError) {
    console.error('Erro ao atualizar senha:', updateError.message)
    process.exit(1)
  }

  console.log('Senha alterada com sucesso para:', email)
  console.log('Faça login em http://localhost:3000/login com a nova senha.')
}

main()
