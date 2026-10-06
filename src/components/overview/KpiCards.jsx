import React from 'react';
import Delta from '../common/Delta.jsx';
import Sparkline from '../common/Sparkline.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';
import { SVCS, CHART_ORDER } from '../../data/constants.js';
import { dailyAt, countAt, sumRange, rangeInfo, isActive } from '../../data/selectors.js';
import { inrS } from '../../utils/format.js';

export default function KpiCards() {
  const { db, ui } = useAdmin();
  const { n, label } = rangeInfo(ui.range);

  const yesterday = (key) => (SVCS.reduce((a, s) => a + db[key][s.id][58], 0) / 1.9) * 0.94;
  const gov = sumRange(db, dailyAt, n);
  const govP = n === 1 ? yesterday('daily') : sumRange(db, dailyAt, n, n);
  const cnt = sumRange(db, countAt, n);
  const cntP = n === 1 ? yesterday('counts') : sumRange(db, countAt, n, n);

  const sp = [];
  const spc = [];
  const len = n === 1 ? 14 : n;
  for (let i = 59 - len + 1; i <= 59; i++) {
    sp.push(SVCS.reduce((a, s) => a + dailyAt(db, s.id, i), 0));
    spc.push(SVCS.reduce((a, s) => a + countAt(db, s.id, i), 0));
  }

  const ver = db.partners.filter((p) => p.kyc === 'Verified');
  const on = ver.filter((p) => p.online).length;
  const act = db.orders.filter(isActive);
  const need = act.filter((o) => !o.partner).length;
  const stackFoot = { flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-end', gap: 6 };

  return (
    <section className="kpis">
      <div className="card kpi">
        <span className="lab">Gross order value</span>
        <span className="val">{inrS(gov)}</span>
        <div className="foot">
          <Delta cur={gov} prev={govP} label={label} />
          <Sparkline values={sp} />
        </div>
      </div>
      <div className="card kpi">
        <span className="lab">{ui.range === 'today' ? 'Orders today' : 'Orders'}</span>
        <span className="val">{cnt.toLocaleString('en-IN')}</span>
        <div className="foot">
          <Delta cur={cnt} prev={cntP} label={label} />
          <Sparkline values={spc} />
        </div>
      </div>
      <div className="card kpi">
        <span className="lab">Partners online</span>
        <span className="val">
          {on}
          <span className="muted" style={{ fontSize: 16 }}> / {ver.length}</span>
        </span>
        <div className="foot" style={stackFoot}>
          <span className="muted" style={{ fontSize: 12.5 }}>
            {Math.round((on / ver.length) * 100)}% of verified partners
          </span>
          <div className="meter">
            <i style={{ width: (on / ver.length) * 100 + '%', background: 'var(--green)' }} />
          </div>
        </div>
      </div>
      <div className="card kpi">
        <span className="lab">Active right now</span>
        <span className="val">{act.length}</span>
        <div className="foot" style={stackFoot}>
          <span className={need ? '' : 'muted'} style={{ fontSize: 12.5, ...(need ? { color: 'var(--warn)', fontWeight: 700 } : {}) }}>
            {need ? need + ' waiting for a partner' : 'All assigned'}
          </span>
          <div className="meter" title="Active by service">
            {CHART_ORDER.map((k) => {
              const c = act.filter((o) => o.svc === k).length;
              return c ? <i key={k} style={{ flex: c, background: `var(--s-${k})` }} /> : null;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
