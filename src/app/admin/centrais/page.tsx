'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Building2, MapPin, Plus, Settings } from 'lucide-react'

interface Tenant {
  id: string
  name: string
  slug: string
  logo: string | null
  isActive: boolean
  showPassengerAds: boolean
  linkedCity?: {
    id: string
    name: string
    state: string
  } | null
  _count?: {
    drivers: number
    passengers: number
  }
}

export default function CentraisPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTenants()
  }, [])

  async function loadTenants() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/centrais')
      if (!res.ok) {
        if (res.status === 403) {
          setError('Você não tem permissão para acessar esta página.')
          return
        }
        throw new Error('Erro ao carregar centrais')
      }
      const data = await res.json()
      const list = Array.isArray(data) ? data : (Array.isArray(data?.tenants) ? data.tenants : [])
      setTenants(list)
    } catch (err) {
      console.error(err)
      setError('Erro ao carregar centrais')
    } finally {
      setLoading(false)
    }
  }

  const states = useMemo(() => {
    const set = new Set<string>()
    for (const t of tenants) {
      if (t.linkedCity?.state) set.add(t.linkedCity.state)
    }
    return Array.from(set).sort()
  }, [tenants])

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.slug.toLowerCase().includes(search.toLowerCase()) ||
        t.linkedCity?.name.toLowerCase().includes(search.toLowerCase())

      const matchesState = !stateFilter || t.linkedCity?.state === stateFilter

      return matchesSearch && matchesState
    })
  }, [tenants, search, stateFilter])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Centrais</h1>
          <p className="text-muted-foreground">
            Gerencie as centrais cadastradas no sistema
          </p>
        </div>
        <Button onClick={() => router.push('/admin/parceiros')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Central
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, slug ou cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {states.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={stateFilter === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStateFilter(null)}
              >
                Todos
              </Button>
              {states.map((state) => (
                <Button
                  key={state}
                  variant={stateFilter === state ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStateFilter(state)}
                >
                  {state}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTenants.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                {search || stateFilter
                  ? 'Nenhuma central encontrada com os filtros aplicados.'
                  : 'Nenhuma central cadastrada.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTenants.map((tenant) => (
            <Card
              key={tenant.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => router.push(`/admin/centrais/${tenant.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{tenant.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {tenant.slug}
                    </CardDescription>
                  </div>
                  <Badge variant={tenant.isActive ? 'default' : 'secondary'}>
                    {tenant.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {tenant.linkedCity && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {tenant.linkedCity.name} — {tenant.linkedCity.state}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm">
                  {tenant._count && (
                    <>
                      <span className="text-muted-foreground">
                        {tenant._count.drivers} motoristas
                      </span>
                      <span className="text-muted-foreground">
                        {tenant._count.passengers} passageiros
                      </span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {tenant.showPassengerAds && (
                    <Badge variant="outline" className="text-xs">
                      Publicidade
                    </Badge>
                  )}
                </div>

                <Button variant="ghost" size="sm" className="w-full mt-2">
                  <Settings className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        {filteredTenants.length} de {tenants.length} centrais
      </div>
    </div>
  )
}
