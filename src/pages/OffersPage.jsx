import React from 'react';
import Icon from '../components/common/Icon.jsx';
import ServiceTile from '../components/common/ServiceTile.jsx';
import Switch from '../components/common/Switch.jsx';
import NewOfferModal from '../components/modals/NewOfferModal.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import { SVC } from '../data/constants.js';
import { inr } from '../utils/format.js';

export default function OffersPage() {
  const { db, openModal, confirm, toast, refresh, copyText } = useAdmin();
  const live = db.offers.filter((o) => o.active).length;

  const toggle = (o, on) => {
    o.active = on;
    toast(`${o.code} ${on ? 'is live' : 'paused'}`);
    refresh();
  };
  const remove = (o) =>
    confirm({
      title: `Delete ${o.code}?`,
      text: "Customers who saved this code won't be able to use it.",
      ok: 'Delete offer',
      onOk: () => {
        db.offers.splice(db.offers.indexOf(o), 1);
        toast(`${o.code} deleted`);
        refresh();
      },
    });

  return (
    <>
      <div className="pagehead">
        <div>
          <h2>Offers & coupons</h2>
          <p>
            {live} live · {db.offers.reduce((a, o) => a + o.used, 0).toLocaleString('en-IN')} redemptions so far
          </p>
        </div>
        <button className="btn primary" onClick={() => openModal(<NewOfferModal />)}>
          <Icon name="plus" size={16} />
          Create offer
        </button>
      </div>

      <div className="coupons">
        {db.offers.map((o) => (
          <div key={o.code} className={'coupon' + (o.active ? '' : ' off')}>
            <div className="stub">
              <b>{o.kind === '%' ? o.value + '%' : '₹' + o.value}</b>
              <small>OFF</small>
            </div>
            <div className="cb">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="code">{o.code}</span>
                {o.svc === 'all' ? (
                  <span className="pill t-mute plain">All services</span>
                ) : (
                  <span className="row" style={{ gap: 6, fontSize: 12.5, fontWeight: 600 }}>
                    <ServiceTile svc={o.svc} size="sm" />
                    {SVC[o.svc].short}
                  </span>
                )}
              </div>
              <p>{o.desc}</p>
              <div className="meta">
                <span>Min {inr(o.min)}</span>
                <span>Cap {inr(o.cap)}</span>
                <span>Ends {new Date(o.exp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                <span>{o.used.toLocaleString('en-IN')} used</span>
              </div>
              <div className="acts">
                <label className="row" style={{ gap: 8, fontSize: 12.5, fontWeight: 600 }}>
                  <Switch checked={o.active} onChange={(e) => toggle(o, e.target.checked)} aria-label={`${o.code} active`} />
                  {o.active ? 'Live' : 'Paused'}
                </label>
                <div className="row" style={{ gap: 4 }}>
                  <button className="btn sm ghost" onClick={() => copyText(o.code, `Copied ${o.code}`)} aria-label="Copy code">
                    <Icon name="copy" size={14} />
                  </button>
                  <button className="btn sm ghost" onClick={() => remove(o)} aria-label="Delete offer" style={{ color: 'var(--bad)' }}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
