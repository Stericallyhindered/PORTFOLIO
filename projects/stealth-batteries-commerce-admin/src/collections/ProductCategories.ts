import type { CollectionConfig } from 'payload'
import type { ProductCategory } from '../payload-types'

import { anyone } from '../access/anyone'
import { isAdmin } from '@/access/is-admin'
import { slugField } from '@/fields/slug'

export const ProductCategories: CollectionConfig = {
  slug: 'productCategories',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: anyone,
    update: isAdmin,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Shop',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 999,
      admin: {
        description:
          'Lower numbers appear first (e.g. 0 for batteries, 1 for accessories, 2 for swag)',
      },
    },
    {
      name: 'featuredProduct',
      type: 'relationship',
      relationTo: 'products',
      hasMany: false,
      admin: {
        description:
          "Select a product to feature for this category. This product's image will be displayed on the main products page as the category preview.",
        position: 'sidebar',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'productCategories',
      hasMany: false,
      admin: {
        position: 'sidebar',
      },
      filterOptions: ({ id }) => {
        if (!id) return { id: { exists: true } }
        return {
          id: {
            not_equals: Number(id),
          },
        }
      },
    },
    {
      name: 'breadcrumbs',
      type: 'array',
      admin: {
        disabled: true,
      },
      fields: [
        {
          name: 'doc',
          type: 'relationship',
          relationTo: 'productCategories',
        },
        {
          name: 'url',
          type: 'text',
        },
        {
          name: 'label',
          type: 'text',
        },
      ],
      hooks: {
        beforeChange: [
          async ({ data, req }) => {
            if (!data?.parent) return []

            const breadcrumbs: {
              doc: number
              url: string
              label: string
            }[] = []

            let currentCat = (await req.payload.findByID({
              collection: 'productCategories',
              id: data.parent,
            })) as ProductCategory | null

            while (currentCat) {
              if (currentCat.title && currentCat.slug) {
                breadcrumbs.unshift({
                  doc: currentCat.id,
                  url: `/shop/categories/${currentCat.slug}`,
                  label: currentCat.title,
                })
              }

              const parentId = typeof currentCat.parent === 'number' ? currentCat.parent : null

              if (parentId) {
                currentCat = (await req.payload.findByID({
                  collection: 'productCategories',
                  id: parentId,
                })) as ProductCategory | null
              } else {
                currentCat = null
              }
            }

            return breadcrumbs
          },
        ],
      },
    },
    ...slugField(),
  ],
}
