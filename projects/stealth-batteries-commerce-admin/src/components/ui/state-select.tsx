'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/utilities/ui'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ListOfStates as states } from '@/utilities/state-list'

interface StateSelectProps {
  value?: string
  onValueChange: (value: string) => void
}

export function StateSelect({ value, onValueChange }: StateSelectProps) {
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? states.find((state) => state.value === value)?.label : 'Select state...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <Command>
          <CommandInput placeholder="Search states..." className="h-9" />
          <CommandList>
            <CommandEmpty>No state found.</CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-auto">
              {states.map((state) => (
                <CommandItem
                  key={state.value}
                  value={`${state.label} ${state.value}`}
                  onSelect={() => {
                    onValueChange(state.value === value ? '' : state.value)
                    setOpen(false)
                  }}
                >
                  {state.label}
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      value === state.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
