'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { PartnerApprovedGate } from '@/components/partner/PartnerApprovedGate'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, CarFront, Loader2, Pencil, Plus, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

type RideTypeRow = {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  basePrice: string
  pricePerKm: string
  pricePerMin: string
  isActive: boolean
  cityLabel: string
}

type PartnerCity = { id: string; name: string; state: string }

type DialogMode = 'closed' | 'edit' | 'create'

async function fetchRideTypesList(): Promise<{ ok: boolean; error?: string; rideTypes: RideTypeRow[] }> {
  const res = await fetch('/api/partner/ride-types', {
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    return {
      ok: false,
      error: typeof json?.error === 'string' ? json.error : 'Não foi possível carregar os tipos.',
      rideTypes: [],
    }
  }
  const raw = Array.isArray(json?.rideTypes) ? json.rideTypes : []
  const rideTypes: RideTypeRow[] = raw.map((item: unknown) => {
    const r = item as Record<string, unknown>
    return {
      id: String(r.id ?? ''),
      name: String(r.name ?? ''),
      slug: String(r.slug ?? ''),
      description: r.description == null ? null : String(r.description),
      imageUrl:
        typeof r.imageUrl === 'string' && r.imageUrl.trim() !== '' ? r.imageUrl.trim() : null,
      basePrice: String(r.basePrice ?? ''),
      pricePerKm: String(r.pricePerKm ?? ''),
      pricePerMin: String(r.pricePerMin ?? ''),
      isActive: Boolean(r.isActive),
      cityLabel: String(r.cityLabel ?? ''),
    }
  })
  return { ok: true, rideTypes }
}

export default function PainelTiposCorridaPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rideTypes, setRideTypes] = useState<RideTypeRow[]>([])
  const [dialogMode, setDialogMode] = useState<DialogMode>('closed')
  const [editing, setEditing] = useState<RideTypeRow | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formBase, setFormBase] = useState('')
  const [formKm, setFormKm] = useState('')
  const [formMin, setFormMin] = useState('')
  const [formActive, setFormActive] = useState(true)
  const [formCityChoice, setFormCityChoice] = useState<string>('__all__')
  const [partnerCities, setPartnerCities] = useState<PartnerCity[]>([])
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [formImageUrl, setFormImageUrl] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const imageFileRef = useRef<HTMLInputElement | null>(null)
  const [listNotice, setListNotice] = useState<string | null>(null)

  const loadList = useCallback(async () => {
    const result = await fetchRideTypesList()
    if (!result.ok) {
      setError(result.error ?? null)
      setRideTypes([])
      return
    }
    setError(null)
    setRideTypes(result.rideTypes)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await loadList()
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [loadList])

  useEffect(() => {
    if (dialogMode === 'edit' && editing) {
      setFormName(editing.name)
      setFormDescription(editing.description ?? '')
      setFormBase(editing.basePrice)
      setFormKm(editing.pricePerKm)
      setFormMin(editing.pricePerMin)
      setFormActive(editing.isActive)
      setFormImageUrl(editing.imageUrl ?? '')
      setSaveError(null)
    }
  }, [dialogMode, editing])

  useEffect(() => {
    if (dialogMode !== 'create') return
    let cancelled = false
    setCitiesLoading(true)
    ;(async () => {
      try {
        const res = await fetch('/api/partner/cities', { credentials: 'include', cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        const raw = Array.isArray(json?.cities) ? json.cities : []
        const cities: PartnerCity[] = raw
          .filter((c: unknown) => c && typeof c === 'object' && 'id' in c && 'name' in c && 'state' in c)
          .map((c: { id: string; name: string; state: string }) => ({
            id: c.id,
            name: c.name,
            state: c.state,
          }))
        if (cancelled) return
        setPartnerCities(cities)
        if (cities.length === 1) {
          setFormCityChoice(cities[0].id)
        } else {
          setFormCityChoice('__all__')
        }
      } catch {
        if (!cancelled) {
          setPartnerCities([])
          setFormCityChoice('__all__')
        }
      } finally {
        if (!cancelled) setCitiesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dialogMode])

  function closeDialog() {
    setDialogMode('closed')
    setEditing(null)
  }

  function openEdit(rt: RideTypeRow) {
    setDialogMode('edit')
    setEditing(rt)
  }

  function openCreate() {
    setDialogMode('create')
    setEditing(null)
    setFormName('')
    setFormDescription('')
    setFormBase('5')
    setFormKm('2.5')
    setFormMin('0.45')
    setFormActive(true)
    setFormCityChoice('__all__')
    setFormImageUrl('')
    setSaveError(null)
  }

  async function uploadRideTypeImage(file: File) {
    setImageUploading(true)
    setSaveError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/partner/ride-types/image-upload', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSaveError(typeof json?.error === 'string' ? json.error : 'Falha no upload da imagem.')
        return
      }
      if (typeof json.url === 'string') {
        setFormImageUrl(json.url)
      }
    } catch {
      setSaveError('Erro de rede no upload.')
    } finally {
      setImageUploading(false)
    }
  }

  async function handleSubmit() {
    if (dialogMode === 'edit') {
      if (!editing) return
      setSaving(true)
      setSaveError(null)
      try {
        const res = await fetch(`/api/partner/ride-types/${editing.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName.trim(),
            description: formDescription.trim() === '' ? null : formDescription.trim(),
            imageUrl: formImageUrl.trim() === '' ? null : formImageUrl.trim(),
            basePrice: formBase,
            pricePerKm: formKm,
            pricePerMin: formMin,
            isActive: formActive,
          }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          setSaveError(typeof json?.error === 'string' ? json.error : 'Não foi possível salvar.')
          return
        }
        await loadList()
        setListNotice(
          json?.imagePersistFailed === true
            ? 'Preços e texto foram salvos, mas a imagem não pôde ser gravada no banco. Confira se a coluna imageUrl existe (prisma db push ou SQL no Supabase).'
            : 'Salvo com sucesso.'
        )
        closeDialog()
      } catch {
        setSaveError('Erro de rede ao salvar.')
      } finally {
        setSaving(false)
      }
      return
    }

    if (dialogMode === 'create') {
      if (!formName.trim()) {
        setSaveError('Informe o nome da corrida.')
        return
      }
      if (partnerCities.length >= 2 && !formCityChoice) {
        setSaveError('Selecione a cidade.')
        return
      }
      setSaving(true)
      setSaveError(null)
      try {
        const payload: Record<string, unknown> = {
          name: formName.trim(),
          description: formDescription.trim() === '' ? null : formDescription.trim(),
          basePrice: formBase,
          pricePerKm: formKm,
          pricePerMin: formMin,
          isActive: formActive,
        }
        if (formImageUrl.trim() !== '') {
          payload.imageUrl = formImageUrl.trim()
        }
        if (partnerCities.length >= 2) {
          payload.cityId = formCityChoice === '__all__' ? null : formCityChoice
        } else if (partnerCities.length === 1) {
          payload.cityId = partnerCities[0].id
        } else {
          payload.cityId = null
        }

        const res = await fetch('/api/partner/ride-types', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          setSaveError(typeof json?.error === 'string' ? json.error : 'Não foi possível criar.')
          return
        }
        await loadList()
        setListNotice(
          json?.imagePersistFailed === true
            ? 'Tipo criado, mas a imagem não pôde ser gravada no banco. Confira a coluna imageUrl (prisma db push ou SQL no Supabase).'
            : 'Tipo criado com sucesso.'
        )
        closeDialog()
      } catch {
        setSaveError('Erro de rede ao criar.')
      } finally {
        setSaving(false)
      }
    }
  }

  const dialogOpen = dialogMode !== 'closed'
  const isCreate = dialogMode === 'create'

  return (
    <PartnerApprovedGate>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CarFront className="h-7 w-7 text-primary" />
              Tipos de corrida
            </h1>
            <p className="text-muted-foreground mt-1">
              Modalidades, valores e regras por cidade da sua central.
            </p>
            {listNotice ? (
              <p
                className={cn(
                  'mt-3 text-sm rounded-md px-3 py-2 border',
                  listNotice.includes('não pôde')
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-100'
                    : 'bg-green-500/10 border-green-500/30 text-green-900 dark:text-green-100'
                )}
                role="status"
              >
                {listNotice}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button type="button" onClick={openCreate} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Nova corrida
            </Button>
            <Button variant="outline" asChild>
              <Link href="/painel">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar à visão geral
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            Carregando…
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6 text-destructive">{error}</CardContent>
          </Card>
        ) : rideTypes.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Nenhum tipo de corrida ainda</CardTitle>
              <CardDescription>
                Sua central ainda não tem modalidades cadastradas no sistema. Centrais novas passam a
                receber um <strong>tipo padrão</strong> automaticamente; as antigas podem precisar de
                uma sincronização feita pelo administrador. Você também pode <strong>criar um tipo agora</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <Button type="button" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar nova corrida
              </Button>
              <p>
                Se você é o responsável técnico: rode no servidor{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run db:backfill-ride-types</code>{' '}
                ou use a ferramenta de backfill no painel master.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rideTypes.map((rt) => (
              <Card key={rt.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      {rt.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rt.imageUrl}
                          alt=""
                          className="h-14 w-14 rounded-lg object-cover border shrink-0"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-lg border border-dashed bg-muted shrink-0 flex items-center justify-center text-xs text-muted-foreground text-center px-1">
                          sem foto
                        </div>
                      )}
                      <CardTitle className="text-lg pt-1">{rt.name}</CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          rt.isActive
                            ? 'text-xs font-medium rounded-full bg-green-500/15 text-green-700 dark:text-green-400 px-2 py-0.5'
                            : 'text-xs font-medium rounded-full bg-muted text-muted-foreground px-2 py-0.5'
                        )}
                      >
                        {rt.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(rt)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{rt.cityLabel}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {rt.description ? (
                    <p className="text-muted-foreground">{rt.description}</p>
                  ) : null}
                  <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t">
                    <div>
                      <dt className="text-muted-foreground text-xs">Bandeirada</dt>
                      <dd className="font-medium">R$ {Number(rt.basePrice).toFixed(2)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Por km</dt>
                      <dd className="font-medium">R$ {Number(rt.pricePerKm).toFixed(2)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Por minuto</dt>
                      <dd className="font-medium">R$ {Number(rt.pricePerMin).toFixed(2)}</dd>
                    </div>
                  </dl>
                  <p className="text-xs text-muted-foreground pt-1">Identificador: {rt.slug}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open) closeDialog()
          }}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isCreate ? 'Nova corrida' : 'Editar tipo de corrida'}</DialogTitle>
              <DialogDescription>
                {isCreate
                  ? 'O identificador interno (slug) é gerado automaticamente a partir do nome. Imagem opcional (app passageiro). Defina preços e, se houver mais de uma cidade, escolha o escopo.'
                  : 'O identificador interno (slug) e a cidade não são alterados aqui — nome, descrição, imagem, preços e status ativo.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              {!isCreate && editing ? (
                <p className="text-sm text-muted-foreground">{editing.cityLabel}</p>
              ) : null}
              {isCreate && citiesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando cidades…
                </div>
              ) : null}
              {isCreate && !citiesLoading && partnerCities.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">
                  Sua central ainda não tem cidades vinculadas. O tipo será criado como válido para toda a
                  central (sem cidade específica).
                </p>
              ) : null}
              {isCreate && !citiesLoading && partnerCities.length === 1 ? (
                <p className="text-sm text-muted-foreground">
                  Cidade:{' '}
                  <span className="font-medium text-foreground">
                    {partnerCities[0].name} ({partnerCities[0].state})
                  </span>
                </p>
              ) : null}
              {isCreate && !citiesLoading && partnerCities.length >= 2 ? (
                <div className="space-y-2">
                  <Label htmlFor="rt-city">Cidade</Label>
                  <Select value={formCityChoice} onValueChange={setFormCityChoice}>
                    <SelectTrigger id="rt-city">
                      <SelectValue placeholder="Escolha…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todas as cidades</SelectItem>
                      {partnerCities.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.state})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="rt-name">Nome</Label>
                <Input
                  id="rt-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  autoComplete="off"
                  placeholder="Ex.: Corrida econômica"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rt-desc">Descrição (opcional)</Label>
                <textarea
                  id="rt-desc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className={cn(
                    'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                    'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rt-image-url">Imagem no app (URL pública)</Label>
                <p className="text-xs text-muted-foreground">
                  Envie um arquivo ou cole o link. A imagem aparece na lista de modalidades no app do passageiro.
                </p>
                <input
                  ref={imageFileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void uploadRideTypeImage(f)
                    e.target.value = ''
                  }}
                />
                <div className="flex flex-col sm:flex-row gap-2 items-start">
                  <Input
                    id="rt-image-url"
                    type="url"
                    placeholder="https://…"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    autoComplete="off"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={imageUploading}
                    onClick={() => imageFileRef.current?.click()}
                  >
                    {imageUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Enviar imagem
                  </Button>
                </div>
                {formImageUrl.trim() !== '' ? (
                  <div className="flex items-center gap-3 pt-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formImageUrl.trim()}
                      alt="Pré-visualização"
                      className="h-20 w-20 rounded-lg object-cover border"
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => setFormImageUrl('')}>
                      Remover imagem
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="rt-base">Bandeirada (R$)</Label>
                  <Input
                    id="rt-base"
                    inputMode="decimal"
                    value={formBase}
                    onChange={(e) => setFormBase(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rt-km">Por km (R$)</Label>
                  <Input
                    id="rt-km"
                    inputMode="decimal"
                    value={formKm}
                    onChange={(e) => setFormKm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rt-min">Por minuto (R$)</Label>
                  <Input
                    id="rt-min"
                    inputMode="decimal"
                    value={formMin}
                    onChange={(e) => setFormMin(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <div>
                  <Label htmlFor="rt-active" className="text-base">
                    Tipo ativo
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tipos inativos não devem ser oferecidos em novas corridas (conforme o app).
                  </p>
                </div>
                <Switch id="rt-active" checked={formActive} onCheckedChange={setFormActive} />
              </div>
              {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={closeDialog} disabled={saving}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={saving || (isCreate && citiesLoading) || imageUploading}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {isCreate ? 'Criando…' : 'Salvando…'}
                  </>
                ) : isCreate ? (
                  'Criar'
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PartnerApprovedGate>
  )
}
