import { PartnerApprovedGate } from '@/components/partner/PartnerApprovedGate'
import { PartnerModulePlaceholder } from '@/components/partner/PartnerModulePlaceholder'

export default function PainelTiposCorridaPage() {
  return (
    <PartnerApprovedGate>
      <PartnerModulePlaceholder
        title="Tipos de corrida"
        description="Modalidades, valores e regras por cidade."
      />
    </PartnerApprovedGate>
  )
}
