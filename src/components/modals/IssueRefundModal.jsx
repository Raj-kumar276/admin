import React, { useState, useMemo } from 'react';
import ModalFrame, { FieldError } from './ModalFrame.jsx';
import ServiceTile from '../common/ServiceTile.jsx';
import Icon from '../common/Icon.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';
import { SVC, REFUND_REASONS, REFUND_DESTINATIONS } from '../../data/constants.js';
import { inr } from '../../utils/format.js';
import { activityFor } from '../../data/generators.js';

export default function IssueRefundModal({ order: initialOrder = null, onComplete }) {
  const { db, toast, refresh, pushNotif } = useAdmin();
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrder ? initialOrder.id : '');
  const [orderSearch, setOrderSearch] = useState('');
  const [isFull, setIsFull] = useState(true);
  const [customAmt, setCustomAmt] = useState('');

  // Active selected order
  const currentOrder = useMemo(() => {
    if (initialOrder) return initialOrder;
    if (!selectedOrderId) return null;
    return db.orders.find((o) => o.id === selectedOrderId) || null;
  }, [initialOrder, selectedOrderId, db.orders]);

  // Order suggestions for search
  const orderSuggestions = useMemo(() => {
    if (initialOrder) return [];
    const q = orderSearch.trim().toLowerCase();
    if (!q) return db.orders.slice(0, 8);
    return db.orders
      .filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.phone.includes(q)
      )
      .slice(0, 10);
  }, [initialOrder, orderSearch, db.orders]);

  return (
    <ModalFrame
      title={currentOrder ? `Issue refund for ${currentOrder.id}` : 'Issue customer refund'}
      ok="Process refund"
      onSubmit={(f, err) => {
        if (!currentOrder) {
          err('order', 'Please select an order to refund.');
          return false;
        }

        const amt = isFull ? currentOrder.amount : +f.customAmount;
        if (!amt || amt <= 0) {
          err('amount', 'Enter a valid refund amount greater than ₹0.');
          return false;
        }
        if (amt > currentOrder.amount) {
          err('amount', `Amount cannot exceed the order total of ${inr(currentOrder.amount)}.`);
          return false;
        }

        // Generate refund record
        const rfid = db.rfid ? db.rfid++ : 8110;
        const newRecord = {
          id: `RF-${rfid}`,
          orderId: currentOrder.id,
          svc: currentOrder.svc,
          customer: currentOrder.customer,
          phone: currentOrder.phone,
          amount: amt,
          orderTotal: currentOrder.amount,
          pay: currentOrder.pay,
          destination: f.destination,
          reason: f.reason,
          status: 'Processed',
          t: Date.now(),
          processedAt: Date.now(),
          notes: (f.notes || '').trim() || 'Refund processed by Ops Admin',
        };

        if (!db.refunds) db.refunds = [];
        db.refunds.unshift(newRecord);

        // Update the order
        currentOrder.refunded = true;
        currentOrder.refundAmt = amt;
        currentOrder.refundReason = f.reason;

        // Credit customer wallet if selected
        if (f.destination.includes('Wallet')) {
          const cust = db.customers.find((c) => c.name === currentOrder.customer || c.phone === currentOrder.phone);
          if (cust) {
            cust.wallet += amt;
          }
        }

        // Log activity & toast
        db.activity.unshift(activityFor(currentOrder, 'refund'));
        pushNotif('refund', `Refund of ${inr(amt)} processed for ${currentOrder.id} (${currentOrder.customer})`, '/refunds');
        toast(`Refund of ${inr(amt)} issued for ${currentOrder.id}`);

        if (onComplete) onComplete(newRecord);
        refresh();
      }}
    >
      {(e) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Order Search / Selector if not pre-populated */}
          {!initialOrder && (
            <div className="field">
              <label>Select order to refund</label>
              <div className="adorn">
                <input
                  className="inp"
                  placeholder="Search order ID (e.g. FD-4188), customer name, or phone..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
                <Icon name="search" size={15} />
              </div>

              {/* Suggestions dropdown / quick list */}
              <div
                style={{
                  maxHeight: 140,
                  overflowY: 'auto',
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  marginTop: 6,
                  background: 'var(--surface-2)',
                }}
              >
                {orderSuggestions.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => {
                      setSelectedOrderId(o.id);
                      setOrderSearch(o.id);
                    }}
                    style={{
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid var(--line)',
                      cursor: 'pointer',
                      background: selectedOrderId === o.id ? 'color-mix(in oklab, var(--green) 12%, var(--surface))' : 'transparent',
                    }}
                  >
                    <span className="row" style={{ gap: 8 }}>
                      <ServiceTile svc={o.svc} size="sm" />
                      <b>{o.id}</b>
                      <span className="muted" style={{ fontSize: 12 }}>· {o.customer}</span>
                    </span>
                    <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>
                      {inr(o.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <FieldError msg={e.order} />
            </div>
          )}

          {/* Selected Order Summary Card */}
          {currentOrder && (
            <div
              style={{
                background: 'var(--surface-2)',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div className="row" style={{ gap: 10 }}>
                <ServiceTile svc={currentOrder.svc} />
                <div>
                  <div className="row" style={{ gap: 6 }}>
                    <b style={{ fontSize: 14 }}>{currentOrder.id}</b>
                    <span className="pill t-info plain" style={{ height: 20, fontSize: 11 }}>
                      {SVC[currentOrder.svc]?.short}
                    </span>
                  </div>
                  <small style={{ color: 'var(--muted)', fontSize: 12 }}>
                    Customer: {currentOrder.customer} ({currentOrder.phone}) · Paid via <b>{currentOrder.pay}</b>
                  </small>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="muted" style={{ fontSize: 11, textTransform: 'uppercase', display: 'block' }}>
                  Order Total
                </span>
                <b style={{ fontSize: 16, color: 'var(--text)' }}>{inr(currentOrder.amount)}</b>
              </div>
            </div>
          )}

          {/* Refund Amount Options */}
          {currentOrder && (
            <div className="field">
              <label>Refund amount</label>
              <div className="seg" style={{ width: '100%', marginBottom: 8 }}>
                <button
                  type="button"
                  style={{ flex: 1 }}
                  aria-pressed={isFull}
                  onClick={() => {
                    setIsFull(true);
                    setCustomAmt('');
                  }}
                >
                  Full refund ({inr(currentOrder.amount)})
                </button>
                <button
                  type="button"
                  style={{ flex: 1 }}
                  aria-pressed={!isFull}
                  onClick={() => {
                    setIsFull(false);
                    setCustomAmt(Math.round(currentOrder.amount / 2));
                  }}
                >
                  Partial refund
                </button>
              </div>

              {!isFull && (
                <div className="adorn">
                  <input
                    className="inp num"
                    name="customAmount"
                    type="number"
                    min="1"
                    max={currentOrder.amount}
                    value={customAmt}
                    onChange={(e) => setCustomAmt(e.target.value)}
                    placeholder="Enter partial refund amount"
                  />
                  <span>₹</span>
                </div>
              )}
              <FieldError msg={e.amount} />
            </div>
          )}

          {/* Destination */}
          <div className="field">
            <label htmlFor="refDest">Refund destination</label>
            <select className="sel" id="refDest" name="destination" defaultValue={REFUND_DESTINATIONS[0]}>
              {REFUND_DESTINATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} {currentOrder && d.includes('Original') ? `(${currentOrder.pay})` : ''}
                </option>
              ))}
            </select>
            <small className="muted" style={{ fontSize: 11.5 }}>
              Original payment method reversals take 3–5 working days; OneBuddy Wallet is credited immediately.
            </small>
          </div>

          {/* Reason */}
          <div className="field">
            <label htmlFor="refReason">Reason for refund</label>
            <select className="sel" id="refReason" name="reason" defaultValue={REFUND_REASONS[0]}>
              {REFUND_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Internal Notes */}
          <div className="field">
            <label htmlFor="refNotes">Admin / ticket notes (optional)</label>
            <textarea
              className="inp"
              id="refNotes"
              name="notes"
              placeholder="e.g. Approved per support ticket TK-2291. Restaurant verified missing portion."
              rows={2}
            />
          </div>
        </div>
      )}
    </ModalFrame>
  );
}
