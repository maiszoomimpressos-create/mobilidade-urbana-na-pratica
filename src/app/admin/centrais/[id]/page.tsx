'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, ArrowLeft, Save, Upload, MapPin, Shield, Palette } from 'lucide-react'

interface Tenant {
  id: string
  name: string
  slug: string
  logo: string | null
  primaryColor: string | null
  secondaryColor: string | null
  isActive: boolean
  showPassengerAds: boolean
  linkedCity?: {
    id: string
    name: string
    state: string
  } | null
}

interface Feature {
  id: string
  slug: string
  name: string
  description: string | null
  enabled: boolean
}

interface EditableFields {
  name: boolean
  slug: boolean
  logo: boolean
  primaryColor: boolean
  secondaryColor: boolean
  isActive: boolean
  showPassengerAds: boolean
  linkedCity: boolean
  features: boolean
}

export default function EditCentralPage() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [features, setFeatures] = useState<Feature[]>([])
  const [selectedFeatureSlugs, setSelectedFeatureSlugs] = useState<string[]>([])
  const [editableFields, setEditableFields] = useState<EditableFields | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    slug: '',
    logo: '',
    primaryColor: '#ebb000',
    secondaryColor: '#050505',
    isActive: true,
  })

  const [uploadingLogo, setUploadingLogo] = useState(false)

  const loadTenant = useCallback(async () => {
    try {
      setLoading(true)
      const [tenantRes, capabilitiesRes, fieldsRes] = await Promise.all([
        fetch(`/api/admin/tenants/${tenantId}`),
        fetch(`/api/admin/tenants/${tenantId}/capabilities`),
        fetch(`/api/admin/tenants/${tenantId}/editable-fields`),
      ])

      if (!tenantRes.ok) {
        if (tenantRes.status === 403) {
          setError('Você não tem permissão para acessar esta central.')
          return
        }
        throw new Error('Erro ao carregar central')
      }

      const tenantData = await tenantRes.json()
      setTenant(tenantData)
      setForm({
        name: tenantData.name || '',
        slug: tenantData.slug || '',
        logo: tenantData.logo || '',
        primaryColor: tenantData.primaryColor || '#ebb000',
        secondaryColor: tenantData.secondaryColor || '#050505',
        isActive: tenantData.isActive ?? true,
      })

      if (capabilitiesRes.ok) {
        const capData = await capabilitiesRes.json()
        setFeatures(capData.features || [])
        setSelectedFeatureSlugs(
          (capData.features || [])
            .filter((f: Feature) => f.enabled)
            .map((f: Feature) => f.slug)
        )
      }

      if (fieldsRes.ok) {
        const fieldsData = await fieldsRes.json()
        setEditableFields(fieldsData)
      } else {
        setEditableFields({
          name: true,
          slug: false,
          logo: true,
          primaryColor: true,
          secondaryColor: true,
          isActive: false,
          showPassengerAds: false,
          linkedCity: false,
          features: false,
        })
      }
    } catch (err) {
      console.error(err)
      setError('Erro ao carregar dados da central')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    loadTenant()
  }, [loadTenant])

  async function handleSave() {
    if (!tenant || !editableFields) return

    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      const updateData: Record<string, unknown> = {}
      if (editableFields.name) updateData.name = form.name
      if (editableFields.logo) updateData.logo = form.logo || null
      if (editableFields.primaryColor) updateData.primaryColor = form.primaryColor
      if (editableFields.secondaryColor) updateData.secondaryColor = form.secondaryColor
      if (editableFields.isActive) updateData.isActive = form.isActive

      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar')
      }

      setSuccessMessage('Central atualizada com sucesso!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveFeatures() {
    if (!editableFields?.features) return

    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      const res = await fetch(`/api/admin/tenants/${tenantId}/capabilities`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureSlugs: selectedFeatureSlugs }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar funcionalidades')
      }

      setSuccessMessage('Funcionalidades atualizadas com sucesso!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar funcionalidades')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingLogo(true)
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/tenants/logo-upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro no upload')
      }

      const data = await res.json()
      setForm((prev) => ({ ...prev, logo: data.url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload')
    } finally {
      setUploadingLogo(false)
    }
  }

  function toggleFeature(slug: string, checked: boolean) {
    setSelectedFeatureSlugs((prev) =>
      checked ? [...prev, slug] : prev.filter((s) => s !== slug)
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !tenant) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error}</p>
            <Button className="mt-4" onClick={() => router.push('/admin/centrais')}>
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!tenant) return null

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/centrais')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{tenant.name}</h1>
          <p className="text-muted-foreground font-mono text-sm">{tenant.slug}</p>
        </div>
        <Badge variant={tenant.isActive ? 'default' : 'secondary'}>
          {tenant.isActive ? 'Ativa' : 'Inativa'}
        </Badge>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-md bg-green-500/10 p-4 text-green-600 text-sm">
          {successMessage}
        </div>
      )}

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="funcionalidades">Funcionalidades</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
              <CardDescription>Dados principais da central</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Central</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={!editableFields?.name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  disabled
                  className="font-mono bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O slug não pode ser alterado após a criação.
                </p>
              </div>

              {tenant.linkedCity && (
                <div className="space-y-2">
                  <Label>Cidade Vinculada</Label>
                  <div className="flex items-center gap-2 rounded-md border p-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {tenant.linkedCity.name} — {tenant.linkedCity.state}
                    </span>
                  </div>
                </div>
              )}

              {editableFields?.isActive && (
                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <Label>Central Ativa</Label>
                    <p className="text-sm text-muted-foreground">
                      Centrais inativas não aparecem para usuários
                    </p>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                </div>
              )}

              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Identidade Visual
              </CardTitle>
              <CardDescription>Logo e cores da central</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo">Logo (URL)</Label>
                <div className="flex gap-2">
                  <Input
                    id="logo"
                    value={form.logo}
                    onChange={(e) => setForm((prev) => ({ ...prev, logo: e.target.value }))}
                    placeholder="https://..."
                    disabled={!editableFields?.logo}
                  />
                  {editableFields?.logo && (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingLogo}
                      />
                      <Button variant="outline" disabled={uploadingLogo}>
                        {uploadingLogo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                {form.logo && (
                  <div className="mt-2">
                    <img
                      src={form.logo}
                      alt="Logo preview"
                      className="h-16 w-auto rounded-md border"
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="primaryColor"
                      value={form.primaryColor}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, primaryColor: e.target.value }))
                      }
                      className="w-14 h-10 p-1 cursor-pointer"
                      disabled={!editableFields?.primaryColor}
                    />
                    <Input
                      value={form.primaryColor}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, primaryColor: e.target.value }))
                      }
                      placeholder="#ebb000"
                      className="font-mono"
                      disabled={!editableFields?.primaryColor}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="secondaryColor"
                      value={form.secondaryColor}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, secondaryColor: e.target.value }))
                      }
                      className="w-14 h-10 p-1 cursor-pointer"
                      disabled={!editableFields?.secondaryColor}
                    />
                    <Input
                      value={form.secondaryColor}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, secondaryColor: e.target.value }))
                      }
                      placeholder="#050505"
                      className="font-mono"
                      disabled={!editableFields?.secondaryColor}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <div
                  className="h-12 w-24 rounded-md border"
                  style={{ backgroundColor: form.primaryColor }}
                />
                <div
                  className="h-12 w-24 rounded-md border"
                  style={{ backgroundColor: form.secondaryColor }}
                />
                <span className="text-sm text-muted-foreground">Preview das cores</span>
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funcionalidades" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades</CardTitle>
              <CardDescription>
                Selecione as funcionalidades disponíveis para esta central
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!editableFields?.features ? (
                <p className="text-sm text-muted-foreground">
                  Você não tem permissão para editar as funcionalidades desta central.
                </p>
              ) : features.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma funcionalidade cadastrada no sistema.
                </p>
              ) : (
                <>
                  <div className="space-y-3">
                    {features.map((feature) => (
                      <div
                        key={feature.id}
                        className="flex items-start justify-between gap-4 rounded-md border p-4"
                      >
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">{feature.name}</Label>
                          {feature.description && (
                            <p className="text-xs text-muted-foreground">
                              {feature.description}
                            </p>
                          )}
                        </div>
                        <Checkbox
                          checked={selectedFeatureSlugs.includes(feature.slug)}
                          disabled={saving}
                          onCheckedChange={(checked) =>
                            toggleFeature(feature.slug, checked === true)
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <Button onClick={handleSaveFeatures} disabled={saving}>
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar Funcionalidades
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
