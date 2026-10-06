import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getDb } from '../data/seed.js';
import { SVC, SVCS } from '../data/constants.js';
import { isActive } from '../data/selectors.js';
import { genOrder, activityFor, assignable } from '../data/generators.js';
import { pick, rnd } from '../utils/random.js';
import { inr, copyTableData, toTSV } from '../utils/format.js';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';
import CopyFallbackModal from '../components/modals/CopyFallbackModal.jsx';

const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

let toastId = 0;

export function AdminProvider({ children }) {
  const db = getDb();
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  // Filters / tabs remembered while navigating between pages.
  const uiRef = useRef(null);
  if (!uiRef.current) {
    const u = { range: '7d', chartTable: false, tab: {}, st: {}, q: {}, pSvc: 'all', pSt: 'all', pQ: '', cQ: '', cSt: 'all', tFilter: 'Open', tSel: 'TK-2291' };
    SVCS.forEach((s) => {
      u.tab[s.id] = 'orders';
      u.st[s.id] = 'all';
      u.q[s.id] = '';
    });
    uiRef.current = u;
  }
  const ui = uiRef.current;
  const setUi = useCallback(
    (patch) => {
      Object.assign(uiRef.current, typeof patch === 'function' ? patch(uiRef.current) : patch);
      refresh();
    },
    [refresh]
  );

  /* ---------- toasts ---------- */
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, bad = false) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, msg, bad, leaving: false }]);
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x))), 3200);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  /* ---------- modal ---------- */
  const [modal, setModal] = useState(null);
  const openModal = useCallback((el) => setModal(el), []);
  const closeModal = useCallback(() => setModal(null), []);
  const confirm = useCallback((opts) => setModal(<ConfirmModal {...opts} />), []);

  const copyText = useCallback(
    (txt, label) => {
      const done = () => toast(label || 'Copied');
      const fallback = () => setModal(<CopyFallbackModal text={txt} />);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fallback);
      else fallback();
    },
    [toast]
  );

  const copyTable = useCallback(
    async (tableSpec, label) => {
      const res = await copyTableData(tableSpec);
      if (res && res.ok) {
        toast(label || 'Copied table to clipboard');
      } else {
        const text = (res && res.text) || '';
        setModal(<CopyFallbackModal text={text} />);
      }
    },
    [toast]
  );

  /* ---------- order drawer ---------- */
  const [drawerId, setDrawerId] = useState(null);
  const openOrder = useCallback((id) => setDrawerId(id), []);
  const closeDrawer = useCallback(() => setDrawerId(null), []);

  /* ---------- session / live ---------- */
  const [live, setLive] = useState(true);
  const [signedOut, setSignedOut] = useState(false);

  /* ---------- shared actions ---------- */
  const pushNotif = useCallback(
    (icon, text, route) => {
      db.notifs.unshift({ id: db.nid++, icon, text, t: Date.now(), read: false, route });
      refresh();
    },
    [db, refresh]
  );

  const advanceOrder = useCallback(
    (o, silent) => {
      const s = SVC[o.svc];
      if (o.cancelled || o.idx === s.statuses.length - 1) return;
      o.idx++;
      o.hist[o.idx] = Date.now();
      if (!o.partner && o.idx >= s.assignAt) {
        const c = assignable(db, o.svc).filter((p) => p.online);
        const pk = c[0] || assignable(db, o.svc)[0];
        if (pk) {
          o.partner = pk.id;
          if (!silent) toast(`Auto-assigned ${pk.name}`);
        }
      }
      db.activity.unshift(activityFor(o, 'status'));
    },
    [db, toast]
  );

  const setPaused = useCallback(
    (id, val) => {
      db.paused[id] = val;
      toast(`${SVC[id].name} ${val ? 'paused' : 'resumed'}`);
      pushNotif(val ? 'alert' : 'play', `${SVC[id].name} was ${val ? 'paused' : 'resumed'} by Ops Admin`, '/services/' + id);
    },
    [db, toast, pushNotif]
  );

  /* ---------- live order simulation (every 7s) ---------- */
  const tick = useRef(0);
  useEffect(() => {
    const t = setInterval(() => {
      if (!live || signedOut) return;
      tick.current++;
      const open = SVCS.filter((s) => !db.paused[s.id]);
      if (tick.current % 3 !== 0 && open.length) {
        const s = pick(open);
        const o = genOrder(db, s.id, 0, 0);
        o.freshAt = Date.now();
        db.orders.unshift(o);
        db.activity.unshift(activityFor(o, 'new'));
        if (rnd() < 0.25) db.notifs.unshift({ id: db.nid++, icon: s.id === 'ride' ? 'zap' : 'bell', text: `New ${s.unit} ${o.id} · ${inr(o.amount)} from ${o.area}`, t: Date.now(), read: false, route: '/services/' + s.id });
      } else {
        const act = db.orders.filter(isActive);
        if (act.length) advanceOrder(pick(act), true);
      }
      refresh();
    }, 7000);
    return () => clearInterval(t);
  }, [live, signedOut, db, advanceOrder, refresh]);

  const value = useMemo(
    () => ({
      db, version, refresh, ui, setUi,
      toasts, toast,
      modal, openModal, closeModal, confirm, copyText, copyTable,
      drawerId, openOrder, closeDrawer,
      live, setLive, signedOut, setSignedOut,
      pushNotif, advanceOrder, setPaused,
    }),
    [db, version, refresh, ui, setUi, toasts, toast, modal, openModal, closeModal, confirm, copyText, copyTable, drawerId, openOrder, closeDrawer, live, signedOut, pushNotif, advanceOrder, setPaused]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
