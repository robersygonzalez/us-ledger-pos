/// <reference types="vite/client" />

interface ImportMetaEnv {
  // URL base de la API, sin slash final (ej. "https://us-ledger-pos-api.onrender.com").
  // Si no se define, se usa "/api" y se asume el proxy de Vite (solo dev local).
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
