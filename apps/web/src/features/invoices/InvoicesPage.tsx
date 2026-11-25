import { useEffect, useState } from "react";
import { InvoiceStatus, type Customer, type Invoice } from "@us-ledger-pos/shared";
import { api } from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/format";
import StatusBadge from "../../components/StatusBadge";

// El backend incluye el cliente relacionado en /invoices y /invoices/:id.
type InvoiceWithCustomer = Invoice & { customer: Customer };

const NEXT_STATUSES: Record<InvoiceStatus, InvoiceStatus[]> = {
  [InvoiceStatus.DRAFT]: [InvoiceStatus.SENT, InvoiceStatus.VOID],
  [InvoiceStatus.SENT]: [InvoiceStatus.PAID, InvoiceStatus.VOID],
  [InvoiceStatus.PAID]: [InvoiceStatus.VOID],
  [InvoiceStatus.VOID]: [],
};

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: "Borrador",
  [InvoiceStatus.SENT]: "Enviada",
  [InvoiceStatus.PAID]: "Pagada",
  [InvoiceStatus.VOID]: "Anulada",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.invoices.list();
      setInvoices(data as InvoiceWithCustomer[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando facturas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStatusChange(
    invoice: InvoiceWithCustomer,
    status: InvoiceStatus,
  ) {
    setUpdatingId(invoice.id);
    setError(null);
    try {
      await api.invoices.updateStatus(invoice.id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar estado");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Facturas</h2>

      {loading && <p className="text-sm text-slate-500">Cargando...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Número</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Vence</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Sin facturas todavía.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-4 py-2 font-mono text-xs text-slate-600">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-4 py-2">
                      {invoice.customer?.name ?? invoice.customerId}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {NEXT_STATUSES[invoice.status].map((next) => (
                          <button
                            key={next}
                            disabled={updatingId === invoice.id}
                            onClick={() => handleStatusChange(invoice, next)}
                            className="btn-secondary"
                          >
                            Marcar {STATUS_LABELS[next]}
                          </button>
                        ))}
                        {NEXT_STATUSES[invoice.status].length === 0 && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
