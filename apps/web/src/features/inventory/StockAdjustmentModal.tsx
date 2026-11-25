import { useState, type FormEvent } from "react";
import type { Product } from "@us-ledger-pos/shared";
import Modal from "../../components/Modal";
import { api } from "../../lib/api";

interface StockAdjustmentModalProps {
  product: Product;
  onClose: () => void;
  onAdjusted: () => void;
}

type Direction = "IN" | "OUT";

export default function StockAdjustmentModal({
  product,
  onClose,
  onAdjusted,
}: StockAdjustmentModalProps) {
  const [direction, setDirection] = useState<Direction>("IN");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const qty = Number(quantity) || 0;
  const resultingStock =
    product.currentStock + (direction === "IN" ? qty : -qty);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (qty <= 0) {
      setError("La cantidad debe ser mayor a cero");
      return;
    }
    if (resultingStock < 0) {
      setError("El ajuste dejaría el stock en negativo");
      return;
    }

    setSubmitting(true);
    try {
      await api.products.adjustStock(product.id, {
        quantityDelta: direction === "IN" ? qty : -qty,
        note: note.trim() || undefined,
      });
      onAdjusted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al ajustar stock");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Ajustar stock · ${product.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-slate-500">
          Stock actual: <span className="font-medium">{product.currentStock}</span>
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDirection("IN")}
            className={`flex-1 rounded-md border px-3 py-1.5 text-sm font-medium ${
              direction === "IN"
                ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                : "border-slate-300 text-slate-600"
            }`}
          >
            + Entrada
          </button>
          <button
            type="button"
            onClick={() => setDirection("OUT")}
            className={`flex-1 rounded-md border px-3 py-1.5 text-sm font-medium ${
              direction === "OUT"
                ? "border-red-600 bg-red-50 text-red-700"
                : "border-slate-300 text-slate-600"
            }`}
          >
            − Salida
          </button>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Cantidad</span>
          <input
            required
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="input"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Nota (opcional)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Conteo físico, mercancía dañada, etc."
            className="input"
          />
        </label>

        <p className="text-sm text-slate-500">
          Stock resultante:{" "}
          <span
            className={`font-medium ${resultingStock < 0 ? "text-red-600" : "text-slate-900"}`}
          >
            {resultingStock}
          </span>
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Guardando..." : "Aplicar ajuste"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
