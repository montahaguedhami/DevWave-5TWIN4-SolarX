import { SMART_ADVISOR_DATA } from "@/data/dashboard";
import { Sparkles, ArrowRight, Lightbulb, Zap } from "lucide-react";
import { Link } from "react-router-dom";
function SmartAdvisorCard() {
  const { title, insight, recommendation, actionText } = SMART_ADVISOR_DATA;
  return <div className="bg-gradient-to-br from-primary/10 via-card to-indigo-950 text-foreground rounded-2xl border border-blue-800/50 p-6 shadow-md hover:shadow-lg transition-all h-full flex flex-col justify-between relative overflow-hidden group">
      {
    /* Background Decorative Glow */
  }
      <div className="absolute -right-12 -top-12 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-400/30 transition-all duration-500 pointer-events-none" />

      <div>
        {
    /* Title and Sparkle Badge */
  }
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 border border-primary/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-pulse text-primary" />
            </div>
            <h3 className="font-bold text-xl tracking-tight text-foreground">
              {title}
            </h3>
          </div>

          <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <Zap className="w-3 h-3 text-primary" /> AI Insight
          </span>
        </div>

        {
    /* Insight Box */
  }
        <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 border border-border mb-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground leading-relaxed">
                "{insight}"
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-normal">
                {recommendation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {
    /* Action Button */
  }
      <div className="pt-2">
        <Link
    to="/ai-advisor"
    className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-foreground font-semibold text-xs transition-all shadow-sm group/btn cursor-pointer"
  >
          <span>{actionText}</span>
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>;
}
export {
  SmartAdvisorCard
};
