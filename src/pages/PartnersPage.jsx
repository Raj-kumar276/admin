import React from 'react';
import PartnersTable from '../components/partners/PartnersTable.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import { SVCS } from '../data/constants.js';

export default function PartnersPage() {
  const { db, ui, setUi } = useAdmin();
  const pend = db.partners.filter((p) => p.kyc === 'Pending').length;
  const filters = [['all', 'All services']].concat(SVCS.map((s) => [s.id, s.short]));

  return (
    <>
      <div className="pagehead">
        <div>
          <h2>Partners & KYC</h2>
          <p>
            {db.partners.length} partners across five services · {pend} waiting for document review
          </p>
        </div>
      </div>
      <div className="row">
        {filters.map(([k, l]) => (
          <button key={k} className="chip" aria-pressed={ui.pSvc === k} onClick={() => setUi({ pSvc: k })}>
            {k !== 'all' && <span className="d" style={{ '--c': `var(--s-${k})` }} />}
            {l} <b>{db.partners.filter((p) => k === 'all' || p.svc === k).length}</b>
          </button>
        ))}
      </div>
      <div className="card">
        <PartnersTable svcId="" />
      </div>
    </>
  );
}
