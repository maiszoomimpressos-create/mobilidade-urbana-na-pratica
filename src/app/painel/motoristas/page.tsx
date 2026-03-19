import { PartnerApprovedGate } from '@/components/partner/PartnerApprovedGate'
import { PartnerModulePlaceholder } from '@/components/partner/PartnerModulePlaceholder'

export default function PainelMotoristasPage() {
  return (
    <PartnerApprovedGate>
      <PartnerModulePlaceholder
        title="Equipe / motoristas"
        description="Convites, cadastro e gestão de motoristas da central."
      />
    </PartnerApprovedGate>
  )
}
