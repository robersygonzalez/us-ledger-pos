import { useState, type FormEvent, type ReactNode } from "react";
import type { CreateProductInput } from "@us-ledger-pos/shared";
import Modal from "../../components/Modal";
import { api } from "../../lib/api";

interface ProductFormModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function ProductFormModal({
  onClose,
  onCreated,
}: ProductFormModalProps) {
  const [form, setForm] = useState({
    sku: "",
    name: "",
    description: "",
    unitCost: "",
    unitPrice: "",
    currentStock: "0",
    reorderPoint: "0",
    isTaxable: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const payload: CreateProductInput = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      unitCost: Number(form.unitCost),
      unitPrice: Number(form.unitPrice),
      currentStock: Number(form.currentStock),
      reorderPoint: Number(form.reorderPoint),
      isTaxable: form.isTaxable,
    };

    setSubmitting(true);
    try {
      await api.products.create(payload);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear producto");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Nuevo producto" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU">
            <input
              required
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Nombre">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
            />
          </Field>
        </div>

        <Field label="Descripción (opcional)">
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Costo unitario">
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.unitCost}
              onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Precio de venta">
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Stock inicial">
            <input
              type="number"
              min="0"
              step="1"
              value={form.currentStock}
              onChange={(e) =>
                setForm({ ...form, currentStock: e.target.value })
              }
              className="input"
            />
          </Field>
          <Field label="Punto de reorden">
            <input
              required
              type="number"
              min="0"
              step="1"
              value={form.reorderPoint}
              onChange={(e) =>
                setForm({ ...form, reorderPoint: e.target.value })
              }
              className="input"
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.isTaxable}
            onChange={(e) => setForm({ ...form, isTaxable: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          Producto sujeto a Sales Tax
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Guardando..." : "Crear producto"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-600">{label}</span>
      {children}
    </label>
  );
}
