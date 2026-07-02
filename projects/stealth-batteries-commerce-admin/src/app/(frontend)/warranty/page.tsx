import LightningBolt from '@/components/icons/LightningBolt'
import { RoundLogo } from '@/components/RoundLogo'
import React from 'react'
import { Metadata } from 'next'
import { getServerSideURL } from '@/utilities/getURL'

export const metadata: Metadata = {
  title: '10-Year Warranty',
  description: 'Unrivaled Power, Trusted and Dependable. Backed with Full Confidence.',
  alternates: {
    canonical: `${getServerSideURL()}/warranty`,
  },
  openGraph: {
    title: '10-Year Warranty',
    description: 'Unrivaled Power, Trusted and Dependable. Backed with Full Confidence.',
  },
}

export default function Warranty() {
  return (
    <>
      <div className="w-full bg-primary text-white flex items-center justify-center min-h-16 py-4 gap-12 mt-12">
        <LightningBolt className="h-10 w-10 p-1 rounded-full bg-white stroke-primary fill-primary" />
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-medium font-noto">Stealth Batteries 10-Year Warranty</h1>
          <span className="text-lg font-noto mt-2">Unrivaled Power. Backed with Confidence.</span>
        </div>
        <LightningBolt className="h-10 w-10 p-1 rounded-full bg-white stroke-primary fill-primary scale-x-[1]" />
      </div>
      <main className="container mx-auto flex flex-col min-h-screen gap-8 py-24 font-noto">
        <div className="border-t border-primary w-full my-4" />
        <section>
          <h2 className="text-2xl font-medium font-noto mb-2">Coverage Terms:</h2>
          <p className="mb-2">
            Your Stealth Battery is covered for{' '}
            <span className="font-bold text-primary">10 full years</span> from the date of purchase.
            If your battery fails due to a manufacturing defect during this period, we will repair
            or replace it with a battery of equal or greater value and at no cost to you.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>
              <span className="font-bold text-primary">Years 1–10:</span> Full coverage for
              manufacturing defects (3650 days)
            </li>
            <li>
              No prorating. No complicated terms. Just guaranteed performance backed by us, Stealth
              Batteries.
            </li>
          </ul>
        </section>
        <div className="border-t border-primary w-full my-4" />
        <section>
          <h2 className="text-xl font-bold text-primary mb-2">Shipping Costs:</h2>
          <p>We pay for all shipping costs related to approved warranty claims!</p>
          <p className="mt-1">
            You trusted us, and{' '}
            <span className="font-bold">we stand behind you &amp; our products.</span>
          </p>
        </section>
        <div className="border-t border-primary w-full my-4" />
        <section>
          <h2 className="text-xl font-bold text-primary mb-2">Proof of Purchase:</h2>
          <p>
            We prefer a receipt or invoice to help speed up the process, but it&apos;s not required.
          </p>
          <p className="mt-1">
            If it&apos;s a genuine Stealth Battery within 10 years of purchase,{' '}
            <span className="font-bold">we got you covered.</span>
          </p>
        </section>
        <div className="border-t border-primary w-full my-4" />
        <section>
          <h2 className="font-bold text-primary text-lg mb-2">Warranty Exclusions:</h2>
          <p className="mb-2">
            While our warranty is one of the strongest in the industry, it does not cover:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Improper installation or failure to follow usage guidelines.</li>
            <li>Use of non-approved or incompatible chargers.</li>
            <li>Operation outside recommended temperature or voltage ranges.</li>
            <li>Physical damage (e.g., water exposure, fire, impact, etc.)</li>
            <li>Unauthorized tampering, disassembly, or modification.</li>
            <li>Batteries left uncharged for 12+ months.</li>
            <li>Normal wear and tear (e.g., capacity loss below 70% over time)</li>
            <li>Shipping damage not reported within 2 days of delivery.</li>
          </ul>
        </section>
        <div className="border-t border-primary w-full my-4" />
        <section>
          <h2 className="font-bold text-primary text-lg mb-2">How to File a Warranty Claim:</h2>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>
              <span className="font-bold">Step 1: Visit your local dealer or Contact Support:</span>
              <ul className="list-disc list-inside ml-4 text-primary">
                <li>
                  <span className="text-white">Email: support@stealthbatteries.com</span>
                </li>
                <li>
                  <span className="text-white">Phone: 877-277-2025</span>
                </li>
              </ul>
              <span className="block mt-1">
                Provide a description of the issue and purchase details (if available).
              </span>
            </li>
            <li>
              <span className="font-bold">Step 2: Receive an RMA:</span>
              <span className="block mt-1">
                Once your claim is approved, we&apos;ll issue a Return Merchandise Authorization
                (RMA) along with a pre-paid return shipping label. If you&apos;re working with your
                dealer directly then they will handle all of this for you.
              </span>
            </li>
            <li>
              <span className="font-bold">Step 3: Ship the Battery:</span>
              <span className="block mt-1">
                Use the original packaging if available, or request suitable shipping materials from
                us.
              </span>
            </li>
            <li>
              <span className="font-bold">Step 4: Inspection & Resolution:</span>
              <span className="block mt-1">
                Once we receive and inspect your battery, we&apos;ll repair or replace it for equal
                or greater value and at no cost to you. Hassle Free!
              </span>
            </li>
          </ol>
        </section>
        <div className="border-t border-primary w-full my-4" />
        <section className="space-y-2">
          <h2 className="font-bold text-primary text-lg">Questions?</h2>
          <p>Our U.S.-based support team is ready to help.</p>
          <p>
            Reach out to us anytime at{' '}
            <span className="font-bold">support@stealthbatteries.com</span>
          </p>
          <p>
            or call us <span className="font-bold">877-277-2025</span>.
          </p>
        </section>
        <div className="pt-12 w-full flex items-center justify-center">
          <RoundLogo />
        </div>
      </main>
    </>
  )
}
