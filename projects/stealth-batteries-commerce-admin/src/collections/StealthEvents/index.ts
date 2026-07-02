import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/is-admin'
import { adminOrPublished } from '@/access/authenticatedOrPublished'
import { slugField } from '@/fields/slug'
import { defaultLexical } from '@/fields/defaultLexical'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { revalidateEvent } from './hooks/revalidateEvent'
import { generateExcerpt } from './hooks/generateExcerpt'

export const StealthEvents: CollectionConfig = {
  slug: 'stealth-events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'eventDate', '_status', 'createdAt'],
    group: 'Content',
  },
  access: {
    read: adminOrPublished,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [generateExcerpt, populatePublishedAt],
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
      name: 'eventStartDate',
      type: 'date',
      required: false,
      admin: {
        description: 'When does this event start? (Times are in Phoenix/Arizona timezone)',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'eventEndDate',
      type: 'date',
      required: false,
      admin: {
        description: 'When does this event end? (Times are in Phoenix/Arizona timezone)',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      validate: (value, { data }: { data: { eventStartDate?: string } }) => {
        if (!value || !data?.eventStartDate) return true
        if (new Date(value) < new Date(data.eventStartDate)) {
          return 'End date must be after start date'
        }
        return true
      },
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
  ],
}
