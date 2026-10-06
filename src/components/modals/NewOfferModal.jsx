import React from 'react';
import ModalFrame, { FieldError } from './ModalFrame.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';
import { SVCS } from '../../data/constants.js';

export default function NewOfferModal() {
  const { db, toast, refresh } = useAdmin();
  const d = new Date();
  d.setDate(d.getDate() + 30);

  const submit = (f, err) => {
    let bad = false;
    const code = (f.code || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{4,12}$/.test(code)) (err('code', 'Use 4–12 letters or numbers, no spaces.'), (bad = true));
    else if (db.offers.some((o) => o.code === code)) (err('code', `${code} already exists.`), (bad = true));
    if (!(f.desc || '').trim()) (err('desc', 'Add a short description.'), (bad = true));
    const v = +f.value;
    if (!(v > 0)) (err('value', 'Enter a value above 0.'), (bad = true));
    else if (f.kind === '%' && v > 90) (err('value', "Percentage can't exceed 90%."), (bad = true));
    if (!(+f.cap > 0)) (err('cap', 'Enter a maximum discount.'), (bad = true));
    if (!f.exp || new Date(f.exp) < new Date(new Date().toDateString())) (err('exp', 'Pick today or a later date.'), (bad = true));
    if (bad) return false;
    db.offers.unshift({ code, desc: f.desc.trim(), kind: f.kind, value: v, cap: +f.cap, min: +f.min || 0, svc: f.svc, used: 0, active: true, exp: f.exp });
    toast(`${code} is live`);
    refresh();
  };

  return (
    <ModalFrame title="Create offer" ok="Create offer" onSubmit={submit}>
      {(e) => (
        <>
          <div className="two">
            <div className="field">
              <label htmlFor="oc">Coupon code</label>
              <input className="inp mono" id="oc" name="code" placeholder="WEEKEND40" style={{ textTransform: 'uppercase' }} />
              <FieldError msg={e.code} />
            </div>
            <div className="field">
              <label htmlFor="os">Service</label>
              <select className="sel" id="os" name="svc">
                <option value="all">All services</option>
                {SVCS.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="od">Description customers see</label>
            <input className="inp" id="od" name="desc" placeholder="40% off weekend dinners" />
            <FieldError msg={e.desc} />
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor="ok">Discount type</label>
              <select className="sel" id="ok" name="kind">
                <option value="%">Percentage (%)</option>
                <option value="₹">Flat amount (₹)</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="ov">Value</label>
              <input className="inp" id="ov" name="value" type="number" min="1" placeholder="40" />
              <FieldError msg={e.value} />
            </div>
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor="om">Minimum order (₹)</label>
              <input className="inp" id="om" name="min" type="number" min="0" defaultValue={199} />
            </div>
            <div className="field">
              <label htmlFor="ocap">Maximum discount (₹)</label>
              <input className="inp" id="ocap" name="cap" type="number" min="1" defaultValue={120} />
              <FieldError msg={e.cap} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="oe">Ends on</label>
            <input className="inp" id="oe" name="exp" type="date" defaultValue={d.toISOString().slice(0, 10)} />
            <FieldError msg={e.exp} />
          </div>
        </>
      )}
    </ModalFrame>
  );
}
