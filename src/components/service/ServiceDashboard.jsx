import React from 'react';
import Icon from '../common/Icon.jsx';
import ServiceTile from '../common/ServiceTile.jsx';
import Delta from '../common/Delta.jsx';
import Sparkline from '../common/Sparkline.jsx';
import OrdersTab from './OrdersTab.jsx';
import PricingTab from './PricingTab.jsx';
import PartnersTable from '../partners/PartnersTable.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';
import { SVC } from '../../data/constants.js';
import { isActive, isDone, todaySum, filterOrders } from '../../data/selectors.js';
import { partnerOf } from '../../data/generators.js';
import { inr, inrS, mode, ago, fmtPhone } from '../../utils/format.js';

/** Shared dashboard used by each of the five service pages. */
export default function ServiceDashboard({ svcId: id }) {
  const { db, ui, setUi, confirm, setPaused, refresh, copyTable } = useAdmin();
  const s = SVC[id];
  const mine = db.orders.filter((o) => o.svc === id);
  const act = mine.filter(isActive);
  const delivered = mine.filter((o) => isDone(o) && !o.cancelled);
  const parts = db.partners.filter((p) => p.svc === id);
  const onlineParts = parts.filter((p) => p.online);
  const on = onlineParts.length;
  const canc = mine.filter((o) => o.cancelled).length;
  const paused = db.paused[id];
  const tab = ui.tab[id];

  // Active delivery tracking: which online partners are currently on a delivery/job
  const busyPartnerIds = new Set(act.map((o) => o.partner).filter(Boolean));
  const deliveringParts = onlineParts.filter((p) => busyPartnerIds.has(p.id));
  const availableParts = onlineParts.filter((p) => !busyPartnerIds.has(p.id));

  // Partner types breakdown
  const partnerTypes = Array.from(new Set(parts.map((p) => p.type)));
  const typeBreakdown = partnerTypes.map((t) => {
    const ofType = parts.filter((p) => p.type === t);
    const ofTypeOnline = ofType.filter((p) => p.online);
    return {
      type: t,
      total: ofType.length,
      online: ofTypeOnline.length,
    };
  });

  const togglePause = () => {
    if (paused) {
      setPaused(id, false);
      refresh();
    } else
      confirm({
        title: `Pause ${s.name}?`,
        text: `Customers won't be able to place new ${s.units.toLowerCase()} until you resume. ${act.length} ongoing ${s.units.toLowerCase()} will continue.`,
        ok: 'Pause service',
        onOk: () => {
          setPaused(id, true);
          refresh();
        },
      });
  };

  const copyData = () => {
    const rows = filterOrders(db, id, ui.st[id], ui.q[id]);
    const headers = ['ID', 'Customer', 'Phone', 'Area', 'Items', 'Partner', 'Amount', 'Payment', 'Status', 'Placed'];
    const colDefs = [
      { width: 7, align: 'left' },
      { width: 14, align: 'left' },
      { width: 11, align: 'left' },
      { width: 10, align: 'left' },
      { width: 22, align: 'left' },
      { width: 7, align: 'left' },
      { width: 6, align: 'right' },
      { width: 7, align: 'left' },
      { width: 8, align: 'left' },
      { width: 9, align: 'left' },
    ];
    const dataRows = rows.map((o) => {
      const p = partnerOf(db, o.partner);
      const partnerName = p ? p.name : isActive(o) && o.idx >= s.assignAt - 1 ? 'Unassigned' : '—';
      return [
        o.id,
        o.customer,
        fmtPhone(o.phone),
        o.area,
        o.detail,
        partnerName,
        inr(o.amount),
        o.pay,
        o.cancelled ? 'Cancelled' : s.statuses[o.idx],
        ago(o.t),
      ];
    });

    copyTable(
      { headers, rows: dataRows, colDefs },
      `${rows.length} ${s.units.toLowerCase()} copied as table`
    );
  };

  const TABS = [
    ['orders', s.units],
    ['partners', s.partnerTab],
    ['pricing', 'Pricing & rules'],
  ];

  return (
    <>
      <div className="pagehead">
        <div className="svchead">
          <ServiceTile svc={id} size="lg" />
          <div>
            <h2>{s.name}</h2>
            <p>
              {paused ? <b style={{ color: 'var(--warn)' }}>Paused</b> : <span style={{ color: 'var(--good)', fontWeight: 700 }}>● Live</span>}
              {' · '}
              {act.length} active {s.units.toLowerCase()} · {on} of {parts.length} partners online
            </p>
          </div>
        </div>
        <div className="row">
          <button className="btn" onClick={togglePause}>
            <Icon name={paused ? 'play' : 'pause'} size={15} />
            {paused ? 'Resume service' : 'Pause service'}
          </button>
          <button className="btn" onClick={copyData} title="Copy table to clipboard">
            <Icon name="copy" size={15} />
            <span className="hide-sm">Copy</span>
          </button>
        </div>
      </div>

      {paused && (
        <div className="banner">
          <Icon name="alert" />
          <span>
            <b>{s.name} is paused.</b> Customers can't place new {s.units.toLowerCase()}; ongoing ones continue.
          </span>
          <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={togglePause}>
            Resume now
          </button>
        </div>
      )}

      <section className="kpis">
        <div className="card kpi">
          <span className="lab">{s.units} today</span>
          <span className="val">{mine.length}</span>
          <div className="foot">
            <Delta cur={mine.length} prev={(db.counts[id][58] / 1.9) * 0.94} label="vs this time yesterday" />
            <Sparkline values={db.counts[id].slice(46).concat([mine.length])} />
          </div>
        </div>
        <div className="card kpi">
          <span className="lab">Order value today</span>
          <span className="val">{inrS(todaySum(db, id))}</span>
          <div className="foot">
            <Delta cur={todaySum(db, id)} prev={(db.daily[id][58] / 1.9) * 0.94} label="vs this time yesterday" />
            <Sparkline values={db.daily[id].slice(46).concat([todaySum(db, id)])} />
          </div>
        </div>
        <div className="card kpi">
          <span className="lab">{s.kpiTime}</span>
          <span className="val">{s.time}</span>
          <div className="foot">
            <span className="muted" style={{ fontSize: 12.5 }}>Target under {s.target}</span>
          </div>
        </div>
        <div className="card kpi">
          <span className="lab">Cancellations</span>
          <span className="val">
            {canc}
            <span className="muted" style={{ fontSize: 16 }}> · {((canc / (mine.length || 1)) * 100).toFixed(1)}%</span>
          </span>
          <div className="foot">
            <span className="muted" style={{ fontSize: 12.5 }}>
              {canc ? 'Top reason: ' + mode(mine.filter((o) => o.cancelled).map((o) => o.cancelReason)) : 'None today'}
            </span>
          </div>
        </div>
      </section>

      {/* Delivered & Online Partners Live Operational Section */}
      <section className="svc-ops-card">
        <div className="svc-ops-head">
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>
              Live Delivery & Online Partner Operations
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
              Real-time fulfillment metrics and online fleet availability for {s.name}
            </p>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <span className="pill t-good">
              <span className="pulse-dot" />
              {on} Partners Online Now
            </span>
            <button
              className="btn sm"
              onClick={() => {
                ui.tab[id] = 'partners';
                setUi({});
              }}
              title={`View ${s.partnerTab}`}
            >
              <Icon name="users" size={14} />
              View {s.partnerTab}
            </button>
          </div>
        </div>

        <div className="svc-ops-grid">
          {/* Panel 1: Delivered Services */}
          <div className="svc-ops-panel">
            <div className="svc-ops-head">
              <div className="svc-ops-title">
                <span className="svc-ops-icon" style={{ background: 'color-mix(in oklab, var(--good) 15%, transparent)', color: 'var(--good)' }}>
                  <Icon name="check" size={18} />
                </span>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, display: 'block' }}>
                    Delivered {s.units}
                  </span>
                  <small style={{ color: 'var(--muted)', fontSize: 11.5 }}>Completed successfully today</small>
                </div>
              </div>
              <span className="pill t-good plain" style={{ fontWeight: 700 }}>
                {Math.round((delivered.length / (mine.length || 1)) * 100)}% Fulfilled
              </span>
            </div>

            <div className="svc-ops-main-val">
              <b style={{ color: 'var(--good)' }}>{delivered.length}</b>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                of {mine.length} {s.units.toLowerCase()} placed today
              </span>
            </div>

            <div className="svc-ops-stat-row">
              <div className="svc-ops-stat-box">
                <b style={{ color: 'var(--text)' }}>{inr(delivered.reduce((a, o) => a + o.amount, 0))}</b>
                <span>Delivered Value</span>
              </div>
              <div className="svc-ops-stat-box">
                <b style={{ color: act.length > 0 ? 'var(--info)' : 'var(--text)' }}>{act.length}</b>
                <span>In Progress</span>
              </div>
              <div className="svc-ops-stat-box">
                <b style={{ color: 'var(--text)' }}>{s.time}</b>
                <span>Avg Fulfillment</span>
              </div>
            </div>

            {/* Pipeline progress bar */}
            <div>
              <div className="row" style={{ justifyContent: 'space-between', fontSize: 11.5, color: 'var(--muted)', marginBottom: 5 }}>
                <span>Fulfillment pipeline:</span>
                <span>{delivered.length} delivered · {act.length} active · {canc} cancelled</span>
              </div>
              <div className="svc-ops-bar">
                <i style={{ width: `${(delivered.length / (mine.length || 1)) * 100}%`, background: 'var(--green)' }} title={`${delivered.length} delivered`} />
                <i style={{ width: `${(act.length / (mine.length || 1)) * 100}%`, background: 'var(--info)' }} title={`${act.length} in transit`} />
                <i style={{ width: `${(canc / (mine.length || 1)) * 100}%`, background: 'var(--bad)' }} title={`${canc} cancelled`} />
              </div>
            </div>
          </div>

          {/* Panel 2: Online Partners */}
          <div className="svc-ops-panel">
            <div className="svc-ops-head">
              <div className="svc-ops-title">
                <span className="svc-ops-icon" style={{ background: 'color-mix(in oklab, var(--green) 15%, transparent)', color: 'var(--green)' }}>
                  <Icon name="users" size={18} />
                </span>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, display: 'block' }}>
                    Partners in Online
                  </span>
                  <small style={{ color: 'var(--muted)', fontSize: 11.5 }}>Active fleet readiness in Hyderabad</small>
                </div>
              </div>
              <span className="pill t-good plain" style={{ fontWeight: 700 }}>
                {Math.round((on / (parts.length || 1)) * 100)}% Online
              </span>
            </div>

            <div className="svc-ops-main-val">
              <b style={{ color: on > 0 ? 'var(--text)' : 'var(--muted)' }}>{on}</b>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                of {parts.length} registered partners online
              </span>
            </div>

            <div className="svc-ops-stat-row">
              <div className="svc-ops-stat-box">
                <b style={{ color: 'var(--good)' }}>{deliveringParts.length}</b>
                <span>Delivering Now</span>
              </div>
              <div className="svc-ops-stat-box">
                <b style={{ color: 'var(--info)' }}>{availableParts.length}</b>
                <span>Ready / Available</span>
              </div>
              <div className="svc-ops-stat-box">
                <b style={{ color: 'var(--muted)' }}>{parts.length - on}</b>
                <span>Offline Fleet</span>
              </div>
            </div>

            {/* Partner type chips */}
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 6 }}>
                Online by partner role:
              </div>
              <div className="row" style={{ gap: 6 }}>
                {typeBreakdown.map((t) => (
                  <span
                    key={t.type}
                    className="chip"
                    style={{ height: 26, padding: '0 10px', fontSize: 11.5, cursor: 'default' }}
                  >
                    <b>{t.type}</b>: {t.online} online <small style={{ color: 'var(--muted)', marginLeft: 3 }}>/ {t.total}</small>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="card">
        <div className="tabs" role="tablist" style={{ padding: '0 10px' }}>
          {TABS.map(([k, l]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => {
                ui.tab[id] = k;
                setUi({});
              }}
            >
              {l}
            </button>
          ))}
        </div>
        {tab === 'orders' ? <OrdersTab svcId={id} /> : tab === 'partners' ? <PartnersTable svcId={id} /> : <PricingTab key={id} svcId={id} />}
      </div>
    </>
  );
}
