import { useState, useEffect } from "react";
import type { DailyRevenue, TopProduct, Product } from "../../types/pos";

const API_BASE = "http://localhost:3001/api";

export default function ReportsPage() {
  const [daily, setDaily] = useState<DailyRevenue[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/reports/daily`)
      .then((r) => r.ok && r.json())
      .then((d) => setDaily(d || []))
      .catch(() => {});
    fetch(`${API_BASE}/reports/top-products`)
      .then((r) => r.ok && r.json())
      .then((d) => setTopProducts(d || []))
      .catch(() => {});
    fetch(`${API_BASE}/products/low-stock`)
      .then((r) => r.ok && r.json())
      .then((d) => setLowStock(d || []))
      .catch(() => {});
  }, []);

  const totalRevenue = daily.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = daily.reduce((s, d) => s + d.count, 0);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-5 py-3">
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>📊</span> Reports
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold text-gray-800">₹{totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Total Revenue</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800">{totalOrders}</p>
                <p className="text-xs text-gray-500 mt-1">Total Orders</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Daily Revenue (Last 30 Days)</h2>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {daily.length === 0 ? (
                <p className="text-sm text-gray-400">No data yet</p>
              ) : (
                daily.map((d) => {
                  const maxRev = Math.max(...daily.map((x) => x.revenue), 1);
                  const pct = (d.revenue / maxRev) * 100;
                  return (
                    <div key={d.day} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-24 flex-shrink-0">{d.day}</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-gray-700 w-20 text-right">
                        ₹{d.revenue.toFixed(2)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Top Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400">No sales data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-2 font-medium text-gray-500 w-8"></th>
                    <th className="text-left pb-2 font-medium text-gray-500">Product</th>
                    <th className="text-right pb-2 font-medium text-gray-500">Sold</th>
                    <th className="text-right pb-2 font-medium text-gray-500">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={p.name} className="border-b border-gray-50">
                      <td className="py-2 text-gray-400 text-xs">{i + 1}</td>
                      <td className="py-2 flex items-center gap-2">
                        {p.image ? (
                          <img src={p.image} alt="" className="w-7 h-7 object-contain rounded" />
                        ) : (
                          <span className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded text-[10px] text-gray-400 font-bold">
                            {p.name.charAt(0)}
                          </span>
                        )}
                        <span className="font-medium text-gray-800">{p.name}</span>
                      </td>
                      <td className="py-2 text-right font-mono">{p.quantity}</td>
                      <td className="py-2 text-right font-mono">₹{p.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">⚠️ Low Stock Products</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-400">All products are adequately stocked</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-2 font-medium text-gray-500">Product</th>
                    <th className="text-right pb-2 font-medium text-gray-500">Stock</th>
                    <th className="text-right pb-2 font-medium text-gray-500">Min Stock</th>
                    <th className="text-right pb-2 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className="py-2 font-medium text-gray-800">{p.name}</td>
                      <td className="py-2 text-right font-mono text-red-600">{p.stock}</td>
                      <td className="py-2 text-right font-mono text-gray-600">{p.minStock}</td>
                      <td className="py-2 text-right">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          {p.stock === 0 ? "Out of Stock" : "Low Stock"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
