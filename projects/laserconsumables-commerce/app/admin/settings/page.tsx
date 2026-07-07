import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SiteSettingsForm from '@/components/admin/SiteSettingsForm'

export default async function AdminSettingsPage() {
  await requireAdmin()

  const settings = await prisma.siteSetting.findMany({
    orderBy: { key: 'asc' },
  })

  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting
    return acc
  }, {} as Record<string, typeof settings[0]>)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Site Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic site configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <SiteSettingsForm
              settings={[
                { key: 'site_name', label: 'Site Name', type: 'string' },
                { key: 'site_description', label: 'Site Description', type: 'string' },
                { key: 'currency', label: 'Currency', type: 'string' },
                { key: 'tax_rate', label: 'Tax Rate (%)', type: 'number' },
              ]}
              initialValues={settingsMap}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Visual settings</CardDescription>
          </CardHeader>
          <CardContent>
            <SiteSettingsForm
              settings={[
                { key: 'logo_url', label: 'Logo URL', type: 'image' },
                { key: 'primary_color', label: 'Primary Color', type: 'string' },
              ]}
              initialValues={settingsMap}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Settings</CardTitle>
            <CardDescription>ShipStation and shipping configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <SiteSettingsForm
              settings={[
                { key: 'shipping_from_name', label: 'Ship From Name', type: 'string' },
                { key: 'shipping_from_address1', label: 'Ship From Address', type: 'string' },
                { key: 'shipping_from_address2', label: 'Ship From Address 2', type: 'string' },
                { key: 'shipping_from_city', label: 'Ship From City', type: 'string' },
                { key: 'shipping_from_state', label: 'Ship From State', type: 'string' },
                { key: 'shipping_from_zip', label: 'Ship From ZIP', type: 'string' },
                { key: 'shipping_from_country', label: 'Ship From Country', type: 'string' },
                { key: 'auto_create_labels', label: 'Auto-Create Labels', type: 'boolean' },
                { key: 'default_carrier', label: 'Default Carrier Code', type: 'string' },
                { key: 'default_service', label: 'Default Service Code', type: 'string' },
                { key: 'default_package', label: 'Default Package Type', type: 'string' },
              ]}
              initialValues={settingsMap}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

