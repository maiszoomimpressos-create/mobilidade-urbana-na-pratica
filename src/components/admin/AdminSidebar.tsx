"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  BarChart3,
  MapPin,
  FileText,
  Database,
} from "lucide-react"
import { cn } from "@/lib/utils"

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Parceiros",
    href: "/admin/parceiros",
    icon: Building2,
  },
  {
    title: "Usuários",
    href: "/admin/usuarios",
    icon: Users,
  },
  {
    title: "Planos",
    href: "/admin/planos",
    icon: CreditCard,
  },
  {
    title: "Relatórios",
    href: "/admin/relatorios",
    icon: BarChart3,
  },
  {
    title: "Cidades",
    href: "/admin/cidades",
    icon: MapPin,
  },
  {
    title: "Mapas",
    href: "/admin/mapas",
    icon: FileText,
  },
  {
    title: "Dados",
    href: "/admin/dados",
    icon: Database,
  },
  {
    title: "Configurações",
    href: "/admin/configuracoes",
    icon: Settings,
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-hero border-r border-primary/10 flex flex-col">
      {/* Logo */}
      <Link href="/" className="p-6 border-b border-primary/10 block hover:opacity-90 transition-opacity">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-mobility-gradient flex items-center justify-center">
            <MapPin className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-display font-bold text-hero-foreground block">
              Mai Drive
            </span>
            <span className="text-xs text-hero-foreground/60">Admin Master</span>
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-mobility-gradient text-primary-foreground shadow-lg"
                  : "text-hero-foreground/70 hover:bg-hero-foreground/10 hover:text-hero-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.title}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-primary/10">
        <div className="text-xs text-hero-foreground/50 text-center">
          © 2024 Mai Drive
        </div>
      </div>
    </aside>
  )
}

