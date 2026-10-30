import { useEffect, useState } from "react";
import { Bot, Lightbulb, Loader2, RefreshCw, Send, Sparkles, Sun, Wind, X, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { meteoApi } from "@/services/semantic-api";

const POTENTIEL_STYLE = {
  Élevé: { text: "text-emerald-500", bar: "bg-emerald-500", box: "border-emerald-500/40 bg-emerald-500/10" },
  Moyen: { text: "text-amber-500", bar: "bg-amber-500", box: "border-amber-500/40 bg-amber-500/10" },
  Faible: { text: "text-rose-500", bar: "bg-rose-500", box: "border-rose-500/40 bg-rose-500/10" },
};

function Liste({ icon: Icon, titre, items }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-[var(--primary)]" /> {titre}
      </p>
      <ul className="space-y-1 pl-5 list-disc text-xs text-muted-foreground">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

export function MeteoAssistant({ villeId, dateMesure }) {
  const [ouvert, setOuvert] = useState(false);
  const [analyse, setAnalyse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [question, setQuestion] = useState("");

  const analyser = async (q) => {
    setLoading(true);
    setError(null);
    try {
      setAnalyse(await meteoApi.assistant(villeId, q));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // A new city or new weather closes the assistant: it only runs on demand.
  useEffect(() => {
    setOuvert(false);
    setAnalyse(null);
    setError(null);
    setQuestion("");
  }, [villeId, dateMesure]);

  const ouvrir = () => {
    setOuvert(true);
    analyser();
  };

  const poser = (e) => {
    e.preventDefault();
    if (question.trim()) analyser(question.trim());
  };

  const style = POTENTIEL_STYLE[analyse?.potentiel] || POTENTIEL_STYLE.Moyen;
  const ind = analyse?.indicateurs;

  if (!ouvert) {
    return (
      <div className="flex justify-end">
        <Button onClick={ouvrir} size="lg">
          <Sparkles /> Assistant IA
        </Button>
      </div>
    );
  }

  return (
    <Card variant="glass" expandable={false}>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--primary)]" /> Assistant IA énergie
          </CardTitle>
          <CardDescription className="text-xs">
            Potentiel de production, conséquences de la météo et conseils.
            {analyse && (
              <span className="ml-1">
                · {analyse.modele === "analyse-locale" ? "Analyse automatique (IA indisponible)" : `Gemini ${analyse.modele}`}
                {analyse.secours && analyse.modele !== "analyse-locale" ? " (modèle de secours)" : ""}
              </span>
            )}
          </CardDescription>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => analyser()} disabled={loading} aria-label="Relancer l'analyse">
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setOuvert(false)} aria-label="Fermer l'assistant">
            <X />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !analyse && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> L'assistant analyse la météo...
          </p>
        )}
        {error && <p className="text-sm text-rose-500">{error}</p>}

        {analyse && (
          <>
            <div className={`p-4 rounded-2xl border ${style.box} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Zap className={`w-4 h-4 ${style.text}`} /> Potentiel énergétique :{" "}
                  <span className={style.text}>{analyse.potentiel}</span>
                </span>
                <span className={`text-2xl font-extrabold ${style.text}`}>{analyse.score}/100</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${style.bar}`} style={{ width: `${analyse.score}%` }} />
              </div>
              <p className="text-sm text-foreground">{analyse.resume}</p>
              {analyse.meilleurCreneau && (
                <p className="text-xs text-muted-foreground">Meilleur créneau de production : {analyse.meilleurCreneau}</p>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                ["Soleil prévu (24 h)", `${ind.irradiation24hKWhM2} kWh/m²`],
                ["Pic de rayonnement", `${ind.picRayonnement} W/m²${ind.heurePic ? ` à ${ind.heurePic}` : ""}`],
                ["Heures ensoleillées", `${ind.heuresEnsoleillees} h`],
                ["Vent moyen / max", `${ind.ventMoyen} / ${ind.ventMax} m/s`],
              ].map(([label, value]) => (
                <div key={label} className="p-2.5 rounded-xl border border-border bg-card/50">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>

            {ind.installations.some((i) => i.productionEstimeeKWh != null) && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Production estimée des installations de la ville (24 h)</p>
                {ind.installations
                  .filter((i) => i.productionEstimeeKWh != null)
                  .map((i) => (
                    <p key={i.nom}>
                      {i.nom.replaceAll("_", " ")} ({i.puissanceKW} kW) : <b className="text-foreground">{i.productionEstimeeKWh} kWh</b>
                    </p>
                  ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Liste icon={Sun} titre="Impact sur le solaire" items={analyse.impactsSolaire} />
              <Liste icon={Wind} titre="Impact sur l'éolien" items={analyse.impactsEolien} />
              <Liste icon={Lightbulb} titre="Conseils" items={analyse.conseils} />
            </div>

            {analyse.reponse && (
              <div className="p-3 rounded-xl border border-border bg-card/50 text-sm flex gap-2">
                <Bot className="w-4 h-4 mt-0.5 shrink-0 text-[var(--primary)]" />
                <p className="text-foreground">{analyse.reponse}</p>
              </div>
            )}
          </>
        )}

        <form onSubmit={poser} className="flex gap-2">
          <Input
            value={question}
            maxLength={500}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Posez une question (ex. : puis-je lancer la pompe cet après-midi ?)"
          />
          <Button type="submit" disabled={loading || !question.trim()}>
            {loading ? <Loader2 className="animate-spin" /> : <Send />} Demander
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
