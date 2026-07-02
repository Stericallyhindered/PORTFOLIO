'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { DealerSelect } from '@/components/DealerSelect'
import {
  Package,
  DollarSign,
  ShoppingCart,
  Calendar,
  ExternalLink,
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
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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

interface DealerSummary {
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

export default function DealerOrdersPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState<string | null>(null)
  const [dealerSummary, setDealerSummary] = useState<DealerSummary | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const searchParams = useSearchParams()
  const dealerId = searchParams.get('dealer')

  useEffect(() => {
    const fetchOrders = async () => {
      if (!dealerId) return

      try {
        setIsLoading(true)
        setError(null)

        // Fetch orders for the specific dealer using query parameter
        const ordersUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders?dealerId=${dealerId}`

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

        // Calculate dealer summary
        const summary: DealerSummary = {
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
        setDealerSummary(summary)
      } catch (error) {
        console.error('Full error details:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to load orders'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [dealerId])

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dealer Orders</h1>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="p-6">
          <div className="mb-6">
            <DealerSelect />
          </div>

          {dealerId ? (
            <div className="mt-6">
              {isLoading ? (
                <p className="text-zinc-400">Loading dealer orders...</p>
              ) : error ? (
                <div>
                  <p className="text-red-400">Error: {error}</p>
                  <p className="text-zinc-400 text-sm mt-2">Dealer ID: {dealerId}</p>
                  <p className="text-zinc-400 text-sm mt-1">
                    Server URL: {process.env.NEXT_PUBLIC_SERVER_URL}
                  </p>
                </div>
              ) : orders.length === 0 ? (
                <p className="text-zinc-400">No orders found for this dealer</p>
              ) : (
                <>
                  {/* Dealer Summary Cards */}
                  <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4 mb-6">
                    <Card className="bg-zinc-800 border-zinc-700">
                      <Flex>
                        <div>
                          <Text className="text-zinc-400">Total Orders</Text>
                          <Metric className="text-white">{dealerSummary?.totalOrders}</Metric>
                        </div>
                        <ShoppingCart className="h-8 w-8 text-zinc-400" />
                      </Flex>
                    </Card>
                    <Card className="bg-zinc-800 border-zinc-700">
                      <Flex>
                        <div>
                          <Text className="text-zinc-400">Total Revenue</Text>
                          <Metric className="text-white">
                            {formatCurrency(dealerSummary?.totalRevenue || 0)}
                          </Metric>
                        </div>
                        <DollarSign className="h-8 w-8 text-zinc-400" />
                      </Flex>
                    </Card>
                    <Card className="bg-zinc-800 border-zinc-700">
                      <Flex>
                        <div>
                          <Text className="text-zinc-400">Total Items</Text>
                          <Metric className="text-white">{dealerSummary?.totalItems}</Metric>
                        </div>
                        <Package className="h-8 w-8 text-zinc-400" />
                      </Flex>
                    </Card>
                    <Card className="bg-zinc-800 border-zinc-700">
                      <Flex>
                        <div>
                          <Text className="text-zinc-400">Last Order</Text>
                          <Metric className="text-white">
                            {dealerSummary?.lastOrderDate
                              ? new Date(dealerSummary.lastOrderDate).toLocaleDateString()
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
                                {flexRender(header.column.columnDef.header, header.getContext())}
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
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
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
                          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                        </span>
                        <select
                          value={table.getState().pagination.pageSize}
                          onChange={(e) => {
                            table.setPageSize(Number(e.target.value))
                          }}
                          className="px-3 py-1 rounded-md bg-zinc-700 text-white"
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
            </div>
          ) : (
            <p className="text-zinc-400">Select a dealer above to view their orders</p>
          )}
        </div>
      </div>
    </div>
  )
}
