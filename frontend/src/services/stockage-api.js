import useSWR, { mutate } from "swr";

// Module P2 — Stockage + Équipement. Même backend que les autres modules (frontend/.env : VITE_API_URL=...)
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

async function appel(path, options) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error(`Backend injoignable (${API_URL}).`);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data?.detail;
    throw new Error((Array.isArray(detail) ? detail.map((d) => d.msg).join(" ; ") : detail) || `Erreur ${res.status}`);
  }
  return data;
}

export const useApi = (path) => useSWR(path, appel, { revalidateOnFocus: false, keepPreviousData: true });

// CRUD : après chaque écriture on recharge toutes les données du module
const recharger = (prefixe) => mutate((key) => typeof key === "string" && key.startsWith(prefixe));

async function ecrire(prefixe, path, method, body) {
  const data = await appel(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  await recharger(prefixe);
  return data;
}

const enc = encodeURIComponent;

export const stockageApi = {
  creer: (body) => ecrire("/stockage", "/stockage", "POST", body),
  modifier: (id, body) => ecrire("/stockage", `/stockage/${enc(id)}`, "PUT", body),
  supprimer: (id) => ecrire("/stockage", `/stockage/${enc(id)}`, "DELETE"),
};

export const equipementApi = {
  creer: (body) => ecrire("/equipements", "/equipements", "POST", body),
  modifier: (id, body) => ecrire("/equipements", `/equipements/${enc(id)}`, "PUT", body),
  supprimer: (id) => ecrire("/equipements", `/equipements/${enc(id)}`, "DELETE"),
};

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

export const label = (id) => (id ? id.replaceAll("_", " ") : "—");
