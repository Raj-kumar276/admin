import React from 'react';
import Icon from '../common/Icon.jsx';
import { StatusPill } from '../common/Pills.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';
import { SVC } from '../../data/constants.js';
import { filterOrders, isActive } from '../../data/selectors.js';
import { partnerOf } from '../../data/generators.js';
import { ago, inr } from '../../utils/format.js';

export default function OrdersTab({ svcId: id }) {
  const { db, ui, setUi, openOrder } = useAdmin();
  const s = SVC[id];
  const mine = db.orders.filter((o) => o.svc === id);
  const chips = [['all', 'All', mine.length]]
    .concat(s.statuses.map((st, i) => [String(i), st, mine.filter((o) => !o.cancelled && o.idx === i).length]))
    .concat([['x', 'Cancelled', mine.filter((o) => o.cancelled).length]]);
  const rows = filterOrders(db, id, ui.st[id], ui.q[id]);

  return (
    <>
      <div className="toolbar">
        <div className="row">
          {chips.map(([k, l, c]) => (
            <button
              key={k}
              className="chip"
              aria-pressed={ui.st[id] === k}
              onClick={() => {
                ui.st[id] = k;
                setUi({});
              }}
            >
              {l} <b>{c}</b>
            </button>
          ))}
        </div>
        <div className="lsearch">
          <Icon name="search" size={15} />
          <input
            className="inp"
            placeholder="Search ID, customer, area"
            value={ui.q[id]}
            onChange={(e) => {
              ui.q[id] = e.target.value;
              setUi({});
            }}
            aria-label={`Search ${s.units.toLowerCase()}`}
          />
        </div>
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Details</th>
              <th>Partner</th>
              <th className="r">Amount</th>
              <th>Status</th>
              <th>Placed</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((o) => {
                const p = partnerOf(db, o.partner);
                const fresh = o.freshAt && Date.now() - o.freshAt < 1600;
                return (
                  <tr
                    key={o.id}
                    tabIndex={0}
                    className={'click' + (fresh ? ' fresh' : '')}
                    onClick={() => openOrder(o.id)}
                    onKeyDown={(e) => e.key === 'Enter' && openOrder(o.id)}
                  >
                    <td className="mono">{o.id}</td>
                    <td className="who">
                      <b>{o.customer}</b>
                      <small>{o.area}</small>
                    </td>
                    <td>
                      <span className="clamp">{o.detail}</span>
                    </td>
                    <td>
                      {p ? p.name : isActive(o) && o.idx >= s.assignAt - 1 ? <span className="pill t-warn plain">Unassigned</span> : <span className="muted">—</span>}
                    </td>
                    <td className="r num">
                      <b>{inr(o.amount)}</b>
                      {o.refunded && (
                        <>
                          <br />
                          <small className="muted">Refunded</small>
                        </>
                      )}
                    </td>
                    <td>
                      <StatusPill order={o} />
                    </td>
                    <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                      {ago(o.t)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7}>
                  <div className="empty">No {s.units.toLowerCase()} match these filters.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
