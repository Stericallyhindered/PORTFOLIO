import type { CollectionAfterChangeHook } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'

export const revalidateEvent: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = `/stealth-angle/${doc.slug}`

      payload.logger.info(`Revalidating event at path: ${path}`)

      revalidatePath(path)
      revalidateTag('events-sitemap')
    }

    // If the event was previously published, we need to revalidate the old path
    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      const oldPath = `/stealth-angle/${previousDoc.slug}`

      payload.logger.info(`Revalidating old event at path: ${oldPath}`)

      revalidatePath(oldPath)
      revalidateTag('events-sitemap')
    }

    // Always revalidate the main events listing pages when any event changes
    // This ensures that events immediately appear/disappear from current/past events
    payload.logger.info(`Revalidating events listing pages`)
    revalidatePath('/stealth-angle')
    revalidatePath('/stealth-angle/past-events')
  }
  return doc
}
