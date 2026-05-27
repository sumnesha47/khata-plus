import { useState, useEffect } from "react";
import type { Product, CartItem, PaymentMethod, Transaction, Party } from "../../types/pos";
import ProductGrid from "./ProductGrid";
import Cart from "./Cart";
import CheckoutModal from "./CheckoutModal";
import ReceiptModal from "./ReceiptModal";
import HistoryModal from "./HistoryModal";

const API_BASE = "http://localhost:3001/api";

interface POSLayoutProps {
  business: { name: string; address: string; phone: string; gst: string };
}

export default function POSLayout({ business }: POSLayoutProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState<Transaction | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [parties, setParties] = useState<Party[]>([]);

  useEffect(() => {
    fetchTransactions();
    fetchProducts();
    fetchParties();
  }, []);

  const categories = [...new Set(products.map((p) => p.category))];

  async function fetchProducts() {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch {}
  }

  async function fetchTransactions() {
    try {
      const res = await fetch(`${API_BASE}/transactions`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch {}
  }

  async function fetchParties() {
    try {
      const res = await fetch(`${API_BASE}/parties`);
      if (res.ok) {
        const data = await res.json();
        setParties(data);
      }
    } catch {}
  }

  async function addToCart(product: Product) {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(productId: string) {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  }

  async function handleCheckoutComplete(method: PaymentMethod, partyId?: string) {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const tax = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity * (item.product.tax || 0) / 100,
      0
    );
    const total = subtotal + tax;

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      items: cartItems,
      subtotal,
      tax,
      total,
      paymentMethod: method,
      timestamp: Date.now(),
      partyId,
    };

    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Checkout failed");
        return;
      }
      fetchProducts();
      fetchParties();
    } catch {}

    setTransactions((prev) => [...prev, transaction]);
    setCartItems([]);
    setShowCheckout(false);
    setShowReceipt(transaction);
  }

  async function handleDeleteTransaction(id: string) {
    try {
      await fetch(`${API_BASE}/transactions/${id}`, { method: "DELETE" });
      fetchParties();
    } catch {}
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏪</span>
          <h2 className="text-base font-bold text-gray-800">Point of Sale</h2>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <span>📋</span>
          History
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1">
          <ProductGrid products={products} categories={categories} onAddToCart={addToCart} />
        </div>
        <div className="w-80 lg:w-96 border-l border-gray-200 flex-shrink-0">
          <Cart
            items={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemove={removeFromCart}
            onCheckout={() => setShowCheckout(true)}
          />
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal
          items={cartItems}
          parties={parties}
          onClose={() => setShowCheckout(false)}
          onComplete={handleCheckoutComplete}
        />
      )}

      {showReceipt && (
        <ReceiptModal
          transaction={showReceipt}
          party={parties.find((p) => p.id === showReceipt.partyId)}
          business={business}
          onClose={() => setShowReceipt(null)}
        />
      )}

      {showHistory && (
        <HistoryModal
          transactions={transactions}
          parties={parties}
          onClose={() => setShowHistory(false)}
          onDelete={handleDeleteTransaction}
          onPrint={(tx) => { setShowHistory(false); setShowReceipt(tx); }}
        />
      )}
    </div>
  );
}
