import { PartnerApprovedGate } from '@/components/partner/PartnerApprovedGate'
import { PartnerModulePlaceholder } from '@/components/partner/PartnerModulePlaceholder'

export default function PainelAppMarcaPage() {
  return (
    <PartnerApprovedGate>
      <PartnerModulePlaceholder
        title="Aplicativo & marca"
        description="Cores, logo e identidade visual exibida aos passageiros."
      />
    </PartnerApprovedGate>
  )
}
