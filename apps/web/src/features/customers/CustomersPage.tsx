import { useEffect, useState } from "react";
import { PaymentTerms, type Customer } from "@us-ledger-pos/shared";
import { api } from "../../lib/api";
import CustomerFormModal from "./CustomerFormModal";

const PAYMENT_TERMS_LABELS: Record<PaymentTerms, string> = {
  [PaymentTerms.DUE_ON_RECEIPT]: "Pago al recibir",
  [PaymentTerms.NET_15]: "Net 15",
  [PaymentTerms.NET_30]: "Net 30",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.customers.list();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando clientes");
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
        <h2 className="text-lg font-semibold">Clientes</h2>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          + Nuevo cliente
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">Cargando...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Contacto</th>
                <th className="px-4 py-2">Términos de pago</th>
                <th className="px-4 py-2">Tax-exempt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    Sin clientes todavía.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2 font-medium">{c.name}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {c.email ?? c.phone ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {PAYMENT_TERMS_LABELS[c.paymentTerms]}
                    </td>
                    <td className="px-4 py-2">
                      {c.isTaxExempt ? (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          Exento
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CustomerFormModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}
