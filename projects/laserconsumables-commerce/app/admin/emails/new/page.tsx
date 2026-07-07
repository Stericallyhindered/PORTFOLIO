import { requireAdmin } from '@/lib/auth/session'
import EmailTemplateEditor from '@/components/admin/EmailTemplateEditor'

export default async function NewEmailTemplatePage() {
  await requireAdmin()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Email Template</h1>
      <EmailTemplateEditor />
    </div>
  )
}





