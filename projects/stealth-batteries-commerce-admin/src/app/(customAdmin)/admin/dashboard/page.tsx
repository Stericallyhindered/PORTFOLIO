import DashboardTailwind from '@/components/DashboardTailwind'

export default function AdminDashboard() {
  return (
    <div className="container mx-auto flex flex-col gap-4 md:pb-12">
      <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
      <DashboardTailwind />
    </div>
  )
}
