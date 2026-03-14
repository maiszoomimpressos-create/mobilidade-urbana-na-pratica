'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function EsqueciSenhaPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [linkExpired, setLinkExpired] = useState(false)

  useEffect(() => {
    if (searchParams.get('expired') === '1') setLinkExpired(true)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/redefinir-senha`,
      })

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSuccess(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.'
      setError(msg)
      // "Failed to fetch" = navegador não conseguiu falar com o Supabase (URL errada, projeto pausado ou rede)
      if (typeof msg === 'string' && (msg.includes('fetch') || msg.includes('network'))) {
        setError(
          `${msg}. Verifique no .env: NEXT_PUBLIC_SUPABASE_URL. No Supabase Dashboard confira se o projeto não está pausado. Alternativa: use o script "npx tsx scripts/redefinir-senha-admin.ts seu@email.com NovaSenha123"`
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Recuperar senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Informe seu email e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        {linkExpired && (
          <div className="rounded-md bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              O link de redefinição expirou ou já foi usado. Solicite um novo link abaixo.
            </p>
          </div>
        )}

        {success ? (
          <div className="rounded-md bg-green-50 p-4 space-y-2">
            <p className="text-sm font-medium text-green-800">
              Enviamos um link para redefinir a senha para:
            </p>
            <p className="text-sm text-green-800 font-mono bg-green-100/50 px-2 py-1 rounded break-all">
              {email.trim()}
            </p>
            <p className="text-sm text-green-700 pt-1">
              Verifique a caixa de entrada e a pasta de spam. O link expira em 1 hora. Abra o link na mesma aba (não copie a URL).
            </p>
            <p className="text-sm text-amber-800 bg-amber-50/80 p-2 rounded mt-2">
              Se aparecer &quot;Link inválido&quot; ou &quot;pedir outro link&quot;, use no terminal: <code className="text-xs bg-amber-100 px-1 rounded">npx tsx scripts/redefinir-senha-admin.ts &quot;{email.trim()}&quot; &quot;SuaNovaSenha123&quot;</code>
            </p>
            <p className="mt-3 text-sm text-green-700">
              <Link href="/login" className="font-medium underline hover:no-underline">
                Voltar para o login
              </Link>
            </p>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                placeholder="seu@email.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Enviar link'}
              </Button>
              <p className="text-center text-sm text-gray-600">
                <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                  Voltar para o login
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
