import React from 'react';
import { useNavigate } from 'react-router-dom';
import ServiceTile from '../common/ServiceTile.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';
import { ago } from '../../utils/format.js';

export default function TicketsMini() {
  const { db, setUi } = useAdmin();
  const nav = useNavigate();
  const open = db.tickets.filter((t) => t.status === 'Open');

  return (
    <>
      <div className="row" style={{ marginBottom: 6 }}>
        {['High', 'Medium', 'Low'].map((p) => (
          <span key={p} className={'pill ' + (p === 'High' ? 't-bad' : p === 'Medium' ? 't-warn' : 't-mute')}>
            {open.filter((t) => t.pri === p).length} {p.toLowerCase()}
          </span>
        ))}
      </div>
      {open.slice(0, 4).map((t) => (
        <button
          key={t.id}
          className="titem"
          style={{ padding: '10px 0', borderTop: '1px dashed var(--line)' }}
          onClick={() => {
            setUi({ tSel: t.id, tFilter: 'Open' });
            nav('/support');
          }}
        >
          <ServiceTile svc={t.svc} size="sm" />
          <div style={{ minWidth: 0 }}>
            <b>{t.subject}</b>
            <small>
              {t.id} · {t.customer} · {ago(t.msgs[t.msgs.length - 1].t)}
            </small>
          </div>
        </button>
      ))}
    </>
  );
}
