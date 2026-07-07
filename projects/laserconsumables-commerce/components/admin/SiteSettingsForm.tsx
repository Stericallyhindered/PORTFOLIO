'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SiteSettingsForm({
  settings,
  initialValues,
}: {
  settings: Array<{ key: string; label: string; type: string }>
  initialValues: Record<string, any>
}) {
  const [values, setValues] = useState(
    settings.reduce((acc, setting) => {
      acc[setting.key] = initialValues[setting.key]?.value || ''
      return acc
    }, {} as Record<string, string>)
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await Promise.all(
        settings.map((setting) =>
          fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: setting.key,
              value: values[setting.key],
              type: setting.type,
            }),
          })
        )
      )

      alert('Settings saved successfully')
    } catch (error) {
      alert('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {settings.map((setting) => (
        <div key={setting.key} className="space-y-2">
          <Label htmlFor={setting.key}>{setting.label}</Label>
          <Input
            id={setting.key}
            type={setting.type === 'number' ? 'number' : 'text'}
            value={values[setting.key]}
            onChange={(e) =>
              setValues({ ...values, [setting.key]: e.target.value })
            }
          />
        </div>
      ))}
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Settings'}
      </Button>
    </form>
  )
}





