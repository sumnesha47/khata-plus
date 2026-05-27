import { useState, useEffect } from "react";
import type { Party, Transaction, CartItem, PartyPayment, LedgerEntry } from "../../types/pos";
import FocusTrap from "../FocusTrap";

const API_BASE = "http://localhost:3001/api";

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [search, setSearch] = useState("");
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [partyTransactions, setPartyTransactions] = useState<Transaction[]>([]);
  const [partyPayments, setPartyPayments] = useState<PartyPayment[]>([]);
  const [showLedger, setShowLedger] = useState(false);

  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: 0, note: "" });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [payingParty, setPayingParty] = useState<Party | null>(null);

  useEffect(() => { fetchParties(); }, []);

  async function fetchParties() {
    try {
      const res = await fetch(`${API_BASE}/parties`);
      if (res.ok) setParties(await res.json());
    } catch {}
  }

  async function fetchPartyTransactions(partyId: string) {
    try {
      const res = await fetch(`${API_BASE}/parties/${partyId}/transactions`);
      if (res.ok) setPartyTransactions(await res.json());
    } catch {}
  }

  async function fetchPartyPayments(partyId: string) {
    try {
      const res = await fetch(`${API_BASE}/parties/${partyId}/payments`);
      if (res.ok) setPartyPayments(await res.json());
    } catch {}
  }

  function openAdd() {
    setForm({ name: "", phone: "", address: "" });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(p: Party) {
    setForm({ name: p.name, phone: p.phone, address: p.address });
    setEditingId(p.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name) return;
    if (editingId) {
      await fetch(`${API_BASE}/parties/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch(`${API_BASE}/parties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: crypto.randomUUID() }),
      });
    }
    setShowForm(false);
    fetchParties();
  }

  async function handleDelete(id: string) {
    await fetch(`${API_BASE}/parties/${id}`, { method: "DELETE" });
    setDeleteConfirmId(null);
    fetchParties();
  }

  function openPayModal(party: Party) {
    setPayingParty(party);
    setPayForm({ amount: 0, note: "" });
    setShowPayModal(true);
  }

  async function handlePay() {
    if (!payingParty || payForm.amount <= 0) return;
    try {
      const res = await fetch(`${API_BASE}/parties/${payingParty.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: payForm.amount, note: payForm.note }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Payment failed");
        return;
      }
      setShowPayModal(false);
      fetchParties();
    } catch {
      alert("Payment failed: server not available");
    }
  }

  function viewLedger(party: Party) {
    setSelectedParty(party);
    fetchPartyTransactions(party.id);
    fetchPartyPayments(party.id);
    setShowLedger(true);
  }

  const filtered = parties.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function buildLedger(): LedgerEntry[] {
    const entries: LedgerEntry[] = [];
    for (const tx of partyTransactions) {
      entries.push({
        type: "sale",
        id: tx.id,
        amount: tx.total,
        timestamp: tx.timestamp,
        items: tx.items,
        paymentMethod: tx.paymentMethod,
      });
    }
    for (const pmt of partyPayments) {
      entries.push({
        type: "payment",
        id: pmt.id,
        amount: pmt.amount,
        timestamp: pmt.timestamp,
        note: pmt.note,
      });
    }
    entries.sort((a, b) => b.timestamp - a.timestamp);
    return entries;
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>👥</span> Parties
        </h1>
        <button
          onClick={openAdd}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Party
        </button>
      </div>

      <div className="p-4 border-b border-gray-200 bg-white">
        <input
          type="text"
          placeholder="Search parties..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <span className="text-4xl mb-2">👥</span>
            <p className="text-sm">No parties found</p>
            <p className="text-xs text-gray-300 mt-1">Add a party to start credit sales</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((party) => (
              <div
                key={party.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{party.name}</h3>
                    {party.phone && (
                      <p className="text-xs text-gray-500 mt-0.5">{party.phone}</p>
                    )}
                    {party.address && (
                      <p className="text-xs text-gray-400 mt-0.5">{party.address}</p>
                    )}
                  </div>
                  <span className={`text-sm font-bold ${
                    party.balance > 0 ? "text-orange-600" : "text-green-600"
                  }`}>
                    {party.balance < 0 ? "Credit: " : ""}₹{Math.abs(party.balance).toFixed(2)}
                    {party.balance < 0 && <span className="text-xs font-normal ml-0.5">cr</span>}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => viewLedger(party)}
                    className="flex-1 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Ledger
                  </button>
                  <button
                    onClick={() => openPayModal(party)}
                    className="flex-1 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    {party.balance < 0 ? "Deposit" : "Receive ₹"}
                  </button>
                  <button
                    onClick={() => openEdit(party)}
                    className="py-1.5 px-3 text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(party.id)}
                    className="py-1.5 px-3 text-xs font-medium text-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <FocusTrap onClose={() => setShowForm(false)}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editingId ? "Edit Party" : "Add Party"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
        </FocusTrap>
      )}

      {deleteConfirmId && (
        <FocusTrap onClose={() => setDeleteConfirmId(null)}>
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-80 mx-4 p-5">
            <h3 className="text-base font-bold text-gray-800 mb-2">Delete Party</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this party?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
        </FocusTrap>
      )}

      {showPayModal && payingParty && (
        <FocusTrap onClose={() => setShowPayModal(false)}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                {payingParty.balance < 0 ? "Deposit Payment - " : "Receive Payment - "}{payingParty.name}
              </h2>
              <button
                onClick={() => setShowPayModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-lg"
              >
                ✕
              </button>
            </div>
            {payingParty.balance > 0 ? (
              <p className="text-sm text-gray-500 mb-4">
                Outstanding balance: <span className="font-bold text-orange-600">₹{payingParty.balance.toFixed(2)}</span>
              </p>
            ) : payingParty.balance < 0 ? (
              <p className="text-sm text-gray-500 mb-4">
                Available credit: <span className="font-bold text-green-600">₹{Math.abs(payingParty.balance).toFixed(2)}</span>
                <span className="block text-xs text-gray-400 mt-0.5">Extra payment will add to available credit for future purchases</span>
              </p>
            ) : (
              <p className="text-sm text-gray-500 mb-4">
                No outstanding balance
                <span className="block text-xs text-gray-400 mt-0.5">Payment will be held as credit for future purchases</span>
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={payForm.note}
                  onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                  placeholder="e.g. Cash payment"
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowPayModal(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handlePay}
                disabled={payForm.amount <= 0}
                className="flex-1 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {payingParty.balance < 0 ? "Deposit" : "Receive"} ₹{payForm.amount.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
        </FocusTrap>
      )}

      {showLedger && selectedParty && (
        <FocusTrap onClose={() => setShowLedger(false)}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  📒 {selectedParty.name} - Ledger
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Phone: {selectedParty.phone || "N/A"} | Address: {selectedParty.address || "N/A"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${selectedParty.balance > 0 ? "text-orange-600" : "text-green-600"}`}>
                  {selectedParty.balance < 0 ? "Credit: " : "Balance: "}₹{Math.abs(selectedParty.balance).toFixed(2)}
                </span>
                <button
                  onClick={() => setShowLedger(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {buildLedger().length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <span className="text-4xl mb-2">📒</span>
                  <p className="text-sm">No ledger entries yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {buildLedger().map((entry) => (
                    <div key={entry.type + entry.id} className={`p-4 rounded-xl border ${
                      entry.type === "payment"
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          entry.type === "payment"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}>
                          {entry.type === "payment" ? "Payment Received" : entry.paymentMethod}
                        </span>
                      </div>
                      {entry.type === "sale" && entry.items && (
                        <div className="text-sm text-gray-600 space-y-1">
                          {entry.items.map((item: CartItem) => (
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
                      )}
                      {entry.type === "payment" && entry.note && (
                        <p className="text-sm text-gray-500 mb-1">{entry.note}</p>
                      )}
                      <div className={`flex justify-between font-bold pt-2 mt-2 border-t ${
                        entry.type === "payment"
                          ? "border-green-200 text-green-700"
                          : "border-gray-200 text-gray-800"
                      }`}>
                        <span>{entry.type === "payment" ? "Payment" : "Total"}</span>
                        <span>₹{entry.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        </FocusTrap>
      )}
    </div>
  );
}
