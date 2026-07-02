import { Metadata } from 'next'
import { getServerSideURL } from '@/utilities/getURL'

export const metadata: Metadata = {
  title: 'Website Accessibility Statement',
  description: 'Website Accessibility Statement for Stealth Batteries',
  alternates: {
    canonical: `${getServerSideURL()}/legal/website-accessibility-statement`,
  },
  openGraph: {
    title: 'Website Accessibility Statement',
    description: 'Website Accessibility Statement for Stealth Batteries',
  },
}

export default function WebsiteAccessibilityStatement() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Website Accessibility Statement</h1>

      <div className="prose prose-lg max-w-none">
        <p className="mb-6">
          Stealth Batteries is committed to ensuring digital accessibility for all users, including
          those with disabilities. We strive to provide an inclusive and seamless online experience
          for all visitors to our website, www.stealthbatteries.com, regardless of their abilities
          or the technologies they use.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Our Commitment</h2>
        <p className="mb-6">
          We actively work to enhance the accessibility and usability of our website by adhering to
          recognized standards and best practices, including the Web Content Accessibility
          Guidelines (WCAG) 2.1 Level AA. Our ongoing efforts aim to improve navigation,
          readability, and compatibility with assistive technologies such as screen readers and
          keyboard-only navigation.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Accessibility Features</h2>
        <p className="mb-4">
          To support an accessible online experience, we have implemented the following features:
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>Alternative text for images to aid screen reader users</li>
          <li>Keyboard navigability for improved interaction</li>
          <li>Clear and consistent page structure for easy navigation</li>
          <li>Adjustable text size options for readability</li>
          <li>High-contrast color schemes to enhance visibility</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Ongoing Improvements</h2>
        <p className="mb-6">
          We recognize that accessibility is an ongoing process and are continuously working to
          enhance the user experience. Regular audits and updates are conducted to identify and
          address accessibility barriers, ensuring compliance with evolving accessibility standards.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Feedback & Assistance</h2>
        <p className="mb-4">
          We welcome feedback from our users to improve accessibility. If you encounter any
          accessibility barriers or require assistance while using our website, please contact us:
        </p>
        <ul className="list-none mb-6">
          <li>
            <strong>Email:</strong>{' '}
            <a
              href="mailto:support@stealthbatteries.com"
              className="text-blue-600 hover:text-blue-800"
            >
              support@stealthbatteries.com
            </a>
          </li>
          <li>
            <strong>Phone:</strong> (805) 310-1577
          </li>
          <li>
            <strong>Mailing Address:</strong> 3266 W Galveston Dr #103, Apache Junction, AZ 85120
          </li>
        </ul>
        <p className="mb-6">
          We are committed to addressing accessibility concerns promptly and will do our best to
          provide a solution that meets your needs.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Third-Party Content</h2>
        <p className="mb-6">
          While we strive to ensure full accessibility on our website, some third-party content or
          links to external websites may not be fully accessible. We encourage users to provide
          feedback on any issues they encounter so we can work with our partners to improve
          accessibility where possible.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Date of Last Update</h2>
        <p className="mb-6">
          This Accessibility Statement was last updated on March 19, 2024. We will continue to
          review and enhance our website&apos;s accessibility as part of our commitment to an
          inclusive digital experience.
        </p>

        <p className="mt-8 font-semibold">
          Thank you for visiting Stealth Batteries. Your experience matters to us!
        </p>
      </div>
    </div>
  )
}
