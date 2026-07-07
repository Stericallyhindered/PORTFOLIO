'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface ProductPaginationProps {
  totalProducts: number
  currentPage: number
  itemsPerPage: number
}

export default function ProductPagination({
  totalProducts,
  currentPage,
  itemsPerPage,
}: ProductPaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalPages = Math.ceil(totalProducts / itemsPerPage)

  const updatePage = (page: number) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (page === 1) {
      params.delete('page')
    } else {
      params.set('page', page.toString())
    }
    router.push(`/products?${params.toString()}`)
  }

  const updateItemsPerPage = (items: number) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('perPage', items.toString())
    params.delete('page') // Reset to page 1
    router.push(`/products?${params.toString()}`)
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Items per page:</span>
        <select
          value={itemsPerPage}
          onChange={(e) => updateItemsPerPage(Number(e.target.value))}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value={12}>12</option>
          <option value={24}>24</option>
          <option value={48}>48</option>
          <option value={96}>96</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => updatePage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => updatePage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}




