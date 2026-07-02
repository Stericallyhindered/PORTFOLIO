import { useState, useEffect } from 'react'

interface AddressData {
  billingEmail: string
  billingFirstName: string
  billingLastName: string
  billingPhone: string
  billingAddress: string
  billingAddress2: string
  billingCity: string
  billingState: string
  billingPostalCode: string
  shippingFirstName: string
  shippingLastName: string
  shippingPhone: string
  shippingAddress: string
  shippingAddress2: string
  shippingCity: string
  shippingState: string
  shippingPostalCode: string
}

const STORAGE_KEY = 'checkout_address_info'

export function useAddressStorage() {
  const [addressData, setAddressData] = useState<AddressData | null>(null)

  // Load address data from session storage on mount
  useEffect(() => {
    const storedData = sessionStorage.getItem(STORAGE_KEY)
    if (storedData) {
      try {
        setAddressData(JSON.parse(storedData))
      } catch (error) {
        console.error('Error parsing stored address data:', error)
      }
    }
  }, [])

  // Save address data to session storage
  const saveAddressData = (data: AddressData) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setAddressData(data)
    } catch (error) {
      console.error('Error saving address data:', error)
    }
  }

  // Clear stored address data
  const clearAddressData = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setAddressData(null)
  }

  return {
    addressData,
    saveAddressData,
    clearAddressData,
  }
}
