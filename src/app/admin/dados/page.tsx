 "use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, RefreshCw, Database } from "lucide-react"

interface IbgeFileStatus {
  municipios: boolean
  regioesIntermediarias: boolean
  regioesImediatas: boolean
}

export default function DadosPage() {
  const [status, setStatus] = useState<IbgeFileStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState<"municipios" | "regioesIntermediarias" | "regioesImediatas" | null>(null)

  const loadStatus = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/dados/status")
      if (!res.ok) throw new Error("Erro ao carregar status dos arquivos")
      const data = (await res.json()) as IbgeFileStatus
      setStatus(data)
    } catch (e) {
      console.error(e)
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, target: "municipios" | "regioesIntermediarias" | "regioesImediatas") => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(target)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("target", target)
      const res = await fetch("/api/admin/dados/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error ?? "Erro ao enviar arquivo")
      } else {
        alert(data.message ?? "Arquivo enviado com sucesso")
        await loadStatus()
      }
    } catch (e) {
      console.error(e)
      alert("Erro ao enviar arquivo")
    } finally {
      setUploading(null)
      event.target.value = ""
    }
  }

  const renderStatus = (ok: boolean | undefined) =>
    ok ? <span className="text-xs text-green-600">Arquivo presente</span> : <span className="text-xs text-muted-foreground">Ainda não enviado</span>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <Database className="w-7 h-7 text-primary" />
            Dados do IBGE
          </h1>
          <p className="text-muted-foreground mt-2">
            Central para gerenciar os arquivos da malha do IBGE (municípios e regiões). Use estes arquivos para limites no mapa e filtros por região.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadStatus} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Municípios (limites)</CardTitle>
            <CardDescription>Arquivo BR_Municipios_2024.shp (já extraído do ZIP) usado para limites das cidades.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Envie o ZIP <strong>BR_Municipios_2024.zip</strong> baixado do site do IBGE. O sistema extrai para <code>data/ibge/</code> e mantém o shapefile pronto para uso.
            </p>
            <div className="flex items-center justify-between">
              {renderStatus(status?.municipios)}
              <label className="inline-flex items-center gap-2 text-sm font-medium text-primary cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{uploading === "municipios" ? "Enviando..." : "Enviar ZIP"}</span>
                <input
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={(e) => handleUpload(e, "municipios")}
                  disabled={uploading !== null}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Regiões intermediárias</CardTitle>
            <CardDescription>Arquivo BR_RG_Intermediarias_2024.zip (opcional) para desenhar regiões no mapa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Use este arquivo apenas se quiser ver o <strong>contorno das regiões intermediárias</strong> no mapa. Não é obrigatório para os filtros.
            </p>
            <div className="flex items-center justify-between">
              {renderStatus(status?.regioesIntermediarias)}
              <label className="inline-flex items-center gap-2 text-sm font-medium text-primary cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{uploading === "regioesIntermediarias" ? "Enviando..." : "Enviar ZIP"}</span>
                <input
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={(e) => handleUpload(e, "regioesIntermediarias")}
                  disabled={uploading !== null}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Regiões imediatas</CardTitle>
            <CardDescription>Arquivo BR_RG_Imediatas_2024.zip (opcional) para desenhar regiões no mapa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Assim como as intermediárias, este arquivo é opcional e será usado apenas se você quiser visualizar as regiões imediatas como polígonos.
            </p>
            <div className="flex items-center justify-between">
              {renderStatus(status?.regioesImediatas)}
              <label className="inline-flex items-center gap-2 text-sm font-medium text-primary cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{uploading === "regioesImediatas" ? "Enviando..." : "Enviar ZIP"}</span>
                <input
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={(e) => handleUpload(e, "regioesImediatas")}
                  disabled={uploading !== null}
                />
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

