import { useEffect, useState } from "react";
import type { Product } from "@us-ledger-pos/shared";
import { api } from "../../lib/api";
import { formatCurrency } from "../../lib/format";
import ProductFormModal from "./ProductFormModal";
import StockAdjustmentModal from "./StockAdjustmentModal";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [adjusting, setAdjusting] = useState<Product | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.products.list();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando productos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Inventario</h2>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          + Nuevo producto
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">Cargando...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">SKU</th>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2 text-right">Precio</th>
                <th className="px-4 py-2 text-right">Stock</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Sin productos todavía.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const lowStock = p.currentStock <= p.reorderPoint;
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-2 font-mono text-xs text-slate-600">
                        {p.sku}
                      </td>
                      <td className="px-4 py-2">{p.name}</td>
                      <td className="px-4 py-2 text-right">
                        {formatCurrency(p.unitPrice)}
                      </td>
                      <td
                        className={`px-4 py-2 text-right font-medium ${
                          lowStock ? "text-red-600" : "text-slate-900"
                        }`}
                      >
                        {p.currentStock}
                        {lowStock && (
                          <span className="ml-1 text-xs font-normal text-red-500">
                            (bajo)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          className="btn-secondary"
                          onClick={() => setAdjusting(p)}
                        >
                          Ajustar stock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <ProductFormModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      {adjusting && (
        <StockAdjustmentModal
          product={adjusting}
          onClose={() => setAdjusting(null)}
          onAdjusted={() => {
            setAdjusting(null);
            load();
          }}
        />
      )}
    </div>
  );
}
