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
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, `Backend injoignable (${API_URL}).`);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.detail;
    throw new ApiError(response.status, Array.isArray(detail) ? detail.map((item) => item.msg).join(" ; ") : detail);
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

export const productionApi = {
  measurements: () => request("/production/mesures"),
  createMeasurement: (body) => request("/production/mesures", { method: "POST", body }),
  updateMeasurement: (id, body) => request(`/production/mesures/${enc(id)}`, { method: "PUT", body }),
  deleteMeasurement: (id) => request(`/production/mesures/${enc(id)}`, { method: "DELETE" }),
  installations: (params) => request("/production/installations", { params }),
  installation: (id) => request(`/production/installations/${enc(id)}`),
  getInstallation: (id) => request(`/production/installations/${enc(id)}`),
  createInstallation: (body) => request("/production/installations", { method: "POST", body }),
  updateInstallation: (id, body) => request(`/production/installations/${enc(id)}`, { method: "PUT", body }),
  deleteInstallation: (id) => request(`/production/installations/${enc(id)}`, { method: "DELETE" }),
  sources: (params) => request("/production/sources", { params }),
  source: (id) => request(`/production/sources/${enc(id)}`),
  getSource: (id) => request(`/production/sources/${enc(id)}`),
  sourceTypes: () => request("/production/sources/types"),
  createSource: (body) => request("/production/sources", { method: "POST", body }),
  updateSource: (id, body) => request(`/production/sources/${enc(id)}`, { method: "PUT", body }),
  deleteSource: (id) => request(`/production/sources/${enc(id)}`, { method: "DELETE" }),
  installationsOfSource: (id) => request(`/production/sources/${enc(id)}/installations`),
  stats: () => request("/production/stats"),
  statsParType: () => request("/production/stats/par-type"),
};

export const consumerApi = {
  consumers: (params) => request("/consommateurs", { params }),
  consumer: (id) => request(`/consommateurs/${enc(id)}`),
  consumerTypes: () => request("/consommateurs/types"),
  equipment: () => request("/consommateurs/equipements"),
  createConsumer: (body) => request("/consommateurs", { method: "POST", body }),
  updateConsumer: (id, body) => request(`/consommateurs/${enc(id)}`, { method: "PUT", body }),
  deleteConsumer: (id) => request(`/consommateurs/${enc(id)}`, { method: "DELETE" }),
};

export const consumptionApi = {
  measurements: (params) => request("/consommation/mesures", { params }),
};
