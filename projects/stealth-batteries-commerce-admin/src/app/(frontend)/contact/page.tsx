'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Zap } from 'lucide-react'
import LightningBolt from '@/components/icons/LightningBolt'
import { SecondaryFooter } from '@/components/secondary-footer'
import { toast } from 'sonner'

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.errors?.[0]?.message || 'Failed to send message')
      }

      toast.success('Message sent successfully! We will get back to you soon.')
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      })
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/70 to-transparent" />
      <Image
        src="/assets/PNG/stealth-hero-background-uncompressed.png"
        alt="Wave background"
        width={2560}
        height={1440}
        className="object-cover z-0 absolute top-0 left-0 z-[-1] lg:block hidden"
      />
      <Image
        src="/assets/PNG/stealth-hero-background-uncompressed.png"
        alt="Wave background"
        fill
        className="object-cover z-0 absolute top-0 left-0 z-[-1] lg:hidden"
      />
      <section className="relative text-white py-20 overflow-x-hidden min-h-screen z-10">
        {/* Background wave effect */}

        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-6xl xl:text-[125px] flex flex-col md:flex-row gap-6 items-center justify-center font-black mb-3 text-center font-apotek-extended">
            <span className="text-primary">GET IN </span> TOUCH
          </h1>
          <p className="text-center text-xl mb-12 uppercase font-apotek-extended">
            We&apos;d Love to Hear From You
          </p>

          <div className="max-w-3xl mx-auto bg-black/50 backdrop-blur-xs p-8 rounded-lg shadow-lg border border-primary/20">
            <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-4 mb-8">
              <span className="text-primary font-bold text-2xl font-apotek-extended">Connect</span>
              <LightningBolt className="h-8 w-8 stroke-white fill-white" />
              <span className="text-primary font-bold text-2xl font-apotek-extended">
                Collaborate
              </span>
              <LightningBolt className="h-8 w-8 stroke-white fill-white" />
              <span className="text-primary font-bold text-2xl font-apotek-extended">Power Up</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-md focus:outline-hidden focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-md focus:outline-hidden focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-md focus:outline-hidden focus:border-primary"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-md focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-md focus:outline-hidden focus:border-primary"
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="sales">Sales Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-md focus:outline-hidden focus:border-primary"
                  required
                ></textarea>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-black font-bold py-3 px-6 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
        <SecondaryFooter />
      </section>
    </main>
  )
}
