import React, { useLayoutEffect, useRef, useState } from 'react';
import { useAdmin } from '../../context/AdminContext.jsx';
import { SVC, SVCS, CHART_ORDER } from '../../data/constants.js';
import { dailyAt } from '../../data/selectors.js';
import { inr, inrS, niceMax, MON } from '../../utils/format.js';

function chartData(db, range) {
  const labels = [];
  const series = {};
  SVCS.forEach((s) => (series[s.id] = []));
  if (range === 'today') {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const start = now.getTime() - 11 * 3600000;
    for (let i = 0; i < 12; i++) {
      const h = new Date(start + i * 3600000);
      labels.push(h.toLocaleTimeString('en-IN', { hour: 'numeric' }).replace(' ', '').toLowerCase());
      SVCS.forEach((s) => series[s.id].push(0));
    }
    db.orders.forEach((o) => {
      if (o.cancelled) return;
      const i = Math.floor((o.t - start) / 3600000);
      if (i >= 0 && i < 12) series[o.svc][i] += o.amount;
    });
  } else {
    const n = range === '7d' ? 7 : 30;
    for (let i = 60 - n; i < 60; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (59 - i));
      labels.push(i === 59 ? 'Today' : n === 7 ? d.toLocaleDateString('en-IN', { weekday: 'short' }) + ' ' + d.getDate() : d.getDate() + ' ' + MON[d.getMonth()]);
      SVCS.forEach((s) => series[s.id].push(dailyAt(db, s.id, i)));
    }
  }
  return { labels, series };
}

/** Stacked bar chart of order value per service, with a table view toggle. */
export default function OrderValueChart() {
  const { db, ui } = useAdmin();
  const host = useRef(null);
  const tipRef = useRef(null);
  const [W, setW] = useState(600);
  const [hover, setHover] = useState(null);
  const [tipLeft, setTipLeft] = useState(0);

  useLayoutEffect(() => {
    if (!host.current) return;
    const measure = () => setW(Math.max(300, host.current.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host.current);
    return () => ro.disconnect();
  }, [ui.chartTable]);

  const { labels, series } = chartData(db, ui.range);
  const totals = labels.map((_, i) => CHART_ORDER.reduce((a, k) => a + series[k][i], 0));

  const H = 300;
  const m = { l: 54, r: 6, t: 10, b: 28 };
  const n = labels.length;
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const max = niceMax(Math.max(...totals, 1));
  const y = (v) => m.t + ih - (v / max) * ih;
  const band = iw / n;
  const bw = Math.max(5, Math.min(30, band * 0.62));
  const step = Math.ceil(n / (W < 520 ? 5 : 9));

  useLayoutEffect(() => {
    if (hover == null || !tipRef.current) return;
    const cx = m.l + band * hover + band / 2;
    const tw = tipRef.current.offsetWidth;
    let left = cx + 14;
    if (left + tw > W) left = cx - tw - 14;
    setTipLeft(Math.max(0, left));
  }, [hover, W, band, m.l]);

  const legend = (
    <div className="legend">
      {CHART_ORDER.map((k) => (
        <span key={k} style={{ '--c': `var(--s-${k})` }}>
          <i />
          {SVC[k].short} <b>{inrS(series[k].reduce((a, b) => a + b, 0))}</b>
        </span>
      ))}
    </div>
  );

  if (ui.chartTable) {
    return (
      <>
        {legend}
        <div className="chart" ref={host}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: 560 }}>
              <thead>
                <tr>
                  <th>{ui.range === 'today' ? 'Hour' : 'Day'}</th>
                  {CHART_ORDER.map((k) => (
                    <th key={k} className="r">{SVC[k].short}</th>
                  ))}
                  <th className="r">Total</th>
                </tr>
              </thead>
              <tbody>
                {labels.map((l, i) => (
                  <tr key={l + i}>
                    <td>{l}</td>
                    {CHART_ORDER.map((k) => (
                      <td key={k} className="r num">{inr(series[k][i])}</td>
                    ))}
                    <td className="r num">
                      <b>{inr(totals[i])}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  const bars = [];
  labels.forEach((l, i) => {
    const x = m.l + band * i + (band - bw) / 2;
    let acc = 0;
    const topK = [...CHART_ORDER].reverse().find((k) => series[k][i] > 0);
    CHART_ORDER.forEach((k) => {
      const v = series[k][i];
      if (v <= 0) return;
      const y0 = y(acc) - (acc > 0 ? 2 : 0);
      const y1 = y(acc + v);
      acc += v;
      const h = y0 - y1;
      if (h <= 0.4) return;
      if (k === topK) {
        const r = Math.min(4, bw / 2, h);
        bars.push(<path key={k + i} d={`M${x} ${y0}V${y1 + r}Q${x} ${y1} ${x + r} ${y1}H${x + bw - r}Q${x + bw} ${y1} ${x + bw} ${y1 + r}V${y0}Z`} style={{ fill: `var(--s-${k})` }} />);
      } else bars.push(<rect key={k + i} x={x} y={y1} width={bw} height={h} style={{ fill: `var(--s-${k})` }} />);
    });
  });

  return (
    <>
      {legend}
      <div className="chart" ref={host} onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Stacked bar chart of order value by service">
          {[0, 1, 2, 3, 4].map((k) => {
            const yy = y((max * k) / 4);
            return (
              <g key={k}>
                <line className={k ? 'gl' : 'base'} x1={m.l} x2={W - m.r} y1={yy} y2={yy} />
                <text x={m.l - 8} y={yy + 4} textAnchor="end">
                  {k ? inrS((max * k) / 4) : '₹0'}
                </text>
              </g>
            );
          })}
          <rect x={hover == null ? 0 : m.l + band * hover} y={m.t} width={band} height={ih} fill="var(--surface-2)" opacity={hover == null ? 0 : 1} />
          {bars}
          {labels.map((l, i) =>
            i % step === 0 || i === n - 1 ? (
              <text key={'l' + i} x={m.l + band * i + band / 2} y={H - 8} textAnchor="middle">
                {l}
              </text>
            ) : null
          )}
          {labels.map((l, i) => (
            <rect key={'h' + i} x={m.l + band * i} y={m.t} width={band} height={ih} fill="transparent" onMouseMove={() => setHover(i)} onClick={() => setHover(i)} />
          ))}
        </svg>
        {hover != null && (
          <div className="tip" ref={tipRef} style={{ left: tipLeft, top: 8 }}>
            <b>{labels[hover]}</b>
            {[...CHART_ORDER].reverse().map((k) => (
              <div key={k} style={{ '--c': `var(--s-${k})` }}>
                <span>
                  <i />
                  {SVC[k].short}
                </span>
                <span className="num">{inr(series[k][hover])}</span>
              </div>
            ))}
            <div className="tot">
              <span>Total</span>
              <span className="num">{inr(totals[hover])}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
