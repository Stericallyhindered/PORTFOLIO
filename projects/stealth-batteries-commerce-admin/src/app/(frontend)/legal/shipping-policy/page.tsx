import { format } from 'date-fns'
import React from 'react'
import { Metadata } from 'next'
import { getServerSideURL } from '@/utilities/getURL'

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Shipping Policy for Stealth Batteries',
  alternates: {
    canonical: `${getServerSideURL()}/legal/shipping-policy`,
  },
  openGraph: {
    title: 'Shipping Policy',
    description: 'Shipping Policy for Stealth Batteries',
  },
}

export default function ShippingPolicy(): React.ReactElement {
  const currentDate = format(new Date(), 'MMMM d, yyyy')

  return (
    <div className="min-h-screen bg-background dark:bg-black text-foreground dark:text-white pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 font-apotek-extended text-center">
          Shipping Policy
        </h1>
        <p className="text-sm mb-8 text-gray-600 dark:text-gray-400 text-center">
          Last Updated: {currentDate}
        </p>

        <div className="prose dark:prose-invert max-w-none">
          <h2 className="text-2xl font-bold mt-8 mb-4">Order Processing</h2>
          <p className="mb-4">
            <strong>Processing Time:</strong> Orders are processed within 1-2 business days (Monday
            through Friday) after payment confirmation.
          </p>
          <p className="mb-4">
            <strong>Order Confirmation:</strong> Upon placing an order, you will receive an email
            confirmation. Once your order is shipped, a subsequent email will provide tracking
            information.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Shipping Methods and Delivery Times</h2>
          <ul className="list-disc pl-6 mb-6">
            <li>Standard Shipping: Delivery within 5-7 business days.</li>
            <li>Three Day Shipping: Delivery within 3 business days.</li>
            <li>
              Overnight Shipping: Next business day delivery for orders placed before 12 PM PST.
            </li>
          </ul>
          <p className="mb-4">
            Please note that delivery times are estimates and may vary due to carrier delays or
            unforeseen circumstances.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Shipping Rates</h2>
          <ul className="list-disc pl-6 mb-6">
            <li>Standard Shipping: $60 flat rate.</li>
            <li>Three Day Shipping: $100 flat rate.</li>
            <li>Overnight Shipping: $200 flat rate.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Shipping Restrictions</h2>
          <ul className="list-disc pl-6 mb-6">
            <li>
              P.O. Boxes and APO/FPO Addresses: We do not ship to P.O. boxes or APO/FPO addresses.
            </li>
            <li>International Shipping: Currently, we only ship within the United States.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Handling of Battery Products</h2>
          <p className="mb-4">
            Due to the nature of our products, we adhere strictly to shipping regulations for
            batteries:
          </p>
          <ul className="list-disc pl-6 mb-6">
            <li>
              Packaging: All batteries are packaged in compliance with federal regulations to ensure
              safe transit.
            </li>
            <li>
              Labeling: Shipments are appropriately labeled to indicate the presence of battery
              products.
            </li>
            <li>
              Carrier Compliance: We partner with carriers experienced in handling hazardous
              materials to ensure compliance with all safety protocols.
            </li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Order Tracking</h2>
          <p className="mb-4">
            Once your order is shipped, you will receive a tracking number via email. You can use
            this number to monitor your shipment&apos;s progress through the carrier&apos;s website.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Damaged or Lost Packages</h2>
          <p className="mb-4">
            If your package arrives damaged or is lost in transit, please contact our customer
            service within 7 days of the expected delivery date. We will work with the carrier to
            resolve the issue promptly.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Contact Information</h2>
          <p className="mb-4">
            For any questions or concerns regarding shipping, please contact us at:
          </p>
          <div className="mb-8">
            <p>Stealth Batteries</p>
            <p>3266 W Galveston Dr #103</p>
            <p>Apache Junction, AZ 85120</p>
            <p>Email: info@stealthbatteries.com</p>
            <p>Phone: (805) 310-1577</p>
          </div>

          <p className="mb-8">
            By placing an order with Stealth Batteries, you agree to the terms outlined in this
            Shipping Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
