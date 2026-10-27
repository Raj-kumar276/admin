import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import logo from '../../assets/onebuddy-logo.png';
import { useAdmin } from '../../context/AdminContext.jsx';
import { SVCS, SVC } from '../../data/constants.js';
import { isActive } from '../../data/selectors.js';

export const NAV = [
  { lab: 'Dashboard', items: [{ path: '/overview', n: 'Overview', i: 'grid' }] },
  { lab: 'Services', items: SVCS.map((s) => ({ path: '/services/' + s.id, n: s.name, svc: s.id })) },
  {
    lab: 'Operations',
    items: [
      { path: '/hyderabad', n: 'City & Zones', i: 'pin' },
      { path: '/banners', n: 'Banners', i: 'banner' },
      { path: '/partners', n: 'Partners & KYC', i: 'shield' },
      { path: '/customers', n: 'Customers', i: 'users' },
      { path: '/offers', n: 'Offers & coupons', i: 'tag' },
      { path: '/payouts', n: 'Payouts', i: 'wallet' },
      { path: '/refunds', n: 'Refunds', i: 'refund' },
      { path: '/support', n: 'Support tickets', i: 'chat' },
    ],
  },
  { lab: 'System', items: [{ path: '/settings', n: 'Settings', i: 'sliders' }] },
];

export default function Sidebar({ open, onClose }) {
  const { db } = useAdmin();
  const nav = useNavigate();
  const { pathname } = useLocation();

  const badge = (it) => {
    if (it.svc) {
      if (db.paused[it.svc]) return <span className="paused">Paused</span>;
      return (
        <span className="cnt" title={`Active ${SVC[it.svc].units.toLowerCase()}`}>
          {db.orders.filter((o) => o.svc === it.svc && isActive(o)).length}
        </span>
      );
    }
    if (it.path === '/hyderabad') {
      const n = db.partners.filter((p) => p.online).length;
      return <span className="cnt" title={`${n} partners working`}>{n}</span>;
    }
    if (it.path === '/banners') {
      const n = (db.banners || []).filter((b) => b.active).length;
      if (n) return <span className="cnt" title={`${n} active banners`}>{n}</span>;
    }
    if (it.path === '/partners') {
      const n = db.partners.filter((p) => p.kyc === 'Pending').length;
      if (n) return <span className="cnt">{n}</span>;
    }
    if (it.path === '/refunds') {
      const n = (db.refunds || []).filter((r) => r.status === 'Pending').length;
      if (n) return <span className="cnt">{n}</span>;
    }
    if (it.path === '/support') {
      const n = db.tickets.filter((t) => t.status === 'Open').length;
      if (n) return <span className="cnt">{n}</span>;
    }
    return null;
  };

  const zonesOn = db.zones.filter((z) => z.on).length;

  return (
    <>
      <aside className={'side' + (open ? ' open' : '')} aria-label="Main navigation">
        <div className="brand">
          <div className="coin">
            <img src={logo} alt="" />
          </div>
          <div>
            <b>
              One<span>Buddy</span>
            </b>
            <small>Admin console</small>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {NAV.map((g) => (
            <div className="navsec" key={g.lab}>
              <div className="navlab">{g.lab}</div>
              {g.items.map((it) => (
                <button
                  key={it.path}
                  className="nav"
                  aria-current={pathname === it.path ? 'page' : undefined}
                  onClick={() => {
                    nav(it.path);
                    onClose();
                  }}
                >
                  {it.svc ? <span className="dot" style={{ '--c': `var(--s-${it.svc})` }} /> : <Icon name={it.i} />}
                  <span>{it.n}</span>
                  {badge(it)}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="side-foot">
          <button
            type="button"
            className="city"
            onClick={() => {
              nav('/hyderabad');
              onClose();
            }}
            aria-current={pathname === '/hyderabad' ? 'page' : undefined}
            title="Click to view Hyderabad zones & working partners"
          >
            <div className="city-head">
              <b>
                <Icon name="pin" size={14} />
                Hyderabad
              </b>
              <span className="city-tag">View &rarr;</span>
            </div>
            <span>
              {zonesOn} of {db.zones.length} zones live · {db.partners.filter((p) => p.online).length} partners working
            </span>
            <div className="bar">
              <i style={{ width: (zonesOn / db.zones.length) * 100 + '%' }} />
            </div>
          </button>
        </div>
      </aside>
      <div className="sscrim" onClick={onClose} hidden={!open} />
    </>
  );
}
