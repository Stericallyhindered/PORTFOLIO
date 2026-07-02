'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator, ChevronDown, ChevronUp } from 'lucide-react'

interface CommissionExplainerProps {
  calculationMethod: string
}

export function CommissionExplainer({ calculationMethod }: CommissionExplainerProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (calculationMethod !== 'completed_orders') {
    return null
  }

  return (
    <Card className="bg-blue-950/20 border-blue-800">
      <CardHeader
        className="pb-3 cursor-pointer hover:bg-blue-950/30 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-blue-400" />
            <CardTitle className="text-sm text-blue-400">Commission Calculation</CardTitle>
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-blue-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-blue-400" />
          )}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent>
          <p className="text-sm text-blue-300">
            Your commission is calculated based on <strong>completed orders only</strong>. Orders
            with status &quot;pending&quot;, &quot;processing&quot;, or &quot;back-order&quot; show
            as &quot;Commission Pending&quot; until completed. Cancelled or refunded orders show
            &quot;No Commission&quot; as they will not contribute to earnings.
          </p>
        </CardContent>
      )}
    </Card>
  )
}
