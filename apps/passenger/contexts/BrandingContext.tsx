import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  getStoredTenantSlug,
  setTenantSlug,
  setTenantOverride,
  getTenantOverride,
  clearTenantOverride,
  fetchBranding,
  fetchUserTenants,
  type BrandingConfig,
  type AvailableTenant,
} from '@/lib/branding'

type BrandingContextType = {
  branding: BrandingConfig
  setTenantFromSlug: (slug: string) => Promise<void>
  availableTenants: AvailableTenant[]
  canSwitchTenant: boolean
  isMaster: boolean
  hasOverride: boolean
  switchToTenant: (slug: string) => Promise<void>
  clearOverride: () => Promise<void>
  loadAvailableTenants: (token: string) => Promise<void>
}

const defaultBranding: BrandingConfig = {
  name: 'Mai Drive',
  slug: 'mai-drive',
  logo: null,
  primaryColor: '#ebb000',
  secondaryColor: '#050505',
  showPassengerAds: false,
}

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  setTenantFromSlug: async () => {},
  availableTenants: [],
  canSwitchTenant: false,
  isMaster: false,
  hasOverride: false,
  switchToTenant: async () => {},
  clearOverride: async () => {},
  loadAvailableTenants: async () => {},
})

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding)
  const [availableTenants, setAvailableTenants] = useState<AvailableTenant[]>([])
  const [canSwitchTenant, setCanSwitchTenant] = useState(false)
  const [isMaster, setIsMaster] = useState(false)
  const [hasOverride, setHasOverride] = useState(false)

  const loadBranding = useCallback(async (slug: string) => {
    const config = await fetchBranding(slug)
    setBranding(config)
  }, [])

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      const override = await getTenantOverride()
      if (override) {
        setHasOverride(true)
        if (!cancelled) await loadBranding(override)
      } else {
        const slug = await getStoredTenantSlug()
        if (!cancelled) await loadBranding(slug || 'mai-drive')
      }
    }
    init()
    return () => { cancelled = true }
  }, [loadBranding])

  const setTenantFromSlug = useCallback(async (slug: string) => {
    await setTenantSlug(slug)
    await loadBranding(slug)
  }, [loadBranding])

  const loadAvailableTenants = useCallback(async (token: string) => {
    const result = await fetchUserTenants(token)
    setAvailableTenants(result.tenants)
    setCanSwitchTenant(result.canSwitch)
    setIsMaster(result.isMaster ?? false)
  }, [])

  const switchToTenant = useCallback(async (slug: string) => {
    await setTenantOverride(slug)
    setHasOverride(true)
    await loadBranding(slug)
  }, [loadBranding])

  const clearOverrideHandler = useCallback(async () => {
    await clearTenantOverride()
    setHasOverride(false)
    const slug = await getStoredTenantSlug()
    await loadBranding(slug || 'mai-drive')
  }, [loadBranding])

  return (
    <BrandingContext.Provider
      value={{
        branding,
        setTenantFromSlug,
        availableTenants,
        canSwitchTenant,
        isMaster,
        hasOverride,
        switchToTenant,
        clearOverride: clearOverrideHandler,
        loadAvailableTenants,
      }}
    >
      {children}
    </BrandingContext.Provider>
  )
}

export const useBranding = () => useContext(BrandingContext)
