import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

type PartnerModulePlaceholderProps = {
  title: string
  description: string
}

/** Página provisória até os módulos do parceiro ganharem telas completas. */
export function PartnerModulePlaceholder({ title, description }: PartnerModulePlaceholderProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" className="gap-2 -ml-2" asChild>
        <Link href="/painel">
          <ArrowLeft className="w-4 h-4" />
          Voltar à visão geral
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Este módulo será preenchido com as ferramentas da sua central. Enquanto isso, use a{' '}
          <strong>Visão geral</strong> no menu à esquerda para acompanhar status e dados básicos.
        </CardContent>
      </Card>
    </div>
  )
}
