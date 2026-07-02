'use client'

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface UnitSwitchProps {
  isMetric: boolean
  onToggle: (checked: boolean) => void
}

export function UnitSwitch({ isMetric, onToggle }: UnitSwitchProps) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        id="unit-switch"
        checked={isMetric}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="unit-switch" className="text-sm">
        {isMetric ? 'Metric' : 'Imperial'}
      </Label>
    </div>
  )
} 