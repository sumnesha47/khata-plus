import { useState } from "react";
import FocusTrap from "./FocusTrap";

const API_BASE = "http://localhost:3001/api";

interface BusinessData {
  name: string;
  address: string;
  phone: string;
  gst: string;
}

interface BusinessSetupModalProps {
  initial: BusinessData;
  onSave: (data: BusinessData) => void;
  onClose?: () => void;
}

export default function BusinessSetupModal({ initial, onSave, onClose }: BusinessSetupModalProps) {
  const [name, setName] = useState(initial.name);
  const [address, setAddress] = useState(initial.address);
  const [phone, setPhone] = useState(initial.phone);
  const [gst, setGst] = useState(initial.gst);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/business`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), address: address.trim(), phone: phone.trim(), gst: gst.trim() }),
      });
      onSave({ name: name.trim(), address: address.trim(), phone: phone.trim(), gst: gst.trim() });
    } catch {}
    setSaving(false);
  }

  return (
    <FocusTrap onClose={onClose || (() => {})}>
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">🏪 Business Details</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-lg"
            >
              ✕
            </button>
          )}
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Business Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your business name"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city, etc."
              rows={2}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contact number"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">GST Number</label>
            <input
              value={gst}
              onChange={(e) => setGst(e.target.value)}
              placeholder="GSTIN (optional)"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
    </FocusTrap>
  );
}
