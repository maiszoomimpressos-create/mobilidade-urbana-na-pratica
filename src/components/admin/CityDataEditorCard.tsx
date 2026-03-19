"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Copy, Check, Loader2, Save } from "lucide-react"

export type CityDataForMap = {
  id: string
  name: string
  state: string
  country: string
  latitude: number
  longitude: number
  ibgeCode?: string | null
  isActive?: boolean
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-foreground text-right min-w-0 break-all">{value}</span>
    </div>
  )
}

type CityDataEditorCardProps = {
  cityId: string
  city: CityDataForMap | null
  onSaved: (updated: CityDataForMap) => void
}

/** Card lateral do editor: permite ajustar cadastro da cidade (PATCH /api/admin/cities/[id]). */
export function CityDataEditorCard({ cityId, city, onSaved }: CityDataEditorCardProps) {
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [stateUf, setStateUf] = useState("")
  const [country, setCountry] = useState("BR")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [ibgeCode, setIbgeCode] = useState("")
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (!city) return
    setName(city.name)
    setStateUf(city.state)
    setCountry(city.country || "BR")
    setLatitude(String(city.latitude))
    setLongitude(String(city.longitude))
    setIbgeCode(city.ibgeCode?.trim() ?? "")
    setIsActive(city.isActive !== false)
    setError(null)
  }, [city])

  const handleSave = async () => {
    if (!city) return
    setSaving(true)
    setError(null)
    try {
      const lat = parseFloat(latitude.replace(",", "."))
      const lng = parseFloat(longitude.replace(",", "."))
      if (!name.trim() || !stateUf.trim()) {
        setError("Nome e UF são obrigatórios.")
        return
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setError("Latitude e longitude devem ser números válidos.")
        return
      }

      const res = await fetch(`/api/admin/cities/${cityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          state: stateUf.trim(),
          country: country.trim() || "BR",
          latitude: lat,
          longitude: lng,
          ibgeCode: ibgeCode.trim() || null,
          isActive,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar.")
      }
      const next: CityDataForMap = {
        id: data.id,
        name: data.name,
        state: data.state,
        country: data.country,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        ibgeCode: data.ibgeCode ?? null,
        isActive: data.isActive ?? true,
      }
      onSaved(next)
      alert("Dados da cidade salvos com sucesso.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.")
    } finally {
      setSaving(false)
    }
  }

  if (!city) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Dados da cidade</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground py-6">Carregando dados...</CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Dados da cidade</CardTitle>
        <CardDescription>
          Centro de referência no mapa (ponto). A <strong>área de cobertura</strong> continua sendo o polígono à
          esquerda.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="city-edit-name">Nome</Label>
          <Input
            id="city-edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="city-edit-uf">UF</Label>
            <Input
              id="city-edit-uf"
              value={stateUf}
              onChange={(e) => setStateUf(e.target.value.toUpperCase().slice(0, 2))}
              maxLength={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city-edit-country">País</Label>
            <Input
              id="city-edit-country"
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
              maxLength={2}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="city-edit-lat">Latitude</Label>
            <Input
              id="city-edit-lat"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              inputMode="decimal"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city-edit-lng">Longitude</Label>
            <Input
              id="city-edit-lng"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              inputMode="decimal"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city-edit-ibge">Código IBGE (município)</Label>
          <Input
            id="city-edit-ibge"
            value={ibgeCode}
            onChange={(e) => setIbgeCode(e.target.value.replace(/\D/g, "").slice(0, 7))}
            placeholder="7 dígitos"
            inputMode="numeric"
          />
        </div>
        <div className="flex items-center gap-2 h-10">
          <Checkbox
            id="city-edit-active"
            checked={isActive}
            onCheckedChange={(v) => setIsActive(v === true)}
          />
          <Label htmlFor="city-edit-active" className="text-sm font-normal cursor-pointer">
            Cidade ativa no sistema
          </Label>
        </div>

        <div className="pt-1 border-t border-border space-y-2">
          <Row label="ID interno" value={<span className="font-mono text-xs">{city.id}</span>} />
          <button
            type="button"
            className="inline-flex w-full max-w-full items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-2 py-1.5 text-left text-xs font-mono hover:bg-muted/70"
            title="Copiar ID"
            onClick={() => {
              void navigator.clipboard.writeText(city.id).then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              })
            }}
          >
            <span className="truncate">Copiar ID</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 shrink-0 text-green-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            )}
          </button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="button" className="w-full" disabled={saving} onClick={() => void handleSave()}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar dados da cidade
        </Button>
      </CardContent>
    </Card>
  )
}
