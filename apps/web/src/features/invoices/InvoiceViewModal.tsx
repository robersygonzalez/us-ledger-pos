import { useEffect, useState } from "react";
import { api, type InvoiceDetail } from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/format";
import StatusBadge from "../../components/StatusBadge";

interface InvoiceViewModalProps {
  invoiceId: string;
  onClose: () => void;
}

function formatAddress(customer: InvoiceDetail["customer"]) {
  const line2 = [customer.city, customer.state, customer.zip]
    .filter(Boolean)
    .join(", ");
  return [customer.addressLine1, customer.addressLine2, line2 || null].filter(
    (line): line is string => Boolean(line),
  );
}

export default function InvoiceViewModal({
  invoiceId,
  onClose,
}: InvoiceViewModalProps) {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .invoices.get(invoiceId)
      .then(setInvoice)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error cargando factura"),
      );
  }, [invoiceId]);

  return (
    <div
      className="no-print fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="no-print flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="font-medium">
            Factura {invoice?.invoiceNumber ?? ""}
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!invoice}
              onClick={() => window.print()}
              className="btn-primary"
            >
              Imprimir
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cerrar
            </button>
          </div>
        </div>

        {error && <p className="p-4 text-sm text-red-600">{error}</p>}
        {!invoice && !error && (
          <p className="p-4 text-sm text-slate-500">Cargando...</p>
        )}

        {invoice && (
          <div className="print-area p-8 text-sm text-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold">US Ledger POS</h1>
                <p className="text-slate-500">Factura comercial</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-semibold uppercase tracking-wide">
                  Invoice
                </h2>
                <p className="text-slate-600">#{invoice.invoiceNumber}</p>
                <div className="mt-1">
                  <StatusBadge status={invoice.status} />
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                  Bill To
                </p>
                <p className="font-medium">{invoice.customer.name}</p>
                {formatAddress(invoice.customer).map((line) => (
                  <p key={line} className="text-slate-600">
                    {line}
                  </p>
                ))}
                {invoice.customer.email && (
                  <p className="text-slate-600">{invoice.customer.email}</p>
                )}
                {invoice.customer.phone && (
                  <p className="text-slate-600">{invoice.customer.phone}</p>
                )}
              </div>

              <div className="text-right">
                <p>
                  <span className="text-slate-500">Fecha de emisión: </span>
                  {formatDate(invoice.issueDate)}
                </p>
                <p>
                  <span className="text-slate-500">Fecha de vencimiento: </span>
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
            </div>

            <table className="mt-6 w-full text-left">
              <thead>
                <tr className="border-b border-slate-300 text-xs uppercase text-slate-500">
                  <th className="py-2">Descripción</th>
                  <th className="py-2 text-right">Cant.</th>
                  <th className="py-2 text-right">Precio Unit.</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-2 text-right">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="ml-auto mt-4 max-w-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  Sales Tax ({(invoice.taxRate * 100).toFixed(2)}%)
                </span>
                <span>{formatCurrency(invoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-1 text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Notas
                </p>
                <p className="text-slate-600">{invoice.notes}</p>
              </div>
            )}

            <p className="mt-10 text-center text-xs text-slate-400">
              Gracias por su compra.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
