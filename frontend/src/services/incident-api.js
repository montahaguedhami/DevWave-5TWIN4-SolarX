import useSWR, { mutate } from "swr";

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
    throw new Error(
      (Array.isArray(detail) ? detail.map((d) => d.msg).join(" ; ") : detail) ||
        `Erreur ${res.status}`
    );
  }
  return data;
}

export const useApi = (path) =>
  useSWR(path, appel, { revalidateOnFocus: false, keepPreviousData: true });

const recharger = (prefixe) =>
  mutate((key) => typeof key === "string" && key.startsWith(prefixe));

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

export const incidentApi = {
  creer: (body) => ecrire("/incidents", "/incidents", "POST", body),
  modifier: (id, body) => ecrire("/incidents", `/incidents/${enc(id)}`, "PUT", body),
  supprimer: (id) => ecrire("/incidents", `/incidents/${enc(id)}`, "DELETE"),
};

export const maintenanceApi = {
  creer: (body) => ecrire("/maintenances", "/maintenances", "POST", body),
  modifier: (id, body) => ecrire("/maintenances", `/maintenances/${enc(id)}`, "PUT", body),
  supprimer: (id) => ecrire("/maintenances", `/maintenances/${enc(id)}`, "DELETE"),
};

