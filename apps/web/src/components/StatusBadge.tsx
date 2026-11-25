import { InvoiceStatus } from "@us-ledger-pos/shared";

const STYLES: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: "bg-slate-100 text-slate-600",
  [InvoiceStatus.SENT]: "bg-blue-100 text-blue-700",
  [InvoiceStatus.PAID]: "bg-emerald-100 text-emerald-700",
  [InvoiceStatus.VOID]: "bg-red-100 text-red-700",
};

const LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: "Borrador",
  [InvoiceStatus.SENT]: "Enviada",
  [InvoiceStatus.PAID]: "Pagada",
  [InvoiceStatus.VOID]: "Anulada",
};

export default function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
