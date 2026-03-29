'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import PartnerSidebar from '@/components/partner/PartnerSidebar'
import { partnerMeFetchInit } from '@/lib/partner-me-client'

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const [modulesUnlocked, setModulesUnlocked] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/partner/me', await partnerMeFetchInit())
        const j = await res.json().catch(() => ({}))
        if (cancelled) return
        const t = j?.tenant
        setModulesUnlocked(t?.approvalStatus === 'approved')
      } catch {
        if (!cancelled) setModulesUnlocked(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="pt-24 pb-16 flex-1 flex min-h-0">
        <PartnerSidebar modulesUnlocked={modulesUnlocked} />
        <div className="flex-1 min-w-0 px-6 py-8 overflow-auto">{children}</div>
      </main>
      <Footer />
    </div>
  )
}
