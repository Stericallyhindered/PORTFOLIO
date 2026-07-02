import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.create({
    collection: 'shipping-config',
    data: {
      name: 'Default Dealer Shipping',
      isActive: true,
      freeShippingThreshold: 2500,
      flatRateAmount: 50,
      excludedStates: [],
      additionalNotes: 'Default shipping configuration for dealers',
    },
  })
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Find and delete the default shipping config
  const configs = await payload.find({
    collection: 'shipping-config',
    where: {
      name: {
        equals: 'Default Dealer Shipping',
      },
    },
  })

  if (configs.docs.length > 0) {
    await payload.delete({
      collection: 'shipping-config',
      id: configs.docs[0].id,
    })
  }
}
