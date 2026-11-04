// Jauge demi-cercle : taux de remplissage du stockage (énergie stockée / capacité)
function CapacityGauge({ percent = 0, label, sublabel, size = 220 }) {
  const p = Math.min(Math.max(percent, 0), 100);
  const r = 80;
  const circ = Math.PI * r; // longueur du demi-cercle
  const color = p < 25 ? "#ef4444" : p < 50 ? "#f59e0b" : "#22c55e";
  return (
    <div className="flex flex-col items-center select-none">
      <svg width={size} height={size * 0.6} viewBox="0 0 200 120" role="img" aria-label={`Remplissage ${p}%`}>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--muted)" strokeWidth="16" strokeLinecap="round" />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${(p / 100) * circ} ${circ}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x="100" y="88" textAnchor="middle" className="fill-foreground" style={{ fontSize: 30, fontWeight: 800 }}>
          {p.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}%
        </text>
        <text x="100" y="110" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10 }}>
          {label}
        </text>
      </svg>
      {sublabel && <div className="text-xs text-muted-foreground -mt-1">{sublabel}</div>}
    </div>
  );
}

export { CapacityGauge as default };
