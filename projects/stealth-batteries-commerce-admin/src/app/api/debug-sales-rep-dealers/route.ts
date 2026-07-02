import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const salesRepId = searchParams.get('salesRepId')

    const payload = await getPayload({ config })

    // Get all dealers
    const allDealers = await payload.find({
      collection: 'dealers',
      limit: 100,
      depth: 1,
    })

    // Get dealers with any salesRep assigned
    const dealersWithSalesRep = allDealers.docs.filter((dealer) => dealer.salesRep)

    // If specific sales rep requested, show detailed info
    let specificSalesRepDealers: any = null
    if (salesRepId) {
      const salesRepIdNum = parseInt(salesRepId, 10)

      // Find dealers assigned to this sales rep
      const assignedDealers = allDealers.docs.filter((dealer) => {
        const dealerSalesRepId =
          typeof dealer.salesRep === 'object' ? dealer.salesRep?.id : dealer.salesRep
        return dealerSalesRepId === salesRepIdNum
      })

      specificSalesRepDealers = {
        salesRepId: salesRepIdNum,
        assignedDealersCount: assignedDealers.length,
        assignedDealers: assignedDealers.map((dealer) => ({
          id: dealer.id,
          companyName: dealer.companyName,
          email: dealer.email,
          salesRep: dealer.salesRep,
          salesRepId: typeof dealer.salesRep === 'object' ? dealer.salesRep?.id : dealer.salesRep,
        })),
      }
    }

    return NextResponse.json({
      summary: {
        totalDealers: allDealers.totalDocs,
        dealersWithSalesRep: dealersWithSalesRep.length,
        dealersWithoutSalesRep: allDealers.totalDocs - dealersWithSalesRep.length,
      },
      dealersWithSalesRep: dealersWithSalesRep.map((dealer) => ({
        id: dealer.id,
        companyName: dealer.companyName,
        email: dealer.email,
        salesRep: dealer.salesRep,
        salesRepId: typeof dealer.salesRep === 'object' ? dealer.salesRep?.id : dealer.salesRep,
      })),
      specificSalesRepDealers,
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
