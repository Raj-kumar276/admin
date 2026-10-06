import React from 'react';
import Icon from '../components/common/Icon.jsx';
import ServiceTile from '../components/common/ServiceTile.jsx';
import CreditModal from '../components/modals/CreditModal.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import { SVC } from '../data/constants.js';
import { inr, inrS, fmtPhone } from '../utils/format.js';

export default function CustomersPage() {
  const { db, ui, setUi, openModal, confirm, toast, refresh, copyTable } = useAdmin();
  const q = ui.cQ.trim().toLowerCase();
  const rows = db.customers.filter((c) => (ui.cSt === 'all' || c.status === ui.cSt) && (!q || (c.name + ' ' + c.phone + ' ' + c.area + ' ' + c.id).toLowerCase().includes(q)));
  const active = db.customers.filter((c) => c.status === 'Active').length;

  const copyData = () => {
    const list = rows.length ? rows : db.customers;
    const headers = ['ID', 'Customer', 'Phone', 'Area', 'Orders', 'Spend', 'Wallet', 'Status'];
    const colDefs = [
      { width: 7, align: 'left' },
      { width: 16, align: 'left' },
      { width: 11, align: 'left' },
      { width: 12, align: 'left' },
      { width: 6, align: 'right' },
      { width: 10, align: 'right' },
      { width: 8, align: 'right' },
      { width: 8, align: 'left' },
    ];
    const dataRows = list.map((c) => [
      c.id,
      c.name,
      fmtPhone(c.phone),
      c.area,
      c.orders,
      inr(c.spend),
      inr(c.wallet),
      c.status,
    ]);

    copyTable(
      { headers, rows: dataRows, colDefs },
      `${list.length} customers copied as table`
    );
  };

  const block = (c) =>
    confirm({
      title: `Block ${c.name}?`,
      text: "They are signed out and can't place orders or book rides until unblocked.",
      ok: 'Block customer',
      onOk: () => {
        c.status = 'Blocked';
        toast(`${c.name} blocked`);
        refresh();
      },
    });
  const unblock = (c) => {
    c.status = 'Active';
    toast(`${c.name} unblocked`);
    refresh();
  };

  return (
    <>
      <div className="pagehead">
        <div>
          <h2>Customers</h2>
          <p>
            {db.customers.length} customers shown · {active} active · lifetime spend {inrS(db.customers.reduce((a, c) => a + c.spend, 0))}
          </p>
        </div>
        <button className="btn" onClick={copyData} title="Copy table to clipboard">
          <Icon name="copy" size={15} />
          Copy
        </button>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="row">
            {['all', 'Active', 'Blocked'].map((k) => (
              <button key={k} className="chip" aria-pressed={ui.cSt === k} onClick={() => setUi({ cSt: k })}>
                {k === 'all' ? 'All' : k} <b>{db.customers.filter((c) => k === 'all' || c.status === k).length}</b>
              </button>
            ))}
          </div>
          <div className="lsearch">
            <Icon name="search" size={15} />
            <input className="inp" placeholder="Search name, phone, area" value={ui.cQ} onChange={(e) => setUi({ cQ: e.target.value })} aria-label="Search customers" />
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Area</th>
                <th>Uses most</th>
                <th className="r">Orders</th>
                <th className="r">Lifetime spend</th>
                <th className="r">Wallet</th>
                <th>Status</th>
                <th className="r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((c) => (
                  <tr key={c.id}>
                    <td className="who">
                      <b>{c.name}</b>
                      <small className="mono">
                        {c.id} · +91 {c.phone}
                      </small>
                    </td>
                    <td>{c.area}</td>
                    <td>
                      <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                        <ServiceTile svc={c.fav} size="sm" />
                        {SVC[c.fav].short}
                      </span>
                    </td>
                    <td className="r num">{c.orders}</td>
                    <td className="r num">{inr(c.spend)}</td>
                    <td className="r num">{inr(c.wallet)}</td>
                    <td>
                      <span className={'pill ' + (c.status === 'Active' ? 't-good' : 't-bad')}>{c.status}</span>
                    </td>
                    <td className="r">
                      <div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                        <button className="btn sm" onClick={() => openModal(<CreditModal customer={c} />)}>
                          <Icon name="wallet" size={14} />
                          Credit
                        </button>
                        {c.status === 'Active' ? (
                          <button className="btn sm danger" onClick={() => block(c)}>Block</button>
                        ) : (
                          <button className="btn sm" onClick={() => unblock(c)}>Unblock</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">No customers match “{ui.cQ}”.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
