import { cookies } from 'next/headers'
import { getPayloadClient } from '@/getPayload'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'

async function getAffiliateData() {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) {
    throw new Error('No authentication token found')
  }

  // Try affiliate first
  const affiliateResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/affiliates/me`, {
    headers: {
      Authorization: `JWT ${token}`,
    },
    cache: 'no-store',
  })

  if (affiliateResponse.ok) {
    const data = await affiliateResponse.json()
    return data.user || data
  }

  // If affiliate not found, try admin
  const adminResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/me`, {
    headers: {
      Authorization: `JWT ${token}`,
    },
    cache: 'no-store',
  })

  if (!adminResponse.ok) {
    throw new Error('Failed to fetch data')
  }

  const adminData = await adminResponse.json()
  if (!adminData.user?.canAccessAdmin) {
    throw new Error('Unauthorized')
  }

  return adminData.user
}

export default async function DashboardPage() {
  const affiliate = await getAffiliateData()

  // Check if Stripe onboarding is needed
  if (
    affiliate.payoutInfo?.paymentMethod === 'stripe' &&
    !affiliate.payoutInfo?.stripeOnboardingComplete &&
    affiliate.stripeConnectURL
  ) {
    redirect(affiliate.stripeConnectURL)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Affiliate Dashboard</h1>

      {/* Affiliate Stats */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-2 text-lg font-semibold text-gray-600">Total Earnings</h3>
          <p className="text-2xl font-bold">${(affiliate.totalEarnings || 0).toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-2 text-lg font-semibold text-gray-600">Total Orders</h3>
          <p className="text-2xl font-bold">{affiliate.totalOrders || 0}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-2 text-lg font-semibold text-gray-600">Commission Rate</h3>
          <p className="text-2xl font-bold">{affiliate.affiliateCommission}%</p>
        </div>
      </div>

      {/* Affiliate Code Section */}
      <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-bold">Your Affiliate Link</h2>
        <div className="mb-4">
          <p className="mb-2 text-gray-600">Share this link with your customers:</p>
          <code className="block rounded bg-gray-100 p-3">
            {`${process.env.NEXT_PUBLIC_SERVER_URL}?ref=${affiliate.affiliateCode}`}
          </code>
        </div>
        <p className="text-sm text-gray-500">
          Customers using this link will receive a {affiliate.customerDiscount}% discount on their
          purchase.
        </p>
      </div>

      {/* Payout Information */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-bold">Payout Information</h2>
        <div className="space-y-4">
          <p>
            <span className="font-semibold">Payment Method:</span>{' '}
            {affiliate.payoutInfo?.paymentMethod.toUpperCase()}
          </p>
          {affiliate.payoutInfo?.paymentMethod === 'stripe' && (
            <p>
              <span className="font-semibold">Stripe Status:</span>{' '}
              {affiliate.payoutInfo?.stripeOnboardingComplete ? (
                <span className="text-green-600">Connected</span>
              ) : (
                <span className="text-yellow-600">Setup Required</span>
              )}
            </p>
          )}
          {affiliate.payoutInfo?.paymentMethod === 'paypal' && (
            <p>
              <span className="font-semibold">PayPal Email:</span>{' '}
              {affiliate.payoutInfo?.paypalEmail}
            </p>
          )}
          {affiliate.payoutInfo?.paymentMethod === 'bank' &&
            affiliate.payoutInfo?.accountNumber && (
              <>
                <p>
                  <span className="font-semibold">Bank Name:</span> {affiliate.payoutInfo?.bankName}
                </p>
                <p>
                  <span className="font-semibold">Account Number:</span> ••••
                  {affiliate.payoutInfo.accountNumber.slice(-4)}
                </p>
              </>
            )}
        </div>
      </div>
    </div>
  )
}
