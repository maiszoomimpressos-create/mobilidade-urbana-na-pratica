"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type PendingTenant = {
  id: string
  name: string
  slug: string
  type: string
  createdAt: string
  owner: { id: string; name: string | null; email: string } | null
  plan: { name: string; slug: string } | null
}

export default function AprovacoesPage() {
  const [loading, setLoading] = useState(true)
  const [tenants, setTenants] = useState<PendingTenant[]>([])
  const [processing, setProcessing] = useState("")
  const [message, setMessage] = useState("")

  const loadPending = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/tenants/pending")
      const data = await res.json()
      setTenants(data.tenants ?? [])
    } catch {
      setTenants([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPending()
  }, [])

  const handleAction = async (tenantId: string, action: "approve" | "reject") => {
    setProcessing(tenantId)
    setMessage("")
    try {
      const res = await fetch("/api/admin/tenants/pending", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, action }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error || "Erro ao processar.")
        return
      }
      setMessage(data.message || "Ação realizada.")
      setTenants((prev) => prev.filter((t) => t.id !== tenantId))
    } catch {
      setMessage("Erro ao processar.")
    } finally {
      setProcessing("")
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-hero-foreground">
          Aprovação de Centrais
        </h2>
        <p className="text-muted-foreground mt-1">
          Centrais que se cadastraram e aguardam aprovação para operar.
        </p>
      </div>

      {message && (
        <div className="rounded-lg p-3 text-sm bg-green-500/10 text-green-700">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : tenants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhuma central pendente de aprovação.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tenants.map((tenant) => (
            <Card key={tenant.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{tenant.name}</CardTitle>
                    <CardDescription>
                      Slug: {tenant.slug} · Tipo: {tenant.type === "white-label" ? "White-label" : "Nossa Bandeira"}
                    </CardDescription>
                  </div>
                  <span className="shrink-0 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                    Pendente
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <span className="text-muted-foreground">Responsável:</span>
                    <p className="font-medium">{tenant.owner?.name || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground">{tenant.owner?.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Plano:</span>
                    <p className="font-medium">{tenant.plan?.name || "Nenhum"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cadastro:</span>
                    <p className="font-medium">
                      {new Date(tenant.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleAction(tenant.id, "approve")}
                    disabled={processing === tenant.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing === tenant.id ? "Processando..." : "Aprovar"}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => handleAction(tenant.id, "reject")}
                    disabled={processing === tenant.id}
                  >
                    Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
