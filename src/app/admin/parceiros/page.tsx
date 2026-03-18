"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

type TenantItem = {
  id: string
  name: string
  slug: string
  logo: string | null
  isActive: boolean
  createdAt: string
  showPassengerAds: boolean
  linkedCity: { id: string; name: string; state: string } | null
}

type FilterType = "all" | "brand" | "white-label"
type CityOption = { id: string; name: string; state: string }
type FeatureOption = {
  id: string
  slug: string
  name: string
  description: string | null
  enabled: boolean
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

export default function ParceirosPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [savingBasics, setSavingBasics] = useState(false)
  const [deletingTenant, setDeletingTenant] = useState(false)
  const [uploadingCreateLogo, setUploadingCreateLogo] = useState(false)
  const [uploadingEditLogo, setUploadingEditLogo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [tenants, setTenants] = useState<TenantItem[]>([])
  const [cities, setCities] = useState<CityOption[]>([])

  const [type, setType] = useState<FilterType>("white-label")
  const [selectedTenantId, setSelectedTenantId] = useState("")

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [logo, setLogo] = useState("")
  const [createCityId, setCreateCityId] = useState("")
  const [createShowPassengerAds, setCreateShowPassengerAds] = useState(false)
  const [selectedCityId, setSelectedCityId] = useState("")
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [availableFeatures, setAvailableFeatures] = useState<FeatureOption[]>([])
  const [searchTenantConfig, setSearchTenantConfig] = useState("")
  const [editName, setEditName] = useState("")
  const [editSlug, setEditSlug] = useState("")
  const [editLogo, setEditLogo] = useState("")

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [tenantsRes, citiesRes] = await Promise.all([
        fetch("/api/admin/tenants"),
        fetch("/api/admin/tenants/city-options"),
      ])
      if (!tenantsRes.ok) throw new Error("Erro ao carregar centrais")
      if (!citiesRes.ok) throw new Error("Erro ao carregar cidades")

      const tenantsData = await tenantsRes.json()
      const citiesData = await citiesRes.json()

      const loadedTenants: TenantItem[] = tenantsData.tenants ?? []
      setTenants(loadedTenants)
      setCities(citiesData.cities ?? [])
    } catch {
      setError("Não foi possível carregar as centrais/cidades.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredTenantsForConfig = useMemo(() => {
    const q = searchTenantConfig.trim().toLowerCase()
    if (!q) return tenants
    return tenants.filter((tenant) =>
      tenant.name.toLowerCase().includes(q) || tenant.slug.toLowerCase().includes(q)
    )
  }, [tenants, searchTenantConfig])

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === selectedTenantId) ?? null,
    [tenants, selectedTenantId]
  )

  const loadTenantCapabilities = async (tenantId: string) => {
    setSavingConfig(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/capabilities`)
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao carregar configuração da central.")
      }
      const features: FeatureOption[] = data?.features ?? []
      const enabled = features.filter((feature) => feature.enabled).map((feature) => feature.slug)
      const cityId = data?.tenant?.linkedCity?.id ?? ""

      setAvailableFeatures(features)
      setSelectedFeatures(enabled)
      setSelectedCityId(cityId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar configuração da central.")
    } finally {
      setSavingConfig(false)
    }
  }

  useEffect(() => {
    if (!selectedTenantId) return
    void loadTenantCapabilities(selectedTenantId)
  }, [selectedTenantId])

  useEffect(() => {
    if (!selectedTenant) return
    setEditName(selectedTenant.name)
    setEditSlug(selectedTenant.slug)
    setEditLogo(selectedTenant.logo ?? "")
  }, [selectedTenant])

  const createTenant = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (!name.trim()) {
        throw new Error("Informe o nome da central.")
      }
      if (type === "brand" && !createCityId) {
        throw new Error("Selecione a cidade para a central da nossa bandeira.")
      }

      const body = {
        type,
        name: name.trim(),
        slug: slugify(slug || name),
        logo: logo.trim() || null,
        cityId: createCityId || null,
        showPassengerAds: createShowPassengerAds,
        featureSlugs: createShowPassengerAds ? ["passenger_advertising"] : [],
      }

      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao criar central")
      }

      setSuccess("Central criada com sucesso.")
      setName("")
      setSlug("")
      setLogo("")
      setCreateCityId("")
      setCreateShowPassengerAds(false)
      await loadData()

      const createdTenantId = typeof data?.tenant?.id === "string" ? data.tenant.id : ""
      const createdTenantName = typeof data?.tenant?.name === "string" ? data.tenant.name : ""
      if (createdTenantId) {
        setSelectedTenantId(createdTenantId)
        setSearchTenantConfig(createdTenantName)
        await loadTenantCapabilities(createdTenantId)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar central.")
    } finally {
      setSaving(false)
    }
  }

  const saveSelectedTenantCity = async () => {
    if (!selectedTenantId) return
    setSavingConfig(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/admin/tenants/${selectedTenantId}/capabilities`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityId: selectedCityId || null,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao vincular cidade.")
      }

      const linkedCity = data?.tenant?.linkedCity ?? null
      setTenants((prev) =>
        prev.map((tenant) =>
          tenant.id === selectedTenantId ? { ...tenant, linkedCity } : tenant
        )
      )
      setSuccess("Cidade vinculada com sucesso.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao vincular cidade.")
    } finally {
      setSavingConfig(false)
    }
  }

  const saveSelectedTenantFeatures = async () => {
    if (!selectedTenantId) return
    setSavingConfig(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/admin/tenants/${selectedTenantId}/capabilities`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featureSlugs: selectedFeatures,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao salvar funcionalidades.")
      }

      const features: FeatureOption[] = data?.features ?? []
      const enabled = features.filter((feature) => feature.enabled).map((feature) => feature.slug)
      setAvailableFeatures(features)
      setSelectedFeatures(enabled)

      const showPassengerAds = enabled.includes("passenger_advertising")
      setTenants((prev) =>
        prev.map((tenant) =>
          tenant.id === selectedTenantId ? { ...tenant, showPassengerAds } : tenant
        )
      )

      setSuccess("Funcionalidades da central atualizadas com sucesso.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar funcionalidades.")
    } finally {
      setSavingConfig(false)
    }
  }

  const saveSelectedTenantBasics = async () => {
    if (!selectedTenantId) return
    setSavingBasics(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/admin/tenants/${selectedTenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          slug: editSlug.trim(),
          logo: editLogo.trim() || null,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao editar central.")
      }

      const updated = data?.tenant as TenantItem | undefined
      if (updated?.id) {
        setTenants((prev) => prev.map((tenant) => (tenant.id === updated.id ? updated : tenant)))
        setSelectedTenantId(updated.id)
        setSearchTenantConfig(updated.name)
      }
      setSuccess("Dados da central atualizados com sucesso.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao editar central.")
    } finally {
      setSavingBasics(false)
    }
  }

  const deleteSelectedTenant = async () => {
    if (!selectedTenantId || !selectedTenant) return
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a central "${selectedTenant.name}"?`
    )
    if (!confirmed) return

    setDeletingTenant(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/admin/tenants/${selectedTenantId}`, {
        method: "DELETE",
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao excluir central.")
      }

      setSuccess(data?.message ?? "Central excluída com sucesso.")
      setTenants((prev) => prev.filter((tenant) => tenant.id !== selectedTenantId))
      setSelectedTenantId("")
      setSearchTenantConfig("")
      setAvailableFeatures([])
      setSelectedFeatures([])
      setSelectedCityId("")
      setEditName("")
      setEditSlug("")
      setEditLogo("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir central.")
    } finally {
      setDeletingTenant(false)
    }
  }

  const uploadLogoImage = async (file: File, mode: "create" | "edit") => {
    const setUploading = mode === "create" ? setUploadingCreateLogo : setUploadingEditLogo
    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (selectedTenantId) {
        formData.append("tenantId", selectedTenantId)
      }

      const res = await fetch("/api/admin/tenants/logo-upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao enviar logo.")
      }

      const uploadedUrl = typeof data?.url === "string" ? data.url : ""
      if (!uploadedUrl) {
        throw new Error("Upload concluído sem URL pública.")
      }

      if (mode === "create") {
        setLogo(uploadedUrl)
      } else {
        setEditLogo(uploadedUrl)
      }
      setSuccess("Logo enviada com sucesso. URL preenchida automaticamente.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar logo.")
    } finally {
      setUploading(false)
    }
  }

  const handleCreateLogoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    void uploadLogoImage(file, "create")
  }

  const handleEditLogoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    void uploadLogoImage(file, "edit")
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-hero-foreground">Centrais</h2>
        <p className="text-muted-foreground mt-1">
          Cadastre e consulte centrais. A bandeira Mai Drive já existe como central padrão.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criar central</CardTitle>
          <CardDescription>
            Crie centrais da nossa bandeira (Mai Drive + Cidade) ou centrais white-label independentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-md border px-3 py-1.5 text-sm ${
                type === "brand" ? "bg-primary text-primary-foreground border-primary" : "bg-background"
              }`}
              onClick={() => {
                setType("brand")
                if (createCityId) {
                  const city = cities.find((c) => c.id === createCityId)
                  if (city) {
                    const autoName = `Mai Drive ${city.name}`
                    setName(autoName)
                    setSlug(slugify(autoName))
                  }
                }
              }}
            >
              Nossa bandeira
            </button>
            <button
              type="button"
              className={`rounded-md border px-3 py-1.5 text-sm ${
                type === "white-label" ? "bg-primary text-primary-foreground border-primary" : "bg-background"
              }`}
              onClick={() => {
                setType("white-label")
                if (createCityId && name.startsWith("Mai Drive ")) {
                  const city = cities.find((c) => c.id === createCityId)
                  if (city) {
                    setName(city.name)
                    setSlug(slugify(city.name))
                  }
                }
              }}
            >
              White-label
            </button>
          </div>

          {type === "brand" && (
            <div className="rounded-md border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800">
              Selecione a cidade para criar uma central com a bandeira <strong>Mai Drive</strong>.
              O nome será preenchido automaticamente (ex: Mai Drive Dois Vizinhos).
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tenantCity">Cidade da central</Label>
            <select
              id="tenantCity"
              value={createCityId}
                onChange={(e) => {
                  const cityId = e.target.value
                  setCreateCityId(cityId)
                  const city = cities.find((c) => c.id === cityId)
                  if (city && type === "brand") {
                    const autoName = `Mai Drive ${city.name}`
                    setName(autoName)
                    setSlug(slugify(autoName))
                  } else if (city && !name.trim()) {
                    setName(city.name)
                    setSlug(slugify(city.name))
                  }
                }}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Selecione uma cidade</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name} - {city.state}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Ao selecionar a cidade, o nome será preenchido automaticamente. Você pode editá-lo depois.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tenantName">Nome da central</Label>
              <Input
                id="tenantName"
                placeholder="Ex.: Mai Drive Dois Vizinhos"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenantSlug">Slug (gerado automaticamente)</Label>
              <Input
                id="tenantSlug"
                placeholder="mai-drive-dois-vizinhos"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenantLogo">Logo (URL opcional)</Label>
            <Input
              id="tenantLogo"
              type="url"
              placeholder="https://dominio.com/logo.png"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
            />
            <Input
              type="file"
              accept="image/*"
              onChange={handleCreateLogoFileChange}
              disabled={saving || uploadingCreateLogo}
            />
            <p className="text-xs text-muted-foreground">
              {uploadingCreateLogo
                ? "Enviando e convertendo imagem..."
                : "Você pode enviar um arquivo. A imagem será convertida para WebP e a URL será preenchida."}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Função da central</Label>
            <div className="h-10 rounded-md border border-input px-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Publicidade no app passageiro</span>
              <Checkbox
                checked={createShowPassengerAds}
                onCheckedChange={(checked) => setCreateShowPassengerAds(checked === true)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg p-3 text-sm bg-red-500/10 text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg p-3 text-sm bg-green-500/10 text-green-700 dark:text-green-400">
              {success}
            </div>
          )}

          <Button onClick={createTenant} disabled={saving}>
            {saving ? "Criando..." : "Criar central"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de centrais</CardTitle>
          <CardDescription>
            A lista completa não fica fixa na tela. Busque e selecione a central para configurar cidade e funcionalidades.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="searchCentralConfig">Buscar central para configurar</Label>
            <Input
              id="searchCentralConfig"
              placeholder="Ex.: Mai Drive, transporte..."
              value={searchTenantConfig}
              onChange={(e) => setSearchTenantConfig(e.target.value)}
              className="max-w-xl"
            />
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando centrais...</p>
          ) : filteredTenantsForConfig.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma central encontrada para a busca informada.</p>
          ) : (
            <div className="space-y-2 max-w-xl">
              {filteredTenantsForConfig.map((tenant) => (
                <button
                  key={tenant.id}
                  type="button"
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                    selectedTenantId === tenant.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                  }`}
                  onClick={() => {
                    setSelectedTenantId(tenant.id)
                    setSearchTenantConfig(tenant.name)
                    setError(null)
                    setSuccess(null)
                  }}
                >
                  <div className="font-medium">{tenant.name}</div>
                  <div className="text-xs text-muted-foreground">Slug: {tenant.slug}</div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTenant && (
        <Card>
          <CardHeader>
            <CardTitle>Configuração da central selecionada</CardTitle>
            <CardDescription>
              Central: <strong>{selectedTenant.name}</strong> ({selectedTenant.slug})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Dados da central</Label>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editTenantName">Nome</Label>
                  <Input
                    id="editTenantName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={savingBasics || deletingTenant}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editTenantSlug">Slug</Label>
                  <Input
                    id="editTenantSlug"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    disabled={savingBasics || deletingTenant}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTenantLogo">Logo (URL)</Label>
                <Input
                  id="editTenantLogo"
                  value={editLogo}
                  onChange={(e) => setEditLogo(e.target.value)}
                  placeholder="https://dominio.com/logo.png"
                  disabled={savingBasics || deletingTenant}
                />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleEditLogoFileChange}
                  disabled={savingBasics || deletingTenant || uploadingEditLogo}
                />
                <p className="text-xs text-muted-foreground">
                  {uploadingEditLogo
                    ? "Enviando e convertendo imagem..."
                    : "Envie uma imagem para gerar URL web otimizada (WebP) automaticamente."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={savingBasics || deletingTenant} onClick={saveSelectedTenantBasics}>
                  {savingBasics ? "Salvando..." : "Salvar edição da central"}
                </Button>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  disabled={savingBasics || deletingTenant}
                  onClick={deleteSelectedTenant}
                >
                  {deletingTenant ? "Excluindo..." : "Excluir central"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="selectedTenantCity">Cidade de atuação da central</Label>
              <div className="grid gap-3 md:grid-cols-[1fr_auto] items-end">
                <select
                  id="selectedTenantCity"
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  disabled={savingConfig}
                >
                  <option value="">Sem cidade vinculada</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name} - {city.state}
                    </option>
                  ))}
                </select>
                <Button disabled={savingConfig} onClick={saveSelectedTenantCity}>
                  {savingConfig ? "Salvando..." : "Salvar cidade"}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Funcionalidades da central</Label>
              {availableFeatures.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma funcionalidade encontrada.</p>
              ) : (
                <div className="space-y-2">
                  {availableFeatures.map((feature) => (
                    <div
                      key={feature.id}
                      className="rounded-md border px-3 py-2 flex items-start justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{feature.name}</p>
                        {feature.description && (
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        )}
                      </div>
                      <Checkbox
                        checked={selectedFeatures.includes(feature.slug)}
                        disabled={savingConfig}
                        onCheckedChange={(checked) => {
                          setSelectedFeatures((prev) => {
                            const has = prev.includes(feature.slug)
                            if (checked === true && !has) return [...prev, feature.slug]
                            if (checked !== true && has) return prev.filter((slugItem) => slugItem !== feature.slug)
                            return prev
                          })
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
              <Button disabled={savingConfig} onClick={saveSelectedTenantFeatures}>
                {savingConfig ? "Salvando..." : "Salvar funcionalidades"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
