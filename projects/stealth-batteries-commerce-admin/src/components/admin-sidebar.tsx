'use client'

import type React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  ChevronLeft,
  Menu,
  ChevronDown,
  ChevronRight,
  Plus,
  List,
  BarChart,
  LogOut,
} from 'lucide-react'
import { useState, memo } from 'react'

type AdminSidebarProps = {
  children: React.ReactNode
}

type NavItem = {
  name: string
  href?: string
  icon: React.ElementType
  subItems?: Array<{
    name: string
    href: string
    icon: React.ElementType
  }>
}

const NavigationItem = memo(function NavigationItem({
  item,
  pathname,
  onLinkClick,
}: {
  item: NavItem
  pathname: string
  onLinkClick?: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const hasSubItems = Boolean(item.subItems?.length)
  const isActive =
    pathname === item.href || (hasSubItems && item.subItems?.some((sub) => pathname === sub.href))

  if (hasSubItems && item.subItems) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 ${
            isActive ? 'bg-zinc-800 text-white' : ''
          }`}
        >
          <div className="flex items-center">
            <item.icon className="mr-2 h-5 w-5" />
            <span>{item.name}</span>
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {isOpen && (
          <div className="ml-4 pl-4 border-l border-zinc-800 space-y-1">
            {item.subItems.map((subItem) => (
              <Link
                key={subItem.href}
                href={subItem.href}
                onClick={onLinkClick}
                className={`flex items-center px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 ${
                  pathname === subItem.href ? 'bg-zinc-800 text-white' : ''
                }`}
              >
                <subItem.icon className="mr-2 h-4 w-4" />
                <span>{subItem.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href || '#'}
      onClick={onLinkClick}
      className={`flex items-center px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 ${
        pathname === item.href ? 'bg-zinc-800 text-white' : ''
      }`}
    >
      <item.icon className="mr-2 h-5 w-5" />
      <span>{item.name}</span>
    </Link>
  )
})

const NavigationItems = memo(function NavigationItems({
  pathname,
  onLinkClick,
}: {
  pathname: string
  onLinkClick?: () => void
}) {
  const items: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart,
    },
    {
      name: 'Products',
      icon: Package,
      subItems: [
        {
          name: 'Products & Inventory',
          href: '/admin/products',
          icon: Package,
        },
        {
          name: 'All Products (CMS)',
          href: '/admin/collections/products',
          icon: List,
        },
        {
          name: 'Add Product',
          href: '/admin/collections/products/create',
          icon: Plus,
        },
      ],
    },
    {
      name: 'Orders',
      icon: ShoppingCart,
      subItems: [
        {
          name: 'All Orders',
          href: '/admin/orders',
          icon: List,
        },
      ],
    },
    {
      name: 'Customers',
      icon: Users,
      subItems: [
        {
          name: 'All Customers',
          href: '/admin/customers',
          icon: List,
        },
        {
          name: 'Customer Orders',
          href: '/admin/customers/orders',
          icon: ShoppingCart,
        },
      ],
    },
    {
      name: 'Dealers',
      icon: Users,
      subItems: [
        {
          name: 'All Dealers',
          href: '/admin/dealers',
          icon: List,
        },
        {
          name: 'Add Dealer',
          href: '/admin/collections/dealers/create',
          icon: Plus,
        },
        {
          name: 'Dealer Orders',
          href: '/admin/dealers/orders',
          icon: ShoppingCart,
        },
      ],
    },
    {
      name: 'Sales Reps',
      icon: Users,
      subItems: [
        {
          name: 'All Sales Reps',
          href: '/admin/sales-reps',
          icon: List,
        },
        {
          name: 'Add Sales Rep',
          href: '/admin/collections/salesReps/create',
          icon: Plus,
        },
      ],
    },
    {
      name: 'CMS Admin',
      href: '/admin',
      icon: Settings,
    },
    {
      name: 'Logout',
      href: '/admin/logout',
      icon: LogOut,
    },
  ]

  return (
    <nav className="flex-1 p-4 space-y-2">
      {items.map((item) => (
        <NavigationItem key={item.name} item={item} pathname={pathname} onLinkClick={onLinkClick} />
      ))}
    </nav>
  )
})

const SidebarContent = memo(function SidebarContent({
  pathname,
  onCollapse,
  onLinkClick,
}: {
  pathname: string
  onCollapse: () => void
  onLinkClick?: () => void
}) {
  return (
    <div className="w-[16rem] border-r border-zinc-800 bg-black h-full ">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-100">Admin Portal</h2>
          <button onClick={onCollapse} className="text-zinc-400 hover:text-zinc-100 lg:hidden">
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
        <NavigationItems pathname={pathname} onLinkClick={onLinkClick} />
        <div className="border-t border-zinc-800 p-4">
          <Link
            href="/admin"
            onClick={onLinkClick}
            className="flex items-center px-3 py-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            <span>Back to CMS Admin</span>
          </Link>
        </div>
      </div>
    </div>
  )
})

export function AdminSidebar({ children }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(true)

  const handleLinkClick = () => {
    // Only collapse on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsCollapsed(true)
    }
  }

  return (
    <div className="flex w-full h-full relative">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsCollapsed(false)}
        className={`${
          isCollapsed ? 'block' : 'hidden'
        } lg:hidden fixed top-[5.5rem] left-4 z-[100] p-2 bg-zinc-800 rounded-md text-zinc-200 hover:text-white hover:bg-zinc-700`}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        } fixed lg:static top-0 left-0 h-screen z-[90] transition-transform duration-300 ease-in-out border-b border-zinc-800`}
      >
        <SidebarContent
          pathname={pathname}
          onCollapse={() => setIsCollapsed(true)}
          onLinkClick={handleLinkClick}
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 p-4 max-w-[calc(95vw)] ml-auto lg:max-w-full">
        <main className="p-6">{children}</main>
      </div>

      {/* Mobile overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[80] lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </div>
  )
}

export default memo(AdminSidebar)
