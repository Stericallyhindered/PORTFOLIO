import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DealerUpdatePage() {
  return (
    <div className="container mx-auto flex-col md:flex">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Update Dealer Information</h2>
          <Link href="/dealer/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
        <p>This is where you&apos;ll create a form for dealers to update their information.</p>
      </div>
    </div>
  )
}
