'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Só permite ver módulos além da visão geral quando a central está aprovada.
 * Evita acesso direto por URL (/painel/financeiro etc.) com central pendente.
 */
export function PartnerApprovedGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/partner/me')
      .then((r) => r.json().catch(() => ({})))
      .then((j) => {
        if (cancelled) return
        const t = j?.tenant
        if (t?.approvalStatus === 'approved') {
          setAllowed(true)
        } else {
          router.replace('/painel')
        }
      })
      .catch(() => {
        if (!cancelled) router.replace('/painel')
      })
    return () => {
      cancelled = true
    }
  }, [router])

  if (allowed !== true) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground text-sm">Verificando permissões...</p>
      </div>
    )
  }

  return <>{children}</>
}
