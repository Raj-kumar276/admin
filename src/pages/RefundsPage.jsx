import React, { useState, useMemo } from 'react';
import Icon from '../components/common/Icon.jsx';
import ServiceTile from '../components/common/ServiceTile.jsx';
import IssueRefundModal from '../components/modals/IssueRefundModal.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import { SVC, SVCS } from '../data/constants.js';
import { inr, inrS, fmtT } from '../utils/format.js';
import { activityFor } from '../data/generators.js';

export default function RefundsPage() {
  const { db, toast, confirm, refresh, openModal, openOrder, copyText, pushNotif } = useAdmin();

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Pending' | 'Processed' | 'Rejected'
  const [svcF, setSvcF] = useState('all');
  const [destF, setDestF] = useState('all');
  const [searchQ, setSearchQ] = useState('');

  const refunds = db.refunds || [];

  // Metrics
  const pending = refunds.filter((r) => r.status === 'Pending');
  const processed = refunds.filter((r) => r.status === 'Processed');
  const rejected = refunds.filter((r) => r.status === 'Rejected');

  const pendingTotal = pending.reduce((a, r) => a + r.amount, 0);
  const processedTotal = processed.reduce((a, r) => a + r.amount, 0);
  const walletCreditsTotal = processed
    .filter((r) => r.destination.includes('Wallet'))
    .reduce((a, r) => a + r.amount, 0);

  // Approve a pending refund
  const approveRefund = (r) => {
    confirm({
      title: `Approve refund of ${inr(r.amount)}?`,
      text: `Issue ${inr(r.amount)} to ${r.customer} via ${r.destination}. This reversal cannot be cancelled.`,
      ok: 'Approve & Release',
      danger: false,
      onOk: () => {
        r.status = 'Processed';
        r.processedAt = Date.now();

        // Update corresponding order
        const ord = db.orders.find((o) => o.id === r.orderId);
        if (ord) {
          ord.refunded = true;
          ord.refundAmt = r.amount;
          db.activity.unshift(activityFor(ord, 'refund'));
        }

        // Credit wallet if destination is OneBuddy Wallet
        if (r.destination.includes('Wallet')) {
          const cust = db.customers.find((c) => c.name === r.customer || c.phone === r.phone);
          if (cust) cust.wallet += r.amount;
        }

        pushNotif('refund', `Refund of ${inr(r.amount)} approved for ${r.orderId}`, '/refunds');
        toast(`Refund of ${inr(r.amount)} approved for ${r.orderId}`);
        refresh();
      },
    });
  };

  // Reject a pending refund
  const rejectRefund = (r) => {
    confirm({
      title: `Reject refund for ${r.orderId}?`,
      text: `Decline ${inr(r.amount)} refund claim for ${r.customer}. Reason: ${r.reason}.`,
      ok: 'Decline Refund',
      danger: true,
      onOk: () => {
        r.status = 'Rejected';
        r.processedAt = Date.now();
        toast(`Refund claim for ${r.orderId} rejected`);
        refresh();
      },
    });
  };

  // Bulk process all pending refunds
  const processAllPending = () => {
    if (!pending.length) return;
    confirm({
      title: `Approve and release all ${pending.length} pending refunds?`,
      text: `Total of ${inr(pendingTotal)} will be refunded to customers via their chosen methods.`,
      ok: `Release all (${inrS(pendingTotal)})`,
      danger: false,
      onOk: () => {
        pending.forEach((r) => {
          r.status = 'Processed';
          r.processedAt = Date.now();
          const ord = db.orders.find((o) => o.id === r.orderId);
          if (ord) {
            ord.refunded = true;
            ord.refundAmt = r.amount;
            db.activity.unshift(activityFor(ord, 'refund'));
          }
          if (r.destination.includes('Wallet')) {
            const cust = db.customers.find((c) => c.name === r.customer || c.phone === r.phone);
            if (cust) cust.wallet += r.amount;
          }
        });
        toast(`${inr(pendingTotal)} processed across ${pending.length} refunds`);
        refresh();
      },
    });
  };

  // Filtered rows
  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return refunds.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (svcF !== 'all' && r.svc !== svcF) return false;
      if (destF !== 'all') {
        if (destF === 'wallet' && !r.destination.includes('Wallet')) return false;
        if (destF === 'original' && r.destination.includes('Wallet')) return false;
      }
      if (q) {
        const text = `${r.id} ${r.orderId} ${r.customer} ${r.phone} ${r.reason} ${r.notes || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [refunds, statusFilter, svcF, destF, searchQ]);

  return (
    <>
      {/* Page Header */}
      <div className="pagehead">
        <div>
          <h2>Refunds & Claims</h2>
          <p>Customer reversal requests, goodwill credits, and dispute resolution across all services</p>
        </div>
        <div className="row">
          {pending.length > 0 && (
            <button className="btn" onClick={processAllPending}>
              <Icon name="check" size={15} />
              Approve all pending ({inrS(pendingTotal)})
            </button>
          )}
          <button className="btn primary" onClick={() => openModal(<IssueRefundModal />)}>
            <Icon name="plus" size={15} />
            Issue new refund
          </button>
        </div>
      </div>

      {/* Pending Attention Alert */}
      {pending.length > 0 && (
        <div className="banner">
          <Icon name="alert" size={18} />
          <div>
            <b>{pending.length} pending refund requests ({inr(pendingTotal)})</b> require review before today's settlement cut-off.
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <section className="kpis">
        <div className="card kpi">
          <span className="lab">Pending review</span>
          <span className="val" style={{ color: pending.length ? 'var(--warn)' : 'var(--text)' }}>
            {pending.length} <small style={{ fontSize: 15, color: 'var(--muted)' }}>requests</small>
          </span>
          <div className="foot">
            <span className="delta" style={{ color: 'var(--warn)' }}>
              {inr(pendingTotal)}
              <small>Awaiting ops approval</small>
            </span>
          </div>
        </div>

        <div className="card kpi">
          <span className="lab">Processed refunds</span>
          <span className="val" style={{ color: 'var(--good)' }}>
            {inr(processedTotal)}
          </span>
          <div className="foot">
            <span className="delta up">
              {processed.length} completed
              <small>Settled to customers</small>
            </span>
          </div>
        </div>

        <div className="card kpi">
          <span className="lab">Wallet credits issued</span>
          <span className="val">{inr(walletCreditsTotal)}</span>
          <div className="foot">
            <span className="delta">
              Instant credit
              <small>Credited to OneBuddy wallet</small>
            </span>
          </div>
        </div>

        <div className="card kpi">
          <span className="lab">Resolution rate</span>
          <span className="val">
            {refunds.length ? Math.round(((processed.length + rejected.length) / refunds.length) * 100) : 100}%
          </span>
          <div className="foot">
            <span className="delta">
              Avg resolution &lt; 15m
              <small>{rejected.length} claims declined</small>
            </span>
          </div>
        </div>
      </section>

      {/* Table & Filter Card */}
      <div className="card">
        <div className="toolbar">
          <div className="row">
            {/* Status Segment */}
            <div className="seg" role="group" aria-label="Refund status">
              <button aria-pressed={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
                All ({refunds.length})
              </button>
              <button aria-pressed={statusFilter === 'Pending'} onClick={() => setStatusFilter('Pending')}>
                Pending ({pending.length})
              </button>
              <button aria-pressed={statusFilter === 'Processed'} onClick={() => setStatusFilter('Processed')}>
                Processed ({processed.length})
              </button>
              <button aria-pressed={statusFilter === 'Rejected'} onClick={() => setStatusFilter('Rejected')}>
                Rejected ({rejected.length})
              </button>
            </div>

            {/* Service Filter */}
            <select
              className="sel"
              style={{ width: 'auto', minWidth: 140 }}
              value={svcF}
              onChange={(e) => setSvcF(e.target.value)}
              aria-label="Filter by service"
            >
              <option value="all">All Services</option>
              {SVCS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Destination Filter */}
            <select
              className="sel"
              style={{ width: 'auto', minWidth: 150 }}
              value={destF}
              onChange={(e) => setDestF(e.target.value)}
              aria-label="Filter by destination"
            >
              <option value="all">All Destinations</option>
              <option value="original">Original method (UPI / Card)</option>
              <option value="wallet">OneBuddy Wallet</option>
            </select>
          </div>

          <div className="row">
            <div className="lsearch">
              <Icon name="search" size={15} />
              <input
                className="inp"
                placeholder="Search order ID, refund ID, customer..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                aria-label="Search refunds"
              />
            </div>
            {(statusFilter !== 'all' || svcF !== 'all' || destF !== 'all' || searchQ) && (
              <button
                className="btn sm"
                onClick={() => {
                  setStatusFilter('all');
                  setSvcF('all');
                  setDestF('all');
                  setSearchQ('');
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Refunds Data Table */}
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Refund ID & Date</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Service</th>
                <th className="r">Amount</th>
                <th>Destination</th>
                <th>Reason & Notes</th>
                <th>Status</th>
                <th className="r">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((r) => {
                  const isPartial = r.amount < r.orderTotal;

                  return (
                    <tr key={r.id}>
                      <td>
                        <b className="mono" style={{ fontSize: 13 }}>{r.id}</b>
                        <small style={{ color: 'var(--muted)', display: 'block', fontSize: 11.5 }}>
                          {fmtT(r.t)}
                        </small>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn sm ghost"
                          style={{ height: 26, padding: '0 6px', fontWeight: 600, color: 'var(--green-ink)' }}
                          onClick={() => openOrder(r.orderId)}
                          title="Click to view full order details"
                        >
                          <Icon name="file" size={12} />
                          {r.orderId}
                        </button>
                      </td>
                      <td className="who">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <b>{r.customer}</b>
                          <button
                            className="btn sm ghost"
                            style={{ height: 20, padding: '0 4px' }}
                            onClick={() => copyText(r.phone, `Phone ${r.phone} copied`)}
                            title={`Copy phone: ${r.phone}`}
                          >
                            <Icon name="phone" size={11} />
                          </button>
                        </div>
                        <small>{r.phone}</small>
                      </td>
                      <td>
                        <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                          <ServiceTile svc={r.svc} size="sm" />
                          <span style={{ fontSize: 12.5 }}>{SVC[r.svc]?.short}</span>
                        </span>
                      </td>
                      <td className="r">
                        <b style={{ fontSize: 14 }}>{inr(r.amount)}</b>
                        <small style={{ color: 'var(--muted)', display: 'block', fontSize: 11 }}>
                          {isPartial ? `Partial of ${inr(r.orderTotal)}` : `Full refund`}
                        </small>
                      </td>
                      <td>
                        <span className="pill plain t-info" style={{ height: 22, fontSize: 11 }}>
                          {r.destination.includes('Wallet') ? (
                            <span className="row" style={{ gap: 4 }}>
                              <Icon name="wallet" size={11} />
                              Wallet
                            </span>
                          ) : (
                            <span className="row" style={{ gap: 4 }}>
                              <Icon name="tag" size={11} />
                              {r.pay || 'Original'}
                            </span>
                          )}
                        </span>
                      </td>
                      <td style={{ maxWidth: 220 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 500, display: 'block' }}>{r.reason}</span>
                        {r.notes && (
                          <small style={{ color: 'var(--muted)', fontSize: 11, display: 'block' }} className="clamp">
                            {r.notes}
                          </small>
                        )}
                      </td>
                      <td>
                        <span
                          className={`pill ${
                            r.status === 'Processed'
                              ? 't-good'
                              : r.status === 'Pending'
                              ? 't-warn'
                              : 't-mute'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="r">
                        {r.status === 'Pending' ? (
                          <div className="row" style={{ justifyContent: 'flex-end', gap: 6, flexWrap: 'nowrap' }}>
                            <button
                              className="btn sm primary"
                              onClick={() => approveRefund(r)}
                              title="Approve refund"
                            >
                              Approve
                            </button>
                            <button
                              className="btn sm danger"
                              onClick={() => rejectRefund(r)}
                              title="Decline refund"
                            >
                              Reject
                            </button>
                          </div>
                        ) : r.status === 'Processed' ? (
                          <span style={{ fontSize: 12, color: 'var(--good)', fontWeight: 600 }}>
                            Completed ✓
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Declined</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9}>
                    <div className="empty">
                      No refunds match the current filter selection.
                      <div style={{ marginTop: 8 }}>
                        <button
                          className="btn sm"
                          onClick={() => {
                            setStatusFilter('all');
                            setSvcF('all');
                            setDestF('all');
                            setSearchQ('');
                          }}
                        >
                          Clear all filters
                        </button>
                      </div>
                    </div>
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
