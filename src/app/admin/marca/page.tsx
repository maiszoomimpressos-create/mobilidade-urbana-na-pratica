"use client"

import { useEffect, useState, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type BrandLogoFormItem = {
  id?: string
  url: string
  label: string
  isActive: boolean
}

export default function MarcaPage() {
  const [name, setName] = useState("")
  const [logos, setLogos] = useState<BrandLogoFormItem[]>([])
  const [primaryColor, setPrimaryColor] = useState("#ebb000")
  const [secondaryColor, setSecondaryColor] = useState("#050505")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetch("/api/admin/brand")
      .then((res) => {
        if (!res.ok) throw new Error("Não autorizado")
        return res.json()
      })
      .then((data) => {
        setName(data.name ?? "Mai Drive")
        const loadedLogos =
          Array.isArray(data.logos) && data.logos.length > 0
            ? data.logos.map((item: { id?: string; url?: string; label?: string; isActive?: boolean }) => ({
                id: item.id,
                url: typeof item.url === "string" ? item.url : "",
                label: typeof item.label === "string" ? item.label : "",
                isActive: item.isActive === true,
              }))
            : data.logo
              ? [{ url: data.logo, label: "Logo principal", isActive: true }]
              : []
        setLogos(loadedLogos)
        setPrimaryColor(data.primaryColor ?? "#ebb000")
        setSecondaryColor(data.secondaryColor ?? "#050505")
      })
      .catch(() => setMessage({ type: "error", text: "Não foi possível carregar. Apenas o admin master pode editar." }))
      .finally(() => setLoading(false))
  }, [])

  const addEmptyLogo = () => {
    setLogos((prev) => [...prev, { url: "", label: "", isActive: prev.length === 0 }])
  }

  const removeLogo = (index: number) => {
    setLogos((prev) => {
      const next = prev.filter((_, itemIndex) => itemIndex !== index)
      if (next.length > 0 && !next.some((item) => item.isActive)) {
        next[0] = { ...next[0], isActive: true }
      }
      return next
    })
  }

  const setActiveLogo = (index: number) => {
    setLogos((prev) =>
      prev.map((item, itemIndex) => ({
        ...item,
        isActive: itemIndex === index,
      }))
    )
  }

  const handleUploadLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setUploadingLogo(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("tenantId", "mai-drive-brand")

      const response = await fetch("/api/admin/tenants/logo-upload", {
        method: "POST",
        body: formData,
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error ?? "Erro ao fazer upload da logo.")
      }

      const url = typeof data?.url === "string" ? data.url : ""
      if (!url) {
        throw new Error("Upload concluído sem URL.")
      }

      setLogos((prev) => [...prev, { url, label: "", isActive: prev.length === 0 }])
      setMessage({ type: "success", text: "Logo enviada com sucesso." })
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao enviar logo.",
      })
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const sanitizedLogos = logos
        .map((item) => ({
          url: item.url.trim(),
          label: item.label.trim(),
          isActive: item.isActive,
        }))
        .filter((item) => item.url.length > 0)

      if (sanitizedLogos.length > 0 && !sanitizedLogos.some((item) => item.isActive)) {
        sanitizedLogos[0].isActive = true
      }

      const selectedLogo = sanitizedLogos.find((item) => item.isActive)?.url ?? sanitizedLogos[0]?.url ?? null

      const res = await fetch("/api/admin/brand", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Mai Drive",
          logo: selectedLogo,
          logos: sanitizedLogos,
          primaryColor: primaryColor || "#ebb000",
          secondaryColor: secondaryColor.trim() || "#050505",
        }),
      })
      if (!res.ok) throw new Error("Erro ao salvar")
      setMessage({ type: "success", text: "Configuração salva. Apps usarão as cores e a logo ativa." })
    } catch {
      setMessage({ type: "error", text: "Erro ao salvar. Verifique se você é o admin master." })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-hero-foreground">Nossa Marca</h2>
        <p className="text-muted-foreground mt-1">
          Cores e logo exibidos no app do passageiro quando o usuário usa nossa bandeira (Mai Drive).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identidade visual</CardTitle>
          <CardDescription>
            Personalize nome, múltiplas logos e cores. Uma logo fica ativa por vez para exibição no app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mai Drive"
            />
          </div>

          <div className="space-y-3">
            <Label>Logos da bandeira</Label>
            {logos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma logo cadastrada. Adicione por URL ou faça upload.
              </p>
            ) : (
              <div className="space-y-3">
                {logos.map((item, index) => (
                  <div key={`${item.id ?? "new"}-${index}`} className="rounded-md border p-3 space-y-2">
                    <div className="grid gap-2 sm:grid-cols-[1fr_220px_auto] items-end">
                      <div className="space-y-1">
                        <Label>URL</Label>
                        <Input
                          type="url"
                          value={item.url}
                          onChange={(e) =>
                            setLogos((prev) =>
                              prev.map((logoItem, itemIndex) =>
                                itemIndex === index ? { ...logoItem, url: e.target.value } : logoItem
                              )
                            )
                          }
                          placeholder="https://exemplo.com/logo.webp"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Rótulo</Label>
                        <Input
                          value={item.label}
                          onChange={(e) =>
                            setLogos((prev) =>
                              prev.map((logoItem, itemIndex) =>
                                itemIndex === index ? { ...logoItem, label: e.target.value } : logoItem
                              )
                            )
                          }
                          placeholder="Ex.: Vertical, Horizontal..."
                        />
                      </div>
                      <Button variant="outline" onClick={() => removeLogo(index)}>
                        Remover
                      </Button>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="active-brand-logo"
                        checked={item.isActive}
                        onChange={() => setActiveLogo(index)}
                      />
                      Usar esta logo como ativa
                    </label>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={addEmptyLogo}>
                Adicionar logo por URL
              </Button>
              <Input
                type="file"
                accept="image/*"
                onChange={handleUploadLogo}
                disabled={uploadingLogo}
                className="max-w-xs"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {uploadingLogo
                ? "Enviando e convertendo imagem para WebP..."
                : "No upload, a imagem é convertida para WebP e adicionada à lista."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Cor primária</Label>
              <div className="flex gap-2 items-center">
                <input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#ebb000"
                  className="font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Cor secundária (opcional)</Label>
              <div className="flex gap-2 items-center">
                <input
                  id="secondaryColor"
                  type="color"
                  value={secondaryColor || "#6b7280"}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#6b7280 ou vazio"
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`rounded-lg p-3 text-sm ${
                message.type === "success"
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : "bg-red-500/10 text-red-700 dark:text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
