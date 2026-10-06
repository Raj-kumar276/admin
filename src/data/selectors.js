import { SVC, SVCS } from './constants.js';

export const isDone = (o) => o.idx === SVC[o.svc].statuses.length - 1;
export const isActive = (o) => !o.cancelled && !isDone(o);

export const todaySum = (db, svc) => db.orders.filter((o) => o.svc === svc && !o.cancelled).reduce((a, o) => a + o.amount, 0);
export const todayCount = (db, svc) => db.orders.filter((o) => o.svc === svc).length;

// Index 59 is "today" (live); 0–58 are history.
export const dailyAt = (db, svc, i) => (i === 59 ? todaySum(db, svc) : db.daily[svc][i]);
export const countAt = (db, svc, i) => (i === 59 ? todayCount(db, svc) : db.counts[svc][i]);

export const sumRange = (db, fn, n, offset = 0) => {
  let s = 0;
  for (let i = 59 - offset - n + 1; i <= 59 - offset; i++) SVCS.forEach((x) => (s += fn(db, x.id, i)));
  return s;
};

export const rangeInfo = (range) =>
  range === 'today' ? { n: 1, label: 'vs this time yesterday' } : range === '7d' ? { n: 7, label: 'vs prev. 7 days' } : { n: 30, label: 'vs prev. 30 days' };

export const payoutPartners = (db) => db.partners.filter((p) => p.svc !== 'ride' && p.kyc === 'Verified' && p.jobs > 0);

export const filterOrders = (db, id, status, query) => {
  const q = query.trim().toLowerCase();
  return db.orders.filter(
    (o) =>
      o.svc === id &&
      (status === 'all' || (status === 'x' ? o.cancelled : !o.cancelled && String(o.idx) === status)) &&
      (!q || (o.id + ' ' + o.customer + ' ' + o.area + ' ' + o.phone + ' ' + o.detail).toLowerCase().includes(q))
  );
};
