'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPhoneBrInput, digitsOnly, isValidBrazilPhoneDigits } from '@/lib/phone-br'
import {
  PassengerAddressFields,
  type TenantResolvePayload,
} from '@/components/register/PassengerAddressFields'

type GeocodeHit = { label: string; latitude: number; longitude: number }

async function syncPassengerRegistration(accessToken: string, body: Record<string, unknown>) {
  await fetch('/api/auth/sync-passenger-registration', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

/**
 * Cadastro web: por padrão grava user_type passenger (alinhado a users.accountKind).
 * Link da central para motorista: /register?intent=driver
 */
function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const intent = searchParams.get('intent')?.toLowerCase() ?? ''
  const isDriverIntent = intent === 'driver'
  const signupUserType = isDriverIntent ? 'driver' : 'passenger'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [addressInput, setAddressInput] = useState('')
  const [selectedPlace, setSelectedPlace] = useState<GeocodeHit | null>(null)
  const [tenantResolve, setTenantResolve] = useState<TenantResolvePayload | null>(null)
  const [tenantSlug, setTenantSlug] = useState('')

  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

    if (!isValidBrazilPhoneDigits(phone)) {
      setError('Informe um telefone com DDD (10 ou 11 dígitos).')
      return
    }

    if (!isDriverIntent) {
      if (!selectedPlace) {
        setError('Selecione um endereço na lista de sugestões.')
        return
      }
      if (!tenantSlug.trim()) {
        setError('Selecione ou confirme a central de atendimento.')
        return
      }
    }

    setIsLoading(true)

    try {
      let supabase
      try {
        supabase = createClient()
      } catch {
        setError(
          'Configuração do Supabase ausente. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY na Vercel.'
        )
        return
      }

      const phoneDigits = digitsOnly(phone)

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim() || undefined,
            user_type: signupUserType,
            phone: phoneDigits,
            ...(isDriverIntent
              ? {}
              : selectedPlace && {
                  home_address: selectedPlace.label,
                  home_lat: selectedPlace.latitude,
                  home_lng: selectedPlace.longitude,
                  preferred_tenant_slug: tenantSlug.trim(),
                }),
          },
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Este email já está cadastrado. Faça login.')
        } else {
          setError(signUpError.message)
        }
        return
      }

      if (data.session?.access_token && !isDriverIntent && selectedPlace) {
        await syncPassengerRegistration(data.session.access_token, {
          phone: phoneDigits,
          homeAddress: selectedPlace.label,
          homeLatitude: selectedPlace.latitude,
          homeLongitude: selectedPlace.longitude,
          tenantSlug: tenantSlug.trim(),
        })
      } else if (data.session?.access_token && isDriverIntent) {
        await syncPassengerRegistration(data.session.access_token, { phone: phoneDigits })
      }

      if (data.user && !data.session) {
        setError(
          'Conta criada. Verifique seu email para confirmar (se habilitado) e faça login. Telefone, endereço e central serão aplicados ao entrar.'
        )
        setTimeout(() => router.push('/login'), 2800)
        return
      }

      if (data.session) {
        await new Promise((r) => setTimeout(r, 300))
        router.push('/')
        router.refresh()
        return
      }

      router.push('/login')
    } catch {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Criar nova conta
          </h2>
          {isDriverIntent ? (
            <p className="mt-2 text-center text-sm text-amber-800 bg-amber-50 rounded-md py-2 px-3">
              Cadastro como <strong>motorista</strong> (use o app motorista após confirmar a conta, se
              aplicável).
            </p>
          ) : (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Conta para uso como <strong>passageiro</strong> (padrão). Para motorista pelo site, use o
              link com <code className="text-xs bg-muted px-1 rounded">?intent=driver</code> ou o app
              motorista.
            </p>
          )}
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/80"
            >
              faça login na sua conta
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <Label htmlFor="phone">Celular (com DDD)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel-national"
                required
                value={phone}
                onChange={(e) => setPhone(formatPhoneBrInput(e.target.value))}
                className="mt-1"
                placeholder="(11) 98765-4321"
                maxLength={16}
              />
            </div>
            {!isDriverIntent && (
              <PassengerAddressFields
                addressInput={addressInput}
                setAddressInput={setAddressInput}
                selectedPlace={selectedPlace}
                setSelectedPlace={setSelectedPlace}
                tenantResolve={tenantResolve}
                setTenantResolve={setTenantResolve}
                tenantSlug={tenantSlug}
                setTenantSlug={setTenantSlug}
              />
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
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                placeholder="••••••••"
                minLength={6}
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Carregando…
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  )
}
