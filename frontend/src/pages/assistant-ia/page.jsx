import { useState } from "react";
import { Sparkles, Send, Loader2, ListTree, MessageSquareText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorState } from "@/components/solarx/api-state";
import { API_URL, useApi } from "@/services/solarx-api";

const formatCell = (v) => {
  if (v == null) return "—";
  if (typeof v === "number") return v.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  return String(v);
};

async function askQuestion(question) {
  const res = await fetch(`${API_URL}/api/ia/question`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = Array.isArray(body.detail) ? body.detail.map((d) => d.msg).join(", ") : body.detail;
    throw new Error(detail || `Erreur ${res.status}`);
  }
  return res.json();
}

function ResultsTable({ colonnes, resultats }) {
  if (!resultats.length) {
    return <div className="text-sm text-muted-foreground py-4 text-center">Aucun résultat.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {colonnes.map((c) => <TableHead key={c} className="whitespace-nowrap">{c}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {resultats.map((row, i) => (
            <TableRow key={i}>
              {colonnes.map((c) => (
                <TableCell key={c} className={typeof row[c] === "number" ? "font-mono text-right" : ""}>
                  {formatCell(row[c])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AssistantIaPage() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const examples = useApi("/api/ia/exemples");

  const submit = async (q = question) => {
    const text = q.trim();
    if (text.length < 2 || loading) return;
    setQuestion(text);
    setLoading(true);
    setError(null);
    try {
      setResult(await askQuestion(text));
    } catch (e) {
      setError(e);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-card/50 text-[var(--primary)] border border-border">
            <Sparkles className="w-5 h-5" />
          </div>
          Assistant IA
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Posez une question en français : elle est traduite en requête SPARQL et exécutée sur l'ontologie SolarX (Fuseki).
        </p>
      </div>

      <Card expandable={false}>
        <CardContent className="p-5 space-y-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex. : Quelles batteries sont situées à Tunis ?"
              className="h-11 text-base"
              maxLength={300}
              autoFocus
            />
            <Button type="submit" className="h-11 gap-2 px-5" disabled={loading || question.trim().length < 2}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Demander
            </Button>
          </form>
          {examples.data?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {examples.data.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => submit(ex)}
                  className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {error && <ErrorState error={error} />}

      {result && (
        <>
          <Card expandable={false} className="border-primary/30">
            <CardContent className="p-5 flex gap-3">
              <MessageSquareText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-base font-medium text-foreground">{result.reponse}</div>
                {result.remarques?.length > 0 && (
                  <div className="text-xs text-muted-foreground">{result.remarques.join(" ")}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {result.sparql && (
            <Card expandable={false}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ListTree className="w-4 h-4 text-primary" /> Résultats ({result.resultats.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResultsTable colonnes={result.colonnes} resultats={result.resultats} />
              </CardContent>
            </Card>
          )}
        </>
      )}

      <CardDescription className="text-xs">
        Outils NLP : spaCy (fr_core_news_sm), sentence-transformers (Hugging Face), RapidFuzz, rdflib — sans API de LLM.
      </CardDescription>
    </div>
  );
}

export default AssistantIaPage;
