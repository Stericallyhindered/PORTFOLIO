import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

export default async function AdminEmailsPage() {
  await requireAdmin()

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { name: 'asc' },
  })

  const recentEmails = await prisma.emailLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Email Management</h1>

      <div className="mb-6">
        <Link href="/admin/emails/new">
          <Button>Create New Template</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Email Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {templates.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No templates yet</p>
              ) : (
                templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex justify-between items-center p-3 border rounded"
                  >
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-gray-500">{template.subject}</p>
                    </div>
                    <Link href={`/admin/emails/${template.id}`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentEmails.map((email) => (
                <div
                  key={email.id}
                  className="flex justify-between items-center p-3 border rounded"
                >
                  <div>
                    <p className="font-medium text-sm">{email.to}</p>
                    <p className="text-xs text-gray-500">{email.subject}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(email.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      email.status === 'sent'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {email.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

