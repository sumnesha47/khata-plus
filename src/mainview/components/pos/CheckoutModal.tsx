import { useState } from "react";
import type { CartItem, PaymentMethod, Party } from "../../types/pos";
import FocusTrap from "../FocusTrap";

interface CheckoutModalProps {
  items: CartItem[];
  parties: Party[];
  onClose: () => void;
  onComplete: (method: PaymentMethod, partyId?: string) => void;
}

export default function CheckoutModal({ items, parties, onClose, onComplete }: CheckoutModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [partyId, setPartyId] = useState("");

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity * (item.product.tax || 0) / 100,
    0
  );
  const total = subtotal + tax;

  const methods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: "cash", label: "Cash", icon: "💵" },
    { value: "paytm", label: "Paytm", icon: "💳" },
    { value: "paytm_business", label: "Paytm Business", icon: "📱" },
    { value: "credit", label: "Credit", icon: "📝" },
  ];

  const selectedParty = parties.find((p) => p.id === partyId);

  return (
    <FocusTrap onClose={onClose}>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Complete Sale</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-lg"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-60 overflow-y-auto">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {item.product.image ? (
                  <img src={item.product.image} alt="" className="w-6 h-6 object-contain rounded" />
                ) : (
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-[10px] text-gray-400 font-bold">
                    {item.product.name.charAt(0)}
                  </span>
                )}
                <span className="text-gray-700">
                  {item.product.name} × {item.quantity}
                </span>
              </span>
              <span className="font-medium text-gray-800">
                ₹{(item.product.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="px-5 pb-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="px-5 pb-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Payment Method</p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {methods.map((m) => (
              <button
                key={m.value}
                onClick={() => setMethod(m.value)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                  method === m.value
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                }`}
              >
                <span className="text-xl">{m.icon}</span>
                <span className="text-xs font-medium">{m.label}</span>
              </button>
            ))}
          </div>

          {method === "credit" && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Select Party</label>
              <select
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a party --</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.phone ? `(${p.phone})` : ""}
                  </option>
                ))}
              </select>
              {selectedParty && (
                <div className="mt-2 space-y-1 text-xs">
                  {selectedParty.balance > 0 ? (
                    <p className="text-orange-600">
                      Outstanding: ₹{selectedParty.balance.toFixed(2)}
                    </p>
                  ) : selectedParty.balance < 0 ? (
                    <>
                      <p className="text-green-600 font-medium">
                        Available credit: ₹{Math.abs(selectedParty.balance).toFixed(2)}
                      </p>
                      <p className="text-gray-500">
                        {total <= Math.abs(selectedParty.balance)
                          ? "This purchase will be fully covered by credit."
                          : `₹${Math.abs(selectedParty.balance).toFixed(2)} credit will apply, ₹${(total - Math.abs(selectedParty.balance)).toFixed(2)} added to balance.`
                        }
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500">No outstanding balance</p>
                  )}
                  {selectedParty.balance < 0 && (
                    <div className="flex justify-between font-medium pt-1 border-t border-gray-100 mt-1">
                      <span>Amount added to balance:</span>
                      <span className={total <= Math.abs(selectedParty.balance) ? "text-green-600" : "text-orange-600"}>
                        ₹{Math.max(0, total - Math.abs(selectedParty.balance)).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              if (method === "credit" && !partyId) {
                alert("Please select a party for credit sale");
                return;
              }
              onComplete(method, partyId || undefined);
            }}
            disabled={method === "credit" && !partyId}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors active:scale-[0.98] text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Sale — ₹{total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
    </FocusTrap>
  );
}
