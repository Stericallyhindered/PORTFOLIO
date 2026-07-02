'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type DiscountCodeInputProps = {
  email?: string
}

export function DiscountCodeInput({ email }: DiscountCodeInputProps) {
  const [code, setCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const { state, setDiscountCode, clearDiscountCode } = useCart()

  const handleApplyCode = async () => {
    if (!code.trim()) {
      toast.error('Please enter a discount code')
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          ...(email ? { email } : {}),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to validate discount code')
      }

      const data = await response.json()
      clearDiscountCode()
      setDiscountCode({
        code: data.code,
        type: data.discountType,
        amount: data.discountAmount,
        applicableProducts: (data.applicableProducts || []).map((p: any) =>
          typeof p === 'object' && (p.id || p.value) ? String(p.id || p.value) : String(p),
        ),
      })

      toast.success('Discount code applied successfully')
      setCode('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to apply discount code')
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        placeholder="Enter discount code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="flex-1"
      />
      <Button onClick={handleApplyCode} disabled={isValidating} variant="outline">
        {isValidating ? 'Applying...' : 'Apply'}
      </Button>
    </div>
  )
}
