import { useEffect, useState } from "react";
import { PaymentTerms, type Product } from "@us-ledger-pos/shared";

type ApiStatus = "checking" | "online" | "offline";

export default function App() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => (res.ok ? setApiStatus("online") : setApiStatus("offline")))
      .catch(() => setApiStatus("offline"));

    fetch("/api/products")
      .then((res) => res.json())
      .then((data: Product[]) => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold">US Ledger POS</h1>
        <p className="text-sm text-slate-500">
          Facturación, ventas, stock y reportes
        </p>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 p-6">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-medium">Estado de la API</h2>
          <p className="text-sm">
            {apiStatus === "checking" && "Verificando..."}
            {apiStatus === "online" && "✅ conectada (apps/api)"}
            {apiStatus === "offline" && "⚠️ sin conexión (¿corriste npm run dev:api?)"}
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-medium">Productos</h2>
          {products.length === 0 ? (
            <p className="text-sm text-slate-500">
              Sin productos todavía (o la API no respondió).
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {products.map((p) => (
                <li key={p.id} className="flex justify-between py-1">
                  <span>{p.name}</span>
                  <span className="text-slate-500">stock: {p.currentStock}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-medium">Términos de pago disponibles</h2>
          <p className="text-sm text-slate-500">
            Tipos importados desde @us-ledger-pos/shared, los mismos que usa
            la API y la base de datos.
          </p>
          <ul className="mt-2 flex gap-2 text-sm">
            {Object.values(PaymentTerms).map((term) => (
              <li
                key={term}
                className="rounded bg-slate-100 px-2 py-1 font-mono text-xs"
              >
                {term}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
