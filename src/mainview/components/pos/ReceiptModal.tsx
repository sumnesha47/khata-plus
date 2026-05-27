import { useCallback } from "react";
import type { Transaction, Party } from "../../types/pos";
import FocusTrap from "../FocusTrap";

function getReceiptHtml(transaction: Transaction, business: { name: string; address: string; phone: string; gst: string }, party?: Party): string {
  const date = new Date(transaction.timestamp);
  const dateStr = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const methodLabels: Record<string, string> = {
    cash: "Cash",
    paytm: "Paytm",
    paytm_business: "Paytm Business",
    credit: "Credit",
  };

  const itemsHtml = transaction.items.map((item) => {
    const lineTotal = item.product.price * item.quantity;
    return `<tr>
      <td style="padding:4px 0;font-size:12px;color:#333">${item.product.name}</td>
      <td style="padding:4px 0;font-size:12px;text-align:center;color:#333">${item.quantity}</td>
      <td style="padding:4px 0;font-size:12px;text-align:right;color:#666">₹${item.product.price.toFixed(2)}</td>
      <td style="padding:4px 0;font-size:12px;text-align:right;color:#333;font-weight:600">₹${lineTotal.toFixed(2)}</td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { margin: 0; size: 80mm auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    width: 80mm;
    padding: 4mm 3mm;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .center { text-align: center; }
  .border-b { border-bottom: 1px dashed #ccc; padding-bottom: 4mm; margin-bottom: 4mm; }
  .flex { display: flex; justify-content: space-between; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; padding: 4px 0; font-size: 11px; color: #666; border-bottom: 1px solid #ccc; }
  th.r, td.r { text-align: right; }
  th.c, td.c { text-align: center; }
  .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; padding-top: 4px; border-top: 1px solid #333; }
  .meta { font-size: 11px; color: #666; margin-top: 4mm; padding-top: 4mm; border-top: 1px dashed #ccc; }
  .thankyou { text-align: center; font-size: 11px; color: #999; margin-top: 4mm; padding-top: 4mm; border-top: 1px dashed #ccc; }
  .items { width: 100%; }
</style>
</head>
<body>
  <div class="center border-b">
    <div style="font-size:16px;font-weight:bold;color:#333">${business.name}</div>
    ${business.address ? `<div style="font-size:11px;color:#666">${business.address}</div>` : ""}
    ${business.phone ? `<div style="font-size:11px;color:#666">Tel: ${business.phone}</div>` : ""}
    ${business.gst ? `<div style="font-size:11px;color:#666">GST: ${business.gst}</div>` : ""}
    <div style="font-size:10px;color:#999;margin-top:2mm">Receipt</div>
  </div>

  <div class="flex" style="font-size:11px;color:#666;margin-bottom:4mm">
    <span>#${transaction.id.slice(0, 8).toUpperCase()}</span>
    <span>${dateStr} ${timeStr}</span>
  </div>

  <table>
    <thead>
      <tr><th>Item</th><th class="c">Qty</th><th class="r">Price</th><th class="r">Total</th></tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div style="margin-top:4mm">
    <div class="flex" style="font-size:12px;color:#666"><span>Subtotal</span><span>₹${transaction.subtotal.toFixed(2)}</span></div>
    <div class="flex" style="font-size:12px;color:#666"><span>Tax</span><span>₹${transaction.tax.toFixed(2)}</span></div>
    <div class="total-row"><span>Total</span><span>₹${transaction.total.toFixed(2)}</span></div>
  </div>

  <div class="meta">
    <div class="flex"><span>Payment</span><span style="font-weight:600;color:#333">${methodLabels[transaction.paymentMethod] || transaction.paymentMethod}</span></div>
    ${party ? `<div class="flex" style="margin-top:2mm"><span>Party</span><span style="font-weight:600;color:#333">${party.name}</span></div>` : ""}
  </div>

  <div class="thankyou">Thank you for your visit!</div>
</body>
</html>`;
}

function formatReceiptText(transaction: Transaction, businessName: string, party?: Party): string {
  const date = new Date(transaction.timestamp);
  const dateStr = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const methodLabels: Record<string, string> = {
    cash: "Cash",
    paytm: "Paytm",
    paytm_business: "Paytm Business",
    credit: "Credit",
  };

  let text = `🏪 *${businessName}*\n`;
  text += `Receipt #${transaction.id.slice(0, 8).toUpperCase()}\n`;
  text += `${dateStr} ${timeStr}\n`;
  text += "──────────────────\n\n";

  for (const item of transaction.items) {
    const lineTotal = item.product.price * item.quantity;
    text += `${item.product.name}\n`;
    text += `  ${item.quantity} × ₹${item.product.price.toFixed(2)} = ₹${lineTotal.toFixed(2)}\n`;
  }

  text += "\n──────────────────\n";
  text += `Subtotal: ₹${transaction.subtotal.toFixed(2)}\n`;
  text += `Tax:      ₹${transaction.tax.toFixed(2)}\n`;
  text += `*Total:   ₹${transaction.total.toFixed(2)}*\n\n`;
  text += `Payment: ${methodLabels[transaction.paymentMethod] || transaction.paymentMethod}\n`;

  if (party) {
    text += `Party: ${party.name}\n`;
  }

  text += "\nThank you for your visit!";
  return text;
}

interface ReceiptModalProps {
  transaction: Transaction;
  party?: Party;
  business: { name: string; address: string; phone: string; gst: string };
  onClose: () => void;
}

export default function ReceiptModal({ transaction, party, business, onClose }: ReceiptModalProps) {
  const date = new Date(transaction.timestamp);
  const dateStr = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const methodLabels: Record<string, string> = {
    cash: "Cash",
    paytm: "Paytm",
    paytm_business: "Paytm Business",
    credit: "Credit",
  };

  const shareWhatsApp = useCallback(() => {
    const text = formatReceiptText(transaction, business.name, party);
    const phone = party?.phone ? party.phone.replace(/[^0-9]/g, "") : "";
    const url = phone
      ? `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`
      : `whatsapp://send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }, [transaction, party, business.name]);

  return (
    <FocusTrap onClose={onClose}>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:bg-white print:z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden print:rounded-none print:shadow-none print:max-w-none print:mx-0 print:w-[80mm]">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between print:hidden">
          <h2 className="text-lg font-bold text-gray-800">Receipt</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={shareWhatsApp}
              className="px-4 py-2 border border-green-600 [&_svg]:size-4 flex items-center justify-center gap-2 bg-transparent text-green-600 text-sm font-semibold rounded-lg hover:bg-green-200 transition-colors"
            >
              <svg fill="#16a34a" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>whatsapp</title> <path d="M26.576 5.363c-2.69-2.69-6.406-4.354-10.511-4.354-8.209 0-14.865 6.655-14.865 14.865 0 2.732 0.737 5.291 2.022 7.491l-0.038-0.070-2.109 7.702 7.879-2.067c2.051 1.139 4.498 1.809 7.102 1.809h0.006c8.209-0.003 14.862-6.659 14.862-14.868 0-4.103-1.662-7.817-4.349-10.507l0 0zM16.062 28.228h-0.005c-0 0-0.001 0-0.001 0-2.319 0-4.489-0.64-6.342-1.753l0.056 0.031-0.451-0.267-4.675 1.227 1.247-4.559-0.294-0.467c-1.185-1.862-1.889-4.131-1.889-6.565 0-6.822 5.531-12.353 12.353-12.353s12.353 5.531 12.353 12.353c0 6.822-5.53 12.353-12.353 12.353h-0zM22.838 18.977c-0.371-0.186-2.197-1.083-2.537-1.208-0.341-0.124-0.589-0.185-0.837 0.187-0.246 0.371-0.958 1.207-1.175 1.455-0.216 0.249-0.434 0.279-0.805 0.094-1.15-0.466-2.138-1.087-2.997-1.852l0.010 0.009c-0.799-0.74-1.484-1.587-2.037-2.521l-0.028-0.052c-0.216-0.371-0.023-0.572 0.162-0.757 0.167-0.166 0.372-0.434 0.557-0.65 0.146-0.179 0.271-0.384 0.366-0.604l0.006-0.017c0.043-0.087 0.068-0.188 0.068-0.296 0-0.131-0.037-0.253-0.101-0.357l0.002 0.003c-0.094-0.186-0.836-2.014-1.145-2.758-0.302-0.724-0.609-0.625-0.836-0.637-0.216-0.010-0.464-0.012-0.712-0.012-0.395 0.010-0.746 0.188-0.988 0.463l-0.001 0.002c-0.802 0.761-1.3 1.834-1.3 3.023 0 0.026 0 0.053 0.001 0.079l-0-0.004c0.131 1.467 0.681 2.784 1.527 3.857l-0.012-0.015c1.604 2.379 3.742 4.282 6.251 5.564l0.094 0.043c0.548 0.248 1.25 0.513 1.968 0.74l0.149 0.041c0.442 0.14 0.951 0.221 1.479 0.221 0.303 0 0.601-0.027 0.889-0.078l-0.031 0.004c1.069-0.223 1.956-0.868 2.497-1.749l0.009-0.017c0.165-0.366 0.261-0.793 0.261-1.242 0-0.185-0.016-0.366-0.047-0.542l0.003 0.019c-0.092-0.155-0.34-0.247-0.712-0.434z"></path> </g></svg> Share
            </button>
            <button
              onClick={() => {
                const html = getReceiptHtml(transaction, business, party);
                const win = window.open("", "print-receipt", "width=400,height=600,menubar=no,toolbar=no,location=no,status=no");
                if (win) {
                  const doc = win.document;
                  doc.open();
                  doc.write(html);
                  doc.close();
                  win.focus();
                  requestAnimationFrame(() => win.print());
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg [&_svg]:size-4 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-printer-icon lucide-printer"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg> Print
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4 print:p-3 print:space-y-2 text-sm">
          <div className="text-center border-b border-gray-300 pb-3 print:pb-2">
            <h1 className="text-lg font-bold text-gray-800 print:text-base">{business.name}</h1>
            {business.address && <p className="text-xs text-gray-500">{business.address}</p>}
            {business.phone && <p className="text-xs text-gray-500">Tel: {business.phone}</p>}
            {business.gst && <p className="text-xs text-gray-500">GST: {business.gst}</p>}
            <p className="text-xs text-gray-400 mt-1">Receipt</p>
          </div>

          <div className="flex justify-between text-xs text-gray-600">
            <span>#{transaction.id.slice(0, 8).toUpperCase()}</span>
            <span>{dateStr} {timeStr}</span>
          </div>

          <table className="w-full text-xs print:text-[10px]">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1 font-medium text-gray-600">Item</th>
                <th className="text-center py-1 font-medium text-gray-600">Qty</th>
                <th className="text-right py-1 font-medium text-gray-600">Price</th>
                <th className="text-right py-1 font-medium text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              {transaction.items.map((item) => (
                <tr key={item.product.id} className="border-b border-gray-200">
                  <td className="py-1.5 text-gray-800">{item.product.name}</td>
                  <td className="text-center py-1.5 text-gray-800">{item.quantity}</td>
                  <td className="text-right py-1.5 text-gray-600">₹{item.product.price.toFixed(2)}</td>
                  <td className="text-right py-1.5 text-gray-800 font-medium">
                    ₹{(item.product.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1 text-sm print:text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{transaction.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>₹{transaction.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-800 pt-2 border-t border-gray-300 print:text-sm">
              <span>Total</span>
              <span>₹{transaction.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-2 space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Payment</span>
              <span className="font-medium text-gray-800">{methodLabels[transaction.paymentMethod] || transaction.paymentMethod}</span>
            </div>
            {party && (
              <div className="flex justify-between">
                <span>Party</span>
                <span className="font-medium text-gray-800">{party.name}</span>
              </div>
            )}
          </div>

          <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-300 print:pt-1">
            <p>Thank you for your visit!</p>
          </div>
        </div>
      </div>
    </div>
    </FocusTrap>
  );
}
