import { addBusinessDays, format, setHours, setMinutes, isAfter, startOfDay } from 'date-fns'

const PROCESSING_DAYS = 2 // Standard processing time before shipping
const CUTOFF_HOUR = 14 // 2 PM cutoff time (24-hour format)
const CUTOFF_MINUTE = 0 // 0 minutes

interface DeliveryTimeRange {
  earliest: Date
  latest: Date
  formatted: string
  shipDate: Date
}

/**
 * Determine if the current time is past the cutoff time for same-day processing
 * @returns true if past cutoff time, false otherwise
 */
function isPastCutoffTime(orderDate: Date = new Date()): boolean {
  const cutoffTime = setMinutes(setHours(startOfDay(orderDate), CUTOFF_HOUR), CUTOFF_MINUTE)
  return isAfter(orderDate, cutoffTime)
}

/**
 * Calculate the estimated delivery date range based on transit days
 * @param transitDays Number of business days in transit (if null, assumes ground shipping of 5-7 days)
 * @param processingDays Number of business days for processing (defaults to 2)
 * @param orderDate Date the order was placed (defaults to now)
 * @returns Object containing earliest and latest delivery dates, ship date, and a formatted string
 */
export function calculateDeliveryDates(
  transitDays: number | null,
  processingDays: number = PROCESSING_DAYS,
  orderDate: Date = new Date(),
): DeliveryTimeRange {
  // Add an extra processing day if past cutoff time
  const effectiveProcessingDays = isPastCutoffTime(orderDate) ? processingDays + 1 : processingDays

  // Start with processing time
  const shipDate = addBusinessDays(orderDate, effectiveProcessingDays)

  // Calculate transit days based on service type
  let minTransitDays: number
  let maxTransitDays: number

  if (transitDays === null) {
    // Ground shipping: 5-7 business days
    minTransitDays = 5
    maxTransitDays = 7
  } else if (transitDays === 1) {
    // Next Day Air: 1-2 business days
    minTransitDays = 1
    maxTransitDays = 2
  } else if (transitDays === 2) {
    // 2nd Day Air: 2-3 business days
    minTransitDays = 2
    maxTransitDays = 3
  } else if (transitDays === 3) {
    // 3 Day Select: 3-4 business days
    minTransitDays = 3
    maxTransitDays = 4
  } else {
    // Other services: add 1 day buffer
    minTransitDays = transitDays
    maxTransitDays = transitDays + 1
  }

  const earliest = addBusinessDays(shipDate, minTransitDays)
  const latest = addBusinessDays(shipDate, maxTransitDays)

  // Format the date range
  const formatDate = (date: Date) => format(date, 'MMM d')
  const dateRange =
    earliest === latest ? formatDate(earliest) : `${formatDate(earliest)} - ${formatDate(latest)}`

  return {
    earliest,
    latest,
    formatted: dateRange,
    shipDate,
  }
}

/**
 * Get a human-readable description of the delivery estimate
 * @param transitDays Number of business days in transit
 * @param guaranteed Whether the delivery time is guaranteed
 * @param orderDate Date the order was placed (defaults to now)
 * @returns Formatted string describing the delivery estimate
 */
export function getDeliveryEstimate(
  transitDays: number | null,
  guaranteed: boolean = false,
  orderDate: Date = new Date(),
): string {
  const { formatted } = calculateDeliveryDates(transitDays, PROCESSING_DAYS, orderDate)

  return guaranteed && transitDays
    ? `Guaranteed delivery by ${formatted}`
    : `Estimated delivery: ${formatted}`
}
