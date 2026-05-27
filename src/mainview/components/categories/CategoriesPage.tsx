import { useState, useEffect } from "react";
import type { Category, Product } from "../../types/pos";
import FocusTrap from "../FocusTrap";

const API_BASE = "http://localhost:3001/api";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "" });
  const [search, setSearch] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => { fetchCategories(); fetchProducts(); }, []);

  async function fetchCategories() {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (res.ok) setCategories(await res.json());
    } catch {}
  }

  async function fetchProducts() {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (res.ok) setProducts(await res.json());
    } catch {}
  }

  function openAdd() {
    setForm({ name: "" });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(c: Category) {
    setForm({ name: c.name });
    setEditingId(c.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name) return;
    if (editingId) {
      await fetch(`${API_BASE}/categories/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch(`${API_BASE}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: crypto.randomUUID() }),
      });
    }
    setShowForm(false);
    fetchCategories();
  }

  async function handleDelete(id: string) {
    await fetch(`${API_BASE}/categories/${id}`, { method: "DELETE" });
    setDeleteConfirmId(null);
    fetchCategories();
  }

  function productCount(name: string) {
    return products.filter((p) => p.category === name).length;
  }

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>🏷️</span> Categories
        </h1>
        <button
          onClick={openAdd}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Category
        </button>
      </div>

      <div className="p-4 border-b border-gray-200 bg-white">
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <span className="text-4xl mb-2">🏷️</span>
            <p className="text-sm">No categories found</p>
            <p className="text-xs text-gray-300 mt-1">Add a category to organize your products</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Products</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                        {productCount(c.name)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(c)} className="text-blue-600 hover:text-blue-800 mr-3 text-xs font-medium">Edit</button>
                      <button onClick={() => setDeleteConfirmId(c.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <FocusTrap onClose={() => setShowForm(false)}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editingId ? "Rename Category" : "Add Category"}
            </h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ name: e.target.value })}
                placeholder="Category name"
                className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
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
                {editingId ? "Rename" : "Add"}
              </button>
            </div>
          </div>
        </div>
        </FocusTrap>
      )}

      {deleteConfirmId && (() => {
        const cat = categories.find((c) => c.id === deleteConfirmId);
        const count = cat ? products.filter((p) => p.category === cat.name).length : 0;
        return (
        <FocusTrap onClose={() => setDeleteConfirmId(null)}>
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-80 mx-4 p-5">
            <h3 className="text-base font-bold text-gray-800 mb-2">Delete Category</h3>
            <p className="text-sm text-gray-600 mb-4">
              {count > 0
                ? `"${cat?.name}" is used by ${count} product(s). Delete anyway?`
                : "Are you sure you want to delete this category?"}
            </p>
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
        );
      })()}
    </div>
  );
}
