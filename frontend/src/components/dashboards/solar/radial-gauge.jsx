function RadialGauge({
  value,
  max = 100,
  size = 170,
  statusText = "High"
}) {
  const percentage = Math.min(Math.max(value / max * 100, 0), 100);
  const cx = 100;
  const cy = 95;
  const radius = 68;
  const startAngle = -135;
  const endAngle = 135;
  const getCoordinates = (deg, r) => {
    const rad = (deg - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  };
  const ticks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const needleAngle = startAngle + percentage / 100 * (endAngle - startAngle);
  const needleTip = getCoordinates(needleAngle, radius - 12);
  const needleBase1 = getCoordinates(needleAngle + 90, 5);
  const needleBase2 = getCoordinates(needleAngle - 90, 5);
  return <div className="flex flex-col items-center justify-center relative select-none">
      <svg
    width={size}
    height={size * 0.72}
    viewBox="0 0 200 145"
    className="overflow-visible"
  >
        <defs>
          <linearGradient id="gaugeGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {
    /* Outer Track Arc */
  }
        {
    /* Red segment: 0-30 */
  }
        <path
    d="M 28 115 A 72 72 0 0 1 58 48"
    fill="none"
    stroke="#f97316"
    strokeWidth="10"
    strokeLinecap="round"
  />
        {
    /* Yellow/Orange segment: 30-50 */
  }
        <path
    d="M 58 48 A 72 72 0 0 1 100 23"
    fill="none"
    stroke="#f59e0b"
    strokeWidth="10"
  />
        {
    /* Green segment: 50-80 */
  }
        <path
    d="M 100 23 A 72 72 0 0 1 155 58"
    fill="none"
    stroke="#10b981"
    strokeWidth="10"
  />
        {
    /* Red segment: 80-100 */
  }
        <path
    d="M 155 58 A 72 72 0 0 1 172 115"
    fill="none"
    stroke="#ef4444"
    strokeWidth="10"
    strokeLinecap="round"
  />

        {
    /* Ticks and Labels */
  }
        {ticks.map((t) => {
    const angle = startAngle + t / 100 * (endAngle - startAngle);
    const outer = getCoordinates(angle, radius + 11);
    const inner = getCoordinates(angle, radius + 5);
    const labelPos = getCoordinates(angle, radius - 16);
    return <g key={t}>
              <line
      x1={inner.x}
      y1={inner.y}
      x2={outer.x}
      y2={outer.y}
      stroke="#94a3b8"
      strokeWidth={t % 20 === 0 ? "1.5" : "1"}
    />
              {t % 30 === 0 || t === 0 || t === 100 ? <text
      x={labelPos.x}
      y={labelPos.y}
      fill="#64748b"
      fontSize="8.5"
      fontWeight="600"
      textAnchor="middle"
      dominantBaseline="middle"
    >
                  {t}
                </text> : null}
            </g>;
  })}

        {
    /* Center Pivot Point */
  }
        <circle cx={cx} cy={cy} r="8" fill="#1e293b" />
        <circle cx={cx} cy={cy} r="4" fill="#38bdf8" />

        {
    /* Needle */
  }
        <polygon
    points={`${needleBase1.x},${needleBase1.y} ${needleTip.x},${needleTip.y} ${needleBase2.x},${needleBase2.y}`}
    fill="#10b981"
    stroke="#064e3b"
    strokeWidth="0.5"
    filter="url(#shadow)"
  />

        {
    /* Digital display inside gauge center */
  }
        <rect
    x={cx - 24}
    y={cy + 12}
    width="48"
    height="18"
    rx="4"
    fill="#f1f5f9"
    stroke="#cbd5e1"
    strokeWidth="1"
  />
        <text
    x={cx}
    y={cy + 24}
    fill="#0f172a"
    fontSize="10"
    fontWeight="700"
    textAnchor="middle"
  >
          {percentage}%
        </text>
      </svg>
    </div>;
}
export {
  RadialGauge
};
