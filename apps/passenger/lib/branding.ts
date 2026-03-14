import AsyncStorage from '@react-native-async-storage/async-storage'

const TENANT_SLUG_KEY = '@passenger:tenant_slug'
const BRANDING_CACHE_KEY = '@passenger:branding_cache'

export type BrandingConfig = {
  name: string
  slug: string
  logo: string | null
  primaryColor: string
  secondaryColor: string | null
}

const DEFAULT_BRANDING: BrandingConfig = {
  name: 'Mai Drive',
  slug: 'mai-drive',
  logo: null,
  primaryColor: '#ebb000',
  secondaryColor: '#050505',
}

export async function getStoredTenantSlug(): Promise<string | null> {
  try {
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

export async function fetchBranding(slug: string): Promise<BrandingConfig> {
  const apiUrl = process.env.EXPO_PUBLIC_APP_API_URL?.trim()
  if (!apiUrl) return { ...DEFAULT_BRANDING, name: slug === 'mai-drive' ? 'Mai Drive' : slug }

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/app/tenant-config?slug=${encodeURIComponent(slug)}`)
    const data = await res.json()
    return {
      name: data.name ?? DEFAULT_BRANDING.name,
      slug: data.slug ?? slug,
      logo: data.logo ?? null,
      primaryColor: data.primaryColor ?? DEFAULT_BRANDING.primaryColor,
      secondaryColor: data.secondaryColor ?? DEFAULT_BRANDING.secondaryColor,
    }
  } catch {
    return { ...DEFAULT_BRANDING, name: slug === 'mai-drive' ? 'Mai Drive' : slug }
  }
}
