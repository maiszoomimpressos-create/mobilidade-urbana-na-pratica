import React, { createContext, useContext, useEffect, useState } from 'react'
import { getStoredTenantSlug, setTenantSlug, fetchBranding, type BrandingConfig } from '@/lib/branding'

type BrandingContextType = {
  branding: BrandingConfig
  setTenantFromSlug: (slug: string) => Promise<void>
}

const defaultBranding: BrandingConfig = {
  name: 'Mai Drive',
  slug: 'mai-drive',
  logo: null,
  primaryColor: '#ebb000',
  secondaryColor: '#050505',
}

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  setTenantFromSlug: async () => {},
})

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding)

  const loadBranding = async (slug: string) => {
    const config = await fetchBranding(slug)
    setBranding(config)
  }

  useEffect(() => {
    let cancelled = false
    getStoredTenantSlug().then((slug) => {
      if (!cancelled) loadBranding(slug || 'mai-drive')
    })
    return () => { cancelled = true }
  }, [])

  const setTenantFromSlug = async (slug: string) => {
    await setTenantSlug(slug)
    await loadBranding(slug)
  }

  return (
    <BrandingContext.Provider value={{ branding, setTenantFromSlug }}>
      {children}
    </BrandingContext.Provider>
  )
}

export const useBranding = () => useContext(BrandingContext)
