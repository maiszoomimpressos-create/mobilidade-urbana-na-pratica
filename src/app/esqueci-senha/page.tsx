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
    } catch {
      setError('Erro ao enviar. Tente novamente.')
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
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">
              Se existir uma conta com este email, você receberá um link para redefinir a senha em
              alguns minutos. Verifique também a pasta de spam.
            </p>
            <p className="mt-2 text-sm text-green-700">
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
