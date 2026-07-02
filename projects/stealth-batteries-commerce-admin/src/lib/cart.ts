import { CartItem } from '@/context/CartContext'

export const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => {
    const lineTotal = Math.floor(item.price * item.quantity * 100) / 100
    return Math.floor((total + lineTotal) * 100) / 100
  }, 0)
}
