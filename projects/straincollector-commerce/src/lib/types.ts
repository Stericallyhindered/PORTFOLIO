// ─── Product Types ────────────────────────────────────────────
export type ProductCategory = "fresh_snip" | "rooted_clone";

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  image_url: string;
  in_stock: boolean;
  created_at: string;
}

// ─── Cart Types ──────────────────────────────────────────────
export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  category: ProductCategory;
  image_url: string;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
}

// ─── Pricing Types ───────────────────────────────────────────
export interface PricingTier {
  minQty: number;
  maxQty: number | null;
  pricePerUnit: number;
  label: string;
}

export interface CartPricingSummary {
  freshSnipItems: CartItem[];
  rootedCloneItems: CartItem[];
  freshSnipTotal: number;
  rootedCloneTotal: number;
  freshSnipQty: number;
  rootedCloneQty: number;
  rootedCloneUnitPrice: number;
  subtotal: number;
  shipping: number;
  total: number;
}

// ─── Order Types ─────────────────────────────────────────────
export type OrderStatus =
  | "pending"
  | "label_created"
  | "shipped"
  | "completed"
  | "cancelled";

export interface ShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Order {
  id: string;
  order_number: number;
  status: OrderStatus;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: ShippingAddress;
  notes: string | null;
  instagram: string | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shippo_label_url: string | null;
  shippo_tracking_number: string | null;
  shippo_tracking_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  category: ProductCategory;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

// ─── Checkout Types ──────────────────────────────────────────
export interface CheckoutFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  instagram: string;
  notes: string;
}

export interface CheckoutPayload extends CheckoutFormData {
  items: CartItem[];
  pricing: CartPricingSummary;
}

// ─── API Response Types ──────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CheckoutResponse {
  orderId: string;
  orderNumber: number;
  trackingNumber: string | null;
  trackingUrl: string | null;
  labelUrl: string | null;
}
