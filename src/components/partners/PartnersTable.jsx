import React from 'react';
import Icon from '../common/Icon.jsx';
import ServiceTile from '../common/ServiceTile.jsx';
import Switch from '../common/Switch.jsx';
import { KycPill } from '../common/Pills.jsx';
import AddPartnerModal from '../modals/AddPartnerModal.jsx';
import usePartnerActions from '../../hooks/usePartnerActions.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';
import { SVC } from '../../data/constants.js';

const STATES = ['all', 'Verified', 'Pending', 'Suspended', 'Rejected'];

/**
 * Partner list with KYC filters. Used on the Partners page (svcId = '')
 * and inside each service's "partners" tab (svcId = 'food' etc.).
 */
export default function PartnersTable({ svcId = '' }) {
  const { db, ui, setUi, openModal } = useAdmin();
  const act = usePartnerActions();
  const svcF = svcId || ui.pSvc;
  const q = ui.pQ.trim().toLowerCase();

  const rows = db.partners
    .filter((p) => (svcF === 'all' || p.svc === svcF) && (ui.pSt === 'all' || p.kyc === ui.pSt) && (!q || (p.name + ' ' + p.extra + ' ' + p.area + ' ' + p.type).toLowerCase().includes(q)))
    .sort((a, b) => (a.kyc === 'Pending' ? -1 : 0) - (b.kyc === 'Pending' ? -1 : 0));

  return (
    <>
      <div className="toolbar">
        <div className="row">
          {STATES.map((k) => (
            <button key={k} className="chip" aria-pressed={ui.pSt === k} onClick={() => setUi({ pSt: k })}>
              {k === 'all' ? 'All' : k} <b>{db.partners.filter((p) => (!svcId || p.svc === svcId) && (k === 'all' || p.kyc === k)).length}</b>
            </button>
          ))}
        </div>
        <div className="row">
          <div className="lsearch">
            <Icon name="search" size={15} />
            <input className="inp" placeholder="Search partners" value={ui.pQ} onChange={(e) => setUi({ pQ: e.target.value })} aria-label="Search partners" />
          </div>
          <button className="btn primary sm" onClick={() => openModal(<AddPartnerModal svcId={svcId} />)}>
            <Icon name="plus" size={15} />
            Add partner
          </button>
        </div>
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Partner</th>
              {!svcId && <th>Service</th>}
              <th>Type</th>
              <th>Area</th>
              <th>Rating</th>
              <th className="r">Jobs</th>
              <th>KYC</th>
              <th>Online</th>
              <th className="r">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((p) => (
                <tr key={p.id}>
                  <td className="who">
                    <b>{p.name}</b>
                    <small>
                      {p.extra}
                      {p.plan ? ' · Plan ' + p.plan : ''}
                    </small>
                  </td>
                  {!svcId && (
                    <td>
                      <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                        <ServiceTile svc={p.svc} size="sm" />
                        {SVC[p.svc].short}
                      </span>
                    </td>
                  )}
                  <td>{p.type}</td>
                  <td>{p.area}</td>
                  <td>
                    {p.rating ? (
                      <span className="stars">
                        <Icon name="star" size={13} />
                        {p.rating}
                      </span>
                    ) : (
                      <span className="muted">New</span>
                    )}
                  </td>
                  <td className="r num">{p.jobs.toLocaleString('en-IN')}</td>
                  <td>
                    <KycPill kyc={p.kyc} />
                  </td>
                  <td>
                    <label title={p.kyc === 'Verified' ? 'Toggle online' : 'Only verified partners can go online'}>
                      <Switch checked={p.online} disabled={p.kyc !== 'Verified'} onChange={(e) => act.setOnline(p, e.target.checked)} aria-label={`${p.name} online`} />
                    </label>
                  </td>
                  <td className="r">
                    <div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                      {p.kyc === 'Pending' ? (
                        <>
                          <button className="btn sm primary" onClick={() => act.approve(p)}>Approve</button>
                          <button className="btn sm" onClick={() => act.reject(p)}>Reject</button>
                        </>
                      ) : p.kyc === 'Verified' ? (
                        <button className="btn sm danger" onClick={() => act.suspend(p)}>Suspend</button>
                      ) : (
                        <button className="btn sm" onClick={() => act.reinstate(p)}>Reinstate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9}>
                  <div className="empty">No partners match these filters.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
