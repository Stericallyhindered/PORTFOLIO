import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import EmailTemplateEditor from '@/components/admin/EmailTemplateEditor'

export default async function EmailTemplateEditPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdmin()

  const template = await prisma.emailTemplate.findUnique({
    where: { id: params.id },
  })

  if (!template) {
    redirect('/admin/emails')
  }

  // Parse variables from JSON string
  let variables: string[] = []
  try {
    variables = JSON.parse(template.variables || '[]')
  } catch {
    variables = []
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Email Template: {template.name}</h1>
      <EmailTemplateEditor
        template={{
          ...template,
          variables,
        }}
      />
    </div>
  )
}





