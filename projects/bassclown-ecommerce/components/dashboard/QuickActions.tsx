'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Gift, Edit, MessageCircle, Users, FileText, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export const QuickActions = () => {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'bass-clown-admin';

  const adminActions = [
    {
      title: 'Manage Contests',
      description: 'Create and manage content contests',
      icon: Trophy,
      color: 'bg-blue-600 hover:bg-blue-700',
      href: '/admin/contests'
    },
    {
      title: 'Manage Giveaways',
      description: 'Create and manage giveaways',
      icon: Gift,
      color: 'bg-green-600 hover:bg-green-700',
      href: '/admin/giveaways'
    },
    {
      title: 'Manage Blog',
      description: 'Create and publish blog posts',
      icon: FileText,
      color: 'bg-purple-600 hover:bg-purple-700',
      href: '/admin/blog'
    },
    {
      title: 'Manage Users',
      description: 'View and manage all users',
      icon: Users,
      color: 'bg-orange-600 hover:bg-orange-700',
      href: '/admin/users'
    }
  ];

  const userActions = [
    {
      title: 'Browse Contests',
      description: 'View and apply to content contests',
      icon: Trophy,
      color: 'bg-blue-600 hover:bg-blue-700',
      href: '/content-contests'
    },
    {
      title: 'Enter Giveaway',
      description: 'Check out the current giveaway',
      icon: Gift,
      color: 'bg-green-600 hover:bg-green-700',
      href: '/giveaways'
    },
    {
      title: 'My Contests',
      description: 'View your contest applications',
      icon: Edit,
      color: 'bg-purple-600 hover:bg-purple-700',
      href: '/my-contests'
    },
    {
      title: 'Contact Support',
      description: 'Get help from our team',
      icon: MessageCircle,
      color: 'bg-orange-600 hover:bg-orange-700',
      href: '/contact'
    }
  ];

  const actions = isAdmin ? adminActions : userActions;

  return (
    <Card className="bg-[#2D2D2D] border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              variant="ghost"
              className={`w-full justify-start h-auto p-4 ${action.color} text-white hover:text-white`}
              onClick={() => router.push(action.href)}
            >
              <div className="flex items-center space-x-4">
                <Icon size={20} />
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm opacity-90">{action.description}</div>
                </div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};
