// Carte des lignes : chaque ligne est tracée entre les villes de ses installations (relie)
// et de ses consommateurs (dessert). Les coordonnées viennent de la partie Localisation
// (situeDans -> latitude / longitude), lues sans être modifiées. Sans ville dans l'ontologie,
// l'API déduit le lieu du stockage associé (lieuDeduit) : la carte le montre en plus clair.
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import { MapPin } from "lucide-react";
import { TYPE_COLOR, TYPE_LABEL, nomDe, formatKv, label } from "@/components/reseau/ui";

const TUNISIE = [34.2, 9.6];
// Plus la tension est haute, plus le trait et le cercle sont épais : les lignes d'une même ville restent visibles
const EPAISSEUR = { LigneHauteTension: 6, LigneMoyenneTension: 4, LigneBasseTension: 3 };
const RAYON = { LigneHauteTension: 18, LigneMoyenneTension: 12, LigneBasseTension: 7 };

// Lieux distincts d'une ligne : installations d'abord, puis consommateurs
function lieux(l) {
  const out = new Map();
  for (const x of [...l.relie, ...l.dessert]) {
    if (x.latitude != null && x.longitude != null && !out.has(x.ville)) {
      out.set(x.ville, { ville: x.villeNom || label(x.ville), pos: [x.latitude, x.longitude], deduit: !!x.lieuDeduit });
    }
  }
  return [...out.values()];
}

export function CarteLignes({ lignes, onSelect }) {
  const placees = lignes.map((l) => ({ l, lieux: lieux(l) })).filter((p) => p.lieux.length > 0);
  const nonPlacees = lignes.filter((l) => lieux(l).length === 0);

  // Villes à afficher, avec ce qui s'y trouve
  const villes = new Map();
  for (const l of lignes) {
    for (const x of [...l.relie, ...l.dessert]) {
      if (x.latitude == null) continue;
      const v = villes.get(x.ville) || { nom: x.villeNom || label(x.ville), pos: [x.latitude, x.longitude], elements: new Set(), deduit: true };
      v.elements.add(x.lieuDeduit ? `${nomDe(x)} (lieu déduit de ${x.stockageNom || label(x.stockage)})` : nomDe(x));
      v.deduit = v.deduit && !!x.lieuDeduit;
      villes.set(x.ville, v);
    }
  }
  const points = [...villes.values()].map((v) => v.pos);
  const vue = points.length > 1 ? { bounds: points, boundsOptions: { padding: [40, 40] } } : { center: points[0] || TUNISIE, zoom: points.length ? 8 : 6 };

  return (
    <div className="space-y-3">
      {/* isolate : les calques Leaflet restent sous le panneau de détail */}
      <div className="isolate h-[380px] w-full overflow-hidden rounded-xl border border-border">
        <MapContainer key={points.join("|")} {...vue} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {placees.map(({ l, lieux: ls }) => {
            const deduit = ls.some((x) => x.deduit);
            const style = { color: TYPE_COLOR[l.type], weight: EPAISSEUR[l.type] || 3, opacity: deduit ? 0.45 : 0.85 };
            const bulle = (
              <Tooltip sticky>
                <b>{nomDe(l)}</b> · {TYPE_LABEL[l.type]} · {formatKv(l.tensionKV)}
                <br />
                {ls.map((x) => x.ville).join(" → ")} · {l.etat}{deduit && " · lieu déduit du stockage"}
              </Tooltip>
            );
            const events = { click: () => onSelect(l.id) };
            return ls.length > 1 ? (
              <Polyline key={l.id} positions={ls.map((x) => x.pos)} pathOptions={{ ...style, dashArray: l.etat === "En panne" ? "8 8" : undefined }} eventHandlers={events}>
                {bulle}
              </Polyline>
            ) : (
              // Tous les éléments de la ligne sont dans la même ville : un anneau autour de la ville
              <CircleMarker key={l.id} center={ls[0].pos} radius={RAYON[l.type] || 8} pathOptions={{ ...style, fillOpacity: 0, dashArray: l.etat === "En panne" ? "4 4" : undefined }} eventHandlers={events}>
                {bulle}
              </CircleMarker>
            );
          })}
          {[...villes.values()].map((v) => (
            <CircleMarker key={v.nom} center={v.pos} radius={4} pathOptions={{ color: v.deduit ? "#94a3b8" : "#0f172a", fillColor: "#ffffff", fillOpacity: 1, weight: 2 }}>
              <Tooltip direction="top" offset={[0, -6]}>
                <b>{v.nom}</b>
                <br />
                {[...v.elements].join(", ")}
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {Object.entries(TYPE_COLOR).map(([t, c]) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className="inline-block w-5 rounded-full" style={{ background: c, height: (EPAISSEUR[t] || 3) }} /> {TYPE_LABEL[t]}
          </span>
        ))}
        <span>Pointillés : ligne en panne · Anneau : ligne dans une seule ville · Plus clair : lieu déduit du stockage associé</span>
      </div>

      {nonPlacees.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground flex gap-2">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Non placées sur la carte (ni ville ni stockage localisé pour leurs installations et consommateurs) :{" "}
            {nonPlacees.map((l, i) => (
              <span key={l.id}>
                {i > 0 && ", "}
                <button type="button" onClick={() => onSelect(l.id)} className="font-medium text-foreground underline-offset-2 hover:underline cursor-pointer">
                  {nomDe(l)}
                </button>
              </span>
            ))}
          </span>
        </div>
      )}
    </div>
  );
}
