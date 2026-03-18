'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  MousePointer,
  Upload,
} from 'lucide-react'

interface Tenant {
  id: string
  name: string
  slug: string
}

interface Advertisement {
  id: string
  tenantId: string | null
  title: string
  imageUrl: string
  linkUrl: string | null
  position: 'PASSENGER_HOME' | 'PASSENGER_RIDE' | 'DRIVER_HOME' | 'SITE_BANNER'
  priority: number
  startDate: string | null
  endDate: string | null
  isActive: boolean
  impressions: number
  clicks: number
  tenant: Tenant | null
}

const POSITION_LABELS: Record<string, string> = {
  PASSENGER_HOME: 'App Passageiro - Home',
  PASSENGER_RIDE: 'App Passageiro - Corrida',
  DRIVER_HOME: 'App Motorista - Home',
  SITE_BANNER: 'Site - Banner',
}

export default function PublicidadePage() {
  const [loading, setLoading] = useState(true)
  const [ads, setAds] = useState<Advertisement[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [form, setForm] = useState({
    tenantId: '',
    title: '',
    imageUrl: '',
    linkUrl: '',
    position: 'PASSENGER_HOME',
    priority: 0,
    startDate: '',
    endDate: '',
    isActive: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [adsRes, tenantsRes] = await Promise.all([
        fetch('/api/admin/advertisements'),
        fetch('/api/admin/tenants'),
      ])

      if (adsRes.ok) {
        setAds(await adsRes.json())
      }

      if (tenantsRes.ok) {
        const data = await tenantsRes.json()
        setTenants(Array.isArray(data) ? data : data.tenants || [])
      }
    } catch (err) {
      console.error(err)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingAd(null)
    setForm({
      tenantId: '',
      title: '',
      imageUrl: '',
      linkUrl: '',
      position: 'PASSENGER_HOME',
      priority: 0,
      startDate: '',
      endDate: '',
      isActive: true,
    })
    setDialogOpen(true)
  }

  function openEditDialog(ad: Advertisement) {
    setEditingAd(ad)
    setForm({
      tenantId: ad.tenantId || '',
      title: ad.title,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl || '',
      position: ad.position,
      priority: ad.priority,
      startDate: ad.startDate ? ad.startDate.split('T')[0] : '',
      endDate: ad.endDate ? ad.endDate.split('T')[0] : '',
      isActive: ad.isActive,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.title || !form.imageUrl) {
      setError('Título e imagem são obrigatórios')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const payload = {
        tenantId: form.tenantId || null,
        title: form.title,
        imageUrl: form.imageUrl,
        linkUrl: form.linkUrl || null,
        position: form.position,
        priority: form.priority,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        isActive: form.isActive,
      }

      const url = editingAd
        ? `/api/admin/advertisements/${editingAd.id}`
        : '/api/admin/advertisements'
      const method = editingAd ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar')
      }

      setSuccessMessage(editingAd ? 'Anúncio atualizado!' : 'Anúncio criado!')
      setTimeout(() => setSuccessMessage(null), 3000)
      setDialogOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(ad: Advertisement) {
    if (!confirm(`Excluir anúncio "${ad.title}"?`)) return

    try {
      const res = await fetch(`/api/admin/advertisements/${ad.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Erro ao excluir')

      setSuccessMessage('Anúncio excluído!')
      setTimeout(() => setSuccessMessage(null), 3000)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
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
      setForm((prev) => ({ ...prev, imageUrl: data.url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload')
    } finally {
      setUploadingImage(false)
    }
  }

  async function toggleActive(ad: Advertisement) {
    try {
      await fetch(`/api/admin/advertisements/${ad.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !ad.isActive }),
      })
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Publicidade</h1>
          <p className="text-muted-foreground">
            Gerencie os anúncios exibidos nos apps e site
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Anúncio
        </Button>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ads.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                Nenhum anúncio cadastrado.
              </p>
              <Button className="mt-4" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro anúncio
              </Button>
            </CardContent>
          </Card>
        ) : (
          ads.map((ad) => (
            <Card key={ad.id} className="overflow-hidden">
              <div className="aspect-[16/9] relative bg-muted">
                {ad.imageUrl ? (
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge variant={ad.isActive ? 'default' : 'secondary'}>
                    {ad.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{ad.title}</CardTitle>
                <CardDescription>
                  {POSITION_LABELS[ad.position] || ad.position}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {ad.impressions.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointer className="h-4 w-4" />
                    {ad.clicks.toLocaleString()}
                  </span>
                  {ad.impressions > 0 && (
                    <span className="text-xs">
                      CTR: {((ad.clicks / ad.impressions) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>

                {ad.tenant ? (
                  <Badge variant="outline" className="text-xs">
                    {ad.tenant.name}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Todas as centrais
                  </Badge>
                )}

                {ad.linkUrl && (
                  <a
                    href={ad.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver link
                  </a>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(ad)}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(ad)}
                  >
                    {ad.isActive ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(ad)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAd ? 'Editar Anúncio' : 'Novo Anúncio'}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes do anúncio publicitário
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título (interno)</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Promoção Março 2026"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Imagem</Label>
              <div className="flex gap-2">
                <Input
                  id="imageUrl"
                  value={form.imageUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  className="flex-1"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingImage}
                  />
                  <Button variant="outline" disabled={uploadingImage}>
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {form.imageUrl && (
                <div className="mt-2 rounded-md overflow-hidden border">
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkUrl">Link (ao clicar)</Label>
              <Input
                id="linkUrl"
                value={form.linkUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, linkUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Posição</Label>
              <Select
                value={form.position}
                onValueChange={(value) => setForm((prev) => ({ ...prev, position: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PASSENGER_HOME">App Passageiro - Home</SelectItem>
                  <SelectItem value="PASSENGER_RIDE">App Passageiro - Corrida</SelectItem>
                  <SelectItem value="DRIVER_HOME">App Motorista - Home</SelectItem>
                  <SelectItem value="SITE_BANNER">Site - Banner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Central (opcional)</Label>
              <Select
                value={form.tenantId || 'all'}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, tenantId: value === 'all' ? '' : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as centrais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as centrais</SelectItem>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Input
                id="priority"
                type="number"
                value={form.priority}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, priority: parseInt(e.target.value) || 0 }))
                }
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Maior número = exibido primeiro
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, isActive: checked === true }))
                }
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Anúncio ativo
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
