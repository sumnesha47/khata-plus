import { useState } from "react";
import type { Transaction, CartItem, Party } from "../../types/pos";
import FocusTrap from "../FocusTrap";

function formatReceiptText(tx: Transaction, partyName?: string): string {
  const date = new Date(tx.timestamp);
  const dateStr = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const methodLabels: Record<string, string> = {
    cash: "Cash",
    paytm: "Paytm",
    paytm_business: "Paytm Business",
    credit: "Credit",
  };

  let text = "🏪 *Khata POS*\n";
  text += `Receipt #${tx.id.slice(0, 8).toUpperCase()}\n`;
  text += `${dateStr} ${timeStr}\n`;
  text += "──────────────────\n\n";

  for (const item of tx.items) {
    const lineTotal = item.product.price * item.quantity;
    text += `${item.product.name}\n`;
    text += `  ${item.quantity} × ₹${item.product.price.toFixed(2)} = ₹${lineTotal.toFixed(2)}\n`;
  }

  text += "\n──────────────────\n";
  text += `Subtotal: ₹${tx.subtotal.toFixed(2)}\n`;
  text += `Tax:      ₹${tx.tax.toFixed(2)}\n`;
  text += `*Total:   ₹${tx.total.toFixed(2)}*\n\n`;
  text += `Payment: ${methodLabels[tx.paymentMethod] || tx.paymentMethod}\n`;

  if (partyName) {
    text += `Party: ${partyName}\n`;
  }

  text += "\nThank you for your visit!";
  return text;
}

interface HistoryModalProps {
  transactions: Transaction[];
  parties: Party[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onPrint: (tx: Transaction) => void;
}

export default function HistoryModal({ transactions, parties, onClose, onDelete, onPrint }: HistoryModalProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function getPartyName(partyId?: string) {
    if (!partyId) return null;
    const party = parties.find((p) => p.id === partyId);
    return party?.name || "Unknown";
  }

  function shareWhatsApp(tx: Transaction) {
    const party = tx.partyId ? parties.find((p) => p.id === tx.partyId) : undefined;
    const partyName = party?.name;
    const text = formatReceiptText(tx, partyName);
    const phone = party?.phone ? party.phone.replace(/[^0-9]/g, "") : "";
    const url = phone
      ? `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`
      : `whatsapp://send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  return (
    <FocusTrap onClose={onClose}>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">📋 Transaction History</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-lg"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <span className="text-4xl mb-2">📋</span>
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...transactions].reverse().map((tx: Transaction) => (
                <div key={tx.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400 bg-gray-200 px-2 py-0.5 rounded">
                        {tx.id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(tx.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {tx.partyId && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          {getPartyName(tx.partyId)}
                        </span>
                      )}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        tx.paymentMethod === "credit"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {tx.paymentMethod}
                      </span>
                      <button
                        onClick={() => shareWhatsApp(tx)}
                        className="size-4 items-center justify-center rounded-sm hover:bg-green-100 text-green-600 text-sm"
                        title="Share on WhatsApp"
                      >
                        <svg fill="#16a34a" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>whatsapp</title> <path d="M26.576 5.363c-2.69-2.69-6.406-4.354-10.511-4.354-8.209 0-14.865 6.655-14.865 14.865 0 2.732 0.737 5.291 2.022 7.491l-0.038-0.070-2.109 7.702 7.879-2.067c2.051 1.139 4.498 1.809 7.102 1.809h0.006c8.209-0.003 14.862-6.659 14.862-14.868 0-4.103-1.662-7.817-4.349-10.507l0 0zM16.062 28.228h-0.005c-0 0-0.001 0-0.001 0-2.319 0-4.489-0.64-6.342-1.753l0.056 0.031-0.451-0.267-4.675 1.227 1.247-4.559-0.294-0.467c-1.185-1.862-1.889-4.131-1.889-6.565 0-6.822 5.531-12.353 12.353-12.353s12.353 5.531 12.353 12.353c0 6.822-5.53 12.353-12.353 12.353h-0zM22.838 18.977c-0.371-0.186-2.197-1.083-2.537-1.208-0.341-0.124-0.589-0.185-0.837 0.187-0.246 0.371-0.958 1.207-1.175 1.455-0.216 0.249-0.434 0.279-0.805 0.094-1.15-0.466-2.138-1.087-2.997-1.852l0.010 0.009c-0.799-0.74-1.484-1.587-2.037-2.521l-0.028-0.052c-0.216-0.371-0.023-0.572 0.162-0.757 0.167-0.166 0.372-0.434 0.557-0.65 0.146-0.179 0.271-0.384 0.366-0.604l0.006-0.017c0.043-0.087 0.068-0.188 0.068-0.296 0-0.131-0.037-0.253-0.101-0.357l0.002 0.003c-0.094-0.186-0.836-2.014-1.145-2.758-0.302-0.724-0.609-0.625-0.836-0.637-0.216-0.010-0.464-0.012-0.712-0.012-0.395 0.010-0.746 0.188-0.988 0.463l-0.001 0.002c-0.802 0.761-1.3 1.834-1.3 3.023 0 0.026 0 0.053 0.001 0.079l-0-0.004c0.131 1.467 0.681 2.784 1.527 3.857l-0.012-0.015c1.604 2.379 3.742 4.282 6.251 5.564l0.094 0.043c0.548 0.248 1.25 0.513 1.968 0.74l0.149 0.041c0.442 0.14 0.951 0.221 1.479 0.221 0.303 0 0.601-0.027 0.889-0.078l-0.031 0.004c1.069-0.223 1.956-0.868 2.497-1.749l0.009-0.017c0.165-0.366 0.261-0.793 0.261-1.242 0-0.185-0.016-0.366-0.047-0.542l0.003 0.019c-0.092-0.155-0.34-0.247-0.712-0.434z"></path> </g></svg>
                      </button>
                      <button
                        onClick={() => onPrint(tx)}
                        className="size-4 flex items-center justify-center rounded-sm hover:bg-blue-100 text-blue-600 text-sm"
                        title="Print"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-printer-icon lucide-printer"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
                      </button>
                      <button
                        onClick={() => setDeleteId(tx.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-100 text-red-500 text-sm"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {tx.items.map((item: CartItem) => (
                      <div key={item.product.id} className="flex justify-between">
                        <span>
                          {(() => {
                            const p = item.product as unknown as Record<string, string>;
                            const src = p.image || p.emoji || "";
                            return src ? (
                              <img src={src} alt="" className="w-5 h-5 object-contain inline-block mr-1 -mt-0.5" />
                            ) : (
                              <span className="w-5 h-5 inline-flex items-center justify-center bg-gray-200 rounded text-[9px] text-gray-500 font-bold mr-1">
                                {p.name.charAt(0)}
                              </span>
                            );
                          })()}
                          {item.product.name} × {item.quantity}
                        </span>
                        <span>₹{(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold text-gray-800 pt-2 mt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>₹{tx.total.toFixed(2)}</span>
                  </div>
                  {tx.partyId && tx.paymentMethod === "credit" && (
                    <div className="flex justify-between text-xs text-orange-600 font-medium pt-1">
                      <span>Added to balance</span>
                      <span>+₹{tx.total.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {deleteId && (
        <FocusTrap onClose={() => setDeleteId(null)}>
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-80 mx-4 p-5">
            <h3 className="text-base font-bold text-gray-800 mb-2">Delete Transaction</h3>
            <p className="text-sm text-gray-600 mb-4">This will also revert stock and party balance. Are you sure?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(deleteId);
                  setDeleteId(null);
                }}
                className="flex-1 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
        </FocusTrap>
      )}
    </div>
    </FocusTrap>
  );
}
