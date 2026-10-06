import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import ServiceTile from '../common/ServiceTile.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';
import { SVCS } from '../../data/constants.js';
import { todaySum, todayCount, isActive } from '../../data/selectors.js';
import { inrS } from '../../utils/format.js';

export default function ServiceHealth() {
  const { db } = useAdmin();
  const nav = useNavigate();
  const tot = SVCS.reduce((a, s) => a + todaySum(db, s.id), 0) || 1;

  return (
    <div className="health">
      {SVCS.map((s) => {
        const g = todaySum(db, s.id);
        const c = todayCount(db, s.id);
        const a = db.orders.filter((o) => o.svc === s.id && isActive(o)).length;
        return (
          <button key={s.id} onClick={() => nav('/services/' + s.id)}>
            <ServiceTile svc={s.id} size="sm" />
            <div style={{ minWidth: 0 }}>
              <div className="hn">
                <span>{s.name}</span>
                <span className="num">{inrS(g)}</span>
              </div>
              <div className="share" style={{ '--c': `var(--s-${s.id})` }}>
                <i style={{ width: (g / tot) * 100 + '%' }} />
              </div>
              <div className="hs">
                <span>
                  {c} {s.units.toLowerCase()} · {a} active
                </span>
                <span>{db.paused[s.id] ? <b style={{ color: 'var(--warn)' }}>Paused</b> : Math.round((g / tot) * 100) + '% share'}</span>
              </div>
            </div>
            <Icon name="chev" size={16} />
          </button>
        );
      })}
    </div>
  );
}
