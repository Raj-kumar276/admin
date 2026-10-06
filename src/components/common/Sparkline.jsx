import React from 'react';

/** Small area + line trend used in KPI cards. */
export default function Sparkline({ values }) {
  const w = 96;
  const h = 36;
  const mx = Math.max(...values, 1);
  const mn = Math.min(...values, 0);
  const pts = values.map((v, i) => [(i / (values.length - 1 || 1)) * (w - 6) + 3, h - 4 - ((v - mn) / (mx - mn || 1)) * (h - 10)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={`${d} L${last[0].toFixed(1)} ${h} L3 ${h}Z`} fill="var(--green)" fillOpacity=".16" />
      <path d={d} fill="none" stroke="var(--green-ink)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="var(--green-ink)" stroke="var(--surface)" strokeWidth="2" />
    </svg>
  );
}
