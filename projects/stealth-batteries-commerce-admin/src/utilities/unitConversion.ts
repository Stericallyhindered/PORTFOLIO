export const convertUnits = {
  // Length conversions (mm to inches)
  mmToInches: (mm: number): number => {
    return Number((mm / 25.4).toFixed(1))
  },
  inchesToMm: (inches: number): number => {
    return Number((inches * 25.4).toFixed(1))
  },

  // Weight conversions (kg to lbs)
  kgToLbs: (kg: number): number => {
    return Number((kg * 2.20462).toFixed(1))
  },
  lbsToKg: (lbs: number): number => {
    return Number((lbs / 2.20462).toFixed(1))
  },

  // Format dimensions string
  formatDimensions: (length: number, width: number, height: number, isMetric: boolean): string => {
    if (isMetric) {
      return `${length.toFixed(1)} mm × ${width.toFixed(1)} mm × ${height.toFixed(1)} mm`
    }
    const lengthInches = convertUnits.mmToInches(length)
    const widthInches = convertUnits.mmToInches(width)
    const heightInches = convertUnits.mmToInches(height)
    return `${lengthInches.toFixed(1)} in × ${widthInches.toFixed(1)} in × ${heightInches.toFixed(1)} in`
  },

  // Format weight string
  formatWeight: (weight: number, isMetric: boolean): string => {
    if (isMetric) {
      return `${weight.toFixed(1)} kg`
    }
    return `${convertUnits.kgToLbs(weight).toFixed(1)} lbs`
  }
} 