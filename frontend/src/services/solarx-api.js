import useSWR from "swr";

// URL du backend FastAPI (modifiable dans frontend/.env : VITE_API_URL=...)
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const fetcher = async (path) => {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Erreur ${res.status}`);
  }
  return res.json();
};

export const useApi = (path) => useSWR(path, fetcher, { revalidateOnFocus: false });

export const formatKwh = (kwh) => {
  if (kwh == null) return "—";
  if (kwh >= 1000) return `${(kwh / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} MWh`;
  return `${kwh.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} kWh`;
};

export const formatKw = (kw) => {
  if (kw == null) return "—";
  if (kw >= 1000) return `${(kw / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} MW`;
  return `${kw.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} kW`;
};
