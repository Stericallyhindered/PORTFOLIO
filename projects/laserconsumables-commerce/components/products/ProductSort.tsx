'use client'

import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ProductSortInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams?.get('sort') || 'name'

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (value === 'name') {
      params.delete('sort')
    } else {
      params.set('sort', value)
    }
    router.push(`/products?${params.toString()}`)
  }

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="sort" className="text-sm font-medium text-gray-700">
        Sort by:
      </label>
      <select
        id="sort"
        value={currentSort}
        onChange={(e) => handleSortChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
      >
        <option value="name">Name (A-Z)</option>
        <option value="name-desc">Name (Z-A)</option>
        <option value="price">Price (Low to High)</option>
        <option value="price-desc">Price (High to Low)</option>
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>
    </div>
  )
}

export default function ProductSort() {
  return (
    <Suspense fallback={<div className="w-48 h-10 bg-gray-200 animate-pulse rounded" />}>
      <ProductSortInner />
    </Suspense>
  )
}

