'use client'

import { useState, useEffect, useRef } from 'react'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup } from '@/components/ui/radio-group'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, Loader2, X } from 'lucide-react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { StateSelect } from '@/components/ui/state-select'
import { toast } from 'sonner'
import { useDealer } from '@/hooks/useDealer'
import { ListOfStates } from '@/utilities/state-list'
import { DiscountCodeInput } from '@/components/DiscountCodeInput'
import { useAddressStorage } from '@/hooks/useAddressStorage'
import { ShippingMethodCard } from '@/components/shipping/ShippingMethodCard'
import { DiscountProgress } from '@/components/Cart/VolumeDiscountProgress'

interface ShippingMethod {
  id: string
  name: string
  description: string
  price: number
  estimatedDays: string
  carrier: string | null
  service: string | null
  guaranteedDelivery?: boolean
}

interface FormData {
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

interface CheckoutFormProps {
  onSubmitStart?: () => void
  onPaymentSuccess?: (orderId: string) => void
  onPaymentError?: (error: Error) => void
}

export function CheckoutForm({
  onSubmitStart,
  onPaymentSuccess,
  onPaymentError,
}: CheckoutFormProps) {
  const {
    state,
    currentBulkDiscount,
    nextBulkDiscount,
    bulkDiscountProgress,
    dispatch,
    clearDiscountCode,
  } = useCart()
  const { dealer, isLoading: isDealerLoading } = useDealer()
  const { addressData, saveAddressData, clearAddressData } = useAddressStorage()
  const [currentStep, setCurrentStep] = useState(1)
  const [visitedSteps, setVisitedSteps] = useState<number[]>([1])
  const [isDifferentShipping, setIsDifferentShipping] = useState(false)
  const [isDropship, setIsDropship] = useState(false)
  const [shippingMethod, setShippingMethod] = useState<string | null>(null)
  const [availableShippingMethods, setAvailableShippingMethods] = useState<ShippingMethod[]>([])
  const [isLoadingShippingMethods, setIsLoadingShippingMethods] = useState(false)
  const [shippingError, setShippingError] = useState<string | null>(null)
  const [isCardComplete, setIsCardComplete] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingNext, setIsLoadingNext] = useState(false)
  const [estimatedTax, setEstimatedTax] = useState<number | null>(null)
  const [taxSource, setTaxSource] = useState<'stripe' | 'arizona' | null>(null)
  const [isCalculatingTax, setIsCalculatingTax] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    billingEmail: '',
    billingFirstName: '',
    billingLastName: '',
    billingPhone: '',
    billingAddress: '',
    billingAddress2: '',
    billingCity: '',
    billingState: '',
    billingPostalCode: '',
    shippingFirstName: '',
    shippingLastName: '',
    shippingPhone: '',
    shippingAddress: '',
    shippingAddress2: '',
    shippingCity: '',
    shippingState: '',
    shippingPostalCode: '',
  })
  const [discountedSubtotal, setDiscountedSubtotal] = useState<number | null>(null)
  const [isRemovingDiscount, setIsRemovingDiscount] = useState(false)

  const stripe = useStripe()
  const elements = useElements()

  // Add a ref to track the intended checkbox state
  const intendedShippingState = useRef(false)

  // Track if form has been initialized to prevent reinitialization during editing
  const [isFormInitialized, setIsFormInitialized] = useState(false)

  // Initialize form data with stored address data if available
  useEffect(() => {
    if (addressData && !dealer && !isFormInitialized) {
      // Check if there's any non-empty shipping info that's different from billing
      const hasShippingInfo = Object.entries(addressData).some(([key, value]) => {
        if (!key.startsWith('shipping') || !value || value.trim() === '') return false
        // Get the corresponding billing field
        const billingKey = key.replace('shipping', 'billing')
        // Compare with billing info - only count if different
        return value.trim() !== (addressData[billingKey as keyof FormData] || '').trim()
      })

      // Set initial states
      setFormData(addressData)
      setIsDifferentShipping(hasShippingInfo)
      intendedShippingState.current = hasShippingInfo
      setIsFormInitialized(true)
    }
  }, [addressData, dealer, isFormInitialized])

  // Manage address data persistence
  const saveFormData = useRef(
    // Debounce the save operation
    setTimeout(() => {}, 0),
  )

  useEffect(() => {
    // Clear any pending save operations
    clearTimeout(saveFormData.current)

    // Don't save anything for dealers
    if (dealer) return

    // Don't save or clear during payment step unless payment is successful
    if (currentStep === 4) return

    // Only save if form has been initialized (prevent saving during initial load)
    if ((formData.billingEmail || formData.billingFirstName) && isFormInitialized) {
      saveFormData.current = setTimeout(() => {
        const dataToSave = isDifferentShipping
          ? formData
          : {
              ...formData,
              shippingFirstName: '',
              shippingLastName: '',
              shippingPhone: '',
              shippingAddress: '',
              shippingAddress2: '',
              shippingCity: '',
              shippingState: '',
              shippingPostalCode: '',
            }
        saveAddressData(dataToSave)
      }, 500)
    }

    return () => clearTimeout(saveFormData.current)
  }, [formData, dealer, currentStep, isDifferentShipping, saveAddressData, isFormInitialized])

  // Pre-fill form with dealer information when available
  useEffect(() => {
    if (dealer) {
      const [firstName, lastName] = dealer.contactName.split(' ')

      // Find the state code that matches the dealer's state name
      const stateOption = ListOfStates.find(
        (state) => state.label.toLowerCase() === dealer.address.state.toLowerCase(),
      )
      const stateCode = stateOption?.value || dealer.address.state

      setFormData((prev) => {
        const newData = {
          ...prev,
          billingEmail: dealer.email,
          billingFirstName: firstName || '',
          billingLastName: lastName || '',
          billingPhone: dealer.phoneNumber,
          billingAddress: dealer.address.line1,
          billingAddress2: dealer.address.line2 || '',
          billingCity: dealer.address.city,
          billingState: stateCode,
          billingPostalCode: dealer.address.zip,
        }

        // If shipping is same as billing, also update shipping fields
        if (!isDifferentShipping) {
          Object.assign(newData, {
            shippingFirstName: firstName || '',
            shippingLastName: lastName || '',
            shippingPhone: dealer.phoneNumber,
            shippingAddress: dealer.address.line1,
            shippingAddress2: dealer.address.line2 || '',
            shippingCity: dealer.address.city,
            shippingState: stateCode,
            shippingPostalCode: dealer.address.zip,
          })
        }

        return newData
      })

      // Mark form as initialized when dealer data is loaded
      setIsFormInitialized(true)
    }
  }, [dealer, isDifferentShipping])

  // Modify the tax calculation effect
  useEffect(() => {
    const calculateTax = async () => {
      // Only calculate tax if we have the necessary billing info
      const hasRequiredFields =
        formData.billingAddress &&
        formData.billingCity &&
        formData.billingState &&
        formData.billingPostalCode &&
        !state.discounts?.dealer?.taxExempt

      if (!hasRequiredFields || !state.items.length) {
        setEstimatedTax(null)
        setTaxSource(null)
        return
      }

      setIsCalculatingTax(true)

      try {
        const shippingCost = shippingMethod
          ? availableShippingMethods.find((m) => m.id === shippingMethod)?.price || 0
          : 0

        // Send original prices and let the tax calculation endpoint handle discounts
        const items = state.items.map((item) => ({
          id: item.id,
          price: item.price,
          quantity: item.quantity,
        }))

        const response = await fetch('/checkout/stripe/calculate-tax', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items,
            billingDetails: {
              address: formData.billingAddress,
              address2: formData.billingAddress2,
              city: formData.billingCity,
              state: formData.billingState,
              postalCode: formData.billingPostalCode,
            },
            shipping: shippingCost || undefined,
            discounts: state.discounts,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to calculate tax')
        }

        const data = await response.json()
        setEstimatedTax(data.tax)
        setTaxSource(data.source)
      } catch (error) {
        console.error('Error calculating tax:', error)
        setEstimatedTax(null)
        setTaxSource(null)
      } finally {
        setIsCalculatingTax(false)
      }
    }

    // Recalculate immediately when discounts change
    calculateTax()

    return () => {
      // Cleanup if needed
    }
  }, [
    formData.billingAddress,
    formData.billingAddress2,
    formData.billingCity,
    formData.billingState,
    formData.billingPostalCode,
    state.items,
    state.discounts,
    shippingMethod,
    availableShippingMethods,
  ])

  // Add an effect to ensure checkbox state stays consistent
  useEffect(() => {
    if (isDifferentShipping !== intendedShippingState.current) {
      setIsDifferentShipping(intendedShippingState.current)
    }
  }, [isDifferentShipping])

  const handleShippingSameAsBilling = (checked: boolean) => {
    // Store the intended state
    intendedShippingState.current = checked
    // Update the checkbox state immediately
    setIsDifferentShipping(checked)

    // If unchecking, clear shipping fields
    if (!checked) {
      setFormData((prev) => ({
        ...prev,
        shippingFirstName: '',
        shippingLastName: '',
        shippingPhone: '',
        shippingAddress: '',
        shippingAddress2: '',
        shippingCity: '',
        shippingState: '',
        shippingPostalCode: '',
      }))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))

    // Mark form as initialized when user starts typing (for non-dealer users)
    if (!isFormInitialized && !dealer) {
      setIsFormInitialized(true)
    }
  }

  const handleCardChange = (event: any) => {
    setIsCardComplete(event.complete)
    setCardError(event.error?.message || null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) {
      toast.error('Payment system is not ready')
      return
    }

    if (!isCardComplete) {
      toast.error('Please complete card information')
      return
    }

    if (isProcessing) {
      return
    }

    setIsProcessing(true)
    onSubmitStart?.()

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      // Calculate totals with all discounts (bulk, dealer, affiliate, code)
      const subtotal = calculateTotal(state.items)
      let discountedAmount = subtotal
      // Apply bulk discount first
      if (currentBulkDiscount) {
        const bulkDiscount =
          Math.floor(subtotal * (currentBulkDiscount.discountPercent / 100) * 100) / 100
        discountedAmount = Math.floor((discountedAmount - bulkDiscount) * 100) / 100
      }
      // Apply dealer discount
      if (state.discounts?.dealer) {
        const dealerDiscount =
          Math.floor(((discountedAmount * state.discounts.dealer.percentage) / 100) * 100) / 100
        discountedAmount = Math.floor((discountedAmount - dealerDiscount) * 100) / 100
        // Apply volume discount if eligible
        if (state.discounts.dealer.volumeDiscountApplied) {
          const volumeDiscount =
            Math.floor(
              ((discountedAmount * state.discounts.dealer.volumeDiscountPercentage) / 100) * 100,
            ) / 100
          discountedAmount = Math.floor((discountedAmount - volumeDiscount) * 100) / 100
        }
      }
      // Apply affiliate discount
      if (state.discounts?.affiliate) {
        const affiliateDiscount =
          Math.floor(((discountedAmount * state.discounts.affiliate.percentage) / 100) * 100) / 100
        discountedAmount = Math.floor((discountedAmount - affiliateDiscount) * 100) / 100
      }
      // Apply discount code
      if (state.discounts?.discountCode) {
        if (state.discounts.discountCode.type === 'percentage') {
          const codeDiscount =
            Math.floor(((discountedAmount * state.discounts.discountCode.amount) / 100) * 100) / 100
          discountedAmount = Math.floor((discountedAmount - codeDiscount) * 100) / 100
        } else {
          discountedAmount = Math.max(
            0,
            Math.floor((discountedAmount - state.discounts.discountCode.amount) * 100) / 100,
          )
        }
      }

      const shippingCost = shippingMethod
        ? availableShippingMethods.find((m) => m.id === shippingMethod)?.price || 0
        : 0

      // Use the Arizona fallback rate of 7.8% if not tax exempt
      const tax = state.discounts?.dealer?.taxExempt ? 0 : discountedAmount * 0.078
      const total = discountedAmount + shippingCost + tax

      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: `${formData.billingFirstName} ${formData.billingLastName}`,
          email: formData.billingEmail,
          phone: formData.billingPhone,
          address: {
            line1: formData.billingAddress,
            line2: formData.billingAddress2,
            city: formData.billingCity,
            state: formData.billingState,
            postal_code: formData.billingPostalCode,
            country: 'US',
          },
        },
      })

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message)
      }

      // Process payment with discounted amount
      const response = await fetch('/checkout/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          paymentMethodId: paymentMethod.id,
          subtotal,
          discountedSubtotal: discountedAmount,
          tax,
          shipping: shippingCost,
          shippingMethod,
          isDropship: dealer ? isDropship : false,
          billingDetails: {
            firstName: formData.billingFirstName,
            lastName: formData.billingLastName,
            email: formData.billingEmail,
            phone: formData.billingPhone,
            address: formData.billingAddress,
            address2: formData.billingAddress2,
            city: formData.billingCity,
            state: formData.billingState,
            postalCode: formData.billingPostalCode,
          },
          shippingDetails: isDifferentShipping
            ? {
                firstName: formData.shippingFirstName,
                lastName: formData.shippingLastName,
                phone: formData.shippingPhone,
                address: formData.shippingAddress,
                address2: formData.shippingAddress2,
                city: formData.shippingCity,
                state: formData.shippingState,
                postalCode: formData.shippingPostalCode,
              }
            : null,
          items: state.items.map((item) => ({
            id: item.id,
            title: item.title,
            quantity: item.quantity,
            price: item.price,
            variant: item.variant
              ? {
                  name: item.variant.name,
                  value: item.variant.value,
                }
              : undefined,
          })),
          discounts: state.discounts,
          dealerId: dealer?.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Payment failed')
      }

      const data = await response.json()
      // Only clear address data after successful payment
      clearAddressData()
      onPaymentSuccess?.(data.orderId)
    } catch (error) {
      console.error('Payment error:', error)
      setIsProcessing(false)
      onPaymentError?.(error instanceof Error ? error : new Error('Payment failed'))
    }
  }

  const validateBillingInfo = () => {
    const requiredFields = [
      'billingEmail',
      'billingFirstName',
      'billingLastName',
      'billingPhone',
      'billingAddress',
      'billingCity',
      'billingState',
      'billingPostalCode',
    ]

    return requiredFields.every((field) => formData[field as keyof FormData].trim() !== '')
  }

  const validateShippingInfo = () => {
    if (!isDifferentShipping) return true

    const requiredFields = [
      'shippingFirstName',
      'shippingLastName',
      'shippingPhone',
      'shippingAddress',
      'shippingCity',
      'shippingState',
      'shippingPostalCode',
    ]

    return requiredFields.every((field) => formData[field as keyof FormData].trim() !== '')
  }

  const nextStep = () => {
    // Block if dealer info is still loading
    if (isDealerLoading) {
      toast.info('Loading dealer info, please wait...')
      return
    }
    // Validate billing info on step 1
    if (currentStep === 1 && !validateBillingInfo()) {
      toast.error('Please fill out all billing information before proceeding.')
      return
    }
    // Validate shipping info on step 2 if different shipping is selected
    if (currentStep === 2 && !validateShippingInfo()) {
      toast.error('Please fill out all shipping information before proceeding.')
      return
    }
    // If moving to step 3 (shipping methods), fetch rates
    if (currentStep === 2) {
      const shippingInfo = isDifferentShipping
        ? {
            name: `${formData.shippingFirstName} ${formData.shippingLastName}`,
            address: formData.shippingAddress,
            address2: formData.shippingAddress2,
            city: formData.shippingCity,
            state: formData.shippingState,
            postalCode: formData.shippingPostalCode,
            country: 'US',
          }
        : {
            name: `${formData.billingFirstName} ${formData.billingLastName}`,
            address: formData.billingAddress,
            address2: formData.billingAddress2,
            city: formData.billingCity,
            state: formData.billingState,
            postalCode: formData.billingPostalCode,
            country: 'US',
          }

      setIsLoadingNext(true)
      setIsLoadingShippingMethods(true)
      setShippingError(null)

      // Dealer logic: always use backend config for dealers
      if (dealer && dealer.id) {
        fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: state.items,
            destination: shippingInfo,
            subtotal: calculateTotal(state.items),
            dealerId: dealer.id,
            pickup_type: 'ONE_TIME',
            discountCode: state.discounts?.discountCode?.code || undefined,
          }),
        })
          .then(async (response) => {
            const data = await response.json()
            if (!response.ok) {
              throw new Error(data.error || 'Failed to fetch shipping methods')
            }
            if (!data.methods || data.methods.length === 0) {
              throw new Error('No shipping methods available for this address')
            }
            setAvailableShippingMethods(data.methods)
            setShippingMethod(data.methods[0].id)
            // Only advance to next step if we successfully got shipping methods
            const nextStepNumber = Math.min(currentStep + 1, 4)
            setCurrentStep(nextStepNumber)
            if (!visitedSteps.includes(nextStepNumber)) {
              setVisitedSteps([...visitedSteps, nextStepNumber])
            }
          })
          .catch((error) => {
            console.error('Error fetching dealer shipping methods:', error)
            setShippingError(
              error instanceof Error ? error.message : 'Failed to fetch dealer shipping methods',
            )
          })
          .finally(() => {
            setIsLoadingShippingMethods(false)
            setIsLoadingNext(false)
          })
        return
      }

      // Non-dealer, large order: show special bulk shipping message
      const totalQuantity = state.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
      if (!dealer && totalQuantity > 50) {
        setAvailableShippingMethods([
          {
            id: 'bulk-contact',
            name: 'Bulk Order Shipping',
            description:
              'Stealth Batteries will contact you for separate shipping costs on bulk orders.',
            price: 0,
            estimatedDays: '',
            carrier: null,
            service: null,
            guaranteedDelivery: false,
          },
        ])
        setShippingMethod('bulk-contact')
        const nextStepNumber = Math.min(currentStep + 1, 4)
        setCurrentStep(nextStepNumber)
        if (!visitedSteps.includes(nextStepNumber)) {
          setVisitedSteps([...visitedSteps, nextStepNumber])
        }
        setIsLoadingShippingMethods(false)
        setIsLoadingNext(false)
        return
      }

      // Everyone else: fetch normal shipping methods
      fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: state.items,
          destination: shippingInfo,
          subtotal: calculateTotal(state.items),
          pickup_type: 'ONE_TIME',
          discountCode: state.discounts?.discountCode?.code || undefined,
        }),
      })
        .then(async (response) => {
          const data = await response.json()
          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch shipping methods')
          }
          if (!data.methods || data.methods.length === 0) {
            throw new Error('No shipping methods available for this address')
          }
          setAvailableShippingMethods(data.methods)
          setShippingMethod(data.methods[0].id)
          // Only advance to next step if we successfully got shipping methods
          const nextStepNumber = Math.min(currentStep + 1, 4)
          setCurrentStep(nextStepNumber)
          if (!visitedSteps.includes(nextStepNumber)) {
            setVisitedSteps([...visitedSteps, nextStepNumber])
          }
        })
        .catch((error) => {
          console.error('Error fetching shipping methods:', error)
          setShippingError(
            error instanceof Error ? error.message : 'Failed to fetch shipping methods',
          )
        })
        .finally(() => {
          setIsLoadingShippingMethods(false)
          setIsLoadingNext(false)
        })
      return
    }

    // For other steps, just advance normally
    const nextStepNumber = Math.min(currentStep + 1, 4)
    setCurrentStep(nextStepNumber)
    if (!visitedSteps.includes(nextStepNumber)) {
      setVisitedSteps([...visitedSteps, nextStepNumber])
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleStepClick = (step: number) => {
    // Only allow clicking on previously visited steps
    if (visitedSteps.includes(step)) {
      setCurrentStep(step)
    }
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="billingEmail">Email Address</Label>
              <Input
                id="billingEmail"
                type="email"
                value={formData.billingEmail}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billingFirstName">First Name</Label>
                <Input
                  id="billingFirstName"
                  value={formData.billingFirstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="billingLastName">Last Name</Label>
                <Input
                  id="billingLastName"
                  value={formData.billingLastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="billingPhone">Phone</Label>
              <Input
                id="billingPhone"
                value={formData.billingPhone}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="billingAddress">Address Line 1</Label>
              <Input
                id="billingAddress"
                value={formData.billingAddress}
                onChange={handleInputChange}
                placeholder="Street address"
                required
              />
            </div>
            <div>
              <Label htmlFor="billingAddress2">Address Line 2</Label>
              <Input
                id="billingAddress2"
                value={formData.billingAddress2}
                onChange={handleInputChange}
                placeholder="Apartment, suite, unit, etc. (optional)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billingCity">City</Label>
                <Input
                  id="billingCity"
                  value={formData.billingCity}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="billingState">State</Label>
                <StateSelect
                  value={formData.billingState}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, billingState: value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="billingPostalCode">Postal Code</Label>
              <Input
                id="billingPostalCode"
                value={formData.billingPostalCode}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="differentShipping"
                checked={isDifferentShipping}
                onCheckedChange={handleShippingSameAsBilling}
              />
              <Label htmlFor="differentShipping">
                Enter a different shipping address (leave unchecked if same as billing)
              </Label>
            </div>
            {isDifferentShipping && dealer && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDropship"
                  checked={isDropship}
                  onCheckedChange={(checked: boolean) => setIsDropship(checked)}
                />
                <Label htmlFor="isDropship">
                  This is a dropship order (ships directly to customer)
                </Label>
              </div>
            )}
            {isDifferentShipping && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shippingFirstName">First Name</Label>
                    <Input
                      id="shippingFirstName"
                      value={formData.shippingFirstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingLastName">Last Name</Label>
                    <Input
                      id="shippingLastName"
                      value={formData.shippingLastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="shippingPhone">Phone</Label>
                  <Input
                    id="shippingPhone"
                    value={formData.shippingPhone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shippingAddress">Address Line 1</Label>
                  <Input
                    id="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleInputChange}
                    placeholder="Street address"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shippingAddress2">Address Line 2</Label>
                  <Input
                    id="shippingAddress2"
                    value={formData.shippingAddress2}
                    onChange={handleInputChange}
                    placeholder="Apartment, suite, unit, etc. (optional)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shippingCity">City</Label>
                    <Input
                      id="shippingCity"
                      value={formData.shippingCity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingState">State</Label>
                    <StateSelect
                      value={formData.shippingState}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, shippingState: value }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="shippingPostalCode">Postal Code</Label>
                  <Input
                    id="shippingPostalCode"
                    value={formData.shippingPostalCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            {isDealerLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-3 text-gray-600">Loading dealer info...</span>
              </div>
            ) : isLoadingShippingMethods ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-3 text-gray-600">Loading shipping methods...</span>
              </div>
            ) : shippingError ? (
              <div className="text-red-500 py-4">{shippingError}</div>
            ) : availableShippingMethods.length === 0 ? (
              <div className="text-amber-500 py-4">
                No shipping methods available for this address
              </div>
            ) : shippingMethod === 'bulk-contact' ? (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 text-yellow-800 rounded">
                <strong>Bulk Order Shipping:</strong> Stealth Batteries will contact you after
                checkout to arrange shipping and provide a separate shipping quote for your order.
                Shipping costs are not included in your total at this time.
              </div>
            ) : (
              <RadioGroup value={shippingMethod || ''} onValueChange={setShippingMethod}>
                <div className="space-y-3">
                  {availableShippingMethods.map((method) => (
                    <div key={method.id}>
                      <ShippingMethodCard
                        method={method}
                        selected={method.id === shippingMethod}
                        onSelect={() => setShippingMethod(method.id)}
                        hasBackOrderItems={state.items.some((item) => {
                          if (!item.product) return false
                          return (
                            item.product.inventory?.trackInventory &&
                            item.product.inventory.quantity === 0
                          )
                        })}
                        hasPreOrderItems={state.items.some((item) => {
                          if (!item.product?.releaseDate) return false
                          const releaseDate = new Date(item.product.releaseDate)
                          const now = new Date()
                          // Set times to midnight for accurate date comparison
                          releaseDate.setHours(0, 0, 0, 0)
                          now.setHours(0, 0, 0, 0)
                          return releaseDate > now
                        })}
                      />
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-gray-900">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#ffffff',
                      '::placeholder': {
                        color: '#989EAB',
                      },
                      backgroundColor: 'transparent',
                      iconColor: '#ffffff',
                    },
                    invalid: {
                      color: '#ef4444',
                      iconColor: '#ef4444',
                    },
                  },
                  hidePostalCode: true,
                }}
                onChange={handleCardChange}
              />
            </div>
            {cardError && <div className="text-red-500 text-sm mt-2">{cardError}</div>}
          </div>
        )
      default:
        return null
    }
  }

  const calculateTotal = (items: any[]) => {
    return items.reduce((total, item) => {
      const lineTotal = Math.floor(item.price * item.quantity * 100) / 100
      return Math.floor((total + lineTotal) * 100) / 100
    }, 0)
  }

  // Check if any items in the cart are back-ordered
  const hasBackOrderItems = state.items.some((item) => {
    if (!item.product) return false
    return item.product.inventory?.trackInventory && item.product.inventory.quantity === 0
  })

  const getSelectedShippingPrice = () => {
    if (!shippingMethod) return 0
    const selected = availableShippingMethods.find((method) => method.id === shippingMethod)
    return selected ? selected.price : 0
  }

  // Calculate discounted subtotal whenever discounts or items change
  useEffect(() => {
    const subtotal = calculateTotal(state.items)
    let discounted = subtotal
    // Apply bulk discount first
    if (currentBulkDiscount) {
      const bulkDiscount =
        Math.floor(subtotal * (currentBulkDiscount.discountPercent / 100) * 100) / 100
      discounted = Math.floor((discounted - bulkDiscount) * 100) / 100
    }
    // Apply dealer discount
    if (state.discounts?.dealer) {
      const dealerDiscount =
        Math.floor(((discounted * state.discounts.dealer.percentage) / 100) * 100) / 100
      discounted = Math.floor((discounted - dealerDiscount) * 100) / 100
      // Apply volume discount if eligible
      if (state.discounts.dealer.volumeDiscountApplied) {
        const volumeDiscount =
          Math.floor(((discounted * state.discounts.dealer.volumeDiscountPercentage) / 100) * 100) /
          100
        discounted = Math.floor((discounted - volumeDiscount) * 100) / 100
      }
    }
    // Apply affiliate discount
    if (state.discounts?.affiliate) {
      const affiliateDiscount =
        Math.floor(((discounted * state.discounts.affiliate.percentage) / 100) * 100) / 100
      discounted = Math.floor((discounted - affiliateDiscount) * 100) / 100
    }
    // Apply discount code
    if (state.discounts?.discountCode) {
      if (state.discounts.discountCode.type === 'percentage') {
        const codeDiscount =
          Math.floor(((discounted * state.discounts.discountCode.amount) / 100) * 100) / 100
        discounted = Math.floor((discounted - codeDiscount) * 100) / 100
      } else {
        discounted = Math.max(
          0,
          Math.floor((discounted - state.discounts.discountCode.amount) * 100) / 100,
        )
      }
    }
    setDiscountedSubtotal(discounted)
  }, [state.items, state.discounts, currentBulkDiscount])

  async function handleRemoveDiscountCode() {
    if (!state.discounts?.discountCode?.code) return
    setIsRemovingDiscount(true)
    try {
      await fetch('/api/discount-codes/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: state.discounts.discountCode.code,
          action: 'decrement',
        }),
      })
      // Remove discount code from cart state and local storage
      clearDiscountCode()
    } catch (err) {
      console.error('Failed to remove discount code:', err)
    } finally {
      setIsRemovingDiscount(false)
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <form onSubmit={handleSubmit}>
          {[1, 2, 3, 4].map((step) => (
            <Collapsible key={step} open={currentStep === step}>
              <CollapsibleTrigger
                className={`flex items-center justify-between w-full p-4 ${
                  visitedSteps.includes(step)
                    ? 'bg-black dark:bg-primary/80 text-primary-foreground hover:bg-primary/70'
                    : 'bg-gray-900 text-gray-400 cursor-not-allowed'
                } transition-colors`}
                onClick={() => handleStepClick(step)}
                disabled={!visitedSteps.includes(step)}
              >
                <span className="text-lg font-semibold">
                  {step}.{' '}
                  {step === 1
                    ? 'Billing Information'
                    : step === 2
                      ? 'Shipping Information'
                      : step === 3
                        ? 'Shipping Method'
                        : 'Payment Information'}
                </span>
                {currentStep === step ? <ChevronUp /> : <ChevronDown />}
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 border border-t-0 bg-card text-card-foreground">
                {renderStepContent(step)}
                <div className="mt-4 flex justify-between">
                  {step > 1 && (
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Previous
                    </Button>
                  )}
                  {step < 4 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="dark:bg-primary/80 hover:bg-primary/70 text-primary-foreground"
                      disabled={isDealerLoading || isLoadingNext}
                    >
                      {isLoadingNext ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Next'
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="w-fit px-12 dark:bg-primary/80 hover:bg-primary/70 text-primary-foreground"
                      disabled={!stripe || !elements || isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Place Order'
                      )}
                    </Button>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </form>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        <div className="bg-card p-6 rounded-lg border">
          {state.items.map((item) => (
            <div
              key={`${item.id}-${item.variant?.value}`}
              className="flex justify-between mb-2 text-card-foreground"
            >
              <span>
                {item.title} x {item.quantity}
              </span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <Separator className="my-4" />
          {/* Subtotal and Discounts */}
          <div className="space-y-2">
            <div className="flex justify-between text-card-foreground">
              <span>Subtotal</span>
              <span>${calculateTotal(state.items).toFixed(2)}</span>
            </div>
            {/* Bulk Discount UI - Only show for dealers */}
            {dealer?.verified && currentBulkDiscount && (
              <div className="flex justify-between text-green-700">
                <span>Bulk Discount ({currentBulkDiscount.name})</span>
                <span>
                  -$
                  {(
                    Math.floor(
                      calculateTotal(state.items) *
                        (currentBulkDiscount.discountPercent / 100) *
                        100,
                    ) / 100
                  ).toFixed(2)}
                </span>
              </div>
            )}
            {dealer?.verified && nextBulkDiscount && bulkDiscountProgress !== null && (
              <DiscountProgress
                subtotal={calculateTotal(state.items)}
                threshold={nextBulkDiscount.threshold}
                percent={nextBulkDiscount.discountPercent}
                label={nextBulkDiscount.name}
                isCompact
              />
            )}

            {state.discounts?.dealer && (
              <>
                <div className="flex justify-between text-green-600">
                  <span>Dealer Discount ({state.discounts.dealer.tierName})</span>
                  <span>
                    -$
                    {(
                      Math.floor(
                        ((calculateTotal(state.items) * state.discounts.dealer.percentage) / 100) *
                          100,
                      ) / 100
                    ).toFixed(2)}
                  </span>
                </div>
                <DiscountProgress
                  subtotal={calculateTotal(state.items)}
                  threshold={state.discounts.dealer.volumeDiscountThreshold}
                  percent={state.discounts.dealer.volumeDiscountPercentage}
                  label={
                    state.discounts.dealer.volumeDiscountApplied
                      ? 'Volume Discount Applied'
                      : 'Volume Discount'
                  }
                />
              </>
            )}

            {state.discounts?.affiliate && (
              <div className="flex justify-between text-green-600">
                <span>Affiliate Discount ({state.discounts.affiliate.code})</span>
                <span>
                  -$
                  {(
                    calculateTotal(state.items) *
                    (state.discounts.affiliate.percentage / 100)
                  ).toFixed(2)}
                </span>
              </div>
            )}

            {state.discounts?.discountCode && (
              <div className="flex justify-between items-center text-green-600">
                <span>Discount Code ({state.discounts.discountCode.code})</span>
                <span className="flex items-center gap-2">
                  {state.discounts.discountCode.type === 'percentage' ? (
                    <>
                      -{state.discounts.discountCode.amount}% (-$
                      {(
                        calculateTotal(state.items) *
                        (state.discounts.discountCode.amount / 100)
                      ).toFixed(2)}
                      )
                    </>
                  ) : (
                    `-$${state.discounts.discountCode.amount.toFixed(2)}`
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={handleRemoveDiscountCode}
                    disabled={isRemovingDiscount}
                    aria-label="Remove discount code"
                  >
                    {isRemovingDiscount ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4 text-primary/80 hover:text-primary" />
                    )}
                  </Button>
                </span>
              </div>
            )}

            <div className="mt-4 mb-4">
              <DiscountCodeInput email={formData.billingEmail} />
            </div>

            <div className="flex justify-between mt-2 text-card-foreground">
              <span>Shipping</span>
              <span>
                {shippingMethod === 'bulk-contact'
                  ? 'To be quoted separately'
                  : `$${getSelectedShippingPrice().toFixed(2)}`}
              </span>
            </div>

            <div className="flex justify-between mt-2 text-card-foreground">
              <span>
                Tax{' '}
                {state.discounts?.dealer?.taxExempt
                  ? '(Exempt)'
                  : taxSource === 'arizona'
                    ? '(AZ Rate: 7.8%)'
                    : ''}
              </span>
              <span>
                {state.discounts?.dealer?.taxExempt ? (
                  'Tax Exempt'
                ) : isCalculatingTax ? (
                  <span className="flex items-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Calculating...
                  </span>
                ) : estimatedTax !== null ? (
                  `$${estimatedTax.toFixed(2)}`
                ) : (
                  'Calculating tax...'
                )}
              </span>
            </div>

            <div className="flex justify-between mt-2 text-lg font-bold text-card-foreground">
              <span>Total</span>
              <span>
                $
                {(
                  (discountedSubtotal ?? state.total) +
                  getSelectedShippingPrice() +
                  (state.discounts?.dealer?.taxExempt ? 0 : estimatedTax || 0)
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
