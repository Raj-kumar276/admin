import React, { useEffect, useRef, useState } from 'react';
import Icon from '../components/common/Icon.jsx';
import ServiceTile from '../components/common/ServiceTile.jsx';
import { PriorityPill } from '../components/common/Pills.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import { SVC, QUICK_REPLIES } from '../data/constants.js';
import { ago, fmtT } from '../utils/format.js';

export default function SupportPage() {
  const { db, ui, setUi, toast, refresh } = useAdmin();
  const [reply, setReply] = useState('');
  const threadRef = useRef(null);
  const replyRef = useRef(null);

  const list = db.tickets.filter((t) => ui.tFilter === 'All' || t.status === ui.tFilter);
  const t = db.tickets.find((x) => x.id === ui.tSel && list.includes(x)) || list[0];
  if (t) ui.tSel = t.id;

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [t && t.id, t && t.msgs.length]);

  useEffect(() => setReply(''), [t && t.id]);

  const select = (id) => {
    setUi({ tSel: id });
    if (window.innerWidth < 940) setTimeout(() => threadRef.current && threadRef.current.scrollIntoView({ behavior: 'smooth' }), 0);
  };
  const setStatus = (status) => {
    t.status = status;
    toast(`${t.id} ${status === 'Resolved' ? 'resolved' : 'reopened'}`);
    refresh();
  };
  const send = (e) => {
    e.preventDefault();
    const txt = reply.trim();
    if (!txt) {
      toast('Type a reply first', true);
      return;
    }
    t.msgs.push({ from: 'a', text: txt, t: Date.now() });
    setReply('');
    toast(`Reply sent to ${t.customer}`);
    refresh();
  };

  return (
    <>
      <div className="pagehead">
        <div>
          <h2>Support tickets</h2>
          <p>{db.tickets.filter((x) => x.status === 'Open').length} open · first reply target 15 minutes</p>
        </div>
        <div className="seg">
          {['Open', 'Resolved', 'All'].map((k) => (
            <button key={k} aria-pressed={ui.tFilter === k} onClick={() => setUi({ tFilter: k, tSel: null })}>
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="support">
        <div className="card tlist" style={{ overflow: 'hidden' }}>
          {list.length ? (
            list.map((x) => (
              <button key={x.id} className="titem" aria-current={t && x.id === t.id} onClick={() => select(x.id)}>
                <ServiceTile svc={x.svc} size="sm" />
                <div style={{ minWidth: 0 }}>
                  <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                    <b>{x.subject}</b>
                  </div>
                  <small>
                    {x.id} · {x.customer} · {ago(x.msgs[x.msgs.length - 1].t)}
                  </small>
                  <div className="row" style={{ marginTop: 6, gap: 6 }}>
                    <PriorityPill pri={x.pri} />
                    {x.status === 'Resolved' && <span className="pill t-good">Resolved</span>}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="empty">No tickets here.</div>
          )}
        </div>

        {t && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-h" style={{ paddingBottom: 14 }}>
              <div className="svchead">
                <ServiceTile svc={t.svc} />
                <div>
                  <h3>{t.subject}</h3>
                  <p>
                    {t.id} · {t.customer} · {SVC[t.svc].name}
                  </p>
                </div>
              </div>
              <div className="row">
                <select
                  className="sel"
                  value={t.pri}
                  onChange={(e) => {
                    t.pri = e.target.value;
                    toast(`${t.id} priority set to ${t.pri}`);
                    refresh();
                  }}
                  style={{ width: 'auto', height: 32 }}
                  aria-label="Priority"
                >
                  {['High', 'Medium', 'Low'].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
                {t.status === 'Open' ? (
                  <button className="btn sm primary" onClick={() => setStatus('Resolved')}>
                    <Icon name="check" size={14} />
                    Resolve
                  </button>
                ) : (
                  <button className="btn sm" onClick={() => setStatus('Open')}>
                    Reopen
                  </button>
                )}
              </div>
            </div>

            <div className="thread" ref={threadRef}>
              {t.msgs.map((m, i) => (
                <div key={i} className={'msg' + (m.from === 'a' ? ' agent' : '')}>
                  {m.text}
                  <small>
                    {m.from === 'a' ? 'You' : t.customer} · {fmtT(m.t)}
                  </small>
                </div>
              ))}
            </div>

            <form onSubmit={send} style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="row" style={{ gap: 6 }}>
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="chip"
                    onClick={() => {
                      setReply(q);
                      replyRef.current && replyRef.current.focus();
                    }}
                  >
                    {q.length > 34 ? q.slice(0, 32) + '…' : q}
                  </button>
                ))}
              </div>
              <textarea ref={replyRef} className="inp" rows={3} placeholder={`Reply to ${t.customer}…`} value={reply} onChange={(e) => setReply(e.target.value)} />
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  Replies go to the customer's in-app chat.
                </span>
                <button className="btn primary" type="submit">
                  <Icon name="send" size={15} />
                  Send reply
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
