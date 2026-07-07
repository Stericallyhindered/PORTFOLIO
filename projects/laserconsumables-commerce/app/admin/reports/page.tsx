import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ReportsDashboard from '@/components/admin/ReportsDashboard'

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: { type?: string; startDate?: string; endDate?: string }
}) {
  await requireAdmin()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <Link href="/admin/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Reports</CardTitle>
          <CardDescription>View sales, product performance, customer analytics, and more</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportsDashboard
            initialType={searchParams.type}
            initialStartDate={searchParams.startDate}
            initialEndDate={searchParams.endDate}
          />
        </CardContent>
      </Card>
    </div>
  )
}


