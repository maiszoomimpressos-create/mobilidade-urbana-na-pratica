"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function MarcaPage() {
  const [name, setName] = useState("")
  const [logo, setLogo] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#ebb000")
  const [secondaryColor, setSecondaryColor] = useState("#050505")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetch("/api/admin/brand")
      .then((res) => {
        if (!res.ok) throw new Error("Não autorizado")
        return res.json()
      })
      .then((data) => {
        setName(data.name ?? "Mai Drive")
        setLogo(data.logo ?? "")
        setPrimaryColor(data.primaryColor ?? "#ebb000")
        setSecondaryColor(data.secondaryColor ?? "#050505")
      })
      .catch(() => setMessage({ type: "error", text: "Não foi possível carregar. Apenas o admin master pode editar." }))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/brand", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Mai Drive",
          logo: logo.trim() || null,
          primaryColor: primaryColor || "#ebb000",
          secondaryColor: secondaryColor.trim() || "#050505",
        }),
      })
      if (!res.ok) throw new Error("Erro ao salvar")
      setMessage({ type: "success", text: "Configuração salva. O app do passageiro usará essas cores e logo." })
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
            Personalize nome, logo e cores. Essas configurações aparecem na tela de login e nas demais telas do app.
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

          <div className="space-y-2">
            <Label htmlFor="logo">URL da logo</Label>
            <Input
              id="logo"
              type="url"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://exemplo.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">
              Deixe vazio para usar a primeira letra do nome como placeholder.
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
