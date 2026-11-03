// Schéma du flux d'énergie d'un réseau : Installations --relie--> Lignes --dessert--> Consommateurs.
// C'est le graphe RDF du réseau : chaque trait est un triplet de l'ontologie.
import { TYPE_COLOR, TYPE_LABEL, nomDe, formatKv, label } from "@/components/reseau/ui";

const W = 960;
const NOEUD = { w: 230, h: 46 };
const ECART = 14;
const HAUT = 34; // place des titres de colonnes
const COLONNES = [
  { x: 0, titre: "Installations", couleur: "#0ea5e9", vide: "Aucune installation reliée" },
  { x: (W - NOEUD.w) / 2, titre: "Lignes", vide: "Aucune ligne" },
  { x: W - NOEUD.w, titre: "Consommateurs", couleur: "#10b981", vide: "Aucun consommateur desservi" },
];

const court = (t, n = 28) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

// Éléments distincts, dans l'ordre de la première ligne qui les cite (moins de croisements)
function distincts(lignes, cle) {
  const out = new Map();
  for (const l of lignes) for (const x of l[cle]) if (!out.has(x.id)) out.set(x.id, x);
  return [...out.values()];
}

function placer(items, hauteur) {
  const total = items.length * NOEUD.h + Math.max(items.length - 1, 0) * ECART;
  const y0 = HAUT + (hauteur - HAUT - total) / 2;
  return new Map(items.map((x, i) => [x.id, y0 + i * (NOEUD.h + ECART)]));
}

function Noeud({ x, y, couleur, titre, sousTitre, onClick }) {
  return (
    <g transform={`translate(${x},${y})`} onClick={onClick} className={onClick ? "cursor-pointer" : undefined}>
      <rect width={NOEUD.w} height={NOEUD.h} rx={10} style={{ fill: "var(--card)", stroke: couleur, strokeWidth: 1.5 }} />
      <rect width={5} height={NOEUD.h} rx={2.5} style={{ fill: couleur }} />
      <text x={16} y={19} fontSize={13} fontWeight={600} style={{ fill: "var(--foreground)" }}>
        {court(titre)}
        <title>{titre}</title>
      </text>
      <text x={16} y={36} fontSize={11} style={{ fill: "var(--muted-foreground)" }}>{sousTitre}</text>
    </g>
  );
}

export function SchemaFlux({ lignes, onSelect }) {
  const installations = distincts(lignes, "relie");
  const consommateurs = distincts(lignes, "dessert");
  const max = Math.max(installations.length, lignes.length, consommateurs.length, 1);
  const hauteur = HAUT + max * NOEUD.h + (max - 1) * ECART + 8;

  const yInst = placer(installations, hauteur);
  const yLigne = placer(lignes, hauteur);
  const yCons = placer(consommateurs, hauteur);
  const [cI, cL, cC] = COLONNES;

  const lien = (x1, y1, x2, y2) => {
    const m = (x1 + x2) / 2;
    return `M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}`;
  };

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${hauteur}`} className="w-full min-w-[720px]" role="img" aria-label="Flux d'énergie du réseau">
        {COLONNES.map((c) => (
          <text key={c.titre} x={c.x + NOEUD.w / 2} y={14} textAnchor="middle" fontSize={11} fontWeight={700} letterSpacing={1} style={{ fill: "var(--muted-foreground)" }}>
            {c.titre.toUpperCase()}
          </text>
        ))}

        {/* Traits d'abord, pour qu'ils passent sous les nœuds */}
        {lignes.map((l) => {
          const y = yLigne.get(l.id) + NOEUD.h / 2;
          const style = { fill: "none", stroke: TYPE_COLOR[l.type], strokeWidth: 2, opacity: 0.7 };
          return (
            <g key={l.id} strokeDasharray={l.etat === "En panne" ? "6 5" : undefined}>
              {l.relie.map((x) => (
                <path key={x.id} d={lien(cI.x + NOEUD.w, yInst.get(x.id) + NOEUD.h / 2, cL.x, y)} style={style} />
              ))}
              {l.dessert.map((x) => (
                <path key={x.id} d={lien(cL.x + NOEUD.w, y, cC.x, yCons.get(x.id) + NOEUD.h / 2)} style={style} />
              ))}
            </g>
          );
        })}

        {installations.map((x) => (
          <Noeud key={x.id} x={cI.x} y={yInst.get(x.id)} couleur={cI.couleur} titre={nomDe(x)} sousTitre={label(x.type)} />
        ))}
        {lignes.map((l) => (
          <Noeud
            key={l.id}
            x={cL.x}
            y={yLigne.get(l.id)}
            couleur={TYPE_COLOR[l.type]}
            titre={nomDe(l)}
            sousTitre={`${TYPE_LABEL[l.type] || l.type} · ${formatKv(l.tensionKV)}${l.etat !== "Fonctionnel" ? ` · ${l.etat}` : ""}`}
            onClick={() => onSelect(l.id)}
          />
        ))}
        {consommateurs.map((x) => (
          <Noeud key={x.id} x={cC.x} y={yCons.get(x.id)} couleur={cC.couleur} titre={nomDe(x)} sousTitre={label(x.type)} />
        ))}

        {[[cI, installations], [cL, lignes], [cC, consommateurs]].map(([c, items]) =>
          items.length === 0 ? (
            <text key={c.titre} x={c.x + NOEUD.w / 2} y={hauteur / 2 + 4} textAnchor="middle" fontSize={12} fontStyle="italic" style={{ fill: "var(--muted-foreground)" }}>
              {c.vide}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}
