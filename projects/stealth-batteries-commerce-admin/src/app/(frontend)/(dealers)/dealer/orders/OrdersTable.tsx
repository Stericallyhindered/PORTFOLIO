'use client'

import { useMemo, useState, useEffect } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@tremor/react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronRight, ChevronLeft, MoreHorizontal, Eye, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { toast } from 'sonner'

function classNames(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

interface Order {
  id: string
  orderNumber: string
  uuid: string
  status: string
  total: number
  dealerTotal: number
  createdAt: string
  items: Array<{
    product:
      | {
          id: string | number
          title: string
          slug: string
          heroImage?:
            | {
                url?: string
                filename?: string
                mimeType?: string
                filesize?: number
                width?: number
                height?: number
              }
            | string
        }
      | string
    quantity: number
    price: number
    variant?: {
      name: string
      value: string
    }
  }>
}

interface OrdersTableProps {
  orders:
    | {
        docs: Order[]
        totalDocs?: number
        totalPages?: number
      }
    | Order[]
}

function isPaginatedResponse(orders: OrdersTableProps['orders']): orders is {
  docs: Order[]
  totalDocs?: number
  totalPages?: number
} {
  return 'docs' in orders
}

type AriaSort = 'none' | 'ascending' | 'descending' | 'other'

function getSortDirection(isSorted: false | 'asc' | 'desc'): AriaSort {
  if (!isSorted) return 'none'
  return isSorted === 'asc' ? 'ascending' : 'descending'
}

type OrderColumn = ColumnDef<Order, any>

function getStatusBadgeColor(status: string) {
  switch (status.toLowerCase()) {
    case 'delivered':
      return 'bg-green-500'
    case 'shipped':
      return 'bg-blue-500'
    case 'processing':
      return 'bg-yellow-500'
    case 'cancelled':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

const PaginationButton = ({
  active,
  onClick,
  disabled,
  children,
  position,
  className,
}: {
  active?: boolean
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  position?: 'left' | 'right'
  className?: string
}) => {
  return (
    <button
      type="button"
      className={classNames(
        'min-w-[36px] p-2 text-tremor-default text-tremor-content-strong ring-1 ring-inset ring-tremor-ring hover:bg-tremor-background-muted disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-tremor-background dark:text-dark-tremor-content-strong dark:ring-dark-tremor-ring dark:hover:bg-dark-tremor-background-muted dark:disabled:hover:bg-dark-tremor-background',
        active
          ? 'bg-tremor-background-muted font-semibold dark:bg-dark-tremor-background-muted'
          : '',
        position === 'left'
          ? 'rounded-l-md'
          : position === 'right'
            ? '-ml-px rounded-r-md'
            : '-ml-px',
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </button>
  )
}

const MobileButton = ({
  onClick,
  disabled,
  children,
  position,
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  position: 'left' | 'right'
}) => {
  return (
    <button
      type="button"
      className={classNames(
        'group p-2 text-tremor-default ring-1 ring-inset ring-tremor-ring hover:bg-tremor-background-muted disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-tremor-background dark:ring-dark-tremor-ring dark:hover:bg-dark-tremor-background dark:disabled:hover:bg-dark-tremor-background',
        position === 'left'
          ? 'rounded-l-tremor-small'
          : position === 'right'
            ? '-ml-px rounded-r-tremor-small'
            : '',
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export default function OrdersTable({ orders }: OrdersTableProps) {
  const router = useRouter()
  const { addItem, setDrawerOpen } = useCart()
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const tableData = isPaginatedResponse(orders) ? orders.docs : orders
  const totalDocs = isPaginatedResponse(orders)
    ? orders.totalDocs || tableData.length
    : tableData.length
  const totalPages = isPaginatedResponse(orders)
    ? orders.totalPages || Math.ceil(totalDocs / pageSize)
    : Math.ceil(tableData.length / pageSize)

  // Initialize pagination state from URL on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const pageFromUrl = parseInt(searchParams.get('page') || '1', 10)
    const limitFromUrl = parseInt(searchParams.get('limit') || '10', 10)
    setCurrentPage(pageFromUrl)
    setPageSize(limitFromUrl)
  }, [])

  // Update URL and fetch new data when pagination changes
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set('page', currentPage.toString())
    searchParams.set('limit', pageSize.toString())

    // Use router.push to update URL and trigger a new server render
    router.push(`${window.location.pathname}?${searchParams.toString()}`, { scroll: false })
  }, [currentPage, pageSize, router])

  const handleReorder = (items: Order['items']) => {
    try {
      // Add items from the order
      items.forEach((item) => {
        if (typeof item.product === 'object') {
          // Get the server URL from environment or default to localhost
          const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

          // Construct image URL with fallbacks
          let imageUrl = '/placeholder.svg'
          if (item.product.heroImage) {
            if (typeof item.product.heroImage === 'object') {
              if (item.product.heroImage.url) {
                imageUrl = item.product.heroImage.url.startsWith('http')
                  ? item.product.heroImage.url
                  : `${serverUrl}${item.product.heroImage.url}`
              } else if (item.product.heroImage.filename) {
                imageUrl = `${serverUrl}/media/${item.product.heroImage.filename}`
              }
            } else if (typeof item.product.heroImage === 'string') {
              imageUrl = item.product.heroImage.startsWith('http')
                ? item.product.heroImage
                : `${serverUrl}${item.product.heroImage}`
            }
          }

          const cartItem = {
            id: String(item.product.id),
            title: item.product.title,
            quantity: item.quantity,
            price: item.price,
            ...(item.variant?.name && item.variant?.value
              ? {
                  variant: {
                    name: item.variant.name,
                    value: item.variant.value,
                  },
                }
              : {}),
            image: imageUrl,
            slug: item.product.slug,
            product: item.product,
          }

          addItem(cartItem)
        }
      })

      // Show success message with action but don't open cart drawer
      toast.success('Items added to cart', {
        description: `${items.length} items from your previous order added to cart`,
        action: {
          label: 'View Cart',
          onClick: () => setDrawerOpen(true),
        },
      })
    } catch (error) {
      console.error('Error adding items to cart:', error)
      toast.error('Failed to add items to cart')
    }
  }

  const columns = useMemo<OrderColumn[]>(
    () => [
      {
        header: 'Order Number',
        accessorKey: 'orderNumber',
        enableSorting: true,
        cell: (info) => `#${info.getValue()}`,
      },
      {
        header: 'Date',
        accessorKey: 'createdAt',
        enableSorting: true,
        cell: (info) => format(new Date(info.getValue()), 'MMM d, yyyy'),
      },
      {
        header: 'Status',
        accessorKey: 'status',
        enableSorting: true,
        cell: (info) => (
          <Badge className={'capitalize ' + getStatusBadgeColor(info.getValue())}>
            {info.getValue()}
          </Badge>
        ),
      },
      {
        header: 'Items',
        accessorKey: 'items',
        enableSorting: true,
        cell: (info) => info.getValue().reduce((sum: number, item: any) => sum + item.quantity, 0),
      },
      {
        header: 'Total',
        accessorKey: 'total',
        enableSorting: true,
        cell: (info) => `$${info.getValue().toFixed(2)}`,
      },
      {
        header: 'Dealer Total',
        accessorKey: 'dealerTotal',
        enableSorting: true,
        cell: (info) => {
          const value = info.getValue()
          return typeof value === 'number' ? `$${value.toFixed(2)}` : '$0.00'
        },
      },
      {
        header: 'Actions',
        accessorKey: 'id',
        enableSorting: false,
        cell: (info) => {
          const uuid = info.row.original.uuid
          const isValidUuid = uuid && typeof uuid === 'string' && uuid.trim() !== ''
          const linkTarget = isValidUuid
            ? `/dealer/orders/${uuid}`
            : `/dealer/orders/${info.row.original.id}`

          return (
            <div className="text-right">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[160px]"
                  sideOffset={5}
                  collisionPadding={0}
                  hideWhenDetached
                >
                  <DropdownMenuItem onClick={() => router.push(linkTarget)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Order
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleReorder(info.row.original.items)}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Reorder Items
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [],
  )

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true, // Tell TanStack table that we're handling pagination ourselves
    pageCount: totalPages,
    state: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
  })

  // Calculate totals for visible orders
  const subtotal = tableData.reduce((sum, order) => sum + order.total, 0)

  // Calculate potential revenue, dealer cost, and profit for visible orders
  const potentialRevenue = tableData.reduce((sum, order) => {
    if (!order.items) return sum
    return (
      sum +
      order.items.reduce((itemSum, item) => {
        if (
          typeof item.product === 'object' &&
          'price' in item.product &&
          typeof item.product.price === 'number'
        )
          return itemSum + item.quantity * item.product.price
        return itemSum
      }, 0)
    )
  }, 0)
  const dealerCost = tableData.reduce((sum, order) => {
    if (!order.items) return sum
    return (
      sum +
      order.items.reduce((itemSum, item) => {
        if (typeof item.price === 'number') return itemSum + item.quantity * item.price
        return itemSum
      }, 0)
    )
  }, 0)
  const potentialProfit = potentialRevenue - dealerCost

  return (
    <>
      <div className="sm:flex sm:items-center sm:justify-between sm:space-x-10">
        <div>
          <h3 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            All Orders
          </h3>
          <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
            Overview of all your orders and their current status.
          </p>
          <p className="mt-1 md:hidden flex flex-col items-center text-tremor-default leading-6 text-tremor-content text-md text-center w-full">
            Swipe table to view more columns <span className="ml-1">→</span>
          </p>
        </div>
      </div>

      {/* Orders Table */}
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
      <div className="mt-10 flex items-center justify-between sm:justify-center">
        {/* Desktop pagination */}
        {totalPages > 1 && (
          <div className="hidden rounded-tremor-small shadow-tremor-input dark:shadow-dark-tremor-input sm:block">
            <PaginationButton
              position="left"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4"
            >
              Prev
            </PaginationButton>
            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1
              const isCurrentPage = pageNumber === currentPage
              const isFirstPage = pageNumber === 1
              const isLastPage = pageNumber === totalPages
              const isWithinTwoPages = Math.abs(pageNumber - currentPage) <= 2

              if (isFirstPage || isLastPage || isWithinTwoPages) {
                return (
                  <PaginationButton
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    active={isCurrentPage}
                  >
                    {pageNumber}
                  </PaginationButton>
                )
              }

              if (
                (pageNumber === 2 && currentPage > 4) ||
                (pageNumber === totalPages - 1 && currentPage < totalPages - 3)
              ) {
                return (
                  <PaginationButton
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    disabled
                  >
                    ...
                  </PaginationButton>
                )
              }

              return null
            })}
            <PaginationButton
              position="right"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4"
            >
              Next
            </PaginationButton>
          </div>
        )}

        {/* Mobile pagination */}
        {totalPages > 1 && (
          <>
            <p className="text-tremor-default tabular-nums text-tremor-content dark:text-dark-tremor-content sm:hidden">
              Page{' '}
              <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                {currentPage}
              </span>{' '}
              of{' '}
              <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                {totalPages}
              </span>
            </p>
            <div className="inline-flex items-center rounded-tremor-small shadow-tremor-input dark:shadow-dark-tremor-input sm:hidden">
              <MobileButton
                position="left"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5 text-tremor-content-emphasis group-hover:text-tremor-content-strong dark:text-dark-tremor-content-emphasis dark:group-hover:text-dark-tremor-content-strong" />
              </MobileButton>
              <MobileButton
                position="right"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5 text-tremor-content-emphasis group-hover:text-tremor-content-strong dark:text-dark-tremor-content-emphasis dark:group-hover:text-dark-tremor-content-strong" />
              </MobileButton>
            </div>
          </>
        )}
      </div>

      {/* Page Size Selector */}
      <div className="mt-4 flex justify-end">
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value))
            setCurrentPage(1) // Reset to first page when changing page size
          }}
          className="px-3 py-1 rounded-md bg-zinc-700 text-white"
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              Show {size} per page
            </option>
          ))}
        </select>
      </div>

      {/* Total Orders Info */}
      <div className="mt-4 text-sm text-tremor-content dark:text-dark-tremor-content">
        Showing {Math.min((currentPage - 1) * pageSize + 1, totalDocs)} -{' '}
        {Math.min(currentPage * pageSize, totalDocs)} of {totalDocs} orders
      </div>

      {/* Revenue/Profit Summary */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-800 rounded-lg p-4">
          <div className="text-xs text-zinc-400 mb-1">Potential Revenue (regular price)</div>
          <div className="text-lg font-bold">${potentialRevenue.toFixed(2)}</div>
        </div>
        <div className="bg-zinc-800 rounded-lg p-4">
          <div className="text-xs text-zinc-400 mb-1">Dealer Cost (what you paid)</div>
          <div className="text-lg font-bold">${dealerCost.toFixed(2)}</div>
        </div>
        <div className="bg-zinc-800 rounded-lg p-4">
          <div className="text-xs text-zinc-400 mb-1">Potential Profit</div>
          <div className="text-lg font-bold">${potentialProfit.toFixed(2)}</div>
        </div>
      </div>
    </>
  )
}
