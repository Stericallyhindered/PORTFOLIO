'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useResponsive, touchTargets } from '@/lib/responsive-utils';
import { Menu, X, ChevronDown, Home, Trophy, Gift, User, Search, Settings } from 'lucide-react';

interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavigationItem[];
  badge?: string | number;
}

interface ResponsiveNavigationProps {
  items: NavigationItem[];
  logo?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function ResponsiveNavigation({
  items,
  logo,
  actions,
  className
}: ResponsiveNavigationProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenDropdowns(new Set());
  }, [pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMobileMenuOpen]);

  const toggleDropdown = (label: string) => {
    const newOpenDropdowns = new Set(openDropdowns);
    if (newOpenDropdowns.has(label)) {
      newOpenDropdowns.delete(label);
    } else {
      newOpenDropdowns.add(label);
    }
    setOpenDropdowns(newOpenDropdowns);
  };

  const isActiveRoute = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const hasActiveChild = (children: NavigationItem[]) => {
    return children.some(child => isActiveRoute(child.href));
  };

  // Mobile Navigation
  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <header className={cn('bg-white border-b border-gray-200 px-4 py-3', className)}>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex-shrink-0">
              {logo}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              style={{ minHeight: touchTargets.comfortable, minWidth: touchTargets.comfortable }}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        {/* Mobile Menu Drawer */}
        <div className={cn(
          'fixed top-0 left-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <div className="flex flex-col h-full">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              {logo}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                style={{ minHeight: touchTargets.comfortable, minWidth: touchTargets.comfortable }}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile Menu Items */}
            <nav className="flex-1 overflow-y-auto py-4">
              {items.map((item) => (
                <MobileNavigationItem
                  key={item.label}
                  item={item}
                  isActive={isActiveRoute(item.href)}
                  hasActiveChild={item.children ? hasActiveChild(item.children) : false}
                  isOpen={openDropdowns.has(item.label)}
                  onToggle={() => toggleDropdown(item.label)}
                />
              ))}
            </nav>

            {/* Mobile Menu Actions */}
            {actions && (
              <div className="p-4 border-t border-gray-200">
                {actions}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Tablet Navigation (Sidebar)
  if (isTablet) {
    return (
      <aside className={cn('w-64 bg-white border-r border-gray-200 h-screen flex flex-col', className)}>
        {/* Tablet Header */}
        <div className="p-4 border-b border-gray-200">
          {logo}
        </div>

        {/* Tablet Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {items.map((item) => (
            <TabletNavigationItem
              key={item.label}
              item={item}
              isActive={isActiveRoute(item.href)}
              hasActiveChild={item.children ? hasActiveChild(item.children) : false}
              isOpen={openDropdowns.has(item.label)}
              onToggle={() => toggleDropdown(item.label)}
            />
          ))}
        </nav>

        {/* Tablet Actions */}
        {actions && (
          <div className="p-4 border-t border-gray-200">
            {actions}
          </div>
        )}
      </aside>
    );
  }

  // Desktop Navigation (Horizontal)
  return (
    <header className={cn('bg-white border-b border-gray-200', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Desktop Logo */}
          <div className="flex-shrink-0">
            {logo}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {items.map((item) => (
              <DesktopNavigationItem
                key={item.label}
                item={item}
                isActive={isActiveRoute(item.href)}
                hasActiveChild={item.children ? hasActiveChild(item.children) : false}
                isOpen={openDropdowns.has(item.label)}
                onToggle={() => toggleDropdown(item.label)}
              />
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="flex items-center space-x-4">
            {actions}
          </div>
        </div>
      </div>
    </header>
  );
}

// Mobile Navigation Item Component
function MobileNavigationItem({
  item,
  isActive,
  hasActiveChild,
  isOpen,
  onToggle
}: {
  item: NavigationItem;
  isActive: boolean;
  hasActiveChild: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = item.icon;

  if (item.children && item.children.length > 0) {
    return (
      <div>
        <button
          onClick={onToggle}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 text-left text-base font-medium transition-colors',
            isActive || hasActiveChild
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
          )}
          style={{ minHeight: touchTargets.comfortable }}
        >
          <div className="flex items-center">
            {Icon && <Icon className="h-5 w-5 mr-3" />}
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </div>
          <ChevronDown className={cn(
            'h-4 w-4 transition-transform',
            isOpen ? 'rotate-180' : ''
          )} />
        </button>

        {isOpen && (
          <div className="bg-gray-50">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  'block px-8 py-2 text-sm transition-colors',
                  isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
                style={{ minHeight: touchTargets.minimum }}
              >
                {child.label}
                {child.badge && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {child.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center px-4 py-3 text-base font-medium transition-colors',
        isActive
          ? 'text-blue-600 bg-blue-50'
          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
      )}
      style={{ minHeight: touchTargets.comfortable }}
    >
      {Icon && <Icon className="h-5 w-5 mr-3" />}
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-auto bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// Tablet Navigation Item Component
function TabletNavigationItem({
  item,
  isActive,
  hasActiveChild,
  isOpen,
  onToggle
}: {
  item: NavigationItem;
  isActive: boolean;
  hasActiveChild: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = item.icon;

  if (item.children && item.children.length > 0) {
    return (
      <div>
        <button
          onClick={onToggle}
          className={cn(
            'w-full flex items-center justify-between px-4 py-2 text-left text-sm font-medium transition-colors',
            isActive || hasActiveChild
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          <div className="flex items-center">
            {Icon && <Icon className="h-4 w-4 mr-3" />}
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </div>
          <ChevronDown className={cn(
            'h-4 w-4 transition-transform',
            isOpen ? 'rotate-180' : ''
          )} />
        </button>

        {isOpen && (
          <div className="bg-gray-50">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  'block px-8 py-2 text-sm transition-colors',
                  isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                {child.label}
                {child.badge && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {child.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center px-4 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'text-blue-600 bg-blue-50'
          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
      )}
    >
      {Icon && <Icon className="h-4 w-4 mr-3" />}
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-auto bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// Desktop Navigation Item Component
function DesktopNavigationItem({
  item,
  isActive,
  hasActiveChild,
  isOpen,
  onToggle
}: {
  item: NavigationItem;
  isActive: boolean;
  hasActiveChild: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = item.icon;

  if (item.children && item.children.length > 0) {
    return (
      <div className="relative">
        <button
          onClick={onToggle}
          className={cn(
            'flex items-center px-3 py-2 text-sm font-medium transition-colors',
            isActive || hasActiveChild
              ? 'text-blue-600'
              : 'text-gray-700 hover:text-gray-900'
          )}
        >
          {Icon && <Icon className="h-4 w-4 mr-2" />}
          <span>{item.label}</span>
          {item.badge && (
            <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
          <ChevronDown className={cn(
            'h-4 w-4 ml-1 transition-transform',
            isOpen ? 'rotate-180' : ''
          )} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  'block px-4 py-2 text-sm transition-colors',
                  isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                {child.label}
                {child.badge && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {child.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'text-blue-600'
          : 'text-gray-700 hover:text-gray-900'
      )}
    >
      {Icon && <Icon className="h-4 w-4 mr-2" />}
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// Example usage component
export function ExampleNavigation() {
  const navigationItems: NavigationItem[] = [
    {
      label: 'Home',
      href: '/',
      icon: Home
    },
    {
      label: 'Contests',
      href: '/contests',
      icon: Trophy,
      badge: '3',
      children: [
        { label: 'Active Contests', href: '/contests/active' },
        { label: 'Past Contests', href: '/contests/past' },
        { label: 'Create Contest', href: '/contests/create' }
      ]
    },
    {
      label: 'Giveaways',
      href: '/giveaways',
      icon: Gift,
      children: [
        { label: 'Active Giveaways', href: '/giveaways/active' },
        { label: 'Past Giveaways', href: '/giveaways/past' }
      ]
    },
    {
      label: 'Search',
      href: '/search',
      icon: Search
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: User,
      children: [
        { label: 'My Profile', href: '/profile' },
        { label: 'Settings', href: '/profile/settings' },
        { label: 'Media Kit', href: '/profile/media-kit' }
      ]
    }
  ];

  const logo = (
    <Link href="/" className="flex items-center">
      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
        BC
      </div>
      <span className="ml-2 text-xl font-bold text-gray-900">Bass Clown Co.</span>
    </Link>
  );

  const actions = (
    <div className="flex items-center space-x-2">
      <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">
        <Settings className="h-5 w-5" />
      </button>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
        Sign In
      </button>
    </div>
  );

  return (
    <ResponsiveNavigation
      items={navigationItems}
      logo={logo}
      actions={actions}
    />
  );
} 