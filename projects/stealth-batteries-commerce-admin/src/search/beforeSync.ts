import { BeforeSync, DocToSync } from '@payloadcms/plugin-search/types'

export const beforeSyncWithSearch: BeforeSync = async ({ originalDoc, searchDoc, payload }) => {
  const {
    doc: { relationTo: collection },
  } = searchDoc

  const {
    slug,
    id,
    categories,
    title,
    meta,
    excerpt,
    heroImage,
    price,
    modelNumber,
    productType,
    shippingDetails,
  } = originalDoc

  const modifiedDoc: DocToSync = {
    ...searchDoc,
    slug,
    title: title || '',
    meta: {
      ...meta,
      title: meta?.title || title,
      image: meta?.image?.id || meta?.image || heroImage,
      description: meta?.description,
    },
    categories: [],
    heroImage,
    price,
    modelNumber,
    productType,
    // Only include shipping details for products
    ...(collection === 'products' ? { shippingDetails } : {}),
  }

  if (categories && Array.isArray(categories) && categories.length > 0) {
    // get full categories and keep a flattened copy of their most important properties
    try {
      const mappedCategories = categories.map((category) => {
        const { id, title } = category

        return {
          relationTo: 'categories',
          id,
          title,
        }
      })

      modifiedDoc.categories = mappedCategories
    } catch (err) {
      console.error(
        `Failed. Category not found when syncing collection '${collection}' with id: '${id}' to search.`,
      )
    }
  }

  return modifiedDoc
}
