import { PartnerApprovedGate } from '@/components/partner/PartnerApprovedGate'
import { PartnerModulePlaceholder } from '@/components/partner/PartnerModulePlaceholder'

export default function PainelFinanceiroPage() {
  return (
    <PartnerApprovedGate>
      <PartnerModulePlaceholder
        title="Financeiro"
        description="Faturamento, repasses e taxas da central."
      />
    </PartnerApprovedGate>
  )
}
