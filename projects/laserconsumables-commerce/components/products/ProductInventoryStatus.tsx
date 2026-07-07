import { getInventoryStatus } from '@/lib/services/inventory'
import InventoryBadge from './InventoryBadge'

interface ProductInventoryStatusProps {
  variantId: string
  showQuantity?: boolean
}

export default async function ProductInventoryStatus({
  variantId,
  showQuantity = true,
}: ProductInventoryStatusProps) {
  const status = await getInventoryStatus(variantId)

  return <InventoryBadge status={status} showQuantity={showQuantity} />
}





