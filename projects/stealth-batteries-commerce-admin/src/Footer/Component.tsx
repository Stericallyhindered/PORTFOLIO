import { FooterClient } from './ComponentClient'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'

import type { Footer } from '@/payload-types'

export default async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()

  return <FooterClient data={footerData} />
}
