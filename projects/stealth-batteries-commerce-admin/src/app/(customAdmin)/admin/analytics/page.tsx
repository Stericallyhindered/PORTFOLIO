'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'

// Custom hook for persistent analytics settings
function usePersistentState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(defaultValue)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Load from localStorage on client side
    try {
      const saved = localStorage.getItem(`analytics-${key}`)
      if (saved) {
        setState(JSON.parse(saved))
      }
    } catch (error) {
      console.warn(`Failed to load analytics setting ${key}:`, error)
    }
  }, [key])

  const setValue = (value: T) => {
    setState(value)
    // Save to localStorage on client side
    if (isClient) {
      try {
        localStorage.setItem(`analytics-${key}`, JSON.stringify(value))
      } catch (error) {
        console.warn(`Failed to save analytics setting ${key}:`, error)
      }
    }
  }

  return [state, setValue]
}

type ComparisonType = 'previous-year' | 'previous-month' | 'custom'
type DateRangePreset = 'custom' | 'current-month' | 'last-month' | 'ytd' | 'last-30' | 'last-90'

type AnalyticsData = {
  totalOrders: number
  totalRevenue: number
  processingOrders: number
  completedOrders: number
  averageOrderValue: number
  productRevenue: number
  totalDiscounts: number
  totalShipping: number
  productBreakdown: {
    productId: string
    name: string
    current: {
      quantity: number
      revenue: number
      percentageOfRevenue: string
    }
    comparison: {
      quantity: number
      revenue: number
      percentageOfRevenue: string
    }
    growth: {
      quantity: number
      revenue: number
      percentageChange: string
    }
  }[]
}

// Helper function to get preset date ranges
function getPresetDateRange(preset: DateRangePreset): { start: Date; end: Date } {
  const now = new Date()
  const currentYear = new Date().getFullYear()
  const today = new Date(currentYear, now.getMonth(), now.getDate())

  switch (preset) {
    case 'current-month': {
      const start = new Date(currentYear, now.getMonth(), 1)
      start.setHours(0, 0, 0, 0)

      const end = new Date()
      end.setHours(23, 59, 59, 999)

      return { start, end }
    }
    case 'last-month': {
      // Get first day of last month
      const start = new Date(currentYear, now.getMonth() - 1, 1)
      start.setHours(0, 0, 0, 0)

      // Get last day of last month
      const end = new Date(currentYear, now.getMonth(), 0)
      end.setHours(23, 59, 59, 999)

      return { start, end }
    }
    case 'ytd': {
      const start = new Date(currentYear, 0, 1)
      start.setHours(0, 0, 0, 0)

      const end = new Date()
      end.setHours(23, 59, 59, 999)

      return { start, end }
    }
    case 'last-30': {
      const end = new Date()
      end.setHours(23, 59, 59, 999)

      const start = new Date(end)
      start.setDate(start.getDate() - 30)
      start.setHours(0, 0, 0, 0)

      return { start, end }
    }
    case 'last-90': {
      const end = new Date()
      end.setHours(23, 59, 59, 999)

      const start = new Date(end)
      start.setDate(start.getDate() - 90)
      start.setHours(0, 0, 0, 0)

      return { start, end }
    }
    default:
      return { start: today, end: today }
  }
}

// Helper function to format date range display
function formatDateRange(start: Date, end: Date): string {
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    // Same month - show as "April 1-15, 2025"
    return `${format(start, 'MMMM d')}${format(start, 'yyyy') !== format(end, 'yyyy') ? `, ${format(start, 'yyyy')}` : ''}-${format(end, 'd')}, ${format(end, 'yyyy')}`
  } else if (start.getFullYear() === end.getFullYear()) {
    // Same year - show as "February 1 - April 15, 2025"
    return `${format(start, 'MMMM d')} - ${format(end, 'MMMM d')}, ${format(end, 'yyyy')}`
  } else {
    // Different years - show as "December 1, 2024 - January 15, 2025"
    return `${format(start, 'MMMM d, yyyy')} - ${format(end, 'MMMM d, yyyy')}`
  }
}

function StatCard({
  title,
  currentValue,
  previousValue,
  format = 'number',
  percentageChange,
}: {
  title: string
  currentValue: number
  previousValue: number
  format?: 'number' | 'currency'
  percentageChange: number
}) {
  const formattedCurrent =
    format === 'currency' ? `$${currentValue.toFixed(2)}` : currentValue.toLocaleString()
  const formattedPrevious =
    format === 'currency' ? `$${previousValue.toFixed(2)}` : previousValue.toLocaleString()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-200 bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">{formattedCurrent}</div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">vs</span>
              <span className="text-sm text-zinc-300">{formattedPrevious}</span>
              <span
                className={`text-sm ${percentageChange >= 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {percentageChange >= 0 ? '+' : ''}
                {percentageChange.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function AnalyticsPage() {
  // Use persistent state for user preferences
  const [dateRangePreset, setDateRangePreset] = usePersistentState<DateRangePreset>(
    'dateRangePreset',
    'current-month',
  )
  const [comparisonType, setComparisonType] = usePersistentState<ComparisonType>(
    'comparisonType',
    'previous-year',
  )
  const [startDate, setStartDate] = useState<Date>(getPresetDateRange('current-month').start)
  const [endDate, setEndDate] = useState<Date>(getPresetDateRange('current-month').end)
  const [comparisonStartDate, setComparisonStartDate] = useState<Date | null>(null)
  const [comparisonEndDate, setComparisonEndDate] = useState<Date | null>(null)
  const [currentData, setCurrentData] = useState<AnalyticsData | null>(null)
  const [comparisonData, setComparisonData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize dates based on persistent preset when component mounts
  useEffect(() => {
    if (dateRangePreset !== 'custom') {
      const { start, end } = getPresetDateRange(dateRangePreset)
      setStartDate(start)
      setEndDate(end)
    }
  }, [dateRangePreset])

  // Calculate comparison dates when comparison type changes
  useEffect(() => {
    if (!startDate || !endDate) return

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (comparisonType === 'previous-year') {
      // Create new Date objects to avoid mutating the original dates
      const prevYearStart = new Date(start)
      prevYearStart.setFullYear(start.getFullYear() - 1)

      const prevYearEnd = new Date(end)
      prevYearEnd.setFullYear(end.getFullYear() - 1)

      setComparisonStartDate(prevYearStart)
      setComparisonEndDate(prevYearEnd)
    } else if (comparisonType === 'previous-month') {
      const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

      const newStart = new Date(start)
      newStart.setMonth(start.getMonth() - 1)

      const newEnd = new Date(newStart)
      newEnd.setDate(newEnd.getDate() + daysDiff)

      setComparisonStartDate(newStart)
      setComparisonEndDate(newEnd)
    }
  }, [startDate, endDate, comparisonType])

  // Fetch data when dates change
  useEffect(() => {
    const fetchData = async () => {
      if (!startDate || !endDate || !comparisonStartDate || !comparisonEndDate) return

      try {
        setLoading(true)
        setError(null)

        // Create end dates that include the full day
        const endDateWithFullDay = new Date(endDate)
        endDateWithFullDay.setHours(23, 59, 59, 999)

        const comparisonEndDateWithFullDay = new Date(comparisonEndDate)
        comparisonEndDateWithFullDay.setHours(23, 59, 59, 999)

        // Set start dates to beginning of day
        const startDateWithStartDay = new Date(startDate)
        startDateWithStartDay.setHours(0, 0, 0, 0)

        const comparisonStartDateWithStartDay = new Date(comparisonStartDate)
        comparisonStartDateWithStartDay.setHours(0, 0, 0, 0)

        // Fetch data from the analytics endpoint
        const analyticsUrl = new URL(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/analytics/orders`)
        analyticsUrl.searchParams.append('startDate', startDateWithStartDay.toISOString())
        analyticsUrl.searchParams.append('endDate', endDateWithFullDay.toISOString())
        analyticsUrl.searchParams.append(
          'comparisonStartDate',
          comparisonStartDateWithStartDay.toISOString(),
        )
        analyticsUrl.searchParams.append(
          'comparisonEndDate',
          comparisonEndDateWithFullDay.toISOString(),
        )

        const response = await fetch(analyticsUrl.toString(), {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch analytics data')
        }

        const data = await response.json()

        // Use the pre-calculated metrics from the API
        setCurrentData(data.current)
        setComparisonData(data.comparison)
      } catch (error) {
        console.error('Error fetching analytics data:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [startDate, endDate, comparisonStartDate, comparisonEndDate])

  // Handle preset changes
  const handlePresetChange = (preset: DateRangePreset) => {
    setDateRangePreset(preset)
    if (preset !== 'custom') {
      const { start, end } = getPresetDateRange(preset)
      setStartDate(start)
      setEndDate(end)
    }
  }

  // Update start date with validation
  const handleStartDateChange = (date: Date) => {
    setDateRangePreset('custom')
    setStartDate(date)
  }

  // Update end date with validation
  const handleEndDateChange = (date: Date) => {
    setDateRangePreset('custom')
    setEndDate(date)
  }

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="h-8 w-64">
          <Skeleton className="h-full w-full bg-zinc-800" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="w-full bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24 bg-zinc-800" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 bg-zinc-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="bg-red-900/50 border-red-800 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <p className="mt-2">Please try refreshing the page.</p>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-6">Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Date Range</label>
            <Select value={dateRangePreset} onValueChange={handlePresetChange}>
              <SelectTrigger>
                <SelectValue>
                  {dateRangePreset === 'current-month'
                    ? 'Current Month'
                    : dateRangePreset === 'last-month'
                      ? 'Last Month'
                      : dateRangePreset === 'ytd'
                        ? 'Year to Date'
                        : dateRangePreset === 'last-30'
                          ? 'Last 30 Days'
                          : dateRangePreset === 'last-90'
                            ? 'Last 90 Days'
                            : 'Custom Range'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Current Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
                <SelectItem value="last-30">Last 30 Days</SelectItem>
                <SelectItem value="last-90">Last 90 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-zinc-500">Viewing: {formatDateRange(startDate, endDate)}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Start Date</label>
            <DatePicker date={startDate} setDate={handleStartDateChange} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">End Date</label>
            <DatePicker date={endDate} setDate={handleEndDateChange} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Compare With</label>
            <Select
              value={comparisonType}
              onValueChange={(value: ComparisonType) => setComparisonType(value)}
            >
              <SelectTrigger>
                <SelectValue>
                  {comparisonType === 'previous-year'
                    ? 'Previous Year'
                    : comparisonType === 'previous-month'
                      ? 'Previous Month'
                      : 'Custom Range'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="previous-year">Previous Year (Same Period)</SelectItem>
                <SelectItem value="previous-month">Previous Month (Same Length)</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            {comparisonStartDate && comparisonEndDate && (
              <p className="text-sm text-zinc-500">
                Comparing against: {formatDateRange(comparisonStartDate, comparisonEndDate)}
              </p>
            )}
          </div>
          {comparisonType === 'custom' && (
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Custom Range</label>
              <div className="flex gap-2">
                <DatePicker
                  date={comparisonStartDate || new Date()}
                  setDate={setComparisonStartDate}
                />
                <DatePicker date={comparisonEndDate || new Date()} setDate={setComparisonEndDate} />
              </div>
            </div>
          )}
        </div>

        {currentData && comparisonData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Total Orders"
              currentValue={currentData.totalOrders}
              previousValue={comparisonData.totalOrders}
              percentageChange={calculatePercentageChange(
                currentData.totalOrders,
                comparisonData.totalOrders,
              )}
            />
            <StatCard
              title="Total Revenue"
              currentValue={currentData.totalRevenue}
              previousValue={comparisonData.totalRevenue}
              format="currency"
              percentageChange={calculatePercentageChange(
                currentData.totalRevenue,
                comparisonData.totalRevenue,
              )}
            />
            <StatCard
              title="Product Revenue"
              currentValue={currentData.productRevenue}
              previousValue={comparisonData.productRevenue}
              format="currency"
              percentageChange={calculatePercentageChange(
                currentData.productRevenue,
                comparisonData.productRevenue,
              )}
            />
            <StatCard
              title="Total Discounts"
              currentValue={currentData.totalDiscounts}
              previousValue={comparisonData.totalDiscounts}
              format="currency"
              percentageChange={calculatePercentageChange(
                currentData.totalDiscounts,
                comparisonData.totalDiscounts,
              )}
            />
            <StatCard
              title="Shipping Revenue"
              currentValue={currentData.totalShipping}
              previousValue={comparisonData.totalShipping}
              format="currency"
              percentageChange={calculatePercentageChange(
                currentData.totalShipping,
                comparisonData.totalShipping,
              )}
            />
            <StatCard
              title="Average Order Value"
              currentValue={currentData.averageOrderValue}
              previousValue={comparisonData.averageOrderValue}
              format="currency"
              percentageChange={calculatePercentageChange(
                currentData.averageOrderValue,
                comparisonData.averageOrderValue,
              )}
            />
            <StatCard
              title="Processing Orders"
              currentValue={currentData.processingOrders}
              previousValue={comparisonData.processingOrders}
              percentageChange={calculatePercentageChange(
                currentData.processingOrders,
                comparisonData.processingOrders,
              )}
            />
            <StatCard
              title="Completed Orders"
              currentValue={currentData.completedOrders}
              previousValue={comparisonData.completedOrders}
              percentageChange={calculatePercentageChange(
                currentData.completedOrders,
                comparisonData.completedOrders,
              )}
            />
          </div>
        )}

        {/* Product Breakdown Table */}
        {currentData?.productBreakdown && (
          <Card className="mt-8 bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-zinc-400">Product Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left text-zinc-300">
                  <thead className="text-xs uppercase bg-zinc-800">
                    <tr>
                      <th scope="col" className="px-6 py-3">
                        Product Name
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Current Period
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Previous Period
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Difference
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.productBreakdown.map((product) => (
                      <tr key={product.productId} className="border-b border-zinc-800">
                        <td className="px-6 py-4">{product.name}</td>
                        <td className="px-6 py-4">
                          <div>Qty: {product.current.quantity}</div>
                          <div>
                            ${product.current.revenue.toFixed(2)} (
                            {product.current.percentageOfRevenue}%)
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>Qty: {product.comparison.quantity}</div>
                          <div>
                            ${product.comparison.revenue.toFixed(2)} (
                            {product.comparison.percentageOfRevenue}%)
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            Qty: {product.growth.quantity >= 0 ? '+' : ''}
                            {product.growth.quantity}
                          </div>
                          <div
                            className={
                              product.growth.revenue >= 0 ? 'text-green-400' : 'text-red-400'
                            }
                          >
                            {product.growth.revenue >= 0 ? '+' : '-'}$
                            {Math.abs(product.growth.revenue).toFixed(2)} (
                            {product.growth.percentageChange}%)
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
