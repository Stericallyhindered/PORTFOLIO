declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Shipping Origin Configuration
      SHIPPING_ORIGIN_ADDRESS: string
      SHIPPING_ORIGIN_CITY: string
      SHIPPING_ORIGIN_STATE: string
      SHIPPING_ORIGIN_POSTAL_CODE: string
      SHIPPING_ORIGIN_COUNTRY: string

      // UPS API Configuration
      UPS_CLIENT_ID: string
      UPS_CLIENT_SECRET: string
      UPS_USER_ID: string
      UPS_ACCOUNT_NUMBER: string
      UPS_ENVIRONMENT: 'test' | 'production'
      UPS_FASTAPI_URL?: string
    }
  }
}

export {}
