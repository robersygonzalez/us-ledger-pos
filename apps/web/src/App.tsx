import { useEffect, useState } from "react";
import InventoryPage from "./features/inventory/InventoryPage";
import CustomersPage from "./features/customers/CustomersPage";
import InvoiceBuilderPage from "./features/invoices/InvoiceBuilderPage";
import InvoicesPage from "./features/invoices/InvoicesPage";
import { api } from "./lib/api";

type Tab = "inventory" | "customers" | "new-invoice" | "invoices";

const TABS: { id: Tab; label: string }[] = [
  { id: "inventory", label: "Inventario" },
  { id: "customers", label: "Clientes" },
  { id: "new-invoice", label: "Nueva Factura" },
  { id: "invoices", label: "Facturas" },
];

type ApiStatus = "checking" | "online" | "offline";

export default function App() {
  const [tab, setTab] = useState<Tab>("inventory");
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");

  useEffect(() => {
    api
      .health()
      .then(() => setApiStatus("online"))
      .catch(() => setApiStatus("offline"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">US Ledger POS</h1>
            <p className="text-sm text-slate-500">
              Facturación, ventas, stock y reportes
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              apiStatus === "online"
                ? "bg-emerald-100 text-emerald-700"
                : apiStatus === "offline"
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-500"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                apiStatus === "online"
                  ? "bg-emerald-500"
                  : apiStatus === "offline"
                    ? "bg-red-500"
                    : "bg-slate-400"
              }`}
            />
            {apiStatus === "checking" && "Verificando API..."}
            {apiStatus === "online" && "API conectada"}
            {apiStatus === "offline" && "API sin conexión"}
          </span>
        </div>
      </header>

      <nav className="border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        {tab === "inventory" && <InventoryPage />}
        {tab === "customers" && <CustomersPage />}
        {tab === "new-invoice" && (
          <InvoiceBuilderPage onCreated={() => setTab("invoices")} />
        )}
        {tab === "invoices" && <InvoicesPage />}
      </main>
    </div>
  );
}
