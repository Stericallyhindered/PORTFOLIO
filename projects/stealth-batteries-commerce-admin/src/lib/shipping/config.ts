import type { ShippingConfig } from '@/payload-types'
import { getPayloadClient } from '@/getPayload'

interface GetActiveShippingConfigParams {
  dealerId: string
  destinationState: string
}

export async function getActiveShippingConfig({
  dealerId,
  destinationState,
}: GetActiveShippingConfigParams): Promise<ShippingConfig> {
  const payload = await getPayloadClient()

  const shippingConfigs = await payload.find({
    collection: 'shipping-config',
    where: {
      isActive: {
        equals: true,
      },
    },
  })

  console.log('Shipping configs response:', JSON.stringify(shippingConfigs, null, 2))

  const activeConfig = shippingConfigs.docs[0] as ShippingConfig

  if (!activeConfig) {
    console.log('No active config found for dealer')
    throw new Error('No active shipping configuration found')
  }

  // Check if destination state is excluded
  const isExcluded = activeConfig.excludedStates?.some(
    (excluded) => excluded.state === destinationState,
  )

  if (isExcluded) {
    throw new Error('Shipping not available to this location')
  }

  return activeConfig
}
