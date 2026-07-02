import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/is-admin'
import { adminOrPublished } from '@/access/authenticatedOrPublished'
import { slugField } from '@/fields/slug'
import { defaultLexical } from '@/fields/defaultLexical'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { revalidateEvent } from './StealthEvents/hooks/revalidateEvent'

export const StealthEvents: CollectionConfig = {
  slug: 'stealth-events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'subtitle', '_status', 'createdAt'],
    group: 'Content',
  },
  access: {
    read: adminOrPublished,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [populatePublishedAt],
    afterChange: [revalidateEvent],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Header/Title',
    },
    {
      name: 'subtitle',
      type: 'text',
      required: true,
    },
    {
      name: 'mainContent',
      type: 'richText',
      required: true,
      editor: defaultLexical,
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: {
        description:
          'Optional. If not provided, it will be automatically generated from the main content.',
      },
    },
    {
      name: 'mainImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'secondaryImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'secondaryHeader',
      type: 'text',
      required: true,
    },
    {
      name: 'secondarySubtitle',
      type: 'text',
      required: true,
    },
    ...slugField(),
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: '_status',
      type: 'select',
      required: true,
      admin: {
        position: 'sidebar',
      },
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
      ],
    },
  ],
}
