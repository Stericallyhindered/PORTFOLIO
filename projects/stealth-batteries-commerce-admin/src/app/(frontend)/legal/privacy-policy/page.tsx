import React from 'react'
import { Metadata } from 'next'
import { getServerSideURL } from '@/utilities/getURL'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Stealth Batteries',
  alternates: {
    canonical: `${getServerSideURL()}/legal/privacy-policy`,
  },
  openGraph: {
    title: 'Privacy Policy',
    description: 'Privacy Policy for Stealth Batteries',
  },
}

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm mb-4">
        Effective Date: March 14, 2024
        <br />
        Last Updated: March 14, 2024
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Introduction</h2>
        <p className="mb-4">
          Welcome to Stealth Batteries (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo;
          or &ldquo;us&rdquo;). Your privacy is important to us. This Privacy Policy explains how we
          collect, use, disclose, and safeguard your information when you visit our website,
          stealthbatteries.com (&ldquo;Website&rdquo;). By using our Website, you agree to the
          collection and use of information in accordance with this Privacy Policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
        <p className="mb-4">
          We collect the following types of information when you use our Website:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">
            <strong>Personal Information:</strong> Includes your name, email address, phone number,
            billing and shipping addresses, and payment details when you make a purchase or contact
            us.
          </li>
          <li className="mb-2">
            <strong>Non-Personal Information:</strong> Includes browser type, device information, IP
            address, and cookies that help us analyze Website performance and improve user
            experience.
          </li>
          <li className="mb-2">
            <strong>Cookies and Tracking Technologies:</strong> We use cookies, web beacons, and
            similar tracking technologies to collect information about your interactions with our
            Website.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">2. How We Use Your Information</h2>
        <p className="mb-4">We use the information collected for various purposes, including:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Processing transactions and fulfilling orders</li>
          <li>Providing customer support and responding to inquiries</li>
          <li>Improving Website functionality and user experience</li>
          <li>Sending promotional emails, offers, and updates (you may opt-out at any time)</li>
          <li>Ensuring compliance with legal and regulatory requirements</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">3. How We Share Your Information</h2>
        <p className="mb-4">
          We do not sell, rent, or trade your personal information. However, we may share your
          information in the following circumstances:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">
            <strong>With Service Providers:</strong> We may share your information with third-party
            vendors who assist in operating our Website, processing payments, or delivering orders.
          </li>
          <li className="mb-2">
            <strong>Legal Compliance:</strong> If required by law, we may disclose your information
            to government authorities or other relevant parties.
          </li>
          <li className="mb-2">
            <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of
            assets, your information may be transferred to the new entity.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">4. Data Security</h2>
        <p className="mb-4">
          We implement reasonable security measures to protect your personal information from
          unauthorized access, alteration, or disclosure. However, no method of transmission over
          the internet is 100% secure, and we cannot guarantee absolute security.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">5. Your Rights and Choices</h2>
        <p className="mb-4">
          Depending on your location, you may have rights regarding your personal data, including:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>The right to access, update, or delete your personal information</li>
          <li>The right to withdraw consent for data processing</li>
          <li>The right to opt-out of marketing communications</li>
        </ul>
        <p className="mb-4">
          To exercise these rights, please contact us at support@stealthbatteries.com.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">6. Third-Party Links</h2>
        <p className="mb-4">
          Our Website may contain links to third-party websites. We are not responsible for the
          privacy practices of these websites, and we encourage you to review their privacy policies
          before providing any information.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">7. Children&apos;s Privacy</h2>
        <p className="mb-4">
          Our Website is not intended for individuals under the age of 13. We do not knowingly
          collect personal information from children. If we become aware that a child has provided
          us with personal data, we will take steps to delete it.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">8. Changes to This Privacy Policy</h2>
        <p className="mb-4">
          We reserve the right to update this Privacy Policy at any time. Any changes will be posted
          on this page with an updated &ldquo;Last Updated&rdquo; date. Your continued use of the
          Website after changes are posted constitutes your acceptance of the revised policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">9. Contact Us</h2>
        <p className="mb-4">
          If you have any questions about this Privacy Policy, please contact us at:
        </p>
        <div className="mb-4">
          <p>Stealth Batteries</p>
          <p>support@stealthbatteries.com</p>
        </div>
      </section>

      <section className="mb-8">
        <p className="text-sm italic">
          This Privacy Policy is designed to comply with applicable privacy laws, including the
          General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA),
          where applicable.
        </p>
      </section>
    </div>
  )
}
