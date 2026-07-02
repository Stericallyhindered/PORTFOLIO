import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import LightningBolt from '@/components/icons/LightningBolt'

export const metadata = {
  title: 'Stealth Batteries QR Landing',
  description: 'Discover more about your Stealth Battery',
}

export default function PackagingQRPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <LightningBolt className="w-16 h-16 mx-auto text-primary mb-4" />
          <h1 className="text-4xl font-bold mb-4">
            Welcome to Stealth <span className="text-primary">Batteries!</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            You&apos;ve scanned the QR code from your battery packaging. Explore our products and
            resources below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>Our Products</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-between">
              <p>Discover our range of high-performance marine batteries.</p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/products">View Products</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>Angler&apos;s Corner</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-between">
              <p>Tips, stories, and insights from fellow anglers.</p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/anglers-corner">Explore</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>Stealth Angle</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-between">
              <p>Discover the Stealth Angle advantage.</p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/stealth-angle">Learn More</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>Warranty Information</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-between">
              <p>Learn about our warranty coverage and registration.</p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/warranty">View Warranty</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>Find a Dealer</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-between">
              <p>Locate authorized Stealth Batteries dealers near you.</p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/find-dealer">Find Dealers</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-between">
              <p>Have questions? Get in touch with our team.</p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/contact">Contact</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
