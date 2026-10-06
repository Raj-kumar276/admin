import React from 'react';
import ModalFrame, { FieldError } from './ModalFrame.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';
import { SVCS, SVC, AREAS, PARTNER_TYPES } from '../../data/constants.js';
import { makePartner } from '../../data/generators.js';

const TYPES = ['Rider', 'Restaurant', 'Store', 'Captain', 'Doctor', 'Professional'];

export default function AddPartnerModal({ svcId = '' }) {
  const { db, toast, setUi } = useAdmin();
  return (
    <ModalFrame
      title="Add partner"
      ok="Add & send KYC link"
      onSubmit={(f, err) => {
        let bad = false;
        const ok = PARTNER_TYPES[f.svc];
        if (!ok.includes(f.type)) {
          err('type', `${SVC[f.svc].short} takes: ${ok.join(' or ')}.`);
          bad = true;
        }
        if (!f.name || f.name.trim().length < 3) {
          err('name', 'Enter at least 3 characters.');
          bad = true;
        }
        if (!/^[6-9]\d{9}$/.test(f.phone || '')) {
          err('phone', 'Enter a 10-digit Indian mobile number.');
          bad = true;
        }
        if (bad) return false;
        const p = makePartner(db, f.svc, f.type, f.name.trim(), 'KYC link sent · awaiting documents');
        Object.assign(p, { kyc: 'Pending', online: false, jobs: 0, rating: 0, phone: f.phone, area: f.area });
        if (f.type === 'Doctor') p.fee = 500;
        toast(`${p.name} added — KYC link sent`);
        setUi({ pSt: 'all' });
      }}
    >
      {(e) => (
        <>
          <div className="two">
            <div className="field">
              <label htmlFor="ps">Service</label>
              <select className="sel" id="ps" name="svc" defaultValue={svcId || SVCS[0].id}>
                {SVCS.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pt">Type</label>
              <select className="sel" id="pt" name="type">
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <FieldError msg={e.type} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="pn">Name</label>
            <input className="inp" id="pn" name="name" placeholder="Full name or business name" />
            <FieldError msg={e.name} />
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor="pp">Mobile number</label>
              <input className="inp" id="pp" name="phone" inputMode="numeric" maxLength={10} placeholder="10 digits" />
              <FieldError msg={e.phone} />
            </div>
            <div className="field">
              <label htmlFor="pa">Area</label>
              <select className="sel" id="pa" name="area">
                {AREAS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="muted" style={{ fontSize: 12.5 }}>
            They get an SMS link to upload ID, bank details and licences. They stay offline until you approve the KYC.
          </p>
        </>
      )}
    </ModalFrame>
  );
}
