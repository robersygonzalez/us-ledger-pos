import { useState, type FormEvent } from "react";
import { PaymentTerms, type CreateCustomerInput } from "@us-ledger-pos/shared";
import Modal from "../../components/Modal";
import { api } from "../../lib/api";

interface CustomerFormModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const PAYMENT_TERMS_LABELS: Record<PaymentTerms, string> = {
  [PaymentTerms.DUE_ON_RECEIPT]: "Pago al recibir",
  [PaymentTerms.NET_15]: "Net 15",
  [PaymentTerms.NET_30]: "Net 30",
};

export default function CustomerFormModal({
  onClose,
  onCreated,
}: CustomerFormModalProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    paymentTerms: PaymentTerms.DUE_ON_RECEIPT,
    isTaxExempt: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const payload: CreateCustomerInput = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      paymentTerms: form.paymentTerms,
      isTaxExempt: form.isTaxExempt,
    };

    setSubmitting(true);
    try {
      await api.customers.create(payload);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear cliente");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Nuevo cliente" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Nombre</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Email (opcional)</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Teléfono (opcional)</span>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Términos de pago</span>
          <select
            value={form.paymentTerms}
            onChange={(e) =>
              setForm({
                ...form,
                paymentTerms: e.target.value as PaymentTerms,
              })
            }
            className="input"
          >
            {Object.values(PaymentTerms).map((term) => (
              <option key={term} value={term}>
                {PAYMENT_TERMS_LABELS[term]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.isTaxExempt}
            onChange={(e) =>
              setForm({ ...form, isTaxExempt: e.target.checked })
            }
            className="h-4 w-4 rounded border-slate-300"
          />
          Cliente exento de impuestos (tax-exempt)
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Guardando..." : "Crear cliente"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
