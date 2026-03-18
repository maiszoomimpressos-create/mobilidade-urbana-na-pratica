import { prisma } from '@/lib/prisma'

export type PermissionSlug =
  | 'manage_tenants'
  | 'manage_features'
  | 'manage_users'
  | 'manage_drivers'
  | 'manage_billing'
  | 'view_reports'
  | 'manage_brand'
  | 'manage_roles'
  | 'manage_cities'
  | 'switch_tenant'

export interface UserWithPermissions {
  id: string
  email: string
  name?: string | null
  tenantUsers?: Array<{
    tenantId: string
    role: {
      slug: string
      rolePermissions: Array<{
        permission: { slug: string }
      }>
    }
  }>
  extraPermissions?: Array<{
    type: string
    permission: { slug: string }
  }>
}

export async function getUserPermissions(userId: string): Promise<Set<PermissionSlug>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tenantUsers: {
        where: { isActive: true },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
      extraPermissions: {
        include: { permission: true },
      },
    },
  })

  if (!user) return new Set()

  const permissions = new Set<PermissionSlug>()

  for (const tu of user.tenantUsers) {
    if (tu.role.slug === 'master') {
      return new Set([
        'manage_tenants',
        'manage_features',
        'manage_users',
        'manage_drivers',
        'manage_billing',
        'view_reports',
        'manage_brand',
        'manage_roles',
        'manage_cities',
        'switch_tenant',
      ])
    }
    for (const rp of tu.role.rolePermissions) {
      permissions.add(rp.permission.slug as PermissionSlug)
    }
  }

  for (const ep of user.extraPermissions) {
    const slug = ep.permission.slug as PermissionSlug
    if (ep.type === 'grant') {
      permissions.add(slug)
    } else if (ep.type === 'revoke') {
      permissions.delete(slug)
    }
  }

  return permissions
}

export async function hasPermission(
  userId: string,
  permission: PermissionSlug
): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  return permissions.has(permission)
}

export async function hasAnyPermission(
  userId: string,
  requiredPermissions: PermissionSlug[]
): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  return requiredPermissions.some((p) => permissions.has(p))
}

export async function hasAllPermissions(
  userId: string,
  requiredPermissions: PermissionSlug[]
): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  return requiredPermissions.every((p) => permissions.has(p))
}

export async function getUserTenantIds(userId: string): Promise<string[]> {
  const tenantUsers = await prisma.tenantUser.findMany({
    where: { userId, isActive: true },
    select: { tenantId: true },
  })
  return tenantUsers.map((tu) => tu.tenantId)
}

export async function canAccessTenant(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  if (permissions.has('manage_tenants')) {
    const isMaster = await isUserMaster(userId)
    if (isMaster) return true
  }

  const tenantUser = await prisma.tenantUser.findFirst({
    where: { userId, tenantId, isActive: true },
  })
  return !!tenantUser
}

export async function canEditTenant(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const hasManage = await hasPermission(userId, 'manage_tenants')
  if (!hasManage) return false

  const isMaster = await isUserMaster(userId)
  if (isMaster) return true

  const tenantUser = await prisma.tenantUser.findFirst({
    where: { userId, tenantId, isActive: true },
  })
  return !!tenantUser
}

export async function canViewAllTenants(userId: string): Promise<boolean> {
  const isMaster = await isUserMaster(userId)
  return isMaster
}

export async function isUserMaster(userId: string): Promise<boolean> {
  const tenantUser = await prisma.tenantUser.findFirst({
    where: {
      userId,
      isActive: true,
      role: { slug: 'master' },
    },
  })
  return !!tenantUser
}

export async function isUserGestor(userId: string): Promise<boolean> {
  const tenantUser = await prisma.tenantUser.findFirst({
    where: {
      userId,
      isActive: true,
      role: { slug: 'gestor' },
    },
  })
  return !!tenantUser
}

export async function getUserRole(
  userId: string,
  tenantId?: string
): Promise<string | null> {
  const where: { userId: string; isActive: boolean; tenantId?: string } = {
    userId,
    isActive: true,
  }
  if (tenantId) where.tenantId = tenantId

  const tenantUser = await prisma.tenantUser.findFirst({
    where,
    include: { role: true },
    orderBy: { createdAt: 'asc' },
  })
  return tenantUser?.role.slug ?? null
}

export interface EditableFields {
  name: boolean
  slug: boolean
  logo: boolean
  primaryColor: boolean
  secondaryColor: boolean
  isActive: boolean
  showPassengerAds: boolean
  linkedCity: boolean
  features: boolean
}

export async function getEditableFields(
  userId: string,
  tenantId: string
): Promise<EditableFields> {
  const isMaster = await isUserMaster(userId)

  if (isMaster) {
    return {
      name: true,
      slug: true,
      logo: true,
      primaryColor: true,
      secondaryColor: true,
      isActive: true,
      showPassengerAds: true,
      linkedCity: true,
      features: true,
    }
  }

  const canEdit = await canEditTenant(userId, tenantId)
  if (!canEdit) {
    return {
      name: false,
      slug: false,
      logo: false,
      primaryColor: false,
      secondaryColor: false,
      isActive: false,
      showPassengerAds: false,
      linkedCity: false,
      features: false,
    }
  }

  return {
    name: true,
    slug: false,
    logo: true,
    primaryColor: true,
    secondaryColor: true,
    isActive: false,
    showPassengerAds: false,
    linkedCity: false,
    features: false,
  }
}

export const PERMISSION_LABELS: Record<PermissionSlug, string> = {
  manage_tenants: 'Gerenciar Centrais',
  manage_features: 'Gerenciar Funcionalidades',
  manage_users: 'Gerenciar Usuários',
  manage_drivers: 'Gerenciar Motoristas',
  manage_billing: 'Gerenciar Financeiro',
  view_reports: 'Ver Relatórios',
  manage_brand: 'Gerenciar Marca',
  manage_roles: 'Gerenciar Roles',
  manage_cities: 'Gerenciar Cidades',
  switch_tenant: 'Alternar Central',
}
