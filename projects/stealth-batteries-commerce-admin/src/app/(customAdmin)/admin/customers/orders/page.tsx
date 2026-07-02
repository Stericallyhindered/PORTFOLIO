'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Package,
  DollarSign,
  ShoppingCart,
  Calendar,
  ExternalLink,
  User,
  Check,
  ChevronsUpDown,
} from 'lucide-react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type ColumnDef,
  flexRender,
} from '@tanstack/react-table'
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Text,
  Card,
  Title,
  Grid,
  Metric,
  Flex,
} from '@tremor/react'
import { cn } from '@/utilities/ui'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import Link from 'next/link'
import { StatusUpdateDialog } from '@/app/components/shared/StatusUpdateDialog'

interface Order {
  id: string
  orderNumber: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'
  total: number
  createdAt: string
  items: Array<{
    id?: string
    product: {
      name: string
    }
    quantity: number
    price: number
  }>
}

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  companyName?: string
  isDealer?: boolean
}

interface CustomerSummary {
  totalOrders: number
  totalRevenue: number
  totalItems: number
  averageOrderValue: number
  lastOrderDate: string | null
}

// Helper function to format currency with consistent decimal places
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default function CustomerOrdersPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<Customer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [customerSummary, setCustomerSummary] = useState<CustomerSummary | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [open, setOpen] = useState(false)
  const searchParams = useSearchParams()
  const customerId = searchParams.get('customer')

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/customers`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          console.error('Customer fetch failed:', response.status, response.statusText)
          throw new Error('Failed to fetch customers')
        }

        const data = await response.json()
        const customersList = Array.isArray(data) ? data : data.docs || []
        setCustomers(customersList)
      } catch (error) {
        console.error('Error fetching customers:', error)
        setError('Failed to load customers. Please check your authentication and try again.')
      }
    }

    fetchCustomers()
  }, [])

  useEffect(() => {
    const fetchOrders = async () => {
      if (!customerId) return

      try {
        setIsLoading(true)
        setError(null)

        // Fetch orders for the specific customer using query parameter
        const ordersUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders?customerId=${customerId}`

        const response = await fetch(ordersUrl, {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          console.error('Orders request failed:', response.status, response.statusText)
          const errorText = await response.text()

          // Parse error message if possible
          try {
            const errorData = JSON.parse(errorText)
            throw new Error(errorData.error || errorData.message || 'Failed to fetch orders')
          } catch (e) {
            throw new Error(`Failed to fetch orders: ${response.statusText}`)
          }
        }

        const responseText = await response.text()

        if (!responseText) {
          throw new Error('Empty response from server')
        }

        const responseData = JSON.parse(responseText)

        // Handle both array response and object with docs property
        const ordersList = Array.isArray(responseData) ? responseData : responseData.docs || []
        setOrders(ordersList)

        // Calculate customer summary
        const summary: CustomerSummary = {
          totalOrders: ordersList.length,
          totalRevenue: ordersList.reduce((sum, order) => sum + order.total, 0),
          totalItems: ordersList.reduce(
            (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
            0,
          ),
          averageOrderValue:
            ordersList.length > 0
              ? ordersList.reduce((sum, order) => sum + order.total, 0) / ordersList.length
              : 0,
          lastOrderDate:
            ordersList.length > 0
              ? ordersList.reduce(
                  (latest, order) =>
                    new Date(order.createdAt) > new Date(latest) ? order.createdAt : latest,
                  ordersList[0].createdAt,
                )
              : null,
        }
        setCustomerSummary(summary)
      } catch (error) {
        console.error('Full error details:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to load orders'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [customerId])

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!customerId) {
        setSelectedCustomerDetails(null)
        return
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/customers/${customerId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          },
        )

        if (!response.ok) {
          console.error('Customer detail fetch failed:', response.status, response.statusText)
          throw new Error('Failed to fetch customer details')
        }

        const data = await response.json()
        setSelectedCustomerDetails(data)
      } catch (error) {
        console.error('Error fetching customer details:', error)
        setSelectedCustomerDetails(null)
      }
    }

    fetchCustomerDetails()
  }, [customerId])

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'orderNumber',
      header: 'Order #',
      cell: ({ row }) => <Text>{row.original.orderNumber}</Text>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => <Text>{new Date(row.original.createdAt).toLocaleDateString()}</Text>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-zinc-800 text-white">
            {row.original.status}
          </span>
          <StatusUpdateDialog
            orderId={row.original.id}
            orderNumber={row.original.orderNumber}
            currentStatus={row.original.status}
            trigger={
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Update status</span>
                <ChevronsUpDown className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      ),
    },
    {
      accessorKey: 'items',
      header: 'Items',
      cell: ({ row }) => (
        <Text>{row.original.items.reduce((sum, item) => sum + item.quantity, 0)}</Text>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => <Text>{formatCurrency(row.original.total)}</Text>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Link
          href={`/admin/orders/${row.original.id}`}
          className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
        >
          View Details
          <ExternalLink className="ml-1 h-4 w-4" />
        </Link>
      ),
    },
  ]

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const selectedCustomer = customers.find((c) => c.id === customerId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Customer Orders</h1>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="p-6">
          <div className="mb-6">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                >
                  {selectedCustomer
                    ? `${selectedCustomer.firstName} ${selectedCustomer.lastName} (${selectedCustomer.email})`
                    : 'Select a customer...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-zinc-800 border-zinc-700">
                <Command className="bg-zinc-800">
                  <CommandInput placeholder="Search customers..." className="text-white" />
                  <CommandEmpty className="text-zinc-400">No customer found.</CommandEmpty>
                  <CommandGroup className="bg-zinc-800">
                    {customers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.id}
                        onSelect={(currentValue) => {
                          const url = new URL(window.location.href)
                          if (currentValue === customerId) {
                            url.searchParams.delete('customer')
                          } else {
                            url.searchParams.set('customer', customer.id)
                          }
                          window.history.pushState({}, '', url.toString())
                          window.location.reload()
                        }}
                        className="text-white hover:bg-zinc-700"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            customerId === customer.id ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        {customer.firstName} {customer.lastName} ({customer.email})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {customerId ? (
            <div className="mt-6">
              {isLoading ? (
                <p className="text-zinc-400">Loading customer orders...</p>
              ) : error ? (
                <div>
                  <p className="text-red-400">Error: {error}</p>
                  <p className="text-zinc-400 text-sm mt-2">Customer ID: {customerId}</p>
                  <p className="text-zinc-400 text-sm mt-1">
                    Server URL: {process.env.NEXT_PUBLIC_SERVER_URL}
                  </p>
                </div>
              ) : (
                <>
                  {/* Customer Information Header */}
                  <Card className="bg-zinc-800 border-zinc-700 mb-6">
                    <div className="flex flex-col md:flex-row items-start justify-between">
                      <div>
                        <Title className="text-white mb-1">
                          {selectedCustomerDetails?.firstName} {selectedCustomerDetails?.lastName}
                        </Title>
                        <Text className="text-zinc-400">{selectedCustomerDetails?.email}</Text>
                        {selectedCustomerDetails?.phoneNumber && (
                          <Text className="text-zinc-400 mt-1">
                            {selectedCustomerDetails.phoneNumber}
                          </Text>
                        )}
                        {selectedCustomerDetails?.companyName && (
                          <Text className="text-zinc-400 mt-1">
                            {selectedCustomerDetails.companyName}
                          </Text>
                        )}
                        {selectedCustomerDetails?.address && (
                          <Text className="text-zinc-400 mt-1">
                            {selectedCustomerDetails.address.street},{' '}
                            {selectedCustomerDetails.address.city},{' '}
                            {selectedCustomerDetails.address.state}{' '}
                            {selectedCustomerDetails.address.zipCode}
                          </Text>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right flex flex-row gap-2 w-fit">
                          <Text className="text-zinc-400">Customer ID</Text>
                          <Text className="text-white">{selectedCustomerDetails?.id}</Text>
                        </div>
                        {selectedCustomerDetails?.isDealer && (
                          <div className="text-right">
                            <Text className="text-zinc-400">Account Type</Text>
                            <Text className="text-white">Dealer</Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  {orders.length === 0 ? (
                    <p className="text-zinc-400">No orders found for this customer</p>
                  ) : (
                    <>
                      {/* Customer Summary Cards */}
                      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4 mb-6">
                        <Card className="bg-zinc-800 border-zinc-700">
                          <Flex>
                            <div>
                              <Text className="text-zinc-400">Total Orders</Text>
                              <Metric className="text-white">{customerSummary?.totalOrders}</Metric>
                            </div>
                            <ShoppingCart className="h-8 w-8 text-zinc-400" />
                          </Flex>
                        </Card>
                        <Card className="bg-zinc-800 border-zinc-700">
                          <Flex>
                            <div>
                              <Text className="text-zinc-400">Total Revenue</Text>
                              <Metric className="text-white">
                                {formatCurrency(customerSummary?.totalRevenue || 0)}
                              </Metric>
                            </div>
                            <DollarSign className="h-8 w-8 text-zinc-400" />
                          </Flex>
                        </Card>
                        <Card className="bg-zinc-800 border-zinc-700">
                          <Flex>
                            <div>
                              <Text className="text-zinc-400">Total Items</Text>
                              <Metric className="text-white">{customerSummary?.totalItems}</Metric>
                            </div>
                            <Package className="h-8 w-8 text-zinc-400" />
                          </Flex>
                        </Card>
                        <Card className="bg-zinc-800 border-zinc-700">
                          <Flex>
                            <div>
                              <Text className="text-zinc-400">Last Order</Text>
                              <Metric className="text-white">
                                {customerSummary?.lastOrderDate
                                  ? new Date(customerSummary.lastOrderDate).toLocaleDateString()
                                  : 'N/A'}
                              </Metric>
                            </div>
                            <Calendar className="h-8 w-8 text-zinc-400" />
                          </Flex>
                        </Card>
                      </Grid>

                      {/* Orders Table */}
                      <Card className="bg-zinc-800 border-zinc-700">
                        <Table>
                          <TableHead>
                            {table.getHeaderGroups().map((headerGroup) => (
                              <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                  <TableHeaderCell key={header.id}>
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext(),
                                    )}
                                  </TableHeaderCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableHead>
                          <TableBody>
                            {table.getRowModel().rows.map((row) => (
                              <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                  <TableCell key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {/* Pagination Controls */}
                        <div className="flex flex-col gap-3 md:gap-0 md:flex-row items-center justify-between mt-4">
                          <div className="flex items-center gap-1 md:gap-2">
                            <button
                              onClick={() => table.setPageIndex(0)}
                              disabled={!table.getCanPreviousPage()}
                              className="px-3 py-1 rounded-md bg-zinc-700 text-white disabled:opacity-50"
                            >
                              First
                            </button>
                            <button
                              onClick={() => table.previousPage()}
                              disabled={!table.getCanPreviousPage()}
                              className="px-3 py-1 rounded-md bg-zinc-700 text-white disabled:opacity-50"
                            >
                              Previous
                            </button>
                            <button
                              onClick={() => table.nextPage()}
                              disabled={!table.getCanNextPage()}
                              className="px-3 py-1 rounded-md bg-zinc-700 text-white disabled:opacity-50"
                            >
                              Next
                            </button>
                            <button
                              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                              disabled={!table.getCanNextPage()}
                              className="px-3 py-1 rounded-md bg-zinc-700 text-white disabled:opacity-50"
                            >
                              Last
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400">
                              Page {table.getState().pagination.pageIndex + 1} of{' '}
                              {table.getPageCount()}
                            </span>
                            <select
                              value={table.getState().pagination.pageSize}
                              onChange={(e) => {
                                table.setPageSize(Number(e.target.value))
                              }}
                              className="px-3 py-1 rounded-md bg-zinc-700 text-white md:block hidden"
                            >
                              {[10, 20, 30, 40, 50].map((pageSize) => (
                                <option key={pageSize} value={pageSize}>
                                  Show {pageSize}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </Card>
                    </>
                  )}
                </>
              )}
            </div>
          ) : (
            <p className="text-zinc-400">Select a customer above to view their orders</p>
          )}
        </div>
      </div>
    </div>
  )
}
