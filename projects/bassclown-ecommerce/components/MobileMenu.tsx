"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { User, LogIn, LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    joinDate: string;
    avatar?: string;
  } | null;
}

export const MobileMenu = ({ isOpen, onClose, isAuthenticated, user }: MobileMenuProps) => {
  const { logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();

  // Check if a navigation item is active
  const isActiveLink = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // Check if any sub-item in a dropdown is active
  const isDropdownActive = (subItems?: { href: string; label: string }[]) => {
    if (!subItems) return false;
    return subItems.some(subItem => isActiveLink(subItem.href));
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'bass-admin': return 'Bass Admin';
      case 'brand-admin': return 'Brand Admin';
      case 'member': return 'Member';
      case 'guest': return 'Guest';
      default: return role;
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-0 bg-slate-900 z-40 flex flex-col justify-between items-center transition-opacity duration-300 lg:hidden",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="flex-1 flex flex-col justify-center items-center">
        <nav className="flex flex-col items-center space-y-4">
          {NAV_ITEMS.map((item) => (
            <div key={item.href} className="flex flex-col items-center">
              {item.subItems ? (
                <>
                  <button
                    onClick={() => toggleExpanded(item.href)}
                    className={cn(
                      "text-lg font-medium transition-colors flex items-center space-x-2",
                      isDropdownActive(item.subItems)
                        ? "text-red-500"
                        : "text-white hover:text-red-500"
                    )}
                  >
                    <span>{item.label}</span>
                    {expandedItems.includes(item.href) ? (
                      <ChevronDown size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    )}
                  </button>
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      expandedItems.includes(item.href) 
                        ? "max-h-96 opacity-100 mt-3" 
                        : "max-h-0 opacity-0"
                    )}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "text-base font-medium transition-colors pl-4",
                            isActiveLink(subItem.href)
                              ? "text-red-500"
                              : "text-gray-300 hover:text-red-500"
                          )}
                          onClick={onClose}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "text-lg font-medium transition-colors",
                    isActiveLink(item.href)
                      ? "text-red-500"
                      : "text-white hover:text-red-500"
                  )}
                  onClick={onClose}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
          
          {/* Dashboard link for authenticated users */}
          {isAuthenticated && (
            <Link
              href="/dashboard"
              className={cn(
                "text-lg font-medium transition-colors flex items-center space-x-2",
                isActiveLink("/dashboard")
                  ? "text-red-500"
                  : "text-white hover:text-red-500"
              )}
              onClick={onClose}
            >
              <User size={18} />
              <span>Dashboard</span>
            </Link>
          )}
          
          {/* Authentication section */}
          <div className="mt-8 flex flex-col items-center space-y-4">
            {isAuthenticated && (
              <>
                <div className="text-center">
                  <p className="text-sm text-gray-300">Welcome back,</p>
                  <p className="text-lg font-medium text-white">{user?.name}</p>
                  <p className="text-sm text-gray-400">{getRoleDisplayName(user?.role || '')}</p>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  <LogOut size={14} className="mr-2" />
                  Logout
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
      
      {/* Logo at the bottom */}
      <div className="pb-8">
        <Link href="/" onClick={onClose}>
          <Image 
            src="/images/bass-clown-co-logo-wide.png" 
            alt="Bass Clown Co" 
            width={150} 
            height={44} 
            style={{ width: 'auto', height: 'auto', maxWidth: '150px' }}
            className="opacity-80 hover:opacity-100 transition-opacity"
          />
        </Link>
      </div>
    </div>
  );
};
