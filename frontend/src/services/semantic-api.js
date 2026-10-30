const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(status, detail) {
    super(typeof detail === "string" ? detail : detail?.message || `Erreur ${status}`);
    this.status = status;
    this.detail = detail;
  }
}

async function request(path, { method = "GET", body, params } = {}) {
  const url = new URL(`${API_URL}${path}`);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, `Backend injoignable (${API_URL}).`);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data?.detail;
    // FastAPI validation errors are arrays
    throw new ApiError(res.status, Array.isArray(detail) ? detail.map((d) => d.msg).join(" ; ") : detail);
  }
  return data;
}

const enc = encodeURIComponent;

export const localisationApi = {
  regions: () => request("/localisation/regions"),
  geocodageInverse: (lat, lon) => request("/localisation/geocodage-inverse", { params: { lat, lon } }),
  villes: (params) => request("/localisation/villes", { params }),
  createVille: (body) => request("/localisation/villes", { method: "POST", body }),
  updateVille: (id, body) => request(`/localisation/villes/${enc(id)}`, { method: "PUT", body }),
  deleteVille: (id, cascade = false) =>
    request(`/localisation/villes/${enc(id)}`, { method: "DELETE", params: { cascade } }),
};

export const meteoApi = {
  actuelle: (villeId) => request(`/meteo/villes/${enc(villeId)}/actuelle`),
  consulter: (villeId) => request(`/meteo/villes/${enc(villeId)}/consulter`, { method: "POST" }),
  assistant: (villeId, question) =>
    request(`/meteo/villes/${enc(villeId)}/assistant`, { method: "POST", body: { question: question || null } }),
  historique: (params) => request("/meteo/historique", { params }),
  supprimerJour: (params) => request("/meteo/historique", { method: "DELETE", params }),
  enregistrer: (villeId) => request(`/meteo/villes/${enc(villeId)}/enregistrer`, { method: "POST" }),
  mesures: (villeId) => request(`/meteo/villes/${enc(villeId)}/mesures`),
  supprimerReleve: (villeId, dateMesure) =>
    request(`/meteo/villes/${enc(villeId)}/mesures`, { method: "DELETE", params: { dateMesure } }),
  supprimerMesure: (mesureId) => request(`/meteo/mesures/${enc(mesureId)}`, { method: "DELETE" }),
  alertes: () => request("/meteo/alertes"),
};
