'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { ArrowRight, Building2, CheckCircle, Clock, LogIn } from 'lucide-react'
import MapPreview from '@/components/admin/MapPreview'

type Step = 'loading' | 'auth' | 'register' | 'form' | 'success' | 'already'
type CityOption = { id: string; name: string; state: string; latitude: number; longitude: number }

export default function ParceiroPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planSlug = searchParams.get('plano') || ''

  const [step, setStep] = useState<Step>('loading')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [centralName, setCentralName] = useState('')
  const [cityId, setCityId] = useState('')
  const [citySearch, setCitySearch] = useState('')
  const [cityOptions, setCityOptions] = useState<CityOption[]>([])
  const [cityName, setCityName] = useState('')
  const [cityState, setCityState] = useState('')
  const [cep, setCep] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [existingTenant, setExistingTenant] = useState<{ name: string; slug: string; approvalStatus: string } | null>(null)
  const [cityPreview, setCityPreview] = useState<{ id: string; name: string; state: string; latitude: number; longitude: number } | null>(null)
  const [successMessage, setSuccessMessage] = useState<string>('')

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Se o usuário já tem uma central cadastrada, evita mostrar novamente o formulário.
        try {
          const res = await fetch('/api/partner/me', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
          if (res.ok) {
            const json = await res.json()
            if (json?.tenant) {
              setExistingTenant({
                name: json.tenant.name,
                slug: json.tenant.slug,
                approvalStatus: json.tenant.approvalStatus,
              })
              router.replace('/painel')
              return
            }
          }
        } catch {
          // Mantém fluxo padrão caso falhe o check.
        }

        setStep('form')
      } else {
        setStep('auth')
      }
    }
    checkSession()
  }, [router])

  useEffect(() => {
    const loadCities = async () => {
      try {
        const q = citySearch.trim()
        const res = await fetch(`/api/partner/cities/options${q ? `?q=${encodeURIComponent(q)}` : ''}`)
        if (!res.ok) return
        const data = await res.json()
        setCityOptions(Array.isArray(data?.cities) ? data.cities : [])
      } catch {
        // evita quebrar a página em caso de erro transitório.
      }
    }

    const timer = setTimeout(loadCities, 300)
    return () => clearTimeout(timer)
  }, [citySearch])

  useEffect(() => {
    if (!cityId) {
      setCityPreview(null)
      return
    }
    const selected = cityOptions.find((city) => city.id === cityId) ?? null
    if (!selected) return
    setCityName(selected.name)
    setCityState(selected.state)
    setCityPreview(selected)
  }, [cityId, cityOptions])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signInError) {
        setError('Email ou senha inválidos')
        return
      }
      setStep('form')
    } catch {
      setError('Erro ao fazer login.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !email.trim() || !password) {
      setError('Preencha todos os campos.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim(), user_type: 'partner' },
        },
      })
      if (signUpError) {
        if (signUpError.message?.toLowerCase().includes('already registered')) {
          setError('Este email já está cadastrado. Faça login.')
          return
        }
        setError(signUpError.message || 'Erro ao criar conta.')
        return
      }
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (loginError) {
        setError('Conta criada! Verifique seu e-mail e depois faça login.')
        return
      }
      setStep('form')
    } catch {
      setError('Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCentral = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!centralName.trim()) {
      setError('Informe o nome da sua central.')
      return
    }
    if (!cityId) {
      setError('Selecione a cidade de atuação.')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setStep('auth')
        return
      }

      const res = await fetch('/api/partner/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          centralName: centralName.trim(),
          cityId,
          cityName: cityName.trim(),
          cityState: cityState.trim(),
          cep: cep.trim(),
          planSlug,
          /** Fluxo site + planos = central da Nossa Bandeira Mai Drive (não white-label). */
          tenantType: 'brand',
        }),
      })

      const data = await res.json()

      if (res.status === 409 && data.tenant) {
        setExistingTenant(data.tenant)
        setStep('already')
        return
      }

      if (!res.ok) {
        setError(data.detail || data.error || 'Erro ao cadastrar central.')
        return
      }

      setSuccessMessage(data.message || '')
      // Após cadastrar a central com sucesso, levar direto para o painel da central
      router.replace('/painel')
      return
    } catch {
      setError('Erro ao cadastrar central.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-16">
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto">

            {planSlug && (
              <div className="text-center mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Plano selecionado: {planSlug.replace(/-/g, ' ')}
                </span>
              </div>
            )}

            {step === 'loading' && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Carregando...</p>
                </CardContent>
              </Card>
            )}

            {(step === 'auth' || step === 'register') && (
              <Card>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-mobility-gradient flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl">
                    {step === 'auth' ? 'Entre na sua conta' : 'Crie sua conta'}
                  </CardTitle>
                  <CardDescription>
                    {step === 'auth'
                      ? 'Faça login para cadastrar sua central parceira.'
                      : 'Crie uma conta para começar.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={step === 'auth' ? handleLogin : handleRegister} className="space-y-4">
                    {error && (
                      <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
                    )}

                    {step === 'register' && (
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome completo</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Seu nome"
                          required
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      <LogIn className="w-4 h-4" />
                      {loading
                        ? 'Aguarde...'
                        : step === 'auth' ? 'Entrar' : 'Criar conta'}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      {step === 'auth' ? (
                        <>
                          Não tem conta?{' '}
                          <button type="button" onClick={() => { setStep('register'); setError('') }} className="text-primary font-medium hover:underline">
                            Criar conta
                          </button>
                        </>
                      ) : (
                        <>
                          Já tem conta?{' '}
                          <button type="button" onClick={() => { setStep('auth'); setError('') }} className="text-primary font-medium hover:underline">
                            Fazer login
                          </button>
                        </>
                      )}
                    </p>
                  </form>
                </CardContent>
              </Card>
            )}

            {step === 'form' && (
              <Card>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-mobility-gradient flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl">Cadastre sua Central</CardTitle>
                  <CardDescription>
                    Preencha os dados para criar sua central parceira Mai Drive.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCentral} className="space-y-4">
                    {error && (
                      <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="centralName">Nome da central</Label>
                      <Input
                        id="centralName"
                        value={centralName}
                        onChange={(e) => setCentralName(e.target.value)}
                        placeholder="Ex.: TransPorto, MotoRide São Paulo"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Este será o nome da sua operação na plataforma.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="citySearch">Buscar cidade</Label>
                      <Input
                        id="citySearch"
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                        placeholder="Digite nome da cidade ou UF"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cityId">Cidade de atuação</Label>
                      <select
                        id="cityId"
                        value={cityId}
                        onChange={(e) => setCityId(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Selecione uma cidade</option>
                        {cityOptions.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name} - {city.state}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        A central será vinculada por ID da cidade para evitar ambiguidades.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cityName">Cidade selecionada</Label>
                      <Input
                        id="cityName"
                        value={cityName}
                        readOnly
                        placeholder="Selecione uma cidade acima"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cityState">Estado (UF)</Label>
                      <Input
                        id="cityState"
                        value={cityState}
                        readOnly
                        placeholder="UF da cidade selecionada"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP (opcional)</Label>
                      <Input
                        id="cep"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        placeholder="Ex.: 01001-000"
                      />
                      <p className="text-xs text-muted-foreground">
                        Usaremos apenas para ajudar na validação/preview quando aplicável.
                      </p>
                    </div>

                    <div className="pt-2">
                      {cityPreview ? (
                        <MapPreview
                          lat={cityPreview.latitude}
                          lng={cityPreview.longitude}
                          name={`${cityPreview.name}, ${cityPreview.state}`}
                          height={220}
                          zoom={12}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {cityName.trim() && cityState.trim()
                            ? 'Cidade sem coordenadas válidas para prévia.'
                            : 'Selecione a cidade para ver a prévia no mapa.'}
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Cadastrando...' : 'Cadastrar central'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {step === 'success' && (
              <Card>
                <CardContent className="py-12 text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <Clock className="w-10 h-10 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Central cadastrada!
                    </h2>
                    <p className="text-muted-foreground">
                      {successMessage || (
                        <>
                          Sua central foi cadastrada e está <strong>aguardando aprovação</strong>.
                          Você receberá uma notificação quando for aprovada.
                        </>
                      )}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Button asChild className="w-full">
                      <Link href="/painel">
                        Ir para o painel da central
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/">Voltar ao site</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 'already' && existingTenant && (
              <Card>
                <CardContent className="py-12 text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
                    <Building2 className="w-10 h-10 text-yellow-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Você já tem uma central
                    </h2>
                    <p className="text-muted-foreground">
                      Sua central <strong>{existingTenant.name}</strong> está com status:{' '}
                      <span className={
                        existingTenant.approvalStatus === 'approved' ? 'text-green-600 font-medium' :
                        existingTenant.approvalStatus === 'pending' ? 'text-yellow-600 font-medium' :
                        'text-red-600 font-medium'
                      }>
                        {existingTenant.approvalStatus === 'approved' && 'Aprovada'}
                        {existingTenant.approvalStatus === 'pending' && 'Aguardando aprovação'}
                        {existingTenant.approvalStatus === 'rejected' && 'Rejeitada'}
                      </span>
                    </p>
                  </div>
                  <Button asChild className="w-full">
                    <Link href="/painel">
                      Ir para o painel
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
