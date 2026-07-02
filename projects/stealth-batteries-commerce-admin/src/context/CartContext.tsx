'use client'

import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react'
import { fetchBulkDiscountLevelsClient } from '../utilities/getBulkDiscountLevels'
import type { BulkDiscountLevel } from '../payload-types'

export type CartItem = {
  id: string | number
  title: string
  price: number
  quantity: number
  image?: string
  variant?: {
    name: string
    value: string
  }
  shippingDetails?: {
    weight: number
    length: number
    width: number
    height: number
    stackable?: boolean | null
    hazmat?: boolean | null
    freightClass?: string | null
    requiresLiftgate?: boolean | null
    hazmatClass?: string | null
  }
  product: any
  publicPrice?: number
  dealerPrice?: number
}

type CartState = {
  items: CartItem[]
  total: number
  discounts: {
    dealer?: {
      percentage: number
      tierId: number
      tierName: string
      taxExempt: boolean
      volumeDiscountThreshold: number
      volumeDiscountPercentage: number
      volumeDiscountApplied: boolean
    }
    affiliate?: {
      code: string
      percentage: number
    }
    discountCode?: {
      code: string
      type: 'percentage' | 'fixed'
      amount: number
      applicableProducts?: (string | number)[]
    }
  }
}

type CartAction =
  | { type: 'SET_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string | number }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string | number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState }
  | {
      type: 'SET_DEALER_DISCOUNT'
      payload: {
        percentage: number
        tierId: number
        tierName: string
        taxExempt: boolean
        volumeDiscountThreshold: number
        volumeDiscountPercentage: number
        volumeDiscountApplied: boolean
      }
    }
  | { type: 'SET_AFFILIATE_DISCOUNT'; payload: { code: string; percentage: number } }
  | {
      type: 'SET_DISCOUNT_CODE'
      payload: {
        code: string
        type: 'percentage' | 'fixed'
        amount: number
        applicableProducts?: (string | number)[]
      }
    }
  | { type: 'CLEAR_DISCOUNTS' }
  | { type: 'CLEAR_DEALER_DISCOUNT' }
  | { type: 'CLEAR_DISCOUNT_CODE' }

const initialState: CartState = {
  items: [],
  total: 0,
  discounts: {},
}

const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => {
    // First multiply, then round down to avoid floating point issues
    const itemTotal = Math.floor(item.price * item.quantity * 100) / 100
    return Math.floor((total + itemTotal) * 100) / 100
  }, 0)
}

const calculateDiscountedTotal = (
  subtotal: number,
  discounts: CartState['discounts'] = {},
  items: CartItem[] = [],
): number => {
  let total = Math.floor(subtotal * 100) / 100

  // Apply dealer discount first (if any)
  if (discounts?.dealer) {
    if (subtotal >= discounts.dealer.volumeDiscountThreshold) {
      const dealerDiscount =
        Math.floor(((subtotal * discounts.dealer.percentage) / 100) * 100) / 100
      const volumeDiscount =
        Math.floor(((subtotal * discounts.dealer.volumeDiscountPercentage) / 100) * 100) / 100
      total = Math.floor((total - dealerDiscount - volumeDiscount) * 100) / 100
      discounts.dealer.volumeDiscountApplied = true
    } else {
      const dealerDiscount = Math.floor(((total * discounts.dealer.percentage) / 100) * 100) / 100
      total = Math.floor((total - dealerDiscount) * 100) / 100
      discounts.dealer.volumeDiscountApplied = false
    }
  }

  // Then apply affiliate discount (if any)
  if (discounts?.affiliate) {
    const affiliateDiscount =
      Math.floor(((total * discounts.affiliate.percentage) / 100) * 100) / 100
    total = Math.floor((total - affiliateDiscount) * 100) / 100
  }

  // Apply discount code (product-specific or subtotal)
  if (discounts?.discountCode) {
    const { type, amount, applicableProducts } = discounts.discountCode
    if (applicableProducts && applicableProducts.length > 0) {
      // Product-specific discount
      let discount = 0
      // Extract product IDs from relationship objects or primitives
      const productIds = applicableProducts.map((p: any) =>
        typeof p === 'object' && (p.id || p.value) ? String(p.id || p.value) : String(p),
      )
      for (const item of items) {
        if (productIds.includes(String(item.id))) {
          if (type === 'percentage') {
            discount += Math.floor(item.price * (amount / 100) * item.quantity * 100) / 100
          } else {
            discount += Math.floor(amount * item.quantity * 100) / 100
          }
        }
      }
      total = Math.floor((total - discount) * 100) / 100
    } else {
      // Subtotal discount (current logic)
      if (type === 'percentage') {
        const codeDiscount = Math.floor(((total * amount) / 100) * 100) / 100
        total = Math.floor((total - codeDiscount) * 100) / 100
      } else {
        total = Math.floor((total - amount) * 100) / 100
      }
    }
  }

  return total
}

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'LOAD_CART':
      return action.payload

    case 'SET_ITEM': {
      const existingItemIndex = state.items.findIndex(
        (item) =>
          (item.id === action.payload.id || item.id.toString() === action.payload.id.toString()) &&
          item.variant?.value === action.payload.variant?.value,
      )

      // Ensure price is exactly 2 decimal places
      const price = Math.floor(Number(action.payload.price.toFixed(2)) * 100) / 100

      let newItems: CartItem[]
      if (existingItemIndex > -1) {
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? {
                ...item,
                quantity: item.quantity + action.payload.quantity,
                price,
              }
            : item,
        )
      } else {
        newItems = [...state.items, { ...action.payload, price }]
      }

      const subtotal = calculateTotal(newItems)
      const discounts = { ...state.discounts }

      // Update volume discount applied flag based on new subtotal
      if (discounts.dealer) {
        discounts.dealer.volumeDiscountApplied =
          subtotal >= discounts.dealer.volumeDiscountThreshold
      }

      return {
        items: newItems,
        total: calculateDiscountedTotal(subtotal, discounts, newItems),
        discounts,
      }
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter((item) => item.id !== action.payload)
      const subtotal = calculateTotal(newItems)
      const discounts = { ...state.discounts }

      // Update volume discount applied flag based on new subtotal
      if (discounts.dealer) {
        discounts.dealer.volumeDiscountApplied =
          subtotal >= discounts.dealer.volumeDiscountThreshold
      }

      return {
        items: newItems,
        total: calculateDiscountedTotal(subtotal, discounts, newItems),
        discounts,
      }
    }

    case 'UPDATE_QUANTITY': {
      // If quantity is 0 or less, remove the item
      if (action.payload.quantity <= 0) {
        const newItems = state.items.filter((item) => item.id !== action.payload.id)
        const subtotal = calculateTotal(newItems)
        const discounts = { ...state.discounts }

        // Update volume discount applied flag based on new subtotal
        if (discounts.dealer) {
          discounts.dealer.volumeDiscountApplied =
            subtotal >= discounts.dealer.volumeDiscountThreshold
        }

        return {
          items: newItems,
          total: calculateDiscountedTotal(subtotal, discounts, newItems),
          discounts,
        }
      }

      // Otherwise update the quantity
      const newItems = state.items.map((item) =>
        item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item,
      )
      const subtotal = calculateTotal(newItems)
      const discounts = { ...state.discounts }

      // Update volume discount applied flag based on new subtotal
      if (discounts.dealer) {
        discounts.dealer.volumeDiscountApplied =
          subtotal >= discounts.dealer.volumeDiscountThreshold
      }

      return {
        items: newItems,
        total: calculateDiscountedTotal(subtotal, discounts, newItems),
        discounts,
      }
    }

    case 'CLEAR_CART':
      return initialState

    case 'SET_DEALER_DISCOUNT':
      return {
        ...state,
        discounts: {
          ...state.discounts,
          dealer: action.payload,
        },
        total: calculateDiscountedTotal(
          calculateTotal(state.items),
          {
            ...state.discounts,
            dealer: action.payload,
          },
          state.items,
        ),
      }

    case 'SET_AFFILIATE_DISCOUNT':
      return {
        ...state,
        discounts: {
          ...state.discounts,
          affiliate: action.payload,
        },
        total: calculateDiscountedTotal(
          calculateTotal(state.items),
          {
            ...state.discounts,
            affiliate: action.payload,
          },
          state.items,
        ),
      }

    case 'SET_DISCOUNT_CODE':
      return {
        ...state,
        discounts: {
          ...state.discounts,
          discountCode: action.payload,
        },
        total: calculateDiscountedTotal(
          calculateTotal(state.items),
          {
            ...state.discounts,
            discountCode: action.payload,
          },
          state.items,
        ),
      }

    case 'CLEAR_DEALER_DISCOUNT':
      return {
        ...state,
        discounts: {
          ...state.discounts,
          dealer: undefined,
        },
        total: calculateDiscountedTotal(
          calculateTotal(state.items),
          {
            ...state.discounts,
            dealer: undefined,
          },
          state.items,
        ),
      }

    case 'CLEAR_DISCOUNTS':
      return {
        ...state,
        discounts: {},
        total: calculateTotal(state.items),
      }

    case 'CLEAR_DISCOUNT_CODE':
      return {
        ...state,
        discounts: {
          ...state.discounts,
          discountCode: undefined,
        },
        total: calculateDiscountedTotal(
          calculateTotal(state.items),
          {
            ...state.discounts,
            discountCode: undefined,
          },
          state.items,
        ),
      }

    default:
      return state
  }
}

const CartContext = createContext<{
  state: CartState
  addItem: (item: CartItem) => void
  removeItem: (id: string | number) => void
  updateQuantity: (id: string | number, quantity: number) => void
  clearCart: () => void
  isDrawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  setDealerDiscount: (discount: {
    percentage: number
    tierId: number
    tierName: string
    taxExempt: boolean
    volumeDiscountThreshold: number
    volumeDiscountPercentage: number
    volumeDiscountApplied: boolean
  }) => void
  setAffiliateDiscount: (discount: { code: string; percentage: number }) => void
  setDiscountCode: (discount: {
    code: string
    type: 'percentage' | 'fixed'
    amount: number
    applicableProducts?: (string | number)[]
  }) => void
  clearDiscounts: () => void
  clearDealerDiscount: () => void
  currentBulkDiscount: BulkDiscountLevel | null
  nextBulkDiscount: BulkDiscountLevel | null
  bulkDiscountProgress: number | null
  cartLoaded: boolean
  dispatch: React.Dispatch<CartAction>
  clearDiscountCode: () => void
} | null>(null)

export { CartContext }

function applyBulkDiscount(subtotal: number, bulkDiscount: BulkDiscountLevel | null): number {
  if (bulkDiscount) {
    const discount = Math.floor(subtotal * (bulkDiscount.discountPercent / 100) * 100) / 100
    return Math.floor((subtotal - discount) * 100) / 100
  }
  return subtotal
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const [bulkDiscountLevels, setBulkDiscountLevels] = useState<BulkDiscountLevel[]>([])
  const [currentBulkDiscount, setCurrentBulkDiscount] = useState<BulkDiscountLevel | null>(null)
  const [nextBulkDiscount, setNextBulkDiscount] = useState<BulkDiscountLevel | null>(null)
  const [bulkDiscountProgress, setBulkDiscountProgress] = useState<number | null>(null)
  const [total, setTotal] = useState(0)
  const [cartLoaded, setCartLoaded] = useState(false)
  const initialized = useRef(false)

  // Load cart from localStorage only once on mount
  useEffect(() => {
    if (!initialized.current) {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          dispatch({ type: 'LOAD_CART', payload: parsedCart })
        } catch (error) {
          console.error('Failed to parse cart from localStorage:', error)
        }
      }
      initialized.current = true
      setCartLoaded(true)
    }
  }, [])

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (initialized.current) {
      localStorage.setItem('cart', JSON.stringify(state))
    }
  }, [state])

  // Fetch bulk discount levels and calculate current/next/progress on every cart change
  useEffect(() => {
    async function updateBulkDiscounts() {
      const levels = await fetchBulkDiscountLevelsClient()
      setBulkDiscountLevels(levels)
      const subtotal = calculateTotal(state.items)
      let current: BulkDiscountLevel | null = null
      let next: BulkDiscountLevel | null = null
      for (let i = 0; i < levels.length; i++) {
        if (subtotal >= levels[i].threshold) current = levels[i]
        else {
          next = levels[i]
          break
        }
      }
      setCurrentBulkDiscount(current)
      setNextBulkDiscount(next)
      if (next && subtotal < next.threshold) {
        setBulkDiscountProgress(subtotal / next.threshold)
      } else {
        setBulkDiscountProgress(null)
      }
    }
    updateBulkDiscounts()
  }, [state.items])

  // Recalculate total on every cart or bulk discount change
  useEffect(() => {
    const subtotal = calculateTotal(state.items)
    const bulkDiscountedSubtotal = applyBulkDiscount(subtotal, currentBulkDiscount)

    // Apply all other discounts on top of bulk discount
    const finalTotal = calculateDiscountedTotal(
      bulkDiscountedSubtotal,
      state.discounts,
      state.items,
    )
    setTotal(finalTotal)
  }, [state.items, currentBulkDiscount, state.discounts])

  const addItem = React.useCallback((item: CartItem) => {
    dispatch({ type: 'SET_ITEM', payload: item })
  }, [])

  const removeItem = React.useCallback((id: string | number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id })
  }, [])

  const updateQuantity = React.useCallback((id: string | number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } })
  }, [])

  const clearCart = React.useCallback(() => {
    dispatch({ type: 'CLEAR_CART' })
  }, [])

  const setDealerDiscount = React.useCallback(
    (discount: {
      percentage: number
      tierId: number
      tierName: string
      taxExempt: boolean
      volumeDiscountThreshold: number
      volumeDiscountPercentage: number
      volumeDiscountApplied: boolean
    }) => {
      dispatch({ type: 'SET_DEALER_DISCOUNT', payload: discount })
    },
    [],
  )

  const setAffiliateDiscount = React.useCallback(
    (discount: { code: string; percentage: number }) => {
      dispatch({ type: 'SET_AFFILIATE_DISCOUNT', payload: discount })
    },
    [],
  )

  const setDiscountCode = React.useCallback(
    (discount: {
      code: string
      type: 'percentage' | 'fixed'
      amount: number
      applicableProducts?: (string | number)[]
    }) => {
      dispatch({ type: 'SET_DISCOUNT_CODE', payload: discount })
    },
    [],
  )

  const clearDiscounts = React.useCallback(() => {
    dispatch({ type: 'CLEAR_DISCOUNTS' })
  }, [])

  const clearDealerDiscount = React.useCallback(() => {
    dispatch({ type: 'CLEAR_DEALER_DISCOUNT' })
  }, [])

  const clearDiscountCode = React.useCallback(() => {
    dispatch({ type: 'CLEAR_DISCOUNT_CODE' })
  }, [])

  const value = React.useMemo(
    () => ({
      state: { ...state, total },
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isDrawerOpen,
      setDrawerOpen,
      setDealerDiscount,
      setAffiliateDiscount,
      setDiscountCode,
      clearDiscounts,
      clearDealerDiscount,
      currentBulkDiscount,
      nextBulkDiscount,
      bulkDiscountProgress,
      cartLoaded,
      dispatch,
      clearDiscountCode,
    }),
    [
      state,
      total,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isDrawerOpen,
      setDrawerOpen,
      setDealerDiscount,
      setAffiliateDiscount,
      setDiscountCode,
      clearDiscounts,
      clearDealerDiscount,
      currentBulkDiscount,
      nextBulkDiscount,
      bulkDiscountProgress,
      cartLoaded,
      dispatch,
      clearDiscountCode,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
