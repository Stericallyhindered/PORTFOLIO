// ShipStation API client
// ShipStation uses Basic Auth with API Key and API Secret
// This file exports the complete client - see client-complete.ts for full implementation

const SHIPSTATION_API_URL = 'https://ssapi.shipstation.com'

export * from './client-complete'

export interface ShipStationConfig {
  apiKey: string
  apiSecret: string
}

export class ShipStationClient {
  private apiKey: string
  private apiSecret: string

  constructor(config: ShipStationConfig) {
    this.apiKey = config.apiKey
    this.apiSecret = config.apiSecret
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')

    const response = await fetch(`${SHIPSTATION_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ShipStation API error: ${error}`)
    }

    return response.json()
  }

  // Legacy method - kept for backward compatibility
  async createShipment(data: {
    orderId: string
    carrierCode: string
    serviceCode: string
    packageCode: string
    confirmation?: string
    shipDate: string
    weight: {
      value: number
      units: string
    }
    dimensions?: {
      length: number
      width: number
      height: number
      units: string
    }
    shipTo: {
      name: string
      street1: string
      street2?: string
      city: string
      state: string
      postalCode: string
      country: string
    }
    shipFrom: {
      name: string
      street1: string
      street2?: string
      city: string
      state: string
      postalCode: string
      country: string
    }
  }) {
    return this.request('/orders/createlabelfororder', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getRates(data: {
    carrierCode: string
    serviceCode?: string
    packageCode: string
    fromPostalCode: string
    toState: string
    toCountry: string
    toPostalCode: string
    weight: {
      value: number
      units: string
    }
    dimensions?: {
      length: number
      width: number
      height: number
      units: string
    }
  }) {
    return this.request('/shipments/getrates', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getShipment(shipmentId: string) {
    return this.request(`/shipments/${shipmentId}`)
  }

  async listShipments(params?: {
    page?: number
    pageSize?: number
    orderId?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString())
    if (params?.orderId) queryParams.set('orderId', params.orderId)

    return this.request(`/shipments?${queryParams.toString()}`)
  }

  async getCarriers() {
    return this.request('/carriers')
  }

  async getCarrierServices(carrierCode: string) {
    return this.request(`/carriers/getservices?carrierCode=${carrierCode}`)
  }

  async getPackages() {
    return this.request('/carriers/listpackages')
  }

  async createLabelForOrder(orderId: number, data: {
    carrierCode: string
    serviceCode: string
    packageCode: string
    confirmation?: string
    shipDate: string
    weight: {
      value: number
      units: string
    }
    dimensions?: {
      length: number
      width: number
      height: number
      units: string
    }
    insuranceOptions?: {
      provider?: string
      insureShipment?: boolean
      insuredValue?: number
    }
    advancedOptions?: {
      customField1?: string
      customField2?: string
      customField3?: string
      containsAlcohol?: boolean
      mergedOrSplit?: boolean
      mergedIds?: number[]
      parentId?: number
      storeId?: number
    }
  }) {
    return this.request(`/orders/createlabelfororder`, {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        ...data,
      }),
    })
  }

  async voidLabel(shipmentId: number) {
    return this.request(`/shipments/voidlabel`, {
      method: 'POST',
      body: JSON.stringify({ shipmentId }),
    })
  }

  async getOrder(orderId: number) {
    return this.request(`/orders/${orderId}`)
  }

  async listOrders(params?: {
    orderStatus?: string
    page?: number
    pageSize?: number
    orderDateStart?: string
    orderDateEnd?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.orderStatus) queryParams.set('orderStatus', params.orderStatus)
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString())
    if (params?.orderDateStart) queryParams.set('orderDateStart', params.orderDateStart)
    if (params?.orderDateEnd) queryParams.set('orderDateEnd', params.orderDateEnd)

    return this.request(`/orders?${queryParams.toString()}`)
  }

  // Reporting endpoints
  async getSalesReport(params?: {
    startDate?: string
    endDate?: string
    page?: number
    pageSize?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.set('startDate', params.startDate)
    if (params?.endDate) queryParams.set('endDate', params.endDate)
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString())

    return this.request(`/reports/sales?${queryParams.toString()}`)
  }

  async getShippingReport(params?: {
    startDate?: string
    endDate?: string
    carrierCode?: string
    serviceCode?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.set('startDate', params.startDate)
    if (params?.endDate) queryParams.set('endDate', params.endDate)
    if (params?.carrierCode) queryParams.set('carrierCode', params.carrierCode)
    if (params?.serviceCode) queryParams.set('serviceCode', params.serviceCode)

    return this.request(`/reports/shipping?${queryParams.toString()}`)
  }

  async getTaxReport(params?: {
    startDate?: string
    endDate?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.set('startDate', params.startDate)
    if (params?.endDate) queryParams.set('endDate', params.endDate)

    return this.request(`/reports/tax?${queryParams.toString()}`)
  }

  // Advanced shipping methods
  async createShippingZone(data: {
    name: string
    countries: string[]
    states?: string[]
    zipCodes?: string[]
    rateRules: Array<{
      type: 'weight' | 'price' | 'item_count'
      min: number
      max?: number
      rate: number
      freeShipping?: boolean
    }>
  }) {
    return this.request('/shipping/zones', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getShippingZones() {
    return this.request('/shipping/zones')
  }

  async createShippingProfile(data: {
    name: string
    productIds?: string[]
    collectionIds?: string[]
    zoneId: string
    defaultCarrier?: string
    defaultService?: string
  }) {
    return this.request('/shipping/profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getShippingProfiles() {
    return this.request('/shipping/profiles')
  }

  async calculateShippingRate(data: {
    fromPostalCode: string
    toPostalCode: string
    toCountry: string
    toState?: string
    weight: {
      value: number
      units: string
    }
    dimensions?: {
      length: number
      width: number
      height: number
      units: string
    }
    value?: number
    zoneId?: string
    profileId?: string
  }) {
    return this.request('/shipping/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export function getShipStationClient(): ShipStationClient {
  if (!process.env.SHIPSTATION_API_KEY || !process.env.SHIPSTATION_API_SECRET) {
    throw new Error('ShipStation API credentials not configured')
  }

  return new ShipStationClient({
    apiKey: process.env.SHIPSTATION_API_KEY,
    apiSecret: process.env.SHIPSTATION_API_SECRET,
  })
}

