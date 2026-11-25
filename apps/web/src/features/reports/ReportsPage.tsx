import { useEffect, useState } from "react";
import type { FinancialSummaryReport, Product } from "@us-ledger-pos/shared";
import { api } from "../../lib/api";
import { formatCurrency } from "../../lib/format";

interface SummaryCard {
  label: string;
  value: string;
}

export default function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [summary, setSummary] = useState<FinancialSummaryReport | null>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const range = { from: from || undefined, to: to || undefined };
      const [summaryData, lowStockData] = await Promise.all([
        api.reports.financialSummary(range),
        api.reports.lowStockAlerts(),
      ]);
      setSummary(summaryData);
      setLowStock(lowStockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando reportes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const cards: SummaryCard[] = [
    { label: "Ventas Totales", value: formatCurrency(summary?.totalSales ?? 0) },
    { label: "Ganancia Bruta", value: formatCurrency(summary?.grossProfit ?? 0) },
    {
      label: "Sales Tax Recaudado",
      value: formatCurrency(summary?.totalTaxCollected ?? 0),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Reportes</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
      >
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Desde</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Hasta</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input"
          />
        </label>
        <button type="submit" className="btn-secondary">
          Filtrar
        </button>
        <span className="text-xs text-slate-400">
          Sin rango = acumulado de todas las facturas enviadas/pagadas.
        </span>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Cargando...</p>}

      {!loading && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <p className="text-xs font-medium uppercase text-slate-500">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-semibold">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-2">
              <h3 className="text-sm font-medium text-slate-700">
                Productos por Reordenar
              </h3>
            </div>
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">SKU</th>
                  <th className="px-4 py-2">Producto</th>
                  <th className="px-4 py-2 text-right">Stock Actual</th>
                  <th className="px-4 py-2 text-right">Punto de Reorden</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStock.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-slate-500"
                    >
                      Ningún producto necesita reabastecerse.
                    </td>
                  </tr>
                ) : (
                  lowStock.map((product) => (
                    <tr key={product.id}>
                      <td className="px-4 py-2 font-mono text-xs text-slate-600">
                        {product.sku}
                      </td>
                      <td className="px-4 py-2">{product.name}</td>
                      <td className="px-4 py-2 text-right font-medium text-red-600">
                        {product.currentStock}
                      </td>
                      <td className="px-4 py-2 text-right text-slate-600">
                        {product.reorderPoint}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
