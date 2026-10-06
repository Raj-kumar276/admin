import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import ServiceTile from '../common/ServiceTile.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';
import { SVC } from '../../data/constants.js';
import { inr } from '../../utils/format.js';

/** Top-bar search across orders, customers and partners. Press "/" to focus. */
export default function GlobalSearch() {
  const { db, ui, setUi } = useAdmin();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const input = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
        e.preventDefault();
        input.current && input.current.focus();
      }
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e) => {
      if (wrap.current && !wrap.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, []);

  const term = q.trim().toLowerCase();
  const show = open && term.length >= 2;
  const os = show ? db.orders.filter((o) => (o.id + ' ' + o.customer + ' ' + o.phone).toLowerCase().includes(term)).slice(0, 5) : [];
  const cs = show ? db.customers.filter((c) => (c.name + ' ' + c.phone + ' ' + c.id).toLowerCase().includes(term)).slice(0, 3) : [];
  const ps = show ? db.partners.filter((p) => (p.name + ' ' + p.extra).toLowerCase().includes(term)).slice(0, 3) : [];

  const reset = () => {
    setQ('');
    setOpen(false);
  };
  const goOrder = (o) => {
    reset();
    ui.tab[o.svc] = 'orders';
    ui.st[o.svc] = 'all';
    ui.q[o.svc] = '';
    setUi({});
    // App opens the drawer after the route change (see App.jsx).
    nav('/services/' + o.svc, { state: { openOrder: o.id } });
  };
  const goCustomer = (c) => {
    reset();
    setUi({ cQ: c.name, cSt: 'all' });
    nav('/customers');
  };
  const goPartner = (p) => {
    reset();
    setUi({ pQ: p.name, pSt: 'all', pSvc: 'all' });
    nav('/partners');
  };

  return (
    <div className="search anchor" ref={wrap}>
      <Icon name="search" size={16} />
      <input
        ref={input}
        type="search"
        placeholder="Search orders, customers, partners"
        autoComplete="off"
        aria-label="Search everything"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {show && (
        <div className="pop">
          {os.length + cs.length + ps.length === 0 ? (
            <div className="empty">Nothing matches “{term}”.</div>
          ) : (
            <>
              {os.length > 0 && <div className="sr-group">Orders</div>}
              {os.map((o) => (
                <button key={o.id} className="pop-item" onClick={() => goOrder(o)}>
                  <ServiceTile svc={o.svc} size="sm" />
                  <div>
                    <p>
                      <b className="mono">{o.id}</b> · {o.customer}
                    </p>
                    <small>
                      {SVC[o.svc].short} · {o.cancelled ? 'Cancelled' : SVC[o.svc].statuses[o.idx]} · {inr(o.amount)}
                    </small>
                  </div>
                </button>
              ))}
              {cs.length > 0 && <div className="sr-group">Customers</div>}
              {cs.map((c) => (
                <button key={c.id} className="pop-item" onClick={() => goCustomer(c)}>
                  <Icon name="users" size={17} />
                  <div>
                    <p>{c.name}</p>
                    <small>
                      {c.id} · {c.orders} orders
                    </small>
                  </div>
                </button>
              ))}
              {ps.length > 0 && <div className="sr-group">Partners</div>}
              {ps.map((p) => (
                <button key={p.id} className="pop-item" onClick={() => goPartner(p)}>
                  <ServiceTile svc={p.svc} size="sm" />
                  <div>
                    <p>{p.name}</p>
                    <small>
                      {p.type} · {p.kyc}
                    </small>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
