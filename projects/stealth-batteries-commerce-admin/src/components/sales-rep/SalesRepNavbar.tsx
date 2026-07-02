'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utilities/ui'
import { LogoutButton } from '@/components/LogoutButton'
import { Home, Users, User, HelpCircle, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function SalesRepNavbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/salesReps/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ subject, message }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.errors?.[0]?.message || 'Failed to send support request')
      }

      toast.success('Support request sent successfully')
      setIsDialogOpen(false)
      setSubject('')
      setMessage('')
    } catch (error) {
      console.error('Error sending support request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send support request')
    } finally {
      setIsLoading(false)
    }
  }

  const navItems = [
    {
      label: 'Dashboard',
      href: '/sales-rep/dashboard',
      icon: Home,
    },
    {
      label: 'My Dealers',
      href: '/sales-rep/dealers',
      icon: Users,
    },
    {
      label: 'Commission',
      href: '/sales-rep/commission',
      icon: TrendingUp,
    },
    {
      label: 'Profile',
      href: '/sales-rep/profile',
      icon: User,
    },
  ]

  return (
    <nav className="bg-black/70 border-b border-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        pathname.includes(item.href)
                          ? 'bg-primary text-white'
                          : 'text-muted-foreground hover:bg-primary/80 hover:text-white',
                      )}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} modal={false}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Support
                  </Button>
                </DialogTrigger>
                {isDialogOpen && (
                  <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    aria-hidden="true"
                  />
                )}
                <DialogContent className="sm:max-w-[600px] fixed z-50">
                  <form onSubmit={handleSupportSubmit}>
                    <DialogHeader>
                      <DialogTitle>Contact Support</DialogTitle>
                      <DialogDescription>
                        Send a message to our sales support team. We&apos;ll get back to you as soon
                        as possible.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium mb-2">
                          Subject
                        </label>
                        <Input
                          id="subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Brief description of your issue"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="message" className="block text-sm font-medium mb-2">
                          Message
                        </label>
                        <Textarea
                          id="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Describe your issue in detail"
                          required
                          rows={5}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send Message'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <LogoutButton />
            </div>
          </div>
          {/* Mobile menu button */}
          <h3 className="md:hidden flex text-white text-xl font-medium">Sales Rep Portal</h3>
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-white hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={cn('h-6 w-6', isMobileMenuOpen ? 'hidden' : 'block')}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={cn('h-6 w-6', isMobileMenuOpen ? 'block' : 'hidden')}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={cn('md:hidden', isMobileMenuOpen ? 'block' : 'hidden')} id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 rounded-md text-base font-medium',
                  pathname.includes(item.href)
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:bg-primary/20 hover:text-white',
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
              </Link>
            )
          })}
          <Button
            variant="outline"
            size="sm"
            className="flex items-center w-full justify-start px-3 py-2"
            onClick={() => {
              setIsMobileMenuOpen(false)
              setIsDialogOpen(true)
            }}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Support
          </Button>
          <div className="pt-4">
            <LogoutButton className="w-full justify-center" />
          </div>
        </div>
      </div>
    </nav>
  )
}
