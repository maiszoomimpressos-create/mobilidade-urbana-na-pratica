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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Shield, Users, Plus, Settings, Search } from 'lucide-react'

interface Permission {
  id: string
  slug: string
  name: string
  description: string | null
}

interface Role {
  id: string
  name: string
  slug: string
  description: string | null
  permissions: Permission[]
  usersCount: number
}

interface UserWithPermissions {
  id: string
  email: string
  name: string | null
  tenantUsers: Array<{
    tenantId: string
    tenantName: string
    tenantSlug: string
    role: {
      id: string
      name: string
      slug: string
      permissions: string[]
    }
  }>
  extraPermissions: Array<{
    id: string
    permissionId: string
    permissionSlug: string
    permissionName: string
    type: 'grant' | 'revoke'
  }>
  effectivePermissions: string[]
}

export default function PermissoesPage() {
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [roleForm, setRoleForm] = useState({
    name: '',
    slug: '',
    description: '',
    permissionIds: [] as string[],
  })
  const [savingRole, setSavingRole] = useState(false)

  const [userSearch, setUserSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null)
  const [loadingUser, setLoadingUser] = useState(false)
  const [savingUserPermission, setSavingUserPermission] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [rolesRes, permissionsRes] = await Promise.all([
        fetch('/api/admin/roles'),
        fetch('/api/admin/permissions'),
      ])

      if (!rolesRes.ok || !permissionsRes.ok) {
        if (rolesRes.status === 403 || permissionsRes.status === 403) {
          setError('Você não tem permissão para acessar esta página.')
          return
        }
        throw new Error('Erro ao carregar dados')
      }

      setRoles(await rolesRes.json())
      setPermissions(await permissionsRes.json())
    } catch (err) {
      console.error(err)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  function openNewRoleDialog() {
    setEditingRole(null)
    setRoleForm({ name: '', slug: '', description: '', permissionIds: [] })
    setRoleDialogOpen(true)
  }

  function openEditRoleDialog(role: Role) {
    setEditingRole(role)
    setRoleForm({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
      permissionIds: role.permissions.map((p) => p.id),
    })
    setRoleDialogOpen(true)
  }

  async function saveRole() {
    try {
      setSavingRole(true)
      setError(null)

      const url = editingRole
        ? `/api/admin/roles/${editingRole.id}`
        : '/api/admin/roles'
      const method = editingRole ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar')
      }

      setSuccessMessage(
        editingRole ? 'Role atualizado com sucesso!' : 'Role criado com sucesso!'
      )
      setTimeout(() => setSuccessMessage(null), 3000)
      setRoleDialogOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSavingRole(false)
    }
  }

  async function searchUser() {
    if (!userSearch.trim()) return

    try {
      setLoadingUser(true)
      setError(null)
      setSelectedUser(null)

      const userRes = await fetch(`/api/admin/usuarios?email=${encodeURIComponent(userSearch)}`)
      if (!userRes.ok) {
        if (userRes.status === 404) {
          setError('Usuário não encontrado')
          return
        }
        throw new Error('Erro ao buscar usuário')
      }

      const users = await userRes.json()
      if (!users.length) {
        setError('Usuário não encontrado')
        return
      }

      const userId = users[0].id
      const permRes = await fetch(`/api/admin/user-permissions?userId=${userId}`)
      if (!permRes.ok) throw new Error('Erro ao carregar permissões')

      setSelectedUser(await permRes.json())
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar')
    } finally {
      setLoadingUser(false)
    }
  }

  async function addExtraPermission(permissionId: string, type: 'grant' | 'revoke') {
    if (!selectedUser) return

    try {
      setSavingUserPermission(true)
      setError(null)

      const res = await fetch('/api/admin/user-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.userId,
          permissionId,
          type,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar')
      }

      const permRes = await fetch(
        `/api/admin/user-permissions?userId=${selectedUser.userId}`
      )
      if (permRes.ok) {
        setSelectedUser(await permRes.json())
      }

      setSuccessMessage('Permissão atualizada!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSavingUserPermission(false)
    }
  }

  async function removeExtraPermission(permissionId: string) {
    if (!selectedUser) return

    try {
      setSavingUserPermission(true)
      setError(null)

      const res = await fetch('/api/admin/user-permissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.userId,
          permissionId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao remover')
      }

      const permRes = await fetch(
        `/api/admin/user-permissions?userId=${selectedUser.userId}`
      )
      if (permRes.ok) {
        setSelectedUser(await permRes.json())
      }

      setSuccessMessage('Permissão removida!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover')
    } finally {
      setSavingUserPermission(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !roles.length) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Permissões</h1>
        <p className="text-muted-foreground">
          Gerencie roles e permissões de acesso ao sistema
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

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roles">
            <Shield className="mr-2 h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="usuarios">
            <Users className="mr-2 h-4 w-4" />
            Permissões por Usuário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={openNewRoleDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Role
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {role.slug}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{role.usersCount} usuários</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {role.description && (
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 4).map((p) => (
                      <Badge key={p.id} variant="secondary" className="text-xs">
                        {p.name}
                      </Badge>
                    ))}
                    {role.permissions.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{role.permissions.length - 4}
                      </Badge>
                    )}
                  </div>

                  {role.slug !== 'master' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => openEditRoleDialog(role)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buscar Usuário</CardTitle>
              <CardDescription>
                Digite o email do usuário para gerenciar permissões individuais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="email@exemplo.com"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchUser()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={searchUser} disabled={loadingUser}>
                  {loadingUser ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Buscar'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedUser && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedUser.name || selectedUser.email}</CardTitle>
                <CardDescription>{selectedUser.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedUser.tenantUsers.length > 0 && (
                  <div className="space-y-2">
                    <Label>Roles por Central</Label>
                    <div className="space-y-2">
                      {selectedUser.tenantUsers.map((tu) => (
                        <div
                          key={tu.tenantId}
                          className="flex items-center justify-between rounded-md border p-3"
                        >
                          <div>
                            <span className="font-medium">{tu.tenantName}</span>
                            <span className="text-muted-foreground ml-2 text-sm">
                              ({tu.tenantSlug})
                            </span>
                          </div>
                          <Badge>{tu.role.name}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Permissões Efetivas</Label>
                  <div className="flex flex-wrap gap-1">
                    {selectedUser.effectivePermissions.map((slug) => (
                      <Badge key={slug} variant="default" className="text-xs">
                        {permissions.find((p) => p.slug === slug)?.name || slug}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Permissões Extras Individuais</Label>
                  <div className="space-y-2">
                    {selectedUser.extraPermissions.map((ep) => (
                      <div
                        key={ep.id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={ep.type === 'grant' ? 'default' : 'destructive'}
                          >
                            {ep.type === 'grant' ? '+' : '-'}
                          </Badge>
                          <span>{ep.permissionName}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExtraPermission(ep.permissionId)}
                          disabled={savingUserPermission}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}

                    {selectedUser.extraPermissions.length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">
                        Nenhuma permissão extra configurada.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Adicionar Permissão Extra</Label>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={(value) => {
                        const [permId, type] = value.split('::')
                        addExtraPermission(permId, type as 'grant' | 'revoke')
                      }}
                      disabled={savingUserPermission}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma permissão..." />
                      </SelectTrigger>
                      <SelectContent>
                        {permissions.map((p) => (
                          <div key={p.id}>
                            <SelectItem value={`${p.id}::grant`}>
                              + Adicionar: {p.name}
                            </SelectItem>
                            <SelectItem value={`${p.id}::revoke`}>
                              - Remover: {p.name}
                            </SelectItem>
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use &quot;Adicionar&quot; para dar uma permissão extra ou &quot;Remover&quot; para
                    revogar uma permissão que o role já concede.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Editar Role' : 'Novo Role'}
            </DialogTitle>
            <DialogDescription>
              Configure o nome e as permissões do role
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Nome</Label>
              <Input
                id="roleName"
                value={roleForm.name}
                onChange={(e) =>
                  setRoleForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Admin Operacional"
              />
            </div>

            {!editingRole && (
              <div className="space-y-2">
                <Label htmlFor="roleSlug">Slug</Label>
                <Input
                  id="roleSlug"
                  value={roleForm.slug}
                  onChange={(e) =>
                    setRoleForm((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="admin_operacional"
                  className="font-mono"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="roleDesc">Descrição</Label>
              <Input
                id="roleDesc"
                value={roleForm.description}
                onChange={(e) =>
                  setRoleForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Descrição do role..."
              />
            </div>

            <div className="space-y-2">
              <Label>Permissões</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {permissions.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`perm-${p.id}`}
                      checked={roleForm.permissionIds.includes(p.id)}
                      onCheckedChange={(checked) => {
                        setRoleForm((prev) => ({
                          ...prev,
                          permissionIds: checked
                            ? [...prev.permissionIds, p.id]
                            : prev.permissionIds.filter((id) => id !== p.id),
                        }))
                      }}
                    />
                    <label htmlFor={`perm-${p.id}`} className="text-sm cursor-pointer">
                      {p.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveRole} disabled={savingRole}>
              {savingRole ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
