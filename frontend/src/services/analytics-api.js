import useSWR from "swr";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

async function fetcher(path) {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`Erreur ${res.status}`);
  }
  return res.json();
}

export function useAnalyticsData() {
  const overview = useSWR("/analytics/overview", fetcher, {
    revalidateOnFocus: false,
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      if (retryCount >= 3) return;
      setTimeout(() => revalidate({ retryCount }), 2000);
    },
  });

  const monthly = useSWR("/analytics/monthly", fetcher, {
    revalidateOnFocus: false,
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      if (retryCount >= 3) return;
      setTimeout(() => revalidate({ retryCount }), 2000);
    },
  });

  const productionStats = useSWR("/production/stats/par-type", fetcher, { revalidateOnFocus: false });
  const lignesStats = useSWR("/lignes/stats", fetcher, { revalidateOnFocus: false });
  const incidentsStats = useSWR("/incidents/stats", fetcher, { revalidateOnFocus: false });
  const stockageTotal = useSWR("/stockage/capacite-totale", fetcher, { revalidateOnFocus: false });

  // Données de secours réalistes issues de solarx.owl en cas de délai de démarrage
  const defaultOverview = {
    puissanceTotaleKw: 580.0,
    productionMesureeKwh: 600.0,
    capaciteStockageKwh: 60.0,
    energieStockeeKwh: 27.0,
    tauxRemplissageStockage: 45.0,
    nombreConsommateurs: 6,
    longueurReseauKm: 293.7,
    nombreLignes: 7,
    totalIncidents: 13,
    tauxPenetrationRenouvelable: 100.0,
    co2EviteKg: 432.0,
    mixEnergetique: [
      { type: "CentraleSolaire", nombre: 2, puissanceKw: 100.0, partPct: 17.2 },
      { type: "ParcEolien", nombre: 2, puissanceKw: 250.0, partPct: 43.1 },
      { type: "CentraleHydraulique", nombre: 1, puissanceKw: 230.0, partPct: 39.7 },
    ],
  };

  const defaultMonthly = [
    { month: "Jan", production: 452.4, consumption: 399.0, gridExport: 193.1, selfConsumption: 259.3, autoconsommationPct: 65.0 },
    { month: "Fév", production: 493.0, consumption: 386.4, gridExport: 241.8, selfConsumption: 251.2, autoconsommationPct: 65.0 },
    { month: "Mar", production: 609.0, consumption: 369.6, gridExport: 368.8, selfConsumption: 240.2, autoconsommationPct: 65.0 },
    { month: "Avr", production: 684.4, consumption: 357.0, gridExport: 452.4, selfConsumption: 232.0, autoconsommationPct: 65.0 },
    { month: "Mai", production: 783.0, consumption: 378.0, gridExport: 537.3, selfConsumption: 245.7, autoconsommationPct: 65.0 },
    { month: "Juin", production: 858.4, consumption: 483.0, gridExport: 544.5, selfConsumption: 313.9, autoconsommationPct: 65.0 },
    { month: "Juil", production: 899.0, consumption: 546.0, gridExport: 544.1, selfConsumption: 354.9, autoconsommationPct: 65.0 },
    { month: "Août", production: 841.0, consumption: 525.0, gridExport: 499.8, selfConsumption: 341.2, autoconsommationPct: 65.0 },
    { month: "Sep", production: 725.0, consumption: 441.0, gridExport: 438.4, selfConsumption: 286.6, autoconsommationPct: 65.0 },
    { month: "Oct", production: 580.0, consumption: 378.0, gridExport: 334.3, selfConsumption: 245.7, autoconsommationPct: 65.0 },
    { month: "Nov", production: 475.6, consumption: 386.4, gridExport: 224.4, selfConsumption: 251.2, autoconsommationPct: 65.0 },
    { month: "Déc", production: 417.6, consumption: 411.6, gridExport: 150.1, selfConsumption: 267.5, autoconsommationPct: 65.0 },
  ];

  return {
    overview: overview.data || defaultOverview,
    monthly: monthly.data || defaultMonthly,
    productionStats: productionStats.data || null,
    lignesStats: lignesStats.data || null,
    incidentsStats: incidentsStats.data || null,
    stockageTotal: stockageTotal.data || null,
    isLoading: overview.isLoading && monthly.isLoading,
    isLive: !overview.error && !!overview.data,
  };
}

