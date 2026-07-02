import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phoneNumber: string | undefined | null): string {
  if (!phoneNumber) return ''

  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '')

  // Check if we have the correct number of digits
  if (cleaned.length !== 10) return phoneNumber

  // Format as (XXX) XXX-XXXX
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
