import { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Wrench,
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  Code2,
  Calendar,
  Clock,
  Layers,
  Cpu,
  BarChart3,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IncidentBadge, GraviteBadge, MaintenanceBadge } from "@/components/incidents/incident-badge";
import { PannesEquipementCard } from "@/components/incidents/pannes-equipement-card";
import { MaintenanceTimeline } from "@/components/incidents/maintenance-timeline";
import { IncidentModal } from "@/components/incidents/incident-modal";
import { SparqlModal } from "@/components/incidents/sparql-modal";
import { useApi, incidentApi, maintenanceApi } from "@/services/incident-api";

function useDebounce(valeur, delai = 350) {
  const [v, setV] = useState(valeur);
  useEffect(() => {
    const t = setTimeout(() => setV(valeur), delai);
    return () => clearTimeout(t);
  }, [valeur, delai]);
  return v;
}

export default function IncidentsPage() {
  const [activeTab, setActiveTab] = useState("tous"); // "tous" | "incidents" | "maintenances" | "pannes-equipement"
  const [typeIncident, setTypeIncident] = useState("");
  const [gravite, setGravite] = useState("");
  const [search, setSearch] = useState("");

  const [modalState, setModalState] = useState({ isOpen: false, mode: "incident", initialData: null });
  const [sparqlState, setSparqlState] = useState({ isOpen: false, query: "", title: "" });

  const qRecherche = useDebounce(search).trim();

  // Params pour incidents
  const incidentParams = new URLSearchParams();
  if (typeIncident) incidentParams.set("type", typeIncident);
  if (gravite) incidentParams.set("gravite", gravite);
  if (qRecherche) incidentParams.set("q", qRecherche);
  incidentParams.set("afficher_sparql", "true");

  const incidentsRes = useApi(`/incidents?${incidentParams.toString()}`);
  const incidentStatsRes = useApi("/incidents/stats");
  const pannesEquipementRes = useApi("/incidents/pannes-par-equipement?afficher_sparql=true");

  // Params pour maintenances
  const maintParams = new URLSearchParams();
  if (qRecherche) maintParams.set("q", qRecherche);
  maintParams.set("afficher_sparql", "true");

  const maintenancesRes = useApi(`/maintenances?${maintParams.toString()}`);
  const maintenanceStatsRes = useApi("/maintenances/stats");

  const incidents = incidentsRes.data?.resultats || [];
  const maintenances = maintenancesRes.data?.resultats || [];
  const pannesGroupes = pannesEquipementRes.data?.resultats || [];

  const incStats = incidentStatsRes.data || { total: 0, parType: {}, parGravite: {} };
  const maintStats = maintenanceStatsRes.data || { total: 0, parType: {} };

  // Handlers CRUD Incidents
  const handleSaveIncident = async (data) => {
    if (data.id && modalState.initialData?.id) {
      await incidentApi.modifier(data.id, data);
    } else {
      await incidentApi.creer(data);
    }
  };

  const handleDeleteIncident = async (id) => {
    if (window.confirm(`Confirmer la suppression de l'incident ${id} ?`)) {
      await incidentApi.supprimer(id);
    }
  };

  // Handlers CRUD Maintenances
  const handleSaveMaintenance = async (data) => {
    if (data.id && modalState.initialData?.id) {
      await maintenanceApi.modifier(data.id, data);
    } else {
      await maintenanceApi.creer(data);
    }
  };

  const handleDeleteMaintenance = async (id) => {
    if (window.confirm(`Confirmer la suppression de la maintenance ${id} ?`)) {
      await maintenanceApi.supprimer(id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Entête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-card/50 text-rose-500 border border-border">
              <ShieldAlert className="w-5 h-5" />
            </div>
            Incidents & Maintenances
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Supervision des pannes, alertes et surcharges avec suivi temporel des interventions de maintenance.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">

          <button
            type="button"
            onClick={() => setModalState({ isOpen: true, mode: "incident", initialData: null })}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-sm transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            Signaler un incident
          </button>
        </div>
      </div>

      {/* Cartes KPI Synthétiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Pannes */}
        <div
          onClick={() => { setActiveTab("incidents"); setTypeIncident("Panne"); }}
          className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-1 cursor-pointer transition-all hover:border-rose-500/50 hover:shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Pannes
            </span>
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-300">
            {incStats.parType?.Panne || 0}
          </div>
          <p className="text-[11px] text-muted-foreground">Avaries matérielles bloquantes</p>
        </div>

        {/* Alertes */}
        <div
          onClick={() => { setActiveTab("incidents"); setTypeIncident("Alerte"); }}
          className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1 cursor-pointer transition-all hover:border-amber-500/50 hover:shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Alertes
            </span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300">
            {incStats.parType?.Alerte || 0}
          </div>
          <p className="text-[11px] text-muted-foreground">Seuils et pré-alarmes réseau</p>
        </div>

        {/* Surcharges (Violet) */}
        <div
          onClick={() => { setActiveTab("incidents"); setTypeIncident("Surcharge"); }}
          className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-1 cursor-pointer transition-all hover:border-purple-500/50 hover:shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Surcharges
            </span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-700 dark:text-purple-300">
            {incStats.parType?.Surcharge || 0}
          </div>
          <p className="text-[11px] text-muted-foreground">Pics d'appel et transit de courant</p>
        </div>

        {/* Maintenances */}
        <div
          onClick={() => setActiveTab("maintenances")}
          className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-1 cursor-pointer transition-all hover:border-sky-500/50 hover:shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              Maintenances
            </span>
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600">
              <Wrench className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-sky-700 dark:text-sky-300">
            {maintStats.total || 0}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {maintStats.parType?.Inspection || 0} inspections, {maintStats.parType?.MaintenanceCorrective || 0} corr.
          </p>
        </div>
      </div>

      {/* Navigation Onglets */}
      <div className="flex items-center justify-between border-b border-border gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("tous")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "tous"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("incidents")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "incidents"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Incidents ({incidents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pannes-equipement")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "pannes-equipement"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pannes par équipement
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("maintenances")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "maintenances"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Timeline & Calendrier ({maintenances.length})
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="relative min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Rechercher par libellé, équipement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeTab === "tous" && (
        <div className="space-y-6">
          {/* Section Pannes par équipement */}
          <PannesEquipementCard pannesGroupes={pannesGroupes} />

          {/* Section Tableau des Incidents récents avec Badges */}
          <Card variant="glass" className="border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    Incidents récents du réseau
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Signalements et anomalies enregistrés sur les équipements et le réseau.
                  </CardDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("incidents")}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Tout afficher &rarr;
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Désignation</TableHead>
                      <TableHead>Composant affecté</TableHead>
                      <TableHead>Gravité</TableHead>
                      <TableHead>Date d'occurrence</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.slice(0, 5).map((inc) => (
                      <TableRow key={inc.id}>
                        <TableCell>
                          <IncidentBadge type={inc.type} />
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground text-xs">{inc.nom}</div>
                          <div className="text-[11px] text-muted-foreground line-clamp-1">{inc.description}</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted font-bold text-foreground">
                            {inc.affecteNom || inc.affecte || "Réseau"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <GraviteBadge gravite={inc.gravite} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {inc.dateOccurrence
                            ? new Date(inc.dateOccurrence).toLocaleString("fr-FR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setModalState({ isOpen: true, mode: "incident", initialData: inc })
                              }
                              className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteIncident(inc.id)}
                              className="p-1 text-muted-foreground hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Section Timeline des Maintenances */}
          <MaintenanceTimeline
            maintenances={maintenances}
            onCreer={() => setModalState({ isOpen: true, mode: "maintenance", initialData: null })}
            onModifier={(m) => setModalState({ isOpen: true, mode: "maintenance", initialData: m })}
            onSupprimer={handleDeleteMaintenance}
          />
        </div>
      )}

      {activeTab === "incidents" && (
        <Card variant="glass" className="border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold text-foreground">
                  Registre des Incidents ({incidents.length})
                </CardTitle>

              </div>

              {/* Filtres Type et Gravité */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center rounded-xl border border-border p-1 bg-card/60">
                  {["", "Panne", "Alerte", "Surcharge"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTypeIncident(t)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        typeIncident === t
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t || "Tous types"}
                    </button>
                  ))}
                </div>

                <select
                  value={gravite}
                  onChange={(e) => setGravite(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-xl bg-card border border-border text-foreground focus:outline-none"
                >
                  <option value="">Toutes gravités</option>
                  <option value="Critique">Critique</option>
                  <option value="Élevée">Élevée</option>
                  <option value="Moyenne">Moyenne</option>
                  <option value="Faible">Faible</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Identifiant</TableHead>
                    <TableHead>Intitulé & Description</TableHead>
                    <TableHead>Composant affecté</TableHead>
                    <TableHead>Gravité</TableHead>
                    <TableHead>Capteur détecteur</TableHead>
                    <TableHead>Date d'occurrence</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">
                        Aucun incident ne correspond aux filtres appliqués.
                      </TableCell>
                    </TableRow>
                  ) : (
                    incidents.map((inc) => (
                      <TableRow key={inc.id}>
                        <TableCell>
                          <IncidentBadge type={inc.type} />
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-foreground">
                          {inc.id}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-foreground text-xs">{inc.nom}</div>
                          <div className="text-[11px] text-muted-foreground max-w-md">{inc.description}</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted font-bold text-foreground">
                            {inc.affecteNom || inc.affecte || "Réseau"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <GraviteBadge gravite={inc.gravite} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {inc.detecteParNom || inc.detectePar || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {inc.dateOccurrence
                            ? new Date(inc.dateOccurrence).toLocaleString("fr-FR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setModalState({ isOpen: true, mode: "incident", initialData: inc })
                              }
                              className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Modifier"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteIncident(inc.id)}
                              className="p-1 text-muted-foreground hover:text-rose-500 cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "pannes-equipement" && (
        <PannesEquipementCard pannesGroupes={pannesGroupes} />
      )}

      {activeTab === "maintenances" && (
        <MaintenanceTimeline
          maintenances={maintenances}
          onCreer={() => setModalState({ isOpen: true, mode: "maintenance", initialData: null })}
          onModifier={(m) => setModalState({ isOpen: true, mode: "maintenance", initialData: m })}
          onSupprimer={handleDeleteMaintenance}
        />
      )}

      {/* Modal Création / Modification */}
      <IncidentModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        initialData={modalState.initialData}
        onClose={() => setModalState({ isOpen: false, mode: "incident", initialData: null })}
        onSubmit={modalState.mode === "maintenance" ? handleSaveMaintenance : handleSaveIncident}
      />


    </div>
  );
}

