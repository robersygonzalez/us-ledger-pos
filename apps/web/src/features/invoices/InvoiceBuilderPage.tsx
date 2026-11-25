import { useEffect, useMemo, useState, type FormEvent } from "react";
import type {
  Customer,
  CreateInvoiceInput,
  CreateInvoiceItemInput,
  Product,
} from "@us-ledger-pos/shared";
import { api } from "../../lib/api";
import { formatCurrency } from "../../lib/format";

interface DraftItem {
  key: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function defaultInvoiceNumber() {
  return `INV-${Date.now()}`;
}

function newItem(): DraftItem {
  return {
    key: crypto.randomUUID(),
    productId: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
  };
}

interface InvoiceBuilderPageProps {
  onCreated: () => void;
}

export default function InvoiceBuilderPage({
  onCreated,
}: InvoiceBuilderPageProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [invoiceNumber, setInvoiceNumber] = useState(defaultInvoiceNumber());
  const [customerId, setCustomerId] = useState("");
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [taxRatePercent, setTaxRatePercent] = useState("8.25");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([newItem()]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([api.customers.list(), api.products.list()])
      .then(([customersData, productsData]) => {
        setCustomers(customersData);
        setProducts(productsData);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error cargando datos"),
      )
      .finally(() => setLoadingData(false));
  }, []);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId],
  );

  const totals = useMemo(() => {
    const taxRate = (Number(taxRatePercent) || 0) / 100;
    let subtotal = 0;
    let taxableSubtotal = 0;

    for (const item of items) {
      const lineTotal = item.quantity * item.unitPrice;
      subtotal += lineTotal;
      const product = item.productId
        ? products.find((p) => p.id === item.productId)
        : undefined;
      const isTaxable = product ? product.isTaxable : true;
      if (isTaxable) taxableSubtotal += lineTotal;
    }

    const taxAmount = selectedCustomer?.isTaxExempt
      ? 0
      : taxableSubtotal * taxRate;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }, [items, products, selectedCustomer, taxRatePercent]);

  function updateItem(key: string, patch: Partial<DraftItem>) {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function handleProductChange(key: string, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateItem(key, {
      productId,
      description: product ? product.name : "",
      unitPrice: product ? Number(product.unitPrice) : 0,
    });
  }

  function addItem() {
    setItems((prev) => [...prev, newItem()]);
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!customerId) {
      setError("Selecciona un cliente");
      return;
    }
    if (items.length === 0) {
      setError("Agrega al menos un ítem");
      return;
    }
    for (const item of items) {
      if (!item.productId && !item.description.trim()) {
        setError("Cada ítem sin producto debe tener una descripción");
        return;
      }
      if (item.quantity <= 0) {
        setError("La cantidad de cada ítem debe ser mayor a cero");
        return;
      }
    }

    const payloadItems: CreateInvoiceItemInput[] = items.map((item) => ({
      productId: item.productId || undefined,
      description: item.productId ? undefined : item.description.trim(),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    }));

    const payload: CreateInvoiceInput = {
      invoiceNumber: invoiceNumber.trim(),
      customerId,
      dueDate,
      taxRate: Number((Number(taxRatePercent) || 0) / 100),
      notes: notes.trim() || undefined,
      items: payloadItems,
    };

    setSubmitting(true);
    try {
      const invoice = await api.invoices.create(payload);
      setSuccess(`Factura ${invoice.invoiceNumber} creada como borrador.`);
      setInvoiceNumber(defaultInvoiceNumber());
      setCustomerId("");
      setItems([newItem()]);
      setNotes("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear factura");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingData) {
    return <p className="text-sm text-slate-500">Cargando...</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Nueva factura</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">
                Número de factura
              </span>
              <input
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="input"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Cliente</span>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="input"
              >
                <option value="">Selecciona un cliente...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.isTaxExempt ? " (tax-exempt)" : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">
                Fecha de vencimiento
              </span>
              <input
                required
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">
                Sales Tax rate (%)
              </span>
              <input
                required
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRatePercent}
                onChange={(e) => setTaxRatePercent(e.target.value)}
                className="input"
              />
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-700">Ítems</h3>
            <button type="button" onClick={addItem} className="btn-secondary">
              + Agregar ítem
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item) => {
              const product = item.productId
                ? products.find((p) => p.id === item.productId)
                : undefined;
              const lineTotal = item.quantity * item.unitPrice;

              return (
                <div
                  key={item.key}
                  className="grid grid-cols-1 gap-2 rounded-md border border-slate-100 p-2 sm:grid-cols-[2fr_1fr_1fr_auto_auto]"
                >
                  <select
                    value={item.productId}
                    onChange={(e) =>
                      handleProductChange(item.key, e.target.value)
                    }
                    className="input"
                  >
                    <option value="">— ítem libre —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatCurrency(p.unitPrice)})
                      </option>
                    ))}
                  </select>

                  {!item.productId && (
                    <input
                      placeholder="Descripción"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.key, { description: e.target.value })
                      }
                      className="input"
                    />
                  )}

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.key, {
                        quantity: Number(e.target.value) || 0,
                      })
                    }
                    className="input"
                    placeholder="Cant."
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(item.key, {
                        unitPrice: Number(e.target.value) || 0,
                      })
                    }
                    className="input"
                    placeholder="Precio"
                  />

                  <div className="flex items-center justify-between gap-2 text-sm sm:justify-end">
                    <span className="font-medium">
                      {formatCurrency(lineTotal)}
                    </span>
                    {!product?.isTaxable && item.productId && (
                      <span className="text-xs text-slate-400">no taxable</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="btn-danger"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <label className="mt-3 block text-sm">
            <span className="mb-1 block text-slate-600">Notas (opcional)</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
            />
          </label>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">
                Sales Tax
                {selectedCustomer?.isTaxExempt ? " (cliente exento)" : ""}
              </span>
              <span>{formatCurrency(totals.taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{success}</p>}

        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Guardando..." : "Crear factura"}
          </button>
        </div>
      </form>
    </div>
  );
}
