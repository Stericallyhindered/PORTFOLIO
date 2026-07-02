'use client'

import { useState, useEffect } from 'react'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search, MapPin, Phone } from 'lucide-react'
import { formatPhoneNumber } from '@/lib/utils'

// Add custom styles for Google Maps InfoWindow
const infoWindowStyle = `
.gm-style-iw {
  background-color: #E94E31 !important;
  padding: 0 !important;
}
.gm-style-iw-d {
  overflow: hidden !important;
}
.gm-style-iw-t::after {
  background: #E94E31 !important;
}
.gm-style-iw button[title="Close"] {
  color: white !important;
}
.gm-ui-hover-effect > span {
  width: 16px !important;
  height: 16px !important;
  margin: 0 !important;
  margin-left: 12px !important;
}
.gm-ui-hover-effect {
  width: 32px !important;
  height: 32px !important;
}
`

interface Dealer {
  id: number
  companyName: string
  address: {
    line1: string
    line2?: string | null
    city: string
    state: string
    zip: string
  }
  coordinates: {
    latitude: number
    longitude: number
  }
  distance: number
  phoneNumber: string
}

interface DealerLocatorProps {
  googleMapsApiKey: string
  initialAddress?: string
}

const USER_MARKER_SVG = `
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="8" fill="#E94E31" stroke="white" stroke-width="2"/>
  <circle cx="20" cy="20" r="16" stroke="#E94E31" stroke-width="2" stroke-opacity="0.3"/>
  <circle cx="20" cy="20" r="12" stroke="#E94E31" stroke-width="2" stroke-opacity="0.5"/>
</svg>`

export function DealerLocator({ googleMapsApiKey, initialAddress = '' }: DealerLocatorProps) {
  const [address, setAddress] = useState(initialAddress)
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/dealers/nearest?address=${encodeURIComponent(address)}&limit=10`,
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find dealers')
      }

      setDealers(data.dealers)
      setUserLocation({
        lat: data.userLocation.latitude,
        lng: data.userLocation.longitude,
      })
    } catch (error) {
      console.error('Error searching dealers:', error)
      setError('Failed to find dealers. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (initialAddress) {
      const syntheticEvent = {
        preventDefault: () => {},
      } as React.FormEvent
      handleSearch(syntheticEvent)
    }
  }, [initialAddress]) // eslint-disable-line react-hooks/exhaustive-deps

  const mapCenter = userLocation || { lat: 39.8283, lng: -98.5795 } // Center of USA
  const mapZoom = userLocation ? 10 : 4

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Enter ZIP code or address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full"
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          <Search className="w-4 h-4 mr-2" />
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </form>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-[500px] bg-gray-100 rounded-lg overflow-hidden">
          <LoadScript googleMapsApiKey={googleMapsApiKey}>
            <GoogleMap mapContainerClassName="w-full h-full" center={mapCenter} zoom={mapZoom}>
              <style>{infoWindowStyle}</style>
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={{
                    url: `data:image/svg+xml;base64,${btoa(USER_MARKER_SVG)}`,
                    scaledSize: new google.maps.Size(40, 40),
                    anchor: new google.maps.Point(20, 20),
                  }}
                />
              )}

              {dealers.map((dealer) => (
                <Marker
                  key={dealer.id}
                  position={{
                    lat: dealer.coordinates.latitude,
                    lng: dealer.coordinates.longitude,
                  }}
                  icon={{
                    url: '/assets/SVG/stealth-final-logo-round.svg',
                    scaledSize: new google.maps.Size(40, 40),
                    anchor: new google.maps.Point(20, 20),
                  }}
                  onClick={() => setSelectedDealer(dealer)}
                />
              ))}

              {selectedDealer && (
                <InfoWindow
                  position={{
                    lat: selectedDealer.coordinates.latitude,
                    lng: selectedDealer.coordinates.longitude,
                  }}
                  options={{
                    pixelOffset: new google.maps.Size(0, -10),
                  }}
                  onCloseClick={() => setSelectedDealer(null)}
                >
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <h3 className="font-semibold">{selectedDealer.companyName}</h3>
                    <p className="text-sm">
                      {selectedDealer.address.line1}
                      {selectedDealer.address.line2 && <br />}
                      {selectedDealer.address.line2}
                      <br />
                      {selectedDealer.address.city}, {selectedDealer.address.state}{' '}
                      {selectedDealer.address.zip}
                    </p>
                    <p className="text-sm mt-1">{selectedDealer.distance} miles away</p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>
        </div>

        <div className="space-y-4">
          {dealers.map((dealer) => (
            <Card
              key={dealer.id}
              className="p-4 cursor-pointer hover:bg-gray-900 hover:border-gray-600"
              onClick={() => setSelectedDealer(dealer)}
            >
              <h3 className="font-semibold flex items-center gap-2 text-gray-400">
                <MapPin className="w-4 h-4" />
                <span className="text-primary">{dealer.companyName}</span>
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {dealer.address.line1}
                {dealer.address.line2 && <br />}
                {dealer.address.line2}
                <br />
                {dealer.address.city}, {dealer.address.state} {dealer.address.zip}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <p className="text-primary">{dealer.distance} miles away</p>
                <a
                  href={`tel:${dealer.phoneNumber}`}
                  className="flex items-center gap-1 text-gray-400 hover:text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="w-4 h-4" />
                  {formatPhoneNumber(dealer.phoneNumber)}
                </a>
              </div>
            </Card>
          ))}

          {dealers.length === 0 && userLocation && (
            <p className="text-gray-500 text-center py-8">No dealers found in this area.</p>
          )}
        </div>
      </div>
    </div>
  )
}
