'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Video, 
  Trophy, 
  FileText, 
  Settings, 
  LogOut,
  X,
  BarChart3,
  User,
  CreditCard,
  Coins,
  Gift,
  Users,
  Target,
  Building,
  Cloud,
  Shield
} from 'lucide-react';

interface DashboardSidebarProps {
  onClose: () => void;
}

const getNavigationItems = (userRole: string | undefined) => {
  const isBrandUser = userRole === 'brand-admin' || userRole === 'brand';
  const isAdmin = userRole === 'bass-clown-admin';

  if (isBrandUser) {
    return [
      { href: '/brand', label: 'Dashboard', icon: Home },
      { href: '/brand/brand-contests', label: 'Contests', icon: Trophy },
      { href: '/brand/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/brand/profile', label: 'Profile', icon: Building },
      { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ];
  }

  if (isAdmin) {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/admin', label: 'Admin Panel', icon: Settings },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/admin/reports', label: 'Reports', icon: FileText },
      { href: '/admin/contests', label: 'Contests', icon: Trophy },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/brands', label: 'Brands', icon: Building },
      { href: '/admin/giveaways', label: 'Giveaways', icon: Gift },
      { href: '/dashboard/profile', label: 'Profile', icon: User },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ];
  }

  // Default navigation for regular users
  return [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/contests', label: 'Contests', icon: Trophy },
    { href: '/giveaways', label: 'Giveaways', icon: Gift },
    { href: '/my-contests', label: 'My Contests', icon: Target },
    { href: '/my-entries', label: 'My Entries', icon: Video },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
    { href: '/dashboard/points', label: 'Points', icon: Coins },
    { href: '/dashboard/w9-forms', label: 'W9 Forms', icon: Shield },
    { href: '/dashboard/dropbox', label: 'Dropbox Sync', icon: Cloud },
    { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];
};

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ onClose }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const navigationItems = getNavigationItems(user?.role);

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/bass-clown-co-logo-cream.svg"
              alt="Bass Clown Co"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={20} />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-red-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={onClose}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}; 