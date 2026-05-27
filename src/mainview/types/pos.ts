export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  tax: number;
  minStock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = "cash" | "paytm" | "paytm_business" | "credit";

export interface Transaction {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  timestamp: number;
  partyId?: string;
}

export interface DailyRevenue {
  day: string;
  revenue: number;
  count: number;
}

export interface TopProduct {
  name: string;
  image: string;
  quantity: number;
  revenue: number;
}

export interface ProductForm {
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  tax: number;
  minStock: number;
}

export interface Party {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface PartyPayment {
  id: string;
  partyId: string;
  amount: number;
  note: string;
  timestamp: number;
}

export interface LedgerEntry {
  type: "sale" | "payment";
  id: string;
  amount: number;
  timestamp: number;
  items?: CartItem[];
  note?: string;
  paymentMethod?: PaymentMethod;
}
