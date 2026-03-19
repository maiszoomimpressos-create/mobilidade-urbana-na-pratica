"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CreditCard, MapPin, Users, Settings, CarFront } from "lucide-react"
import { cn } from "@/lib/utils"

const partnerNav = [
  { title: "Visão geral", href: "/painel", icon: LayoutDashboard, requiresApproval: false },
  { title: "Financeiro", href: "/painel/financeiro", icon: CreditCard, requiresApproval: true },
  { title: "Tipos de corrida", href: "/painel/tipos-de-corrida", icon: CarFront, requiresApproval: true },
  { title: "Mapas & Cobertura", href: "/painel/mapas", icon: MapPin, requiresApproval: true },
  { title: "Equipe / Motoristas", href: "/painel/motoristas", icon: Users, requiresApproval: true },
  { title: "Aplicativo & Marca", href: "/painel/app", icon: Settings, requiresApproval: true },
] as const

type PartnerSidebarProps = {
  /** Quando a central está aprovada, libera itens além da visão geral. */
  modulesUnlocked?: boolean
}

export default function PartnerSidebar({ modulesUnlocked = false }: PartnerSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-hero border-r border-primary/10 flex flex-col shrink-0">
      <Link href="/" className="p-6 border-b border-primary/10 block hover:opacity-90 transition-opacity">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-mobility-gradient flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-display font-bold text-hero-foreground block">
              Minha central
            </span>
            <span className="text-xs text-hero-foreground/60">Painel do parceiro</span>
          </div>
        </div>
      </Link>

      <nav className="flex-1 p-4 space-y-1">
        {partnerNav.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          const disabled = item.requiresApproval && !modulesUnlocked

          const content = (
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm",
                disabled
                  ? "opacity-60 cursor-not-allowed border border-dashed border-primary/30"
                  : "cursor-pointer",
                isActive && !disabled
                  ? "bg-mobility-gradient text-primary-foreground shadow-lg"
                  : !disabled && "text-hero-foreground/70 hover:bg-hero-foreground/10 hover:text-hero-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium flex-1">{item.title}</span>
              {disabled && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                  Em breve
                </span>
              )}
            </div>
          )

          if (disabled) {
            return (
              <div key={item.href}>
                {content}
              </div>
            )
          }

          return (
            <Link key={item.href} href={item.href}>
              {content}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-primary/10 text-xs text-hero-foreground/50 text-center">
        © {new Date().getFullYear()} Mai Drive
      </div>
    </aside>
  )
}
