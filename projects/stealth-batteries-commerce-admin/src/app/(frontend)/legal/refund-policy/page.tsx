import React from 'react'
import { Metadata } from 'next'
import { getServerSideURL } from '@/utilities/getURL'

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Refund Policy for Stealth Batteries, should you ever need it.',
  alternates: {
    canonical: `${getServerSideURL()}/legal/refund-policy`,
  },
  openGraph: {
    title: 'Refund Policy',
    description: 'Refund Policy for Stealth Batteries, should you ever need it.',
  },
}

export default function RefundPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Refund Policy</h1>
      <p className="text-gray-600 mb-4">Last Updated: March 19, 2024</p>

      <div className="prose max-w-none">
        <p>
          At Stealth Batteries, we are committed to providing high-quality battery products and
          ensuring customer satisfaction. If you are not completely satisfied with your purchase, we
          offer a refund policy subject to the terms and conditions outlined below.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Eligibility for Refunds</h2>
        <p>To be eligible for a refund, the following conditions must be met:</p>
        <ul className="list-disc pl-6 mb-6">
          <li>The item must be returned within 30 days of the purchase date.</li>
          <li>
            The product must be in its original condition, unused, and in its original packaging.
          </li>
          <li>Proof of purchase (such as an order confirmation or receipt) must be provided.</li>
          <li>The item must not be a final sale or clearance product.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Non-Refundable Items</h2>
        <p>The following items are not eligible for refunds:</p>
        <ul className="list-disc pl-6 mb-6">
          <li>Used or damaged batteries (unless defective upon arrival).</li>
          <li>Custom or special-order batteries.</li>
          <li>Products that have been altered, modified, or improperly used.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Return Process</h2>
        <p>
          To initiate a return, contact our customer support team at{' '}
          <a href="mailto:support@stealthbatteries.com" className="text-blue-600 hover:underline">
            support@stealthbatteries.com
          </a>{' '}
          with your order details and reason for return.
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>
            Once your return request is approved, you will receive instructions on how to send the
            product back.
          </li>
          <li>
            Customers are responsible for return shipping costs unless the product is defective or
            incorrect.
          </li>
          <li>
            We recommend using a trackable shipping service, as we are not responsible for lost or
            damaged returns.
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Refund Processing</h2>
        <ul className="list-disc pl-6 mb-6">
          <li>
            Upon receipt and inspection of the returned item, we will notify you of the approval or
            rejection of your refund.
          </li>
          <li>
            If approved, refunds will be processed within 5-7 business days to the original payment
            method.
          </li>
          <li>
            Shipping costs are non-refundable, except in cases where we have shipped an incorrect or
            defective product.
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Defective or Incorrect Items</h2>
        <p>
          If you receive a defective or incorrect product, please contact us within 7 days of
          receipt at{' '}
          <a href="mailto:support@stealthbatteries.com" className="text-blue-600 hover:underline">
            support@stealthbatteries.com
          </a>
          . We will arrange for a replacement or issue a full refund, including return shipping
          costs.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Exchanges</h2>
        <p>
          We offer exchanges for defective or damaged items. To request an exchange, please contact
          us at{' '}
          <a href="mailto:support@stealthbatteries.com" className="text-blue-600 hover:underline">
            support@stealthbatteries.com
          </a>
          .
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Changes to This Policy</h2>
        <p>
          Stealth Batteries reserves the right to modify or update this refund policy at any time.
          Any changes will be posted on our website and will take effect immediately.
        </p>

        <p className="mt-8">
          For any questions or concerns regarding our refund policy, please reach out to us at{' '}
          <a href="mailto:support@stealthbatteries.com" className="text-blue-600 hover:underline">
            support@stealthbatteries.com
          </a>
          .
        </p>
      </div>
    </div>
  )
}
