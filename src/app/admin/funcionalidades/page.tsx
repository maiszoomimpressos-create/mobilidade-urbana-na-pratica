"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type TenantItem = {
  id: string
  name: string
  slug: string
  linkedCity: { id: string; name: string; state: string } | null
}

type FeatureOption = {
  id: string
  slug: string
  name: string
  description: string | null
  enabled: boolean
}

export default function FuncionalidadesPage() {
  const [loading, setLoading] = useState(true)
  const [tenants, setTenants] = useState<TenantItem[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState("")
  const [features, setFeatures] = useState<FeatureOption[]>([])
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([])
  const [loadingFeatures, setLoadingFeatures] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogState, setDialogState] = useState("")
  const [dialogSearch, setDialogSearch] = useState("")

  useEffect(() => {
    fetch("/api/admin/tenants")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar centrais")
        return res.json()
      })
      .then((data) => {
        setTenants(data.tenants ?? [])
      })
      .catch(() => setError("Não foi possível carregar as centrais."))
      .finally(() => setLoading(false))
  }, [])

  const states = useMemo(() => {
    const set = new Set<string>()
    for (const t of tenants) {
      if (t.linkedCity?.state) set.add(t.linkedCity.state)
    }
    return Array.from(set).sort()
  }, [tenants])

  const tenantsForDialog = useMemo(() => {
    const byState = tenants.filter((t) => t.linkedCity?.state === dialogState)
    const q = dialogSearch.trim().toLowerCase()
    if (!q) return byState
    return byState.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.linkedCity?.name ?? "").toLowerCase().includes(q)
    )
  }, [tenants, dialogState, dialogSearch])

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId) ?? null

  const openStateDialog = (state: string) => {
    setDialogState(state)
    setDialogSearch("")
    setDialogOpen(true)
  }

  const selectTenantFromDialog = (tenant: TenantItem) => {
    setSelectedTenantId(tenant.id)
    setDialogOpen(false)
    setError(null)
    setSuccess(null)
    void loadFeatures(tenant.id)
  }

  const loadFeatures = async (tenantId: string) => {
    setLoadingFeatures(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/capabilities`)
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? "Erro ao carregar funcionalidades.")

      const loaded: FeatureOption[] = data?.features ?? []
      setFeatures(loaded)
      setSelectedSlugs(loaded.filter((f) => f.enabled).map((f) => f.slug))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar funcionalidades.")
      setFeatures([])
      setSelectedSlugs([])
    } finally {
      setLoadingFeatures(false)
    }
  }

  const toggleFeature = (slug: string, checked: boolean) => {
    setSelectedSlugs((prev) => {
      if (checked && !prev.includes(slug)) return [...prev, slug]
      if (!checked && prev.includes(slug)) return prev.filter((s) => s !== slug)
      return prev
    })
  }

  const handleSave = async () => {
    if (!selectedTenantId) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/admin/tenants/${selectedTenantId}/capabilities`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureSlugs: selectedSlugs }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? "Erro ao salvar funcionalidades.")

      const updated: FeatureOption[] = data?.features ?? []
      setFeatures(updated)
      setSelectedSlugs(updated.filter((f) => f.enabled).map((f) => f.slug))
      setSuccess("Funcionalidades salvas com sucesso.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar funcionalidades.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando centrais...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-hero-foreground">
          Funcionalidades por Central
        </h2>
        <p className="text-muted-foreground mt-1">
          Selecione o estado, escolha a central e atribua funcionalidades.
        </p>
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

      <Card>
        <CardHeader>
          <CardTitle>Selecionar por estado</CardTitle>
          <CardDescription>
            Clique no estado para ver as centrais vinculadas e selecionar uma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {states.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma central com cidade vinculada. Vincule cidades às centrais na tela de Parceiros.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {states.map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => openStateDialog(state)}
                  className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-primary/10 hover:border-primary transition-colors"
                >
                  {state}
                </button>
              ))}
            </div>
          )}

          {selectedTenant && (
            <div className="mt-4 rounded-md border border-primary bg-primary/5 px-4 py-3">
              <p className="text-sm font-medium">
                Central selecionada: <strong>{selectedTenant.name}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedTenant.linkedCity
                  ? `${selectedTenant.linkedCity.name} - ${selectedTenant.linkedCity.state}`
                  : "Sem cidade vinculada"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTenant && (
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades: {selectedTenant.name}</CardTitle>
            <CardDescription>
              Marque as funcionalidades que esta central deve ter. Clique em salvar para aplicar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingFeatures ? (
              <p className="text-sm text-muted-foreground">Carregando funcionalidades...</p>
            ) : features.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma funcionalidade cadastrada no sistema.
              </p>
            ) : (
              <div className="space-y-3">
                {features.map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-start justify-between gap-4 rounded-md border p-4"
                  >
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">{feature.name}</Label>
                      {feature.description && (
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      )}
                    </div>
                    <Checkbox
                      checked={selectedSlugs.includes(feature.slug)}
                      disabled={saving}
                      onCheckedChange={(checked) =>
                        toggleFeature(feature.slug, checked === true)
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            <Button onClick={handleSave} disabled={saving || loadingFeatures}>
              {saving ? "Salvando..." : "Salvar funcionalidades"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Centrais — {dialogState}</DialogTitle>
            <DialogDescription>
              Selecione a central para atribuir funcionalidades.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="Buscar central..."
              value={dialogSearch}
              onChange={(e) => setDialogSearch(e.target.value)}
              autoFocus
            />
            {tenantsForDialog.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Nenhuma central encontrada para {dialogState}.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tenantsForDialog.map((tenant) => (
                  <button
                    key={tenant.id}
                    type="button"
                    className="w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-muted/40"
                    onClick={() => selectTenantFromDialog(tenant)}
                  >
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {tenant.linkedCity?.name} — {tenant.slug}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
