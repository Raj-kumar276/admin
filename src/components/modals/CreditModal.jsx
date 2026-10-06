import React from 'react';
import ModalFrame, { FieldError } from './ModalFrame.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';
import { CREDIT_REASONS } from '../../data/constants.js';
import { inr } from '../../utils/format.js';

export default function CreditModal({ customer: c }) {
  const { toast, refresh } = useAdmin();
  return (
    <ModalFrame
      title={`Add wallet credit for ${c.name}`}
      ok="Add credit"
      onSubmit={(f, err) => {
        const a = +f.a;
        if (!a || a < 1) {
          err('a', 'Enter an amount of at least ₹1.');
          return false;
        }
        if (a > 2000) {
          err('a', 'Maximum ₹2,000 per credit.');
          return false;
        }
        c.wallet += a;
        toast(`${inr(a)} added to ${c.name}'s wallet (${f.r})`);
        refresh();
      }}
    >
      {(e) => (
        <>
          <div className="two">
            <div className="field">
              <label htmlFor="ca">Amount (₹)</label>
              <input className="inp" id="ca" name="a" type="number" min="1" max="2000" placeholder="100" />
              <FieldError msg={e.a} />
            </div>
            <div className="field">
              <label htmlFor="cr">Reason</label>
              <select className="sel" id="cr" name="r">
                {CREDIT_REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="muted" style={{ fontSize: 12.5 }}>
            Current balance: {inr(c.wallet)}. Credits above ₹2,000 need finance approval.
          </p>
        </>
      )}
    </ModalFrame>
  );
}
