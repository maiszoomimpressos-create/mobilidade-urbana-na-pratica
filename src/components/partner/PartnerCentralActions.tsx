'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'

type PartnerCentralActionsProps = {
  tenantId: string
  tenantName: string
  onCitiesChanged: () => void
}

export default function PartnerCentralActions({ tenantId, tenantName, onCitiesChanged }: PartnerCentralActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loadingAction, setLoadingAction] = useState<'none' | 'remove' | 'add'>('none')

  const [cityName, setCityName] = useState('')
  const [cityState, setCityState] = useState('')
  const [error, setError] = useState<string | null>(null)

  const resetError = () => setError(null)

  const handleRemoveCentral = async () => {
    resetError()
    if (!confirm(`Tem certeza que deseja excluir a central "${tenantName}"?`)) return

    setLoadingAction('remove')
    try {
      const res = await fetch('/api/partner/tenant/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tenantId }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.error || 'Erro ao excluir central')
      }

      // Após inativar, o endpoint /api/partner/me não deve mais retornar tenant.
      router.replace('/parceiro')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir central')
    } finally {
      setLoadingAction('none')
    }
  }

  const handleAddCity = async () => {
    resetError()
    const name = cityName.trim()
    const state = cityState.trim().toUpperCase()
    if (!name || !state) {
      setError('Informe o nome da cidade e a UF.')
      return
    }

    setLoadingAction('add')
    try {
      const res = await fetch('/api/partner/tenant/cities/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tenantId, cityName: name, cityState: state }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.error || 'Erro ao adicionar cidade')
      }

      setCityName('')
      setCityState('')
      onCitiesChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao adicionar cidade')
    } finally {
      setLoadingAction('none')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} modal>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" />
        Editar central
      </Button>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Gerenciar central</DialogTitle>
          <DialogDescription>
            Exclua a central ou adicione mais cidades para habilitar mapa/cobertura e futuras políticas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Excluir central</p>
                <p className="text-sm text-muted-foreground">
                  Isso desativa a central (soft delete). Você será redirecionado ao cadastro.
                </p>
                <Button
                  variant="destructive"
                  className="mt-3 w-full"
                  onClick={handleRemoveCentral}
                  disabled={loadingAction === 'remove'}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {loadingAction === 'remove' ? 'Excluindo...' : 'Excluir central'}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-medium">Adicionar cidade</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nome da cidade</Label>
                <Input
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="Ex.: Salvador"
                  disabled={loadingAction !== 'none'}
                />
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Input
                  value={cityState}
                  onChange={(e) => setCityState(e.target.value)}
                  placeholder="Ex.: BA"
                  disabled={loadingAction !== 'none'}
                />
              </div>
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleAddCity}
              disabled={loadingAction !== 'none'}
            >
              <Plus className="w-4 h-4" />
              {loadingAction === 'add' ? 'Adicionando...' : 'Adicionar cidade'}
            </Button>
          </div>

          {error && (
            <div className="text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

