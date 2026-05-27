import { useState } from "react";
import type { Product } from "../../types/pos";

interface ProductGridProps {
  products: Product[];
  categories: string[];
  onAddToCart: (product: Product) => void;
}

export default function ProductGrid({ products, categories, onAddToCart }: ProductGridProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || p.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-3 border-b border-gray-200">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setCategory("All")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              category === "All"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                category === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <span className="text-4xl mb-2">🔍</span>
            <p className="text-sm">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((product) => (
              <button
                key={product.id}
                onClick={() => onAddToCart(product)}
                className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all active:scale-95"
              >
                {product.image ? (
                  <img src={product.image} alt="" className="w-12 h-12 object-contain mb-1" />
                ) : (
                  <span className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg text-sm text-gray-400 font-bold mb-1">
                    {product.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="text-xs font-medium text-gray-800 text-center leading-tight">
                  {product.name}
                </span>
                <span className="text-sm font-bold text-blue-600 mt-1">
                  ₹{product.price.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
