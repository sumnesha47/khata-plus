import type { CartItem } from "../../types/pos";

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
}

export default function Cart({ items, onUpdateQuantity, onRemove, onCheckout }: CartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity * (item.product.tax || 0) / 100,
    0
  );
  const total = subtotal + tax;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          🛒 Cart
          {items.length > 0 && (
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
              {items.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          )}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <span className="text-4xl mb-2">🛒</span>
            <p className="text-sm">Cart is empty</p>
            <p className="text-xs text-gray-300 mt-1">Click products to add them</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg"
            >
              {item.product.image ? (
                <img src={item.product.image} alt="" className="w-9 h-9 object-contain rounded" />
              ) : (
                <span className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded text-xs text-gray-400 font-bold">
                  {item.product.name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.product.name}</p>
                <p className="text-xs text-gray-500">₹{item.product.price.toFixed(2)} each</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateQuantity(item.product.id, -1)}
                  className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded-md text-gray-600 hover:bg-gray-300 text-sm font-bold"
                >
                  −
                </button>
                <span className="w-7 text-center text-sm font-medium text-gray-800">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.product.id, 1)}
                  className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded-md text-gray-600 hover:bg-gray-300 text-sm font-bold"
                >
                  +
                </button>
              </div>
              <div className="text-right min-w-[60px]">
                <p className="text-sm font-bold text-gray-800">
                  ₹{(item.product.price * item.quantity).toFixed(2)}
                </p>
                <button
                  onClick={() => onRemove(item.product.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="p-4 border-t border-gray-200 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-800 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <button
            onClick={onCheckout}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors active:scale-[0.98]"
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  );
}
