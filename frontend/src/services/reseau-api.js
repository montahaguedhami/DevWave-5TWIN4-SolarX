import useSWR, { mutate } from "swr";

// Lignes, Réseaux et Assistant IA. Même URL de backend que semantic-api.js (frontend/.env : VITE_API_URL=...)
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

async function lire(res) {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data?.detail;
    // les erreurs de validation FastAPI sont des listes
    throw new Error((Array.isArray(detail) ? detail.map((d) => d.msg).join(" ; ") : detail) || `Erreur ${res.status}`);
  }
  return data;
}

async function appel(path, options) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error(`Backend injoignable (${API_URL}).`);
  }
  return lire(res);
}

// Données en lecture (mises en cache par SWR). path = null : pas de requête.
// keepPreviousData : la page reste affichée pendant qu'un filtre ou une recherche recharge la liste
export const useApi = (path) => useSWR(path, appel, { revalidateOnFocus: false, keepPreviousData: true });

// CRUD : après une écriture, on recharge les données des pages Lignes et Réseaux
async function ecrire(path, method, body) {
  const data = await appel(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  mutate((key) => typeof key === "string" && (key.startsWith("/lignes") || key.startsWith("/reseaux")));
  return data;
}

const enc = encodeURIComponent;

export const lignesApi = {
  creer: (body) => ecrire("/lignes", "POST", body),
  modifier: (id, body) => ecrire(`/lignes/${enc(id)}`, "PUT", body),
  supprimer: (id) => ecrire(`/lignes/${enc(id)}`, "DELETE"),
};

export const reseauxApi = {
  creer: (body) => ecrire("/reseaux", "POST", body),
  modifier: (id, body) => ecrire(`/reseaux/${enc(id)}`, "PUT", body),
  supprimer: (id) => ecrire(`/reseaux/${enc(id)}`, "DELETE"),
};

export const poserQuestion = (question) =>
  appel("/ia/question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
