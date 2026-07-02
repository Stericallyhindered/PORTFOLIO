'use client'

import React from 'react'
import { format } from 'date-fns'

export default function TermsOfService(): React.ReactElement {
  const currentDate = format(new Date(), 'MMMM d, yyyy')

  return (
    <div className="min-h-screen bg-background dark:bg-black text-foreground dark:text-white pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 font-apotek-extended text-center">
          Terms of Service
        </h1>
        <p className="text-sm mb-8 text-gray-600 dark:text-gray-400 text-center">
          Last Updated: {currentDate}
        </p>

        <div className="prose dark:prose-invert max-w-none">
          <p className="mb-6">
            Welcome to Stealth Batteries (&quot;Company,&quot; &quot;we,&quot; &quot;our,&quot; or
            &quot;us&quot;). By accessing or using our website (stealthbatteries.com) and any
            related services (collectively, the &quot;Services&quot;), you agree to be bound by
            these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please
            do not use our Services.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. Use of Services</h2>

          <h3 className="text-xl font-bold mt-6 mb-3">1.1 Eligibility</h3>
          <p className="mb-4">
            You must be at least 18 years old to use our Services. By using the Services, you
            represent and warrant that you meet this requirement.
          </p>

          <h3 className="text-xl font-bold mt-6 mb-3">1.2 Account Responsibility</h3>
          <p className="mb-4">
            If you create an account, you are responsible for maintaining its confidentiality and
            for all activities under your account. We are not responsible for any unauthorized
            access or misuse of your account.
          </p>

          <h3 className="text-xl font-bold mt-6 mb-3">1.3 Prohibited Conduct</h3>
          <p className="mb-4">You agree not to:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Use the Services for any illegal or unauthorized purpose.</li>
            <li>Interfere with or disrupt the Services.</li>
            <li>Attempt to gain unauthorized access to any part of the Services.</li>
            <li>
              Use the Services in a manner that could damage, disable, overburden, or impair our
              infrastructure or networks.
            </li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. Orders and Payments</h2>

          <h3 className="text-xl font-bold mt-6 mb-3">2.1 Product Availability</h3>
          <p className="mb-4">
            We strive to provide accurate product information, but availability and descriptions may
            change without notice. We do not guarantee that any product will always be in stock or
            available for purchase.
          </p>

          <h3 className="text-xl font-bold mt-6 mb-3">2.2 Pricing and Payments</h3>
          <p className="mb-4">
            Prices are listed in U.S. dollars. We reserve the right to modify pricing at any time.
            Payments must be made through approved methods, and you are solely responsible for
            ensuring that your payment information is accurate and up to date.
          </p>

          <h3 className="text-xl font-bold mt-6 mb-3">2.3 Order Cancellation and Refunds</h3>
          <p className="mb-4">
            We may cancel an order due to product unavailability, pricing errors, or suspected
            fraud. Refund policies are detailed in our Refund Policy. We are not responsible for any
            losses incurred due to order cancellations or modifications.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. Intellectual Property</h2>

          <h3 className="text-xl font-bold mt-6 mb-3">3.1 Ownership</h3>
          <p className="mb-4">
            All content on the Services, including text, graphics, logos, and software, is owned by
            or licensed to Stealth Batteries and protected by intellectual property laws.
          </p>

          <h3 className="text-xl font-bold mt-6 mb-3">3.2 Restrictions</h3>
          <p className="mb-4">
            You may not reproduce, distribute, or modify our content without prior written
            permission. Unauthorized use may result in legal action.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            4. Disclaimers and Limitation of Liability
          </h2>

          <h3 className="text-xl font-bold mt-6 mb-3">4.1 No Warranties</h3>
          <p className="mb-4">
            The Services and all products are provided &quot;as is&quot; and &quot;as
            available&quot; without warranties of any kind, express or implied, including but not
            limited to warranties of merchantability, fitness for a particular purpose, and
            non-infringement.
          </p>

          <h3 className="text-xl font-bold mt-6 mb-3">4.2 Limitation of Liability</h3>
          <p className="mb-4">To the fullest extent permitted by law:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>
              Stealth Batteries shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages, including but not limited to loss of profits,
              data, or goodwill, arising from your use of the Services or any products purchased.
            </li>
            <li>
              Our total liability for any claim related to the Services or products shall not exceed
              the amount paid by you for the specific product giving rise to the claim.
            </li>
            <li>
              You assume all responsibility and risk for your use of the Services, including but not
              limited to the installation and use of our battery products. We are not liable for any
              damage, injury, or loss resulting from improper installation, misuse, or failure to
              follow manufacturer instructions.
            </li>
          </ul>

          <h3 className="text-xl font-bold mt-6 mb-3">4.3 Indemnification</h3>
          <p className="mb-4">
            You agree to indemnify, defend, and hold harmless Stealth Batteries, its affiliates,
            officers, directors, employees, and agents from any claims, liabilities, damages,
            losses, and expenses (including legal fees) arising from your use of the Services,
            violation of these Terms, or infringement of any third-party rights.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Governing Law and Dispute Resolution</h2>

          <h3 className="text-xl font-bold mt-6 mb-3">5.1 Governing Law</h3>
          <p className="mb-4">
            These Terms are governed by the laws of Arizona, without regard to conflict of law
            principles.
          </p>

          <h3 className="text-xl font-bold mt-6 mb-3">5.2 Dispute Resolution</h3>
          <p className="mb-4">
            Any disputes shall be resolved through binding arbitration in Arizona, except where
            prohibited by law. You waive any right to participate in class actions, jury trials, or
            other collective proceedings.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">6. Changes to These Terms</h2>
          <p className="mb-4">
            We reserve the right to modify these Terms at any time. Changes will be effective upon
            posting to the website. Your continued use of the Services constitutes acceptance of the
            revised Terms.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">7. Contact Us</h2>
          <p className="mb-4">If you have any questions about these Terms, please contact us at:</p>
          <div className="mb-8">
            <p>Stealth Batteries</p>
            <p>3266 W Galveston Dr #103</p>
            <p>Apache Junction, AZ 85120</p>
            <p>Email: info@stealthbatteries.com</p>
            <p>Phone: (805) 310-1577</p>
          </div>

          <p className="mb-8">
            By using our Services, you acknowledge that you have read, understood, and agreed to
            these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  )
}
