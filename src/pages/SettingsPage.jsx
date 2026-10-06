import React, { useState } from 'react';
import Icon from '../components/common/Icon.jsx';
import ServiceTile from '../components/common/ServiceTile.jsx';
import Switch from '../components/common/Switch.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import { SVCS } from '../data/constants.js';

const ROLES = ['Operations', 'Support', 'Finance', 'Read-only'];

export default function SettingsPage() {
  const { db, toast, refresh, confirm, setPaused } = useAdmin();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ROLES[0]);
  const [inviteErr, setInviteErr] = useState('');

  const setPlatform = (p, on) => {
    p[2] = on;
    toast(`${p[0]} turned ${on ? 'on' : 'off'}`);
    refresh();
  };
  const toggleZone = (z) => {
    z.on = !z.on;
    toast(`${z.z} ${z.on ? 'is taking orders again' : 'stopped taking orders'}`);
    refresh();
  };
  const removeAdmin = (a) =>
    confirm({
      title: `Remove ${a.name}?`,
      text: 'They lose access to the admin console right away.',
      ok: 'Remove',
      onOk: () => {
        db.admins.splice(db.admins.indexOf(a), 1);
        toast(`${a.name} removed`);
        refresh();
      },
    });
  const invite = (e) => {
    e.preventDefault();
    const em = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return setInviteErr('Enter a valid email address.');
    if (db.admins.some((a) => a.email === em)) return setInviteErr('This person already has access.');
    db.admins.push({ name: em.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), email: em, role });
    setInviteErr('');
    setEmail('');
    toast(`Invite sent to ${em}`);
    refresh();
  };

  return (
    <>
      <div className="pagehead">
        <div>
          <h2>Settings</h2>
          <p>Changes apply immediately across the customer and partner apps.</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Platform</h3>
              <p>Global switches</p>
            </div>
          </div>
          <div className="card-b toggles">
            {db.platform.map((p, i) => (
              <label className="trow" htmlFor={'pl' + i} key={p[0]}>
                <span>
                  <b>{p[0]}</b>
                  <small>{p[1]}</small>
                </span>
                <Switch id={'pl' + i} checked={p[2]} onChange={(e) => setPlatform(p, e.target.checked)} />
              </label>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>Services</h3>
              <p>Turn a service off to stop new bookings instantly</p>
            </div>
          </div>
          <div className="card-b toggles">
            {SVCS.map((s) => (
              <label className="trow" htmlFor={'sv-' + s.id} key={s.id}>
                <span className="row" style={{ flexWrap: 'nowrap' }}>
                  <ServiceTile svc={s.id} size="sm" />
                  <span>
                    <b>{s.name}</b>
                    <small>{db.paused[s.id] ? 'Paused' : 'Accepting new ' + s.units.toLowerCase()}</small>
                  </span>
                </span>
                <Switch id={'sv-' + s.id} checked={!db.paused[s.id]} onChange={(e) => setPaused(s.id, !e.target.checked)} />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Service zones · Hyderabad</h3>
            <p>
              {db.zones.filter((z) => z.on).length} of {db.zones.length} zones taking orders. Tap a zone to switch it.
            </p>
          </div>
        </div>
        <div className="card-b row">
          {db.zones.map((z) => (
            <button key={z.z} className="chip" aria-pressed={z.on} onClick={() => toggleZone(z)}>
              <Icon name={z.on ? 'check' : 'pin'} size={14} />
              {z.z}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Admin team</h3>
            <p>People who can sign in to this console</p>
          </div>
        </div>
        <div className="tbl-wrap" style={{ marginTop: 14 }}>
          <table style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th className="r">Action</th>
              </tr>
            </thead>
            <tbody>
              {db.admins.map((a) => (
                <tr key={a.email}>
                  <td>
                    <b style={{ fontWeight: 600 }}>{a.name}</b>
                  </td>
                  <td className="mono">{a.email}</td>
                  <td>
                    <span className={'pill plain ' + (a.role === 'Owner' ? 't-vio' : 't-mute')}>{a.role}</span>
                  </td>
                  <td className="r">
                    {a.role === 'Owner' ? (
                      <span className="muted" style={{ fontSize: 12.5 }}>You</span>
                    ) : (
                      <button className="btn sm danger" onClick={() => removeAdmin(a)}>Remove</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form
          id="inviteForm"
          onSubmit={invite}
          className="card-b"
          style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr) auto', gap: 10, alignItems: 'end', borderTop: '1px solid var(--line)' }}
        >
          <div className="field">
            <label htmlFor="invEmail">Invite by email</label>
            <input className="inp" id="invEmail" type="email" placeholder="name@onebuddy.app" value={email} onChange={(e) => setEmail(e.target.value)} />
            <span className="err">{inviteErr}</span>
          </div>
          <div className="field">
            <label htmlFor="invRole">Role</label>
            <select className="sel" id="invRole" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <span className="err" />
          </div>
          <div className="field">
            <button className="btn primary" type="submit">
              <Icon name="send" size={15} />
              Send invite
            </button>
            <span className="err" />
          </div>
        </form>
      </div>
    </>
  );
}
