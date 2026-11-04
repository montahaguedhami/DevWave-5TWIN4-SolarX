import { AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { API_URL } from "@/services/stockage-api";

export function LoadingState({ label = "Chargement des données de l'ontologie…" }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-10 justify-center">
      <Loader2 className="w-4 h-4 animate-spin" /> {label}
    </div>
  );
}

export function ErrorState({ error }) {
  return (
    <Card expandable={false} className="border-red-500/40">
      <CardContent className="p-5 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div className="text-sm space-y-1">
          <div className="font-semibold text-foreground">Impossible de charger les données</div>
          <div className="text-muted-foreground">{error?.message}</div>
          <div className="text-muted-foreground text-xs">
            Vérifiez que le serveur de données SolarX est accessible sur <code>{API_URL}</code>.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
