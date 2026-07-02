// UPS Service Codes
export const UPSServiceCodes = {
  NEXT_DAY_AIR: '01',
  SECOND_DAY_AIR: '02',
  GROUND: '03',
  THREE_DAY_SELECT: '12',
  NEXT_DAY_AIR_SAVER: '13',
  NEXT_DAY_AIR_EARLY: '14',
  SECOND_DAY_AIR_AM: '59',
} as const

// Define air-based services that should be excluded for hazmat shipments
export const AIR_SERVICES = new Set<string>([
  UPSServiceCodes.NEXT_DAY_AIR,
  UPSServiceCodes.SECOND_DAY_AIR,
  UPSServiceCodes.NEXT_DAY_AIR_SAVER,
  UPSServiceCodes.NEXT_DAY_AIR_EARLY,
  UPSServiceCodes.SECOND_DAY_AIR_AM,
])

// UPS Service Names
export const UPSServiceNames: Record<string, string> = {
  '01': 'UPS Next Day Air',
  '02': 'UPS 2nd Day Air',
  '03': 'UPS Ground',
  '12': 'UPS 3 Day Select',
  '13': 'UPS Next Day Air Saver',
  '14': 'UPS Next Day Air Early',
  '59': 'UPS 2nd Day Air AM',
} as const

// Default transit days for each service
export const UPSServiceTransitDays: Record<string, number | null> = {
  '01': 1, // Next Day Air
  '02': 2, // 2nd Day Air
  '03': null, // Ground (variable 5-7 days)
  '12': 3, // 3 Day Select
  '13': 1, // Next Day Air Saver
  '14': 1, // Next Day Air Early
  '59': 2, // 2nd Day Air AM
} as const

// Default guaranteed delivery for each service
export const UPSServiceGuaranteed: Record<string, boolean> = {
  '01': true, // Next Day Air
  '02': true, // 2nd Day Air
  '03': false, // Ground
  '12': false, // 3 Day Select
  '13': true, // Next Day Air Saver
  '14': true, // Next Day Air Early
  '59': true, // 2nd Day Air AM
} as const

export const SERVICE_TRANSIT_TIMES = {
  '01': { name: 'UPS Next Day Air', days: 1, business_days_only: true, guaranteed: true },
  '02': { name: 'UPS 2nd Day Air', days: 2, business_days_only: true, guaranteed: true },
  '03': { name: 'UPS Ground', days: 5, business_days_only: true, guaranteed: false },
  '12': { name: 'UPS 3 Day Select', days: 3, business_days_only: true, guaranteed: true },
  '13': { name: 'UPS Next Day Air Saver', days: 1, business_days_only: true, guaranteed: true },
  '14': { name: 'UPS Next Day Air Early', days: 1, business_days_only: true, guaranteed: true },
  '59': { name: 'UPS 2nd Day Air A.M.', days: 2, business_days_only: true, guaranteed: true },
} as const
