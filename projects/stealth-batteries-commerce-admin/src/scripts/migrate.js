import { migrate } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import configPromise from '../payload.config'

const migratePayload = async () => {
  const payload = await getPayload({ config: configPromise })

  try {
    await migrate({
      payload,
      migrationDir: './src/migrations',
    })
    console.log('Migration completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('Error running migration:', error)
    process.exit(1)
  }
}

migratePayload()
