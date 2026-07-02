import { isAdminFieldLevel } from '@/access/is-admin'
import { Field } from 'payload'

export const searchFields: Field[] = [
  {
    name: 'slug',
    type: 'text',
    index: true,
    admin: {
      readOnly: true,
    },
    access: {
      create: isAdminFieldLevel,
      update: isAdminFieldLevel,
    },
  },
  {
    name: 'meta',
    label: 'Meta',
    type: 'group',
    index: true,
    admin: {
      readOnly: true,
    },
    fields: [
      {
        type: 'text',
        name: 'title',
        label: 'Title',
      },
      {
        type: 'text',
        name: 'description',
        label: 'Description',
      },
      {
        name: 'image',
        label: 'Image',
        type: 'upload',
        relationTo: 'media',
      },
    ],
  },
  {
    label: 'Categories',
    name: 'categories',
    type: 'array',
    admin: {
      readOnly: true,
    },
    fields: [
      {
        name: 'relationTo',
        type: 'text',
      },
      {
        name: 'id',
        type: 'text',
      },
      {
        name: 'title',
        type: 'text',
      },
    ],
  },
  {
    name: 'price',
    type: 'number',
    admin: {
      readOnly: true,
    },
  },
  {
    name: 'modelNumber',
    type: 'text',
    admin: {
      readOnly: true,
    },
  },
  {
    name: 'productType',
    type: 'text',
    admin: {
      readOnly: true,
    },
  },
  {
    name: 'shippingDetails',
    type: 'group',
    admin: {
      readOnly: true,
    },
    fields: [
      {
        name: 'weight',
        type: 'number',
      },
      {
        name: 'length',
        type: 'number',
      },
      {
        name: 'width',
        type: 'number',
      },
      {
        name: 'height',
        type: 'number',
      },
      {
        name: 'stackable',
        type: 'checkbox',
      },
      {
        name: 'hazmat',
        type: 'checkbox',
      },
      {
        name: 'freightClass',
        type: 'text',
      },
      {
        name: 'requiresLiftgate',
        type: 'checkbox',
      },
    ],
  },
]
