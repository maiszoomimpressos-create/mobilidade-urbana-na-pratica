import AsyncStorage from '@react-native-async-storage/async-storage'
import { getApiBaseUrl } from '@/lib/apiBaseUrl'

const TENANT_SLUG_KEY = '@passenger:tenant_slug'
const TENANT_OVERRIDE_KEY = '@passenger:tenant_override'

export type BrandingConfig = {
  name: string
  slug: string
  logo: string | null
  primaryColor: string
  secondaryColor: string | null
  showPassengerAds: boolean
}

export type AvailableTenant = {
  id: string
  name: string
  slug: string
  logo: string | null
  linkedCity: {
    id: string
    name: string
    state: string
  } | null
}

export type UserTenantsResponse = {
  canSwitch: boolean
  tenants: AvailableTenant[]
  isMaster?: boolean
  message?: string
}

const DEFAULT_BRANDING: BrandingConfig = {
  name: 'Mai Drive',
  slug: 'mai-drive',
  logo: null,
  primaryColor: '#ebb000',
  secondaryColor: '#050505',
  showPassengerAds: false,
}

export async function getStoredTenantSlug(): Promise<string | null> {
  try {
    const override = await AsyncStorage.getItem(TENANT_OVERRIDE_KEY)
    if (override) return override
    return await AsyncStorage.getItem(TENANT_SLUG_KEY)
  } catch {
    return null
  }
}

export async function setTenantSlug(slug: string): Promise<void> {
  try {
    await AsyncStorage.setItem(TENANT_SLUG_KEY, slug)
  } catch {}
}

export async function setTenantOverride(slug: string | null): Promise<void> {
  try {
    if (slug) {
      await AsyncStorage.setItem(TENANT_OVERRIDE_KEY, slug)
    } else {
      await AsyncStorage.removeItem(TENANT_OVERRIDE_KEY)
    }
  } catch {}
}

export async function getTenantOverride(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TENANT_OVERRIDE_KEY)
  } catch {
    return null
  }
}

export async function clearTenantOverride(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TENANT_OVERRIDE_KEY)
  } catch {}
}

export async function fetchBranding(slug: string): Promise<BrandingConfig> {
  const apiUrl = getApiBaseUrl()

  try {
    const res = await fetch(`${apiUrl}/api/app/tenant-config?slug=${encodeURIComponent(slug)}`)
    const data = await res.json()
    return {
      name: data.name ?? DEFAULT_BRANDING.name,
      slug: data.slug ?? slug,
      logo: data.logo ?? null,
      primaryColor: data.primaryColor ?? DEFAULT_BRANDING.primaryColor,
      secondaryColor: data.secondaryColor ?? DEFAULT_BRANDING.secondaryColor,
      showPassengerAds: Boolean(data.showPassengerAds),
    }
  } catch {
    return { ...DEFAULT_BRANDING, name: slug === 'mai-drive' ? 'Mai Drive' : slug }
  }
}

export async function fetchUserTenants(token: string): Promise<UserTenantsResponse> {
  const apiUrl = getApiBaseUrl()

  try {
    const res = await fetch(`${apiUrl}/api/app/user-tenants`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const data = await res.json()
    return {
      canSwitch: Boolean(data.canSwitch),
      tenants: Array.isArray(data.tenants) ? data.tenants : [],
      isMaster: Boolean(data.isMaster),
      message: data.message,
    }
  } catch {
    return { canSwitch: false, tenants: [] }
  }
}
