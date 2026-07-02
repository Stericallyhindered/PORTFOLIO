import { SERVICE_TRANSIT_TIMES } from '../constants/ups'

// Add constants at the top of the file
const CUSTOMER_CLASSIFICATION = {
  WHOLESALE: '01', // Wholesale
  OCCASIONAL: '03', // Occasional
  RETAIL: '04', // Retail
  OTHERS: '05', // Others
} as const

// UPS pickup charges - these are flat rates per pickup request
const PICKUP_CHARGES = {
  ONE_TIME: 0, // Flat rate for one-time pickup, regardless of package count or destination - 14.75 if we decide to charge it.
} as const

// Remove fuel surcharge constants and add pickup type constants
const PICKUP_TYPES = {
  DAILY: '01', // Daily Pickup (Default)
  CUSTOMER_COUNTER: '03', // Customer Counter
  ONE_TIME: '06', // One Time Pickup ($14.75 flat rate)
  LETTER_CENTER: '19', // Letter Center
  AIR_SERVICE: '20', // Air Service Center
} as const

// Service code to name mapping
const serviceNames: { [key: string]: string } = {
  '01': 'UPS Next Day Air',
  '02': 'UPS 2nd Day Air',
  '03': 'UPS Ground',
  '07': 'UPS Worldwide Express',
  '08': 'UPS Worldwide Expedited',
  '11': 'UPS Standard',
  '12': 'UPS 3 Day Select',
  '13': 'UPS Next Day Air Saver',
  '14': 'UPS Next Day Air Early',
  '54': 'UPS Worldwide Express Plus',
  '59': 'UPS 2nd Day Air A.M.',
  '65': 'UPS Saver',
}

export interface UPSCredentials {
  client_id: string
  client_secret: string
  account_number: string
  environment: 'test' | 'production'
}

export interface Address {
  name?: string
  attention_name?: string
  address: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
  is_residential?: boolean
}

export interface Dimensions {
  length: number
  width: number
  height: number
  unit: string
}

export interface Package {
  dimensions: Dimensions
  weight: number
  weight_unit: string
  packaging_type: string
  is_hazmat: boolean
}

export interface RateRequest {
  credentials: UPSCredentials
  origin: Address
  destination: Address
  packages: Package[]
  service_code?: string
  pickup_type?: (typeof PICKUP_TYPES)[keyof typeof PICKUP_TYPES]
  customer_classification?: (typeof CUSTOMER_CLASSIFICATION)[keyof typeof CUSTOMER_CLASSIFICATION]
}

export interface DeliveryTimeInfo {
  days: number
  delivery_by: string
  estimated_delivery_date: string
  business_days_in_transit: number | null
  business_days_only: boolean
  holidays_in_transit: number
  restdays_in_transit: number
  total_days_in_transit: number
}

export interface RateResponse {
  service_code: string
  service_name: string
  total_charge: number
  currency: string
  guaranteed_delivery: boolean
  delivery_days: number | null
  delivery_time: DeliveryTimeInfo | null
  total_weight: number
  billable_weight: number
  rate_type: string | null
  negotiated_rate: boolean
  tax_charges: number | null
  total_with_tax: number | null
  pickup_charge: number
}

export interface ShipmentRequest {
  credentials: UPSCredentials
  origin: Address
  destination: Address
  packages: Package[]
  service_code: string
  reference_number?: string
  notification_email?: string
  is_return?: boolean
}

export interface ShipmentResponse {
  tracking_number: string
  label_url: string
  total_charges: number
  currency: string
  packages: {
    tracking_number: string
    label_url: string
  }[]
}

async function getUPSToken(credentials: UPSCredentials): Promise<string> {
  const baseUrl =
    credentials.environment === 'test' ? 'https://wwwcie.ups.com' : 'https://onlinetools.ups.com'
  const tokenUrl = `${baseUrl}/security/v1/oauth/token`

  // Create Basic auth token from client credentials
  const basicAuth = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString(
    'base64',
  )

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${basicAuth}`,
  }

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers,
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'EDU_SHIPPING_SHIP EDU_SHIPPING_RATE EDU_SHIPPING_SHIP_REQ EDU_SHIPPING_SHIP_ACCEPT',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error getting token:', errorText)
      throw new Error(`Failed to get UPS token: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error getting UPS token:', error)
    throw error
  }
}

export async function getRates(request: RateRequest): Promise<RateResponse[]> {
  // Get base URL and build query string
  const baseUrl =
    request.credentials.environment === 'test'
      ? 'https://wwwcie.ups.com'
      : 'https://onlinetools.ups.com'

  // Build the rate URL - removing the requestoption from path as it should be in the payload
  const version = 'v2409'
  const rateUrl = `${baseUrl}/api/rating/${version}/Shop`

  // Get OAuth token
  const token = await getUPSToken(request.credentials)

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    transId: Date.now().toString(),
    transactionSrc: request.credentials.environment === 'test' ? 'testing' : 'production',
  }

  // Build the exact payload structure that UPS expects
  const payload = {
    RateRequest: {
      Request: {
        TransactionReference: {
          CustomerContext: 'Rating and Service Request',
        },
        RequestOption: [
          'Shop',
          'Rate',
          'TimeInTransit',
          'Charges',
          'FRTDiscounts',
          'SurCharges',
          'RateBreakdown',
          'RateChart',
          'TaxBreakdown',
          'GroundFreight',
          'RatingMethodology',
        ],
        SubVersion: '2205',
      },
      CustomerClassification: {
        Code: request.customer_classification || CUSTOMER_CLASSIFICATION.WHOLESALE,
      },
      Shipment: {
        ShipmentRatingOptions: {
          TPFCNegotiatedRatesIndicator: 'Y',
          NegotiatedRatesIndicator: 'Y',
          RateChartIndicator: 'Y',
          UserLevelDiscountIndicator: 'Y',
          ShowNegotiatedRates: 'Y',
          ShowBaseRates: 'Y',
          IncludeDetailedCharges: 'Y',
          ReturnDetailedCharges: 'Y',
          IncludeAllRateElements: 'Y',
          ShowSurCharges: 'Y',
          ShowFRTDiscounts: 'Y',
          ShowTotalDiscount: 'Y',
          IncludePackingAndPickupCharges: 'Y',
        },
        PickupRequest: {
          PickupType: {
            Code: '06',
          },
          PickupDetails: {
            PickupDate: new Date().toISOString().split('T')[0].replace(/-/g, ''),
            EarliestTimeReady: '0900',
            LatestTimeReady: '1700',
            ResidentialIndicator: request.origin.is_residential ? 'Y' : 'N',
            PickupChargeIndicator: 'Y',
          },
        },
        RateInformation: {
          NegotiatedRatesIndicator: 'Y',
          GetNegotiatedPublishedRates: 'Y',
          GetAllRates: 'Y',
        },
        PaymentInformation: {
          ShipmentCharge: {
            Type: '01',
            BillShipper: {
              AccountNumber: request.credentials.account_number,
            },
          },
        },
        Service: request.service_code
          ? {
              Code: request.service_code.padStart(3, '0'),
              Description: serviceNames[request.service_code],
            }
          : {
              Code: '03', // Default to Ground
              Description: 'UPS Ground',
            },
        DeliveryTimeInformation: {
          Pickup: {
            Date: new Date().toISOString().split('T')[0].replace(/-/g, ''),
          },
        },
        TimeInTransitIndicator: 'Y',
        TaxInformationIndicator: 'Y',
        Shipper: {
          Name: 'Stealth Batteries',
          ShipperNumber: request.credentials.account_number,
          Address: {
            AddressLine: request.origin.address2
              ? [request.origin.address, request.origin.address2]
              : [request.origin.address],
            City: request.origin.city,
            StateProvinceCode: request.origin.state,
            PostalCode: request.origin.postalCode,
            CountryCode: 'US',
          },
        },
        ShipTo: {
          Name: request.destination.name || 'Customer',
          Address: {
            AddressLine: request.destination.address2
              ? [request.destination.address, request.destination.address2]
              : [request.destination.address],
            City: request.destination.city,
            StateProvinceCode: request.destination.state,
            PostalCode: request.destination.postalCode,
            CountryCode: 'US',
            ...(request.destination.is_residential && { ResidentialAddressIndicator: 'Y' }),
          },
        },
        ShipFrom: {
          Name: 'Stealth Batteries',
          ShipperNumber: request.credentials.account_number,
          Address: {
            AddressLine: request.origin.address2
              ? [request.origin.address, request.origin.address2]
              : [request.origin.address],
            City: request.origin.city,
            StateProvinceCode: request.origin.state,
            PostalCode: request.origin.postalCode,
            CountryCode: 'US',
          },
        },
        NumOfPieces: String(request.packages.length),
        Package: request.packages.map((pkg) => ({
          PackagingType: {
            Code: pkg.packaging_type,
            Description: 'Customer Supplied',
          },
          Dimensions: {
            UnitOfMeasurement: {
              Code: pkg.dimensions.unit,
              Description: pkg.dimensions.unit === 'IN' ? 'Inches' : 'Centimeters',
            },
            Length: String(pkg.dimensions.length),
            Width: String(pkg.dimensions.width),
            Height: String(pkg.dimensions.height),
          },
          PackageWeight: {
            UnitOfMeasurement: {
              Code: pkg.weight_unit,
              Description: pkg.weight_unit === 'LBS' ? 'Pounds' : 'Kilograms',
            },
            Weight: String(pkg.weight),
          },
        })),
      },
    },
  }

  try {
    const response = await fetch(rateUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to get rates from UPS:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: rateUrl,
      })
      throw new Error(`Failed to get rates from UPS: ${errorText}`)
    }

    const data = await response.json()

    // Process the response as before...
    const rates: RateResponse[] = []
    let ratedShipments = data.RateResponse?.RatedShipment || []
    if (!Array.isArray(ratedShipments)) {
      ratedShipments = [ratedShipments]
    }

    for (const ratedShipment of ratedShipments) {
      const serviceCode = ratedShipment.Service?.Code || ''
      const serviceName = serviceNames[serviceCode] || `UPS Service ${serviceCode}`

      // Get the published rate components
      const baseCharge = parseFloat(ratedShipment.TransportationCharges?.MonetaryValue || '0')
      const serviceOptionsCharge = parseFloat(
        ratedShipment.ServiceOptionsCharges?.MonetaryValue || '0',
      )
      const publishedRate = baseCharge + serviceOptionsCharge

      // Get the negotiated rate components
      const negotiatedCharges = ratedShipment.NegotiatedRateCharges?.ItemizedCharges || []

      // Get pickup charge - check both ItemizedCharges and specific pickup charge field
      const pickupCharge = parseFloat(
        negotiatedCharges.find(
          (c) => c.Code === 'PKP' || c.Description?.toLowerCase().includes('pickup'),
        )?.MonetaryValue ||
          ratedShipment.PickupCharges?.MonetaryValue ||
          '0',
      )

      // Add flat pickup charge for one-time pickup
      // UPS charges a flat rate of $14.75 for one-time pickups regardless of:
      // - Number of packages
      // - Destination address
      // - Service type
      // - Package weights/dimensions
      const flatPickupCharge = PICKUP_CHARGES.ONE_TIME

      // Get residential surcharge if applicable
      const residentialSurcharge = request.destination.is_residential
        ? parseFloat(
            negotiatedCharges.find(
              (c) => c.Code === '270' || c.Description?.toLowerCase().includes('residential'),
            )?.MonetaryValue || '0',
          )
        : 0

      // Get the total negotiated charge
      const totalNegotiatedCharge =
        parseFloat(ratedShipment.NegotiatedRateCharges?.TotalCharge?.MonetaryValue || '0') +
        flatPickupCharge

      // Calculate final rate including all charges
      const finalRate = totalNegotiatedCharge > 0 ? totalNegotiatedCharge : publishedRate

      // Get guaranteed delivery information
      const guaranteedDelivery = ratedShipment.GuaranteedDelivery
      const timeInTransit = ratedShipment.TimeInTransit

      // Parse transit days as a number, not a string
      const transitDays =
        guaranteedDelivery?.BusinessDaysInTransit || timeInTransit?.BusinessDaysInTransit
      const businessDaysInTransit = transitDays
        ? parseInt(transitDays, 10)
        : serviceCode === '03'
          ? 4
          : serviceCode === '12'
            ? 3
            : null

      // Calculate delivery time
      let deliveryTime: DeliveryTimeInfo | null = null
      if (businessDaysInTransit !== null) {
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Reset time to start of day

        const estimatedDeliveryDate = new Date(today)
        let daysToAdd = businessDaysInTransit

        while (daysToAdd > 0) {
          estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 1)
          // Skip weekends
          if (estimatedDeliveryDate.getDay() !== 0 && estimatedDeliveryDate.getDay() !== 6) {
            daysToAdd--
          }
        }

        deliveryTime = {
          days: businessDaysInTransit,
          delivery_by:
            guaranteedDelivery?.DeliveryByTime || timeInTransit?.DeliveryByTime || 'End of Day',
          estimated_delivery_date: estimatedDeliveryDate.toISOString(),
          business_days_in_transit: businessDaysInTransit,
          business_days_only: true,
          holidays_in_transit: 0,
          restdays_in_transit: 2, // Weekend days
          total_days_in_transit: businessDaysInTransit + 2,
        }
      }

      rates.push({
        service_code: serviceCode,
        service_name: serviceName,
        total_charge: finalRate,
        currency: ratedShipment.TotalCharges?.CurrencyCode || 'USD',
        guaranteed_delivery: !!guaranteedDelivery,
        delivery_days: businessDaysInTransit,
        delivery_time: deliveryTime,
        total_weight: parseFloat(ratedShipment.BillingWeight?.Weight || '0'),
        billable_weight: parseFloat(ratedShipment.BillingWeight?.Weight || '0'),
        rate_type: negotiatedCharges.length > 0 ? 'Negotiated' : 'Published',
        negotiated_rate: negotiatedCharges.length > 0,
        tax_charges: parseFloat(ratedShipment.TotalCharges?.TaxAmount?.MonetaryValue || '0'),
        total_with_tax:
          finalRate + parseFloat(ratedShipment.TotalCharges?.TaxAmount?.MonetaryValue || '0'),
        pickup_charge: flatPickupCharge, // Always include flat pickup charge
      })
    }

    // Sort rates by price
    return rates.sort((a, b) => a.total_charge - b.total_charge)
  } catch (error) {
    console.error('Error getting UPS rates:', error)
    throw error
  }
}

export async function getGroundAnd3DayRates(request: RateRequest): Promise<RateResponse[]> {
  const rates: RateResponse[] = []

  // Get Ground rates
  const groundRequest = { ...request, service_code: '03' }
  try {
    const groundRates = await getRates(groundRequest)
    rates.push(...groundRates)
  } catch (error) {
    console.error('Error getting Ground rates:', error)
  }

  // Get 3 Day Select rates
  const threeDayRequest = { ...request, service_code: '12' }
  try {
    const threeDayRates = await getRates(threeDayRequest)
    rates.push(...threeDayRates)
  } catch (error) {
    console.error('Error getting 3 Day Select rates:', error)
  }

  // Sort rates by price
  return rates.sort((a, b) => a.total_charge - b.total_charge)
}

function buildShipmentPayload(request: ShipmentRequest) {
  return {
    ShipmentRequest: {
      Request: {
        RequestOption: 'validate',
        SubVersion: '1208',
        TransactionReference: {
          CustomerContext: 'Rating and Service Request',
        },
      },
      Shipment: {
        Description: `${request.origin.name || 'Stealth Batteries'} Shipment`,
        Shipper: {
          Name: request.origin.name || 'Stealth Batteries',
          AttentionName: request.origin.attention_name || 'Shipping Department',
          ShipperNumber: request.credentials.account_number,
          Address: {
            AddressLine: request.origin.address,
            City: request.origin.city,
            StateProvinceCode: request.origin.state,
            PostalCode: request.origin.postalCode,
            CountryCode: 'US',
          },
        },
        ShipTo: {
          Name: request.destination.name || 'Customer',
          AttentionName: request.destination.attention_name,
          Address: {
            AddressLine: request.destination.address,
            City: request.destination.city,
            StateProvinceCode: request.destination.state,
            PostalCode: request.destination.postalCode,
            CountryCode: 'US',
            ...(request.destination.is_residential && { ResidentialAddressIndicator: 'Y' }),
          },
          Email: request.notification_email,
        },
        PaymentInformation: {
          ShipmentCharge: {
            Type: '01',
            BillShipper: {
              AccountNumber: request.credentials.account_number,
            },
          },
        },
        Service: {
          Code: request.service_code,
        },
        Package: request.packages.map((pkg) => ({
          Description: 'Package',
          Packaging: {
            Code: pkg.packaging_type,
          },
          Dimensions: {
            UnitOfMeasurement: {
              Code: pkg.dimensions.unit,
            },
            Length: String(pkg.dimensions.length),
            Width: String(pkg.dimensions.width),
            Height: String(pkg.dimensions.height),
          },
          PackageWeight: {
            UnitOfMeasurement: {
              Code: pkg.weight_unit,
            },
            Weight: String(pkg.weight),
          },
        })),
        LabelSpecification: {
          LabelImageFormat: {
            Code: 'GIF',
          },
          HTTPUserAgent: 'Mozilla/4.5',
        },
      },
    },
  }
}

export async function createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
  const baseUrl =
    request.credentials.environment === 'test'
      ? 'https://wwwcie.ups.com'
      : 'https://onlinetools.ups.com'
  const apiBaseUrl = `${baseUrl}/api`
  const shipUrl = `${apiBaseUrl}/shipments/v1/ship`

  // Get OAuth token
  const token = await getUPSToken(request.credentials)

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Transaction-Source': 'testing',
    'x-merchant-id': request.credentials.account_number,
    transId: request.reference_number || 'Shipping API',
    transactionSrc: 'testing',
  }

  // Parse response and extract tracking number and label
  const response = await fetch(shipUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(buildShipmentPayload(request)),
  })

  if (!response.ok) {
    console.error('Failed to create UPS shipment:', {
      status: response.status,
      statusText: response.statusText,
      body: await response.text(),
    })
    throw new Error(`Failed to create UPS shipment: ${response.statusText}`)
  }

  const data = await response.json()

  // Extract shipment-level tracking number and package results
  const shipmentResults = data.ShipmentResponse.ShipmentResults
  const shipmentIdentificationNumber = shipmentResults?.ShipmentIdentificationNumber

  // Handle both single and multiple package responses
  const packageResults = Array.isArray(shipmentResults?.PackageResults)
    ? shipmentResults.PackageResults
    : [shipmentResults?.PackageResults]

  // Extract tracking numbers and labels, with better error logging
  const packages = packageResults
    .map((pkg) => {
      return {
        trackingNumber: pkg?.TrackingNumber || shipmentIdentificationNumber,
        // The label might be in different locations depending on the response
        label:
          pkg?.LabelImage?.GraphicImage ||
          pkg?.GraphicImage ||
          pkg?.ShippingLabel?.GraphicImage ||
          (typeof pkg?.ShippingLabel === 'string' ? pkg.ShippingLabel : undefined),
      }
    })
    .filter((pkg) => {
      const isValid = pkg.trackingNumber && pkg.label
      return isValid
    })

  if (packages.length === 0) {
    console.error('No valid packages found in response. Response structure:', {
      hasShipmentResults: !!shipmentResults,
      shipmentId: shipmentIdentificationNumber,
      packageResultsType: typeof packageResults,
      packageResultsLength: packageResults.length,
      firstPackageKeys: packageResults[0] ? Object.keys(packageResults[0]) : [],
      firstPackageShippingLabel: packageResults[0]?.ShippingLabel,
      firstPackageLabelImage: packageResults[0]?.LabelImage,
      firstPackageGraphicImage: packageResults[0]?.GraphicImage,
    })
    throw new Error('Failed to extract tracking numbers and labels from UPS response')
  }

  return {
    tracking_number: shipmentIdentificationNumber || packages[0].trackingNumber,
    label_url: packages[0].label,
    total_charges: parseFloat(shipmentResults?.ShipmentCharges?.TotalCharges?.MonetaryValue || '0'),
    currency: shipmentResults?.ShipmentCharges?.TotalCharges?.CurrencyCode || 'USD',
    packages: packages.map((pkg) => ({
      tracking_number: pkg.trackingNumber,
      label_url: pkg.label,
    })),
  }
}

function calculateDeliveryDate(days: number, businessDaysOnly: boolean = true): Date {
  const currentDate = new Date()
  if (businessDaysOnly) {
    let remainingDays = days
    while (remainingDays > 0) {
      currentDate.setDate(currentDate.getDate() + 1)
      if (currentDate.getDay() < 5) {
        // Skip weekends
        remainingDays--
      }
    }
    return currentDate
  }
  currentDate.setDate(currentDate.getDate() + days)
  return currentDate
}
