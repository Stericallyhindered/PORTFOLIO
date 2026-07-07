'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Ticket, MessageSquare, Clock, Package, UserPlus } from 'lucide-react';

interface DashboardStats {
  totalCustomers: number;
  totalMachines: number;
  chatSessionsToday: number;
  newCustomersThisWeek: number;
  openTickets: number;
  totalMaterials: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalMachines: 0,
    chatSessionsToday: 0,
    newCustomersThisWeek: 0,
    openTickets: 0,
    totalMaterials: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => {
        if (data.data) {
          setStats({
            totalCustomers: data.data.totalCustomers ?? 0,
            totalMachines: data.data.totalMachines ?? 0,
            chatSessionsToday: data.data.chatSessionsToday ?? 0,
            newCustomersThisWeek: data.data.newCustomersThisWeek ?? 0,
            openTickets: data.data.openTickets ?? 0,
            totalMaterials: data.data.totalMaterials ?? 0,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      description: 'Registered customers',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Product Registrations',
      value: stats.totalMachines,
      icon: Package,
      description: 'Machines with serial numbers',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active Chat Sessions',
      value: stats.chatSessionsToday,
      icon: MessageSquare,
      description: 'Conversations today',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'New Customers',
      value: stats.newCustomersThisWeek,
      icon: UserPlus,
      description: 'This week',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      title: 'Open Tickets',
      value: stats.openTickets,
      icon: Ticket,
      description: 'Awaiting response',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Support Materials',
      value: stats.totalMaterials,
      icon: FileText,
      description: 'PDFs, videos, docs',
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome to the SMT Admin Portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">
                    {loading ? '-' : stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="/admin/customers"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Customers</p>
                <p className="text-sm text-gray-500">View customers, chat history, and registrations</p>
              </div>
            </a>
            <a
              href="/admin/materials"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Upload Materials</p>
                <p className="text-sm text-gray-500">Add videos, PDFs, and documents</p>
              </div>
            </a>
            <a
              href="/admin/ai"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Configure AI</p>
                <p className="text-sm text-gray-500">Edit prompts and settings</p>
              </div>
            </a>
            <a
              href="/admin/tickets"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <Ticket className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium">View Tickets</p>
                <p className="text-sm text-gray-500">Handle support requests</p>
              </div>
            </a>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'New user registered', user: 'John Doe', time: '2 minutes ago', type: 'user' },
                { action: 'Material uploaded', user: 'Admin', time: '15 minutes ago', type: 'material' },
                { action: 'Ticket resolved', user: 'Support Team', time: '1 hour ago', type: 'ticket' },
                { action: 'AI prompt updated', user: 'Admin', time: '2 hours ago', type: 'ai' },
                { action: 'New machine registered', user: 'Jane Smith', time: '3 hours ago', type: 'machine' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-smt-red mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">by {activity.user}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
