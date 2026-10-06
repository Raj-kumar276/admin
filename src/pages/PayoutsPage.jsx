import React from 'react';
import Icon from '../components/common/Icon.jsx';
import ServiceTile from '../components/common/ServiceTile.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import { SVC } from '../data/constants.js';
import { payoutPartners } from '../data/selectors.js';
import { inr, inrS } from '../utils/format.js';

export default function PayoutsPage() {
  const { db, confirm, toast, refresh } = useAdmin();
  const due = payoutPartners(db);
  const pending = due.filter((p) => !p.paid);
  const paid = due.filter((p) => p.paid);
  const pendingTotal = pending.reduce((a, p) => a + p.payout, 0);
  const planFees = db.plans.reduce((a, p) => a + p[1] * p[3], 0);

  const payOne = (p) => {
    p.paid = true;
    toast(`${inr(p.payout)} released to ${p.name}`);
    refresh();
  };
  const payAll = () =>
    confirm({
      title: 'Release all pending payouts?',
      text: `${inr(pendingTotal)} goes to ${pending.length} partners' bank accounts. Transfers can't be recalled.`,
      ok: `Release ${inrS(pendingTotal)}`,
      danger: false,
      onOk: () => {
        pending.forEach((p) => (p.paid = true));
        toast(`${inr(pendingTotal)} released to ${pending.length} partners`);
        refresh();
      },
    });

  return (
    <>
      <div className="pagehead">
        <div>
          <h2>Payouts</h2>
          <p>Settlement cycle: Monday to Sunday · released every Tuesday</p>
        </div>
        <button className="btn primary" onClick={payAll} disabled={!pending.length}>
          <Icon name="wallet" size={15} />
          Release all ({inrS(pendingTotal)})
        </button>
      </div>

      <section className="kpis" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
        <div className="card kpi">
          <span className="lab">Waiting to release</span>
          <span className="val">{inr(pendingTotal)}</span>
          <div className="foot">
            <span className="muted" style={{ fontSize: 12.5 }}>{pending.length} partners</span>
          </div>
        </div>
        <div className="card kpi">
          <span className="lab">Released this cycle</span>
          <span className="val">{inr(paid.reduce((a, p) => a + p.payout, 0))}</span>
          <div className="foot">
            <span className="muted" style={{ fontSize: 12.5 }}>{paid.length} partners</span>
          </div>
        </div>
        <div className="card kpi">
          <span className="lab">Captain plan fees</span>
          <span className="val">{inr(planFees)}</span>
          <div className="foot">
            <span className="muted" style={{ fontSize: 12.5 }}>
              Collected from {db.plans.reduce((a, p) => a + p[3], 0)} captains · no ride payouts
            </span>
          </div>
        </div>
      </section>

      <div className="card">
        <div className="card-h" style={{ paddingBottom: 14 }}>
          <div>
            <h3>Partner settlements</h3>
            <p>Captains aren't listed — riders pay them directly under the partner-plan model.</p>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Partner</th>
                <th>Service</th>
                <th>Bank</th>
                <th className="r">Jobs this week</th>
                <th className="r">Amount</th>
                <th>Status</th>
                <th className="r">Action</th>
              </tr>
            </thead>
            <tbody>
              {due.map((p) => (
                <tr key={p.id}>
                  <td className="who">
                    <b>{p.name}</b>
                    <small>{p.type}</small>
                  </td>
                  <td>
                    <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                      <ServiceTile svc={p.svc} size="sm" />
                      {SVC[p.svc].short}
                    </span>
                  </td>
                  <td className="mono">•••• {p.last4}</td>
                  <td className="r num">{Math.max(3, Math.round(p.jobs / 40))}</td>
                  <td className="r num">
                    <b>{inr(p.payout)}</b>
                  </td>
                  <td>{p.paid ? <span className="pill t-good">Released</span> : <span className="pill t-warn">Pending</span>}</td>
                  <td className="r">
                    {p.paid ? (
                      <span className="muted" style={{ fontSize: 12.5 }}>Done</span>
                    ) : (
                      <button className="btn sm" onClick={() => payOne(p)}>Release</button>
                    )}
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
