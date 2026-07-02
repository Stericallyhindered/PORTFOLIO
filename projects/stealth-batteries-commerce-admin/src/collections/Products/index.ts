import type { CollectionConfig } from 'payload'

import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { revalidateDelete, revalidateProduct } from './hooks/revalidateProduct'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from '@/fields/slug'
import { isAdmin } from '@/access/is-admin'
import { adminOrPublished } from '@/access/authenticatedOrPublished'

export const Products: CollectionConfig<'products'> = {
  slug: 'products',
  access: {
    admin: ({ req }) => {
      const user = req.user as { canAccessAdmin?: boolean } | null
      return Boolean(user?.canAccessAdmin)
    },
    create: isAdmin,
    delete: isAdmin,
    read: adminOrPublished,
    update: isAdmin,
  },
  // This config controls what's populated by default when a post is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'posts'>
  defaultPopulate: {
    title: true,
    slug: true,
    heroImage: true,
  },
  admin: {
    defaultColumns: ['title', 'productType', 'slug', 'updatedAt'],
    group: 'Shop',
    livePreview: {
      url: ({ data, req }) => {
        const path = generatePreviewPath({
          slug: typeof data?.slug === 'string' ? data.slug : '',
          collection: 'products',
          req,
        })

        return path
      },
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: typeof data?.slug === 'string' ? data.slug : '',
        collection: 'products',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'displayName',
      type: 'text',
      required: false,
      defaultValue: '',
      admin: {
        description:
          'Display Name for customer-facing product cards. Leave empty to use the main title.',
      },
    },
    {
      name: 'subtitle',
      type: 'text',
      required: false,
      defaultValue: '',
      admin: {
        description:
          'Secondary display text for product cards (e.g., shown above or below the image).',
      },
    },
    {
      name: 'releaseDate',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        description:
          'The date when this product will be available for purchase. Set to a past date for currently available products.',
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'MMM d, yyyy',
        },
      },
      defaultValue: '2024-01-01', // Default to past date for existing products
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
      admin: {
        description: 'General product description that applies to all product types',
      },
    },
    {
      name: 'productType',
      type: 'select',
      required: true,
      defaultValue: 'battery',
      options: [
        {
          label: 'Battery',
          value: 'battery',
        },
        {
          label: 'Accessory',
          value: 'accessory',
        },
        {
          label: 'Swag',
          value: 'swag',
        },
      ],
    },
    {
      name: 'swagType',
      type: 'select',
      required: false,
      admin: {
        condition: (data) => data.productType === 'swag',
        description: 'Select the type of swag item',
      },
      options: [
        {
          label: 'Apparel',
          value: 'apparel',
        },
        {
          label: 'Hat',
          value: 'hat',
        },
        {
          label: 'Sticker',
          value: 'sticker',
        },
        {
          label: 'Other',
          value: 'other',
        },
      ],
    },
    ...slugField(),
    {
      name: 'productCategories',
      type: 'relationship',
      relationTo: 'productCategories',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Select product categories',
      },
    },
    {
      name: 'legacyCategories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Legacy categories - please use product categories instead',
        hidden: true,
      },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'dealerPrice',
      type: 'number',
      required: true,
      defaultValue: 400,
      min: 0,
      admin: {
        description: 'Dealer Price - The price dealers pay for this product',
        position: 'sidebar',
      },
    },
    {
      name: 'compareAtPrice',
      type: 'number',
      min: 0,
      admin: {
        description: 'Original price for showing discounts',
      },
    },
    {
      name: 'inventory',
      type: 'group',
      fields: [
        {
          name: 'trackInventory',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 0,
        },
        {
          name: 'lowStockThreshold',
          type: 'number',
          min: 0,
          defaultValue: 5,
        },
      ],
    },
    {
      name: 'variants',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'options',
          type: 'array',
          fields: [
            {
              name: 'value',
              type: 'text',
              required: true,
            },
            {
              name: 'priceAdjustment',
              type: 'number',
              defaultValue: 0,
            },
            {
              name: 'inventory',
              type: 'number',
              min: 0,
              defaultValue: 0,
            },
          ],
        },
      ],
    },
    {
      name: 'modelNumber',
      type: 'text',
      required: false,
      admin: {
        description: 'The model number of the product',
        condition: (data) => data.productType === 'battery' || data.productType === 'accessory',
      },
    },
    {
      name: 'shippingDetails',
      type: 'group',
      admin: {
        description: 'Product shipping dimensions and weight',
        position: 'sidebar',
      },
      fields: [
        {
          name: 'weight',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 1,
          admin: {
            description: 'Weight in pounds',
            step: 0.1,
          },
        },
        {
          name: 'length',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 16,
          admin: {
            description: 'Length in inches',
            step: 0.1,
          },
        },
        {
          name: 'width',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 12,
          admin: {
            description: 'Width in inches',
            step: 0.1,
          },
        },
        {
          name: 'height',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 12,
          admin: {
            description: 'Height in inches',
            step: 0.1,
          },
        },
        {
          name: 'freightClass',
          type: 'select',
          admin: {
            description: 'NMFC freight class (for LTL shipments)',
            condition: (data, siblingData) =>
              siblingData?.weight >= 150 || // Show for heavy items
              siblingData?.length > 108 || // or long items (9 feet)
              siblingData?.width * siblingData?.height * siblingData?.length > 5184, // or large volume (3x3x4 feet)
          },
          options: [
            { label: 'Class 50', value: '50' },
            { label: 'Class 55', value: '55' },
            { label: 'Class 60', value: '60' },
            { label: 'Class 65', value: '65' },
            { label: 'Class 70', value: '70' },
            { label: 'Class 77.5', value: '77.5' },
            { label: 'Class 85', value: '85' },
            { label: 'Class 92.5', value: '92.5' },
            { label: 'Class 100', value: '100' },
            { label: 'Class 110', value: '110' },
            { label: 'Class 125', value: '125' },
            { label: 'Class 150', value: '150' },
            { label: 'Class 175', value: '175' },
            { label: 'Class 200', value: '200' },
            { label: 'Class 250', value: '250' },
            { label: 'Class 300', value: '300' },
            { label: 'Class 400', value: '400' },
            { label: 'Class 500', value: '500' },
          ],
        },
        {
          name: 'requiresLiftgate',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Requires liftgate for delivery',
            condition: (data, siblingData) =>
              siblingData?.weight >= 150 || // Show for heavy items
              siblingData?.length > 108, // or long items
          },
        },
        {
          name: 'stackable',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Can this product be stacked during shipping?',
          },
        },
        {
          name: 'hazmat',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Is this a hazardous material?',
          },
        },
        {
          name: 'customPackaging',
          type: 'group',
          admin: {
            description: 'Custom packaging dimensions (if different from product)',
          },
          fields: [
            {
              name: 'useCustom',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Use custom packaging dimensions',
              },
            },
            {
              name: 'packageLength',
              type: 'number',
              min: 0,
              admin: {
                description: 'Package length in inches',
                step: 0.1,
                condition: (data, siblingData) => siblingData?.useCustom,
              },
            },
            {
              name: 'packageWidth',
              type: 'number',
              min: 0,
              admin: {
                description: 'Package width in inches',
                step: 0.1,
                condition: (data, siblingData) => siblingData?.useCustom,
              },
            },
            {
              name: 'packageHeight',
              type: 'number',
              min: 0,
              admin: {
                description: 'Package height in inches',
                step: 0.1,
                condition: (data, siblingData) => siblingData?.useCustom,
              },
            },
            {
              name: 'packageWeight',
              type: 'number',
              min: 0,
              admin: {
                description: 'Additional package weight in pounds',
                step: 0.1,
                condition: (data, siblingData) => siblingData?.useCustom,
              },
            },
          ],
        },
        {
          name: 'shippingNotes',
          type: 'textarea',
          admin: {
            description: 'Additional shipping notes or special handling instructions',
          },
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Media',
          fields: [
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'batteryMascot',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Mascot image for the battery line (e.g. Strykerfish)',
                condition: (data) => data.productType === 'battery',
              },
              defaultValue: 5,
            },
            {
              name: 'gallery',
              type: 'array',
              admin: {
                description: 'Add multiple images to the product gallery',
              },
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'caption',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          label: 'Battery Specifications',
          fields: [
            {
              name: 'specifications',
              type: 'group',
              admin: {
                condition: (data) =>
                  data.productType === 'battery' ||
                  (data.productType === 'accessory' &&
                    data.accessoryDetails?.accessoryType === 'charger'),
              },
              fields: [
                {
                  name: 'batteryType',
                  type: 'text',
                  required: false,
                  admin: {
                    description: 'Type of battery (e.g. Lithium Iron Phosphate)',
                  },
                },
                {
                  name: 'modelFamily',
                  type: 'text',
                  required: false,
                  admin: {
                    description: 'The product line this battery belongs to (e.g. Kraken)',
                  },
                },
                {
                  name: 'grade',
                  type: 'select',
                  required: false,
                  options: [
                    {
                      label: 'Grade A',
                      value: 'A',
                    },
                    {
                      label: 'Grade B',
                      value: 'B',
                    },
                    {
                      label: 'Grade C',
                      value: 'C',
                    },
                  ],
                },
                {
                  name: 'purpose',
                  type: 'select',
                  required: false,
                  options: [
                    {
                      label: 'Dual Purpose',
                      value: 'dual',
                    },
                    {
                      label: 'Starting',
                      value: 'starting',
                    },
                    {
                      label: 'Deep Cycle',
                      value: 'deepCycle',
                    },
                  ],
                },
                {
                  name: 'ampHours',
                  type: 'number',
                  required: false,
                  admin: {
                    description: 'Amp Hours (e.g. 135Ah)',
                  },
                },
                {
                  name: 'wattHours',
                  type: 'number',
                  required: false,
                  admin: {
                    description: 'Watt Hours (e.g. 1728Wh)',
                  },
                },
                {
                  name: 'voltage',
                  type: 'group',
                  admin: {
                    condition: (data) =>
                      data.productType === 'battery' ||
                      (data.productType === 'accessory' &&
                        data.accessoryDetails?.accessoryType === 'charger'),
                  },
                  fields: [
                    {
                      name: 'displayedVoltage',
                      type: 'number',
                      required: false,
                      defaultValue: 12,
                      admin: {
                        description: 'Displayed/Advertised Voltage (e.g. 12V, 24V, 36V)',
                      },
                    },
                    {
                      name: 'standard',
                      type: 'number',
                      required: false,
                      admin: {
                        description: 'Standard Voltage (e.g. 12.8V)',
                      },
                    },
                    {
                      name: 'charging',
                      type: 'number',
                      required: false,
                      admin: {
                        description: 'Charging Voltage (e.g. 14.6V)',
                      },
                    },
                  ],
                },
                {
                  name: 'current',
                  type: 'group',
                  admin: {
                    condition: (data) => data.productType === 'battery',
                  },
                  fields: [
                    {
                      name: 'maxChargingCurrent',
                      type: 'number',
                      required: false,
                      admin: {
                        description: 'Maximum Charging Current (e.g. 100A)',
                      },
                    },
                    {
                      name: 'maxContinuousDischarge',
                      type: 'number',
                      required: false,
                      admin: {
                        description: 'Maximum Continuous Discharge Current (e.g. 200A)',
                      },
                    },
                    {
                      name: 'coldCranking',
                      type: 'number',
                      required: false,
                      admin: {
                        description: 'Cold Cranking Amps (e.g. 1200A)',
                      },
                    },
                  ],
                },
                {
                  name: 'dimensions',
                  type: 'group',
                  admin: {
                    condition: (data) => data.productType === 'battery',
                  },
                  fields: [
                    {
                      name: 'length',
                      type: 'number',
                      required: false,
                      admin: {
                        description: 'Length in inches',
                      },
                    },
                    {
                      name: 'width',
                      type: 'number',
                      required: false,
                      admin: {
                        description: 'Width in inches',
                      },
                    },
                    {
                      name: 'height',
                      type: 'number',
                      required: false,
                      admin: {
                        description: 'Height in inches',
                      },
                    },
                  ],
                },
                {
                  name: 'weight',
                  type: 'number',
                  required: false,
                  admin: {
                    condition: (data) => data.productType === 'battery',
                    description: 'Weight in pounds',
                  },
                },
                {
                  name: 'cycles',
                  type: 'number',
                  required: false,
                  admin: {
                    condition: (data) => data.productType === 'battery',
                    description: 'Number of cycles (e.g. 6000)',
                  },
                },
                {
                  name: 'hasBluetoothConnectivity',
                  type: 'checkbox',
                  label: 'Bluetooth Connectivity',
                  defaultValue: false,
                  admin: {
                    condition: (data) => data.productType === 'battery',
                  },
                },
                {
                  name: 'maxTemperature',
                  type: 'number',
                  required: false,
                  admin: {
                    condition: (data) => data.productType === 'battery',
                    description: 'Maximum operating temperature in Fahrenheit (e.g. 140)',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Accessory Details',
          fields: [
            {
              name: 'accessoryDetails',
              type: 'group',
              admin: {
                condition: (data) => data.productType === 'accessory',
              },
              fields: [
                {
                  name: 'accessoryType',
                  type: 'select',
                  options: [
                    { label: 'Charger', value: 'charger' },
                    { label: 'Monitor', value: 'monitor' },
                    { label: 'Cable', value: 'cable' },
                    { label: 'Mount', value: 'mount' },
                    { label: 'Tool', value: 'tool' },
                    { label: 'Other', value: 'other' },
                  ],
                },
                {
                  name: 'compatibility',
                  type: 'text',
                  admin: {
                    description: 'What battery models or systems this accessory is compatible with',
                  },
                },
                {
                  name: 'specifications',
                  type: 'textarea',
                  admin: {
                    description: 'Key specifications or features of the accessory',
                  },
                },
                {
                  name: 'dimensions',
                  type: 'group',
                  fields: [
                    {
                      name: 'length',
                      type: 'number',
                      label: 'Length (inches)',
                    },
                    {
                      name: 'width',
                      type: 'number',
                      label: 'Width (inches)',
                    },
                    {
                      name: 'height',
                      type: 'number',
                      label: 'Height (inches)',
                    },
                  ],
                },
                {
                  name: 'weight',
                  type: 'number',
                  label: 'Weight (lbs)',
                },
              ],
            },
          ],
        },
        {
          label: 'Swag Details',
          fields: [
            {
              name: 'swagDetails',
              type: 'group',
              admin: {
                condition: (data) => data.productType === 'swag',
              },
              fields: [
                {
                  name: 'material',
                  type: 'text',
                  admin: {
                    description: 'Material composition (e.g. 100% Cotton)',
                  },
                },
                {
                  name: 'careInstructions',
                  type: 'textarea',
                  admin: {
                    condition: (data) => data.swagType === 'apparel',
                  },
                },
                {
                  name: 'fit',
                  type: 'select',
                  admin: {
                    condition: (data) => data.swagType === 'apparel',
                  },
                  options: [
                    { label: 'Regular Fit', value: 'regular' },
                    { label: 'Slim Fit', value: 'slim' },
                    { label: 'Relaxed Fit', value: 'relaxed' },
                  ],
                },
                {
                  name: 'dimensions',
                  type: 'group',
                  admin: {
                    condition: (data) => data.swagType === 'sticker',
                  },
                  fields: [
                    {
                      name: 'width',
                      type: 'number',
                      label: 'Width (inches)',
                    },
                    {
                      name: 'height',
                      type: 'number',
                      label: 'Height (inches)',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),
            MetaDescriptionField({}),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'relatedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Select related products',
      },
      filterOptions: ({ id }) => {
        return {
          id: {
            not_equals: id,
          },
        }
      },
    },
  ],
  hooks: {
    afterChange: [revalidateProduct],
    afterDelete: [revalidateDelete],
    beforeChange: [
      async ({ data, req }) => {
        // If there are legacy categories, create corresponding product categories
        if (data.legacyCategories && Array.isArray(data.legacyCategories)) {
          const productCategories: number[] = []

          for (const catId of data.legacyCategories) {
            const legacyCat = await req.payload.findByID({
              collection: 'categories',
              id: catId,
            })

            if (legacyCat) {
              // Check if a product category with this slug already exists
              const existingCat = await req.payload.find({
                collection: 'productCategories',
                where: {
                  slug: {
                    equals: legacyCat.slug,
                  },
                },
              })

              let productCatId: number
              if (existingCat.docs.length > 0) {
                productCatId = existingCat.docs[0].id
              } else {
                // Create new product category
                const newCat = await req.payload.create({
                  collection: 'productCategories',
                  data: {
                    title: legacyCat.title,
                    slug: legacyCat.slug,
                    order: 999,
                  },
                })
                productCatId = newCat.id
              }

              // Add to list of categories for this product
              productCategories.push(productCatId)

              // Check for parent category and create/link if needed
              if (legacyCat.parent) {
                const parentId =
                  typeof legacyCat.parent === 'number' ? legacyCat.parent : legacyCat.parent.id
                const parentCat = await req.payload.findByID({
                  collection: 'categories',
                  id: parentId,
                })

                if (parentCat) {
                  // Check if parent product category exists
                  const existingParentCat = await req.payload.find({
                    collection: 'productCategories',
                    where: {
                      slug: {
                        equals: parentCat.slug,
                      },
                    },
                  })

                  let parentProductCatId: number
                  if (existingParentCat.docs.length > 0) {
                    parentProductCatId = existingParentCat.docs[0].id
                  } else {
                    // Create parent product category
                    const newParentCat = await req.payload.create({
                      collection: 'productCategories',
                      data: {
                        title: parentCat.title,
                        slug: parentCat.slug,
                        order: 999,
                      },
                    })
                    parentProductCatId = newParentCat.id
                  }

                  // Update the child category with parent reference
                  await req.payload.update({
                    collection: 'productCategories',
                    id: productCatId,
                    data: {
                      parent: parentProductCatId,
                    },
                  })

                  // Add parent to list of categories for this product
                  if (!productCategories.includes(parentProductCatId)) {
                    productCategories.push(parentProductCatId)
                  }
                }
              }
            }
          }

          // Update the data with the new product categories
          if (productCategories.length > 0) {
            data.productCategories = [
              ...(Array.isArray(data.productCategories) ? data.productCategories : []),
              ...productCategories,
            ]
          }
        }

        return data
      },
    ],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
