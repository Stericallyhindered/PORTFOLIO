import { getPayloadClient } from '../getPayload'

export async function getBulkDiscountLevels() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'bulk-discount-levels',
    where: { active: { equals: true } },
    sort: 'threshold',
    limit: 0,
    pagination: false,
  })
  return docs
}
