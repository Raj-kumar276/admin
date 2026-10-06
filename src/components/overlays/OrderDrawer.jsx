import React, { useEffect, useState } from 'react';
import Icon from '../common/Icon.jsx';
import ServiceTile from '../common/ServiceTile.jsx';
import { StatusPill } from '../common/Pills.jsx';
import IssueRefundModal from '../modals/IssueRefundModal.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';
import { SVC } from '../../data/constants.js';
import { isDone } from '../../data/selectors.js';
import { assignable, partnerOf, activityFor } from '../../data/generators.js';
import { fmtT, inr } from '../../utils/format.js';

/** Slide-in panel with full order details and actions. */
export default function OrderDrawer() {
  const { db, drawerId, closeDrawer, toast, confirm, copyText, advanceOrder, refresh, openModal } = useAdmin();
  const o = drawerId ? db.orders.find((x) => x.id === drawerId) : null;
  const [assignId, setAssignId] = useState('');

  useEffect(() => {
    setAssignId('');
  }, [drawerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = !!o;
  let body = null;

  if (o) {
    const s = SVC[o.svc];
    const p = partnerOf(db, o.partner);
    const done = isDone(o);
    const cands = assignable(db, o.svc);
    const next = !o.cancelled && !done ? s.statuses[o.idx + 1] : null;
    const selected = cands.some((c) => c.id === assignId) ? assignId : o.partner && cands.some((c) => c.id === o.partner) ? o.partner : cands[0] && cands[0].id;

    const doAdvance = () => {
      advanceOrder(o);
      toast(`${o.id} marked “${s.statuses[o.idx]}”`);
      refresh();
    };
    const doAssign = () => {
      const np = partnerOf(db, selected);
      if (!np) return;
      o.partner = np.id;
      if (o.idx < s.assignAt) {
        o.idx = s.assignAt;
        o.hist[o.idx] = Date.now();
      }
      toast(`${np.name} assigned to ${o.id}`);
      refresh();
    };
    const doCancel = () => {
      confirm({
        title: `Cancel ${o.id}?`,
        text: `Are you sure you want to cancel this ${s.unit}? This will stop any further delivery actions.`,
        ok: `Cancel ${s.unit}`,
        danger: true,
        onOk: () => {
          o.cancelled = true;
          o.cancelReason = 'Cancelled by admin';
          db.activity.unshift(activityFor(o, 'cancel'));
          toast(`${o.id} cancelled`);
          refresh();
        },
      });
    };
    const doRefund = () => openModal(<IssueRefundModal order={o} />);

    body = (
      <>
        <div className="dh">
          <ServiceTile svc={o.svc} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 className="mono" style={{ fontSize: 16 }}>{o.id}</h3>
            <p className="muted" style={{ fontSize: 12.5 }}>
              {s.name} · placed {fmtT(o.t)}
            </p>
          </div>
          <StatusPill order={o} />
          <button className="ib" onClick={closeDrawer} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="db">
          <div className="sec">
            <h4>Customer</h4>
            <dl className="kv">
              <dt>Name</dt>
              <dd>{o.customer}</dd>
              <dt>Phone</dt>
              <dd>
                <span className="row" style={{ gap: 6 }}>
                  <span className="mono">+91 {o.phone.slice(0, 5)} {o.phone.slice(5)}</span>
                  <button className="btn sm ghost" onClick={() => copyText('+91' + o.phone, `Copied +91${o.phone}`)} aria-label="Copy phone">
                    <Icon name="copy" size={14} />
                  </button>
                </span>
              </dd>
              <dt>Area</dt>
              <dd>{o.area}</dd>
            </dl>
          </div>

          <div className="sec">
            <h4>{s.unit[0].toUpperCase() + s.unit.slice(1)} details</h4>
            <dl className="kv">
              {o.kv.map(([k, v]) => (
                <React.Fragment key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </React.Fragment>
              ))}
              <dt>Amount</dt>
              <dd>
                <b className="num">{inr(o.amount)}</b> · {o.pay}
                {o.refunded && (
                  <>
                    {' · '}
                    <span className="pill t-mute">Refunded</span>
                  </>
                )}
              </dd>
            </dl>
          </div>

          <div className="sec">
            <h4>Progress</h4>
            <div className="steps">
              {s.statuses.map((st, i) => {
                const d = !o.cancelled && i <= o.idx;
                const cur = !o.cancelled && i === o.idx + 1;
                return (
                  <div key={st} className={`step ${d ? 'done' : ''} ${cur ? 'cur' : ''}`}>
                    <span className="m">{d && <Icon name="check" size={12} />}</span>
                    <div>
                      <b>{st}</b>
                      <small>{o.hist[i] ? fmtT(o.hist[i]) : cur ? 'Up next' : '—'}</small>
                    </div>
                  </div>
                );
              })}
              {o.cancelled && (
                <div className="step">
                  <span className="m" style={{ borderColor: 'var(--bad)', color: 'var(--bad)' }}>
                    <Icon name="x" size={12} />
                  </span>
                  <div>
                    <b style={{ color: 'var(--bad)' }}>Cancelled</b>
                    <small>{o.cancelReason}</small>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sec">
            <h4>{s.assignType}</h4>
            {p ? (
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                <div className="who">
                  <b>{p.name}</b>
                  <small>
                    {p.extra}
                    {p.rating ? ' · ★ ' + p.rating : ''}
                  </small>
                </div>
                <button className="btn sm ghost" onClick={() => copyText('+91' + p.phone, `Copied +91${p.phone}`)}>
                  <Icon name="phone" size={14} />
                  Copy number
                </button>
              </div>
            ) : (
              <p className="muted" style={{ marginBottom: 10 }}>
                No {s.assignType.toLowerCase()} assigned yet.
              </p>
            )}
            {!o.cancelled && !done && (
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <select className="sel" value={selected || ''} onChange={(e) => setAssignId(e.target.value)} aria-label={`Choose ${s.assignType.toLowerCase()}`}>
                  {cands.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.online ? 'online' : 'offline'} · {c.area}
                    </option>
                  ))}
                </select>
                <button className="btn" onClick={doAssign}>
                  {p ? 'Reassign' : 'Assign'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="df">
          {!o.cancelled && !done && (
            <button className="btn danger" onClick={doCancel}>
              <Icon name="ban" size={15} />
              Cancel
            </button>
          )}
          {(done || o.cancelled) && !o.refunded && o.pay !== 'Cash' && (
            <button className="btn" onClick={doRefund}>
              <Icon name="refund" size={15} />
              Refund {inr(o.amount)}
            </button>
          )}
          {next ? (
            <button className="btn primary" onClick={doAdvance}>
              Mark “{next}”
              <Icon name="arrow" size={15} />
            </button>
          ) : (
            <button className="btn" onClick={closeDrawer}>
              Close
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dscrim" onClick={closeDrawer} hidden={!open} />
      <aside className={'drawer' + (open ? ' open' : '')} aria-label="Details" aria-hidden={!open}>
        {body}
      </aside>
    </>
  );
}
