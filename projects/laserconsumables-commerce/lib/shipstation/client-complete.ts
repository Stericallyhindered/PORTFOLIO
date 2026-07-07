// Complete ShipStation API client
// Based on full API documentation

const SHIPSTATION_API_URL = 'https://ssapi.shipstation.com'

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

  // ========== ACCOUNTS ==========
  async listTags() {
    return this.request('/accounts/listtags')
  }

  // ========== CARRIERS ==========
  async getCarriers() {
    return this.request('/carriers')
  }

  async getCarrier(carrierCode: string) {
    return this.request(`/carriers/getcarrier?carrierCode=${carrierCode}`)
  }

  async getCarrierServices(carrierCode: string) {
    return this.request(`/carriers/listservices?carrierCode=${carrierCode}`)
  }

  async getPackages(carrierCode?: string) {
    const url = carrierCode 
      ? `/carriers/listpackages?carrierCode=${carrierCode}`
      : '/carriers/listpackages'
    return this.request(url)
  }

  async addFunds(carrierCode: string, amount: number) {
    return this.request('/carriers/addfunds', {
      method: 'POST',
      body: JSON.stringify({ carrierCode, amount }),
    })
  }

  // ========== CUSTOMERS ==========
  async getCustomer(customerId: number) {
    return this.request(`/customers/${customerId}`)
  }

  async listCustomers(params?: {
    stateCode?: string
    countryCode?: string
    tagId?: number
    marketplaceId?: number
    sortBy?: string
    sortDir?: 'ASC' | 'DESC'
    page?: number
    pageSize?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.stateCode) queryParams.set('stateCode', params.stateCode)
    if (params?.countryCode) queryParams.set('countryCode', params.countryCode)
    if (params?.tagId) queryParams.set('tagId', params.tagId.toString())
    if (params?.marketplaceId) queryParams.set('marketplaceId', params.marketplaceId.toString())
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy)
    if (params?.sortDir) queryParams.set('sortDir', params.sortDir)
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString())

    return this.request(`/customers?${queryParams.toString()}`)
  }

  // ========== FULFILLMENTS ==========
  async listFulfillments(params?: {
    fulfillmentId?: number
    orderId?: number
    orderNumber?: string
    trackingNumber?: string
    recipientName?: string
    createDateStart?: string
    createDateEnd?: string
    shipDateStart?: string
    shipDateEnd?: string
    sortBy?: string
    sortDir?: 'ASC' | 'DESC'
    page?: number
    pageSize?: number
  }) {
    const queryParams = new URLSearchParams()
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.set(key, value.toString())
      }
    })

    return this.request(`/fulfillments?${queryParams.toString()}`)
  }

  // ========== ORDERS ==========
  async createOrder(order: any) {
    return this.request('/orders/createorder', {
      method: 'POST',
      body: JSON.stringify(order),
    })
  }

  async createOrders(orders: any[]) {
    return this.request('/orders/createorders', {
      method: 'POST',
      body: JSON.stringify(orders),
    })
  }

  async getOrder(orderId: number) {
    return this.request(`/orders/${orderId}`)
  }

  async listOrders(params?: {
    customerName?: string
    itemKeyword?: string
    createDateStart?: string
    createDateEnd?: string
    modifyDateStart?: string
    modifyDateEnd?: string
    orderDateStart?: string
    orderDateEnd?: string
    orderNumber?: string
    orderStatus?: string
    paymentDateStart?: string
    paymentDateEnd?: string
    storeId?: number
    sortBy?: string
    sortDir?: 'ASC' | 'DESC'
    page?: number
    pageSize?: number
  }) {
    const queryParams = new URLSearchParams()
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.set(key, value.toString())
      }
    })

    return this.request(`/orders?${queryParams.toString()}`)
  }

  async listOrdersByTag(params: {
    orderStatus: string
    tagId: number
    page?: number
    pageSize?: number
  }) {
    const queryParams = new URLSearchParams()
    queryParams.set('orderStatus', params.orderStatus)
    queryParams.set('tagId', params.tagId.toString())
    if (params.page) queryParams.set('page', params.page.toString())
    if (params.pageSize) queryParams.set('pageSize', params.pageSize.toString())

    return this.request(`/orders/listbytag?${queryParams.toString()}`)
  }

  async deleteOrder(orderId: number) {
    return this.request(`/orders/${orderId}`, {
      method: 'DELETE',
    })
  }

  async createLabelForOrder(orderId: number, data: {
    carrierCode: string
    serviceCode: string
    packageCode: string
    confirmation?: string
    shipDate: string
    weight: { value: number; units: string }
    dimensions?: { length: number; width: number; height: number; units: string }
    insuranceOptions?: any
    internationalOptions?: any
    advancedOptions?: any
    testLabel?: boolean
  }) {
    return this.request('/orders/createlabelfororder', {
      method: 'POST',
      body: JSON.stringify({ orderId, ...data }),
    })
  }

  async markAsShipped(data: {
    orderId: number
    carrierCode: string
    shipDate?: string
    trackingNumber?: string
    notifyCustomer?: boolean
    notifySalesChannel?: boolean
  }) {
    return this.request('/orders/markasshipped', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async addTag(orderId: number, tagId: number) {
    return this.request('/orders/addtag', {
      method: 'POST',
      body: JSON.stringify({ orderId, tagId }),
    })
  }

  async removeTag(orderId: number, tagId: number) {
    return this.request('/orders/removetag', {
      method: 'POST',
      body: JSON.stringify({ orderId, tagId }),
    })
  }

  async assignUser(orderIds: number[], userId: string) {
    return this.request('/orders/assignuser', {
      method: 'POST',
      body: JSON.stringify({ orderIds, userId }),
    })
  }

  async unassignUser(orderIds: number[]) {
    return this.request('/orders/unassignuser', {
      method: 'POST',
      body: JSON.stringify({ orderIds }),
    })
  }

  async holdUntil(orderId: number, holdUntilDate: string) {
    return this.request('/orders/holduntil', {
      method: 'POST',
      body: JSON.stringify({ orderId, holdUntilDate }),
    })
  }

  async restoreFromHold(orderId: number) {
    return this.request('/orders/restorefromhold', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    })
  }

  // ========== PRODUCTS ==========
  async getProduct(productId: number) {
    return this.request(`/products/${productId}`)
  }

  async listProducts(params?: {
    sku?: string
    name?: string
    productCategoryId?: number
    productTypeId?: number
    tagId?: number
    startDate?: string
    endDate?: string
    showInactive?: boolean
    sortBy?: string
    sortDir?: 'ASC' | 'DESC'
    page?: number
    pageSize?: number
    upc?: string
  }) {
    const queryParams = new URLSearchParams()
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.set(key, value.toString())
      }
    })

    return this.request(`/products?${queryParams.toString()}`)
  }

  async updateProduct(productId: number, product: any) {
    return this.request(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ productId, ...product }),
    })
  }

  // ========== SHIPMENTS ==========
  async createLabel(data: {
    carrierCode: string
    serviceCode: string
    packageCode: string
    confirmation?: string
    shipDate: string
    weight: { value: number; units: string }
    dimensions?: { length: number; width: number; height: number; units: string }
    shipFrom: any
    shipTo: any
    insuranceOptions?: any
    internationalOptions?: any
    advancedOptions?: any
    testLabel?: boolean
  }) {
    return this.request('/shipments/createlabel', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getRates(data: {
    carrierCode: string
    serviceCode?: string
    packageCode?: string
    fromPostalCode: string
    fromCity?: string
    fromState?: string
    fromWarehouseId?: number
    toState?: string
    toCountry: string
    toPostalCode: string
    toCity?: string
    weight: { value: number; units: string }
    dimensions?: { length: number; width: number; height: number; units: string }
    confirmation?: string
    residential?: boolean
  }) {
    return this.request('/shipments/getrates', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getShipment(shipmentId: number) {
    return this.request(`/shipments/${shipmentId}`)
  }

  async listShipments(params?: {
    recipientName?: string
    recipientCountryCode?: string
    orderNumber?: string
    orderId?: number
    carrierCode?: string
    serviceCode?: string
    trackingNumber?: string
    createDateStart?: string
    createDateEnd?: string
    shipDateStart?: string
    shipDateEnd?: string
    voidDateStart?: string
    voidDateEnd?: string
    storeId?: number
    includeShipmentItems?: boolean
    sortBy?: string
    sortDir?: 'ASC' | 'DESC'
    page?: number
    pageSize?: number
  }) {
    const queryParams = new URLSearchParams()
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.set(key, value.toString())
      }
    })

    return this.request(`/shipments?${queryParams.toString()}`)
  }

  async voidLabel(shipmentId: number) {
    return this.request('/shipments/voidlabel', {
      method: 'POST',
      body: JSON.stringify({ shipmentId }),
    })
  }

  // ========== STORES ==========
  async listStores(params?: {
    showInactive?: boolean
    marketplaceId?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.showInactive !== undefined) queryParams.set('showInactive', params.showInactive.toString())
    if (params?.marketplaceId) queryParams.set('marketplaceId', params.marketplaceId.toString())

    return this.request(`/stores?${queryParams.toString()}`)
  }

  async getStore(storeId: number) {
    return this.request(`/stores/${storeId}`)
  }

  async updateStore(storeId: number, store: any) {
    return this.request(`/stores/${storeId}`, {
      method: 'PUT',
      body: JSON.stringify({ storeId, ...store }),
    })
  }

  async deactivateStore(storeId: number) {
    return this.request('/stores/deactivate', {
      method: 'POST',
      body: JSON.stringify({ storeId: storeId.toString() }),
    })
  }

  async reactivateStore(storeId: number) {
    return this.request('/stores/reactivate', {
      method: 'POST',
      body: JSON.stringify({ storeId: storeId.toString() }),
    })
  }

  async refreshStore(storeId?: number, refreshDate?: string) {
    const queryParams = new URLSearchParams()
    if (storeId) queryParams.set('storeId', storeId.toString())
    if (refreshDate) queryParams.set('refreshDate', refreshDate)

    return this.request(`/stores/refreshstore?${queryParams.toString()}`, {
      method: 'POST',
      body: JSON.stringify({ storeId, refreshDate }),
    })
  }

  async getStoreRefreshStatus(storeId: number) {
    return this.request(`/stores/getrefreshstatus?storeId=${storeId}`)
  }

  async listMarketplaces() {
    return this.request('/stores/marketplaces')
  }

  // ========== USERS ==========
  async listUsers(showInactive?: boolean) {
    const queryParams = new URLSearchParams()
    if (showInactive !== undefined) queryParams.set('showInactive', showInactive.toString())

    return this.request(`/users?${queryParams.toString()}`)
  }

  // ========== WAREHOUSES ==========
  async listWarehouses() {
    return this.request('/warehouses')
  }

  async getWarehouse(warehouseId: number) {
    return this.request(`/warehouses/${warehouseId}`)
  }

  async createWarehouse(data: {
    warehouseName?: string
    originAddress: any
    returnAddress?: any
    isDefault?: boolean
  }) {
    return this.request('/warehouses/createwarehouse', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateWarehouse(warehouseId: number, warehouse: any) {
    return this.request(`/warehouses/${warehouseId}`, {
      method: 'PUT',
      body: JSON.stringify({ warehouseId, ...warehouse }),
    })
  }

  async deleteWarehouse(warehouseId: number) {
    return this.request(`/warehouses/${warehouseId}`, {
      method: 'DELETE',
    })
  }

  // ========== WEBHOOKS ==========
  async listWebhooks() {
    return this.request('/webhooks')
  }

  async subscribeWebhook(data: {
    target_url: string
    event: string
    store_id?: number
    friendly_name?: string
  }) {
    return this.request('/webhooks/subscribe', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async unsubscribeWebhook(webhookId: number) {
    return this.request(`/webhooks/${webhookId}`, {
      method: 'DELETE',
    })
  }

  // ========== REPORTS ==========
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


