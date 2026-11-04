import useSWR from "swr";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

async function fetcher(path) {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`Erreur ${res.status}`);
  }
  return res.json();
}

export function useDashboardData() {
  const production = useSWR("/production/stats", fetcher, { revalidateOnFocus: false });
  const stockageTotal = useSWR("/stockage/capacite-totale", fetcher, { revalidateOnFocus: false });
  const stockageList = useSWR("/stockage", fetcher, { revalidateOnFocus: false });
  const equipements = useSWR("/equipements/stats", fetcher, { revalidateOnFocus: false });
  const incidentsStats = useSWR("/incidents/stats", fetcher, { revalidateOnFocus: false });
  const recentIncidents = useSWR("/incidents", fetcher, { revalidateOnFocus: false });
  const maintenancesStats = useSWR("/maintenances/stats", fetcher, { revalidateOnFocus: false });
  const consommateurs = useSWR("/consommateurs", fetcher, { revalidateOnFocus: false });
  const mesuresConsommation = useSWR("/consommation/mesures", fetcher, { revalidateOnFocus: false });

  const isLoading =
    production.isLoading ||
    stockageTotal.isLoading ||
    equipements.isLoading ||
    incidentsStats.isLoading;

  return {
    production: production.data || null,
    stockageTotal: stockageTotal.data || { capaciteTotale: 60, energieStockee: 27, tauxRemplissage: 45 },
    batteries: stockageList.data || [],
    equipements: equipements.data || { total: 3, parEtat: { Fonctionnel: 2, Maintenance: 1 } },
    incidentsStats: incidentsStats.data || { total: 13, parType: { Alerte: 5, Panne: 5, Surcharge: 3 }, parGravite: { Critique: 2 } },
    incidents: recentIncidents.data?.resultats || (Array.isArray(recentIncidents.data) ? recentIncidents.data : []),
    maintenancesStats: maintenancesStats.data || { total: 14, parType: {} },
    consommateurs: consommateurs.data || [],
    mesuresConsommation: mesuresConsommation.data || [],
    isLoading,
  };
}

