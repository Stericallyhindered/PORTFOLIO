'use client'

import { Check, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/utilities/ui'

interface Dealer {
  id: string
  name: string
}

interface DealerResponse {
  id: number
  companyName: string
  contactName: string
  phoneNumber: string
  address: any
}

export function DealerSelect() {
  const [open, setOpen] = React.useState(false)
  const [dealers, setDealers] = React.useState<Dealer[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentDealerId = searchParams.get('dealer')

  const [selectedDealer, setSelectedDealer] = React.useState<Dealer | null>(null)

  React.useEffect(() => {
    const fetchDealers = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers`, {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch dealers: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.docs || !Array.isArray(data.docs)) {
          throw new Error('Invalid data format received from API')
        }

        const mappedDealers = data.docs.map((dealer: DealerResponse) => ({
          id: dealer.id.toString(),
          name: dealer.companyName || 'Unnamed Dealer',
        }))
        setDealers(mappedDealers)

        // If there's a dealer ID in the URL, find and select that dealer
        if (currentDealerId) {
          const dealer = mappedDealers.find((d) => d.id === currentDealerId)
          if (dealer) {
            setSelectedDealer(dealer)
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dealers'
        console.error('Error fetching dealers:', errorMessage)
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchDealers()
  }, [currentDealerId])

  const handleDealerSelect = (dealerId: string) => {
    const dealer = dealers.find((d) => d.id === dealerId)

    setSelectedDealer(dealer || null)
    setOpen(false)

    const newUrl = `/admin/dealers/orders?dealer=${dealerId}`
    router.push(newUrl)
  }

  if (loading) {
    return <div className="text-zinc-400">Loading dealers...</div>
  }

  if (error) {
    return <div className="text-red-400">Error: {error}</div>
  }

  if (dealers.length === 0) {
    return <div className="text-zinc-400">No dealers found</div>
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white"
        >
          {selectedDealer ? selectedDealer.name : 'Select dealer...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-zinc-800 border-zinc-700">
        <Command>
          <CommandInput placeholder="Search dealers..." className="h-9 bg-zinc-800 text-white" />
          <CommandEmpty>No dealer found.</CommandEmpty>
          <CommandGroup>
            {dealers.map((dealer) => (
              <CommandItem
                key={dealer.id}
                value={dealer.id}
                onSelect={() => handleDealerSelect(dealer.id)}
                className="text-white hover:bg-zinc-700"
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selectedDealer?.id === dealer.id ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {dealer.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
