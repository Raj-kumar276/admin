import React from 'react';
import ServiceTile from '../common/ServiceTile.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';
import { SVC } from '../../data/constants.js';
import { describeActivity } from '../../data/generators.js';
import { ago } from '../../utils/format.js';

export default function LiveFeed() {
  const { db } = useAdmin();
  return (
    <ul className="feed">
      {db.activity.slice(0, 14).map((a, i) => {
        const d = describeActivity(a);
        const fresh = i === 0 && a.freshAt && Date.now() - a.freshAt < 1500;
        return (
          <li key={a.oid + a.kind + a.t} className={fresh ? 'fresh' : ''}>
            <ServiceTile svc={a.svc} size="sm" />
            <div>
              <p>
                {d.pre}
                <b className="mono">{d.id}</b>
                {d.post}
              </p>
              <small>
                {SVC[a.svc].short} · {ago(a.t)}
              </small>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
