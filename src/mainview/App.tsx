import { useState, useEffect } from "react";
import POSLayout from "./components/pos/POSLayout";
import InventoryPage from "./components/inventory/InventoryPage";
import ReportsPage from "./components/reports/ReportsPage";
import PartiesPage from "./components/parties/PartiesPage";
import CategoriesPage from "./components/categories/CategoriesPage";
import BusinessSetupModal from "./components/BusinessSetupModal";

type Tab = "pos" | "inventory" | "categories" | "parties" | "reports";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "pos", label: "POS", icon: "🏪" },
  { key: "inventory", label: "Inventory", icon: "📦" },
  { key: "categories", label: "Categories", icon: "🏷️" },
  { key: "parties", label: "Parties", icon: "👥" },
  { key: "reports", label: "Reports", icon: "📊" },
];

const API_BASE = "http://localhost:3001/api";

function App() {
  const [tab, setTab] = useState<Tab>("pos");
  const [business, setBusiness] = useState({ name: "Khata POS", address: "", phone: "", gst: "" });
  const [showSetup, setShowSetup] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/business`)
      .then((r) => r.ok && r.json())
      .then((data) => {
        if (data) {
          setBusiness({ name: data.name || "Khata POS", address: data.address || "", phone: data.phone || "", gst: data.gst || "" });
          if (!data.address && !data.phone && data.name === "Khata POS") {
            setShowSetup(true);
          }
        } else {
          setShowSetup(true);
        }
      })
      .catch(() => setShowSetup(true))
      .finally(() => setLoaded(true));
  }, []);

  function handleSaveBusiness(data: typeof business) {
    setBusiness(data);
    setShowSetup(false);
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <nav className="bg-white border-b border-gray-200 flex px-4 gap-1 items-center">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
        <button
          onClick={() => setShowSetup(true)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Business Settings"
        >
          ⚙️ Settings
        </button>
      </nav>
      <div className="flex-1 overflow-hidden">
        {tab === "pos" && <POSLayout business={business} />}
        {tab === "inventory" && <InventoryPage />}
        {tab === "categories" && <CategoriesPage />}
        {tab === "parties" && <PartiesPage />}
        {tab === "reports" && <ReportsPage />}
      </div>

      {showSetup && (
        <BusinessSetupModal
          initial={business}
          onSave={handleSaveBusiness}
          onClose={loaded ? () => setShowSetup(false) : undefined}
        />
      )}
    </div>
  );
}

export default App;
