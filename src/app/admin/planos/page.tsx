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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  Tag,
  Building2,
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  Percent,
  Car,
  Calendar,
  Settings2,
} from 'lucide-react'

interface Feature {
  id: string
  name: string
  slug: string
  description: string | null
}

interface PlanFeature {
  featureId: string
  extraValue: number | null
  extraValueFormat: string | null
}

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  targetType: 'BRAND' | 'WHITE_LABEL'
  chargeType: 'PER_RIDE' | 'MONTHLY'
  valueFormat: 'PERCENTAGE' | 'FIXED'
  value: number
  isCustomizable: boolean
  sortOrder: number
  isActive: boolean
  planFeatures: PlanFeature[]
}

const CHARGE_TYPE_LABELS = {
  PER_RIDE: 'Por corrida',
  MONTHLY: 'Mensal',
}

export default function PlanosPage() {
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [selectedType, setSelectedType] = useState<'BRAND' | 'WHITE_LABEL' | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    chargeType: 'PER_RIDE' as 'PER_RIDE' | 'MONTHLY',
    valueFormat: 'FIXED' as 'PERCENTAGE' | 'FIXED',
    value: 0,
    isCustomizable: false,
    sortOrder: 0,
    isActive: true,
    selectedFeatures: [] as string[],
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [plansRes, featuresRes] = await Promise.all([
        fetch('/api/admin/plans'),
        fetch('/api/admin/tenant-features'),
      ])

      if (plansRes.ok) {
        const data = await plansRes.json()
        setPlans(Array.isArray(data) ? data : data.plans || [])
      }

      if (featuresRes.ok) {
        const data = await featuresRes.json()
        setFeatures(Array.isArray(data) ? data : data.features || [])
      }
    } catch (err) {
      console.error(err)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  function openTypeDialog(type: 'BRAND' | 'WHITE_LABEL') {
    setSelectedType(type)
  }

  function closeTypeDialog() {
    setSelectedType(null)
  }

  function openCreatePlanDialog() {
    if (!selectedType) return
    setEditingPlan(null)
    setForm({
      name: '',
      slug: '',
      description: '',
      chargeType: 'PER_RIDE',
      valueFormat: 'FIXED',
      value: 0,
      isCustomizable: false,
      sortOrder: plans.filter((p) => p.targetType === selectedType).length,
      isActive: true,
      selectedFeatures: [],
    })
    setDialogOpen(true)
  }

  function openEditPlanDialog(plan: Plan) {
    setEditingPlan(plan)
    setForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      chargeType: plan.chargeType,
      valueFormat: plan.valueFormat,
      value: plan.value,
      isCustomizable: plan.isCustomizable,
      sortOrder: plan.sortOrder,
      isActive: plan.isActive,
      selectedFeatures: plan.planFeatures.map((pf) => pf.featureId),
    })
    setDialogOpen(true)
  }

  async function handleSavePlan() {
    if (!form.name || !form.slug) {
      setError('Nome e slug são obrigatórios')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        targetType: selectedType,
        chargeType: form.chargeType,
        valueFormat: form.valueFormat,
        value: form.value,
        isCustomizable: form.isCustomizable,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
        featureIds: form.selectedFeatures,
      }

      const url = editingPlan
        ? `/api/admin/plans/${editingPlan.id}`
        : '/api/admin/plans'
      const method = editingPlan ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar')
      }

      setSuccessMessage(editingPlan ? 'Plano atualizado!' : 'Plano criado!')
      setTimeout(() => setSuccessMessage(null), 3000)
      setDialogOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeletePlan(plan: Plan) {
    if (!confirm(`Excluir plano "${plan.name}"?`)) return

    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Erro ao excluir')

      setSuccessMessage('Plano excluído!')
      setTimeout(() => setSuccessMessage(null), 3000)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  function toggleFeature(featureId: string) {
    setForm((prev) => ({
      ...prev,
      selectedFeatures: prev.selectedFeatures.includes(featureId)
        ? prev.selectedFeatures.filter((id) => id !== featureId)
        : [...prev.selectedFeatures, featureId],
    }))
  }

  const brandPlans = plans.filter((p) => p.targetType === 'BRAND')
  const whiteLabelPlans = plans.filter((p) => p.targetType === 'WHITE_LABEL')

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Gestão de Planos
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure os planos para Nossa Bandeira (Mai Drive) e White-label
        </p>
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
          onClick={() => openTypeDialog('BRAND')}
        >
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl">Nossa Bandeira</CardTitle>
            <CardDescription>
              Planos para parceiros que usam a marca Mai Drive
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Badge variant="secondary" className="mb-4">
              {brandPlans.length} plano{brandPlans.length !== 1 ? 's' : ''}
            </Badge>
            <Button className="w-full">
              <Settings2 className="mr-2 h-4 w-4" />
              Configurar Planos
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
          onClick={() => openTypeDialog('WHITE_LABEL')}
        >
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl">White-label</CardTitle>
            <CardDescription>
              Planos para parceiros com marca própria
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Badge variant="secondary" className="mb-4">
              {whiteLabelPlans.length} plano{whiteLabelPlans.length !== 1 ? 's' : ''}
            </Badge>
            <Button className="w-full" variant="outline">
              <Settings2 className="mr-2 h-4 w-4" />
              Configurar Planos
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de listagem de planos por tipo */}
      <Dialog open={selectedType !== null} onOpenChange={() => closeTypeDialog()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Planos - {selectedType === 'BRAND' ? 'Nossa Bandeira' : 'White-label'}
            </DialogTitle>
            <DialogDescription>
              Gerencie os planos disponíveis para{' '}
              {selectedType === 'BRAND' ? 'parceiros Mai Drive' : 'parceiros white-label'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-end">
              <Button onClick={openCreatePlanDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Plano
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(selectedType === 'BRAND' ? brandPlans : whiteLabelPlans).length === 0 ? (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  Nenhum plano cadastrado. Clique em "Novo Plano" para criar.
                </div>
              ) : (
                (selectedType === 'BRAND' ? brandPlans : whiteLabelPlans)
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((plan) => (
                    <Card key={plan.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            <CardDescription className="font-mono text-xs">
                              {plan.slug}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                              {plan.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                            {plan.isCustomizable && (
                              <Badge variant="outline">Customizável</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {plan.description && (
                          <p className="text-sm text-muted-foreground">
                            {plan.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            {plan.chargeType === 'PER_RIDE' ? (
                              <Car className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                            )}
                            {CHARGE_TYPE_LABELS[plan.chargeType]}
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            {plan.valueFormat === 'PERCENTAGE' ? (
                              <Percent className="h-4 w-4" />
                            ) : (
                              <DollarSign className="h-4 w-4" />
                            )}
                            {plan.valueFormat === 'PERCENTAGE'
                              ? `${plan.value}%`
                              : `R$ ${Number(plan.value).toFixed(2)}`}
                          </span>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {plan.planFeatures.length} funcionalidade
                          {plan.planFeatures.length !== 1 ? 's' : ''}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => openEditPlanDialog(plan)}
                          >
                            <Pencil className="mr-1 h-3 w-3" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeletePlan(plan)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de criação/edição de plano */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Editar Plano' : 'Novo Plano'}
            </DialogTitle>
            <DialogDescription>
              Configure o plano para{' '}
              {selectedType === 'BRAND' ? 'Nossa Bandeira' : 'White-label'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planName">Nome</Label>
                <Input
                  id="planName"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Básico"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planSlug">Slug</Label>
                <Input
                  id="planSlug"
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="basico"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="planDesc">Descrição</Label>
              <Input
                id="planDesc"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do plano..."
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Cobrança</Label>
              <Tabs
                value={form.chargeType}
                onValueChange={(v) => setForm((prev) => ({ ...prev, chargeType: v as 'PER_RIDE' | 'MONTHLY' }))}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="PER_RIDE">
                    <Car className="mr-2 h-4 w-4" />
                    Por Corrida
                  </TabsTrigger>
                  <TabsTrigger value="MONTHLY">
                    <Calendar className="mr-2 h-4 w-4" />
                    Mensal
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label>Formato do Valor</Label>
              <Tabs
                value={form.valueFormat}
                onValueChange={(v) => setForm((prev) => ({ ...prev, valueFormat: v as 'PERCENTAGE' | 'FIXED' }))}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="FIXED">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Valor Fixo (R$)
                  </TabsTrigger>
                  <TabsTrigger value="PERCENTAGE">
                    <Percent className="mr-2 h-4 w-4" />
                    Porcentagem (%)
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="planValue">
                Valor ({form.valueFormat === 'PERCENTAGE' ? '%' : 'R$'})
              </Label>
              <Input
                id="planValue"
                type="number"
                step={form.valueFormat === 'PERCENTAGE' ? '0.1' : '0.01'}
                value={form.value}
                onChange={(e) => setForm((prev) => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">
                {form.chargeType === 'PER_RIDE'
                  ? form.valueFormat === 'PERCENTAGE'
                    ? 'Porcentagem cobrada por corrida'
                    : 'Valor fixo cobrado por corrida'
                  : form.valueFormat === 'PERCENTAGE'
                  ? 'Porcentagem do faturamento mensal'
                  : 'Valor fixo mensal'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isCustomizable"
                checked={form.isCustomizable}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, isCustomizable: checked === true }))
                }
              />
              <Label htmlFor="isCustomizable" className="cursor-pointer">
                Plano customizável ("Do Seu Jeito")
              </Label>
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
                Plano ativo
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Funcionalidades Incluídas</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {features.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma funcionalidade cadastrada.
                  </p>
                ) : (
                  features.map((f) => (
                    <div key={f.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`feature-${f.id}`}
                        checked={form.selectedFeatures.includes(f.id)}
                        onCheckedChange={() => toggleFeature(f.id)}
                      />
                      <label htmlFor={`feature-${f.id}`} className="text-sm cursor-pointer flex-1">
                        {f.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePlan} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
