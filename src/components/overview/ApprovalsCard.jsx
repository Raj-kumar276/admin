import React from 'react';
import Icon from '../common/Icon.jsx';
import ServiceTile from '../common/ServiceTile.jsx';
import usePartnerActions from '../../hooks/usePartnerActions.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';

export default function ApprovalsCard() {
  const { db } = useAdmin();
  const act = usePartnerActions();
  const pend = db.partners.filter((p) => p.kyc === 'Pending');

  if (!pend.length)
    return (
      <div className="empty">
        <Icon name="check" size={22} />
        <p style={{ marginTop: 6 }}>No partners waiting for review.</p>
      </div>
    );

  return pend.slice(0, 5).map((p) => (
    <div key={p.id} style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: 10, padding: '10px 0', borderBottom: '1px dashed var(--line)' }}>
      <ServiceTile svc={p.svc} size="sm" />
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <b style={{ fontWeight: 600 }}>{p.name}</b>
          <span className="muted" style={{ fontSize: 12 }}>{p.type}</span>
        </div>
        <p className="muted" style={{ fontSize: 12.5 }}>{p.extra}</p>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn sm primary" onClick={() => act.approve(p)}>
            <Icon name="check" size={14} />
            Approve
          </button>
          <button className="btn sm" onClick={() => act.reject(p)}>
            Reject
          </button>
        </div>
      </div>
    </div>
  ));
}
