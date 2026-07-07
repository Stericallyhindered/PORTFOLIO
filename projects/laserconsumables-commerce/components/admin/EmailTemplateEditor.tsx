'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface EmailTemplateEditorProps {
  template?: {
    id: string
    name: string
    subject: string
    body: string
    bodyHtml: string | null
    variables: string[]
  }
}

export default function EmailTemplateEditor({ template }: EmailTemplateEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    body: template?.body || '',
    bodyHtml: template?.bodyHtml || '',
    variables: template?.variables || [],
  })
  const [newVariable, setNewVariable] = useState('')
  const [testEmail, setTestEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const url = template
        ? `/api/admin/emails/templates/${template.id}`
        : '/api/admin/emails/templates'
      const method = template ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          subject: formData.subject,
          body: formData.body,
          bodyHtml: formData.bodyHtml,
          variables: formData.variables,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save template')
      }

      setSuccess('Template saved successfully!')
      setTimeout(() => {
        router.push('/admin/emails')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to save template')
    } finally {
      setLoading(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail) {
      setError('Please enter a test email address')
      return
    }

    setTesting(true)
    setError('')
    setSuccess('')

    try {
      // Create test variables
      const testVariables: Record<string, string> = {}
      formData.variables.forEach((varName) => {
        testVariables[varName] = `[TEST ${varName}]`
      })

      const response = await fetch('/api/admin/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: formData.name,
          to: testEmail,
          variables: testVariables,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email')
      }

      setSuccess('Test email sent successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to send test email')
    } finally {
      setTesting(false)
    }
  }

  const addVariable = () => {
    if (newVariable && !formData.variables.includes(newVariable)) {
      setFormData({
        ...formData,
        variables: [...formData.variables, newVariable],
      })
      setNewVariable('')
    }
  }

  const removeVariable = (variable: string) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter((v) => v !== variable),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-md">{success}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
          <CardDescription>Basic template information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., order_confirmation"
              required
              disabled={!!template}
            />
            <p className="text-xs text-gray-500 mt-1">
              Used to reference this template in code (cannot be changed after creation)
            </p>
          </div>

          <div>
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Order Confirmation - {{orderNumber}}"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use {'{{variableName}}'} for dynamic content
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Body</CardTitle>
          <CardDescription>Plain text version</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            placeholder="Plain text email body..."
            rows={8}
            required
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>HTML Body (Optional)</CardTitle>
          <CardDescription>Rich HTML version of the email</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.bodyHtml}
            onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
            placeholder="<h1>HTML email body...</h1>"
            rows={12}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Variables</CardTitle>
          <CardDescription>Variables that can be used in subject and body</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={newVariable}
              onChange={(e) => setNewVariable(e.target.value)}
              placeholder="Variable name (e.g., orderNumber)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addVariable()
                }
              }}
            />
            <Button type="button" onClick={addVariable}>
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.variables.map((variable) => (
              <div
                key={variable}
                className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full"
              >
                <span className="text-sm font-medium">{'{{' + variable + '}}'}</span>
                <button
                  type="button"
                  onClick={() => removeVariable(variable)}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Email</CardTitle>
          <CardDescription>Send a test email to verify the template</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleTestEmail}
              disabled={testing || !formData.name}
              variant="outline"
            >
              {testing ? 'Sending...' : 'Send Test'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    </form>
  )
}





