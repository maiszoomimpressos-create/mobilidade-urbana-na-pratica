'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { PartnerApprovedGate } from '@/components/partner/PartnerApprovedGate'
import PartnerCentralActions from '@/components/partner/PartnerCentralActions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, ArrowRight } from 'lucide-react'
import { partnerMeFetchInit } from '@/lib/partner-me-client'

type CityRow = { id: string; name: string; state: string }

export default function PainelMapasPage() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [tenantName, setTenantName] = useState('')
  const [cities, setCities] = useState<CityRow[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const meRes = await fetch('/api/partner/me', await partnerMeFetchInit())
      const me = await meRes.json().catch(() => ({}))
      const t = me?.tenant
      if (!t?.id) {
        setTenantId(null)
        setTenantName('')
        setCities([])
        return
      }
      setTenantId(t.id)
      setTenantName(typeof t.name === 'string' ? t.name : 'Central')

      const cRes = await fetch(
        `/api/partner/cities?tenantId=${encodeURIComponent(t.id)}`,
        await partnerMeFetchInit()
      )
      const cJson = await cRes.json().catch(() => ({}))
      const list = Array.isArray(cJson?.cities) ? (cJson.cities as CityRow[]) : []
      setCities(list.filter((c) => c?.id && c?.name && c?.state))
    } catch {
      setTenantId(null)
      setCities([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return (
    <PartnerApprovedGate>
      <div className="max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mapas & cobertura</h1>
          <p className="text-muted-foreground mt-1">
            Cidades atendidas pela central (mapa e políticas). Adicione cidades aqui ou em{' '}
            <Link href="/painel" className="text-primary underline-offset-4 hover:underline">
              Visão geral
            </Link>{' '}
            → <strong>Editar central</strong>.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : !tenantId ? (
          <Card>
            <CardHeader>
              <CardTitle>Nenhuma central ativa</CardTitle>
              <CardDescription>Cadastre ou aguarde aprovação da central.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/parceiro">
                  Cadastrar central
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Gerenciar cidades da central
                </CardTitle>
                <CardDescription>
                  Cada cidade precisa existir na base do sistema (cadastrada pelo admin). Use nome + UF.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PartnerCentralActions
                  tenantId={tenantId}
                  tenantName={tenantName}
                  onCitiesChanged={reload}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cidades vinculadas</CardTitle>
                <CardDescription>
                  Estas cidades aparecem na visão geral e no app quando a central estiver aprovada.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma cidade ainda. Adicione acima (nome + UF).
                  </p>
                ) : (
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {cities.map((c) => (
                      <li key={c.id}>
                        {c.name} — {c.state}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PartnerApprovedGate>
  )
}
