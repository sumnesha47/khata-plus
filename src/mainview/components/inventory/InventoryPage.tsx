import { useState, useEffect, useRef } from "react";
import type { Product, ProductForm, Category } from "../../types/pos";
import FocusTrap from "../FocusTrap";

const API_BASE = "http://localhost:3001/api";
const EMPTY_FORM: ProductForm = { name: "", price: 0, category: "", stock: 0, image: "", tax: 0, minStock: 0 };

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm({ ...form, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setForm({ ...form, image: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  async function fetchProducts() {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (res.ok) setProducts(await res.json());
    } catch {}
  }

  async function fetchCategories() {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (res.ok) setCategories(await res.json());
    } catch {}
  }

  function openAdd() {
    setForm({ ...EMPTY_FORM, category: categories[0]?.name || "" });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setForm({ name: p.name, price: p.price, category: p.category, stock: p.stock, image: p.image, tax: p.tax, minStock: p.minStock });
    setEditingId(p.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name) return;
    if (editingId) {
      await fetch(`${API_BASE}/products/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: crypto.randomUUID() }),
      });
    }
    setShowForm(false);
    fetchProducts();
  }

  async function handleDelete(id: string) {
    await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
    setDeleteConfirmId(null);
    fetchProducts();
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>📦</span> Inventory
        </h1>
        <div className="flex gap-2">
          <button
            onClick={openAdd}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Product
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200 bg-white">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <span className="text-4xl mb-2">📦</span>
            <p className="text-sm">No products found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-10"></th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Min</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Tax</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {p.image ? (
                        <img src={p.image} alt="" className="w-8 h-8 object-contain rounded" />
                      ) : (
                        <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded text-xs text-gray-400 font-bold">
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category}</td>
                    <td className="px-4 py-3 text-right font-mono">₹{p.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono font-medium ${p.minStock > 0 && p.stock <= p.minStock ? "text-red-600" : "text-gray-800"}`}>
                        {p.stock}
                      </span>
                      {p.minStock > 0 && p.stock <= p.minStock && <span className="ml-1 text-xs text-red-500">⚠️</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">{p.minStock}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">{p.tax}%</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800 mr-3 text-xs font-medium">Edit</button>
                      <button onClick={() => setDeleteConfirmId(p.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteConfirmId && (
        <FocusTrap onClose={() => setDeleteConfirmId(null)}>
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-80 mx-4 p-5">
              <h3 className="text-base font-bold text-gray-800 mb-2">Delete Product</h3>
              <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this product?</p>
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

      {showForm && (
        <FocusTrap onClose={() => setShowForm(false)}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editingId ? "Edit Product" : "Add Product"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Image</label>
                <div className="flex items-center gap-3">
                  {form.image ? (
                    <div className="relative">
                      <img src={form.image} alt="" className="w-14 h-14 object-contain rounded-lg border border-gray-200" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-red-400 text-white rounded-full text-xs hover:bg-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {form.image ? "Change" : "Upload"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              </div>
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm"
                >
                  {categories.length === 0 && <option value="">No categories</option>}
                  {categories.map((c) => <option key={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minStock}
                    onChange={(e) => setForm({ ...form, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tax (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.tax}
                  onChange={(e) => setForm({ ...form, tax: parseFloat(e.target.value) || 0 })}
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

    </div>
  );
}


