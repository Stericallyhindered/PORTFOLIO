// Client-side utility to fetch bulk discount levels from the new API route
export async function fetchBulkDiscountLevelsClient() {
  const res = await fetch('/api/fetch/fetch-bulk-discount-levels')
  if (!res.ok) throw new Error('Failed to fetch bulk discount levels')
  return res.json()
}
