import { PartnerApprovedGate } from '@/components/partner/PartnerApprovedGate'
import { PartnerModulePlaceholder } from '@/components/partner/PartnerModulePlaceholder'

export default function PainelMapasPage() {
  return (
    <PartnerApprovedGate>
      <PartnerModulePlaceholder
        title="Mapas & cobertura"
        description="Áreas de atuação e cidades atendidas pela central."
      />
    </PartnerApprovedGate>
  )
}
