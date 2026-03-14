'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Supabase pode redirecionar com:
 * - Hash: #access_token=...&refresh_token=...&type=recovery
 * - Query: ?code=... (fluxo PKCE)
 */
function RedefinirSenhaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ready, setReady] = useState(false)
  const [hashError, setHashError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    const code = searchParams.get('code')

    const supabase = createClient()

    if (hash) {
      const params = new URLSearchParams(hash.replace(/^#/, ''))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')

      if (type !== 'recovery' || !accessToken || !refreshToken) {
        setHashError('Link inválido ou expirado. Solicite um novo link de redefinição.')
        setReady(true)
        return
      }

      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(() => {
          setReady(true)
          window.history.replaceState(null, '', window.location.pathname)
        })
        .catch(() => {
          setHashError('Não foi possível validar o link. Solicite um novo.')
          setReady(true)
        })
      return
    }

    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(() => {
          setReady(true)
          window.history.replaceState(null, '', window.location.pathname)
        })
        .catch((err) => {
          console.error('[redefinir-senha] exchangeCodeForSession:', err)
          setHashError('Link inválido ou expirado. Solicite um novo link de redefinição.')
          setReady(true)
        })
      return
    }

    setHashError('Link inválido ou expirado. Solicite um novo link de redefinição.')
    setReady(true)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError(
          'Sessão de recuperação expirou ou o link já foi usado. Solicite um novo link em "Esqueci a senha" ou use o script: npx tsx scripts/redefinir-senha-admin.ts seu@email.com NovaSenha123'
        )
        setIsLoading(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        const msg = updateError.message
        if (msg.includes('session') || msg.includes('missing')) {
          setError(
            'Sessão expirou ou o link já foi usado. Solicite um novo em "Esqueci a senha" ou use: npx tsx scripts/redefinir-senha-admin.ts seu@email.com NovaSenha123'
          )
        } else {
          setError(msg)
        }
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch {
      setError('Erro ao redefinir senha. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Validando link...</p>
      </div>
    )
  }

  if (hashError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-6">
          <h2 className="text-center text-2xl font-bold text-gray-900">Link inválido</h2>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{hashError}</p>
          </div>
          <p className="text-center text-sm space-y-2">
            <Link href="/esqueci-senha" className="font-medium text-primary hover:underline block">
              Solicitar novo link
            </Link>
            <span className="block text-muted-foreground text-xs mt-2">
              Ou use no terminal: npx tsx scripts/redefinir-senha-admin.ts seu@email.com NovaSenha123
            </span>
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">Senha alterada com sucesso. Redirecionando para o login...</p>
          </div>
          <p className="text-center text-sm">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Ir para o login
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Nova senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Digite e confirme sua nova senha.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 space-y-3">
              <p className="text-sm text-red-800">{error}</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/esqueci-senha" className="text-sm font-medium text-primary hover:underline">
                  Solicitar novo link
                </Link>
                <span className="text-red-700/70">|</span>
                <Link href="/login" className="text-sm font-medium text-primary hover:underline">
                  Voltar ao login
                </Link>
              </div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Redefinir senha'}
            </Button>
            <p className="text-center text-sm text-gray-600">
              <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                Voltar para o login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <p className="text-gray-600">Carregando...</p>
        </div>
      }
    >
      <RedefinirSenhaForm />
    </Suspense>
  )
}
