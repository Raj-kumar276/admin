import { SVC, SVCS, AREAS, LAND, FOOD_I, GROC_I, HOME_S, CLINICS, FIRST, LAST } from './constants.js';
import { rnd, pick, ri } from '../utils/random.js';
import { fmtT, inr } from '../utils/format.js';

/* ---------- small generators ---------- */
export const person = () => pick(FIRST) + ' ' + pick(LAST);
export const phone = () => String(ri(6, 9)) + String(ri(100000000, 999999999));
export const plate = () => `TS ${String(ri(1, 15)).padStart(2, '0')} ${pick(['EK', 'EX', 'UA', 'FB', 'GC', 'HD', 'JT'])} ${ri(1000, 9999)}`;

export function slot(t) {
  const d = new Date(t + ri(30, 240) * 60000);
  d.setMinutes(Math.round(d.getMinutes() / 15) * 15);
  return fmtT(d);
}

/* ---------- lookups ---------- */
export const partnerOf = (db, id) => db.partners.find((p) => p.id === id);
export const assignable = (db, svc) =>
  db.partners.filter((p) => p.svc === svc && p.type === SVC[svc].assignType && p.kyc === 'Verified');
export const rideFare = (db, v) => db.pricing.ride.fields[v === 'Bike' ? 0 : v === 'Auto' ? 1 : 2][2];

/* ---------- partners ---------- */
export function makePartner(db, svc, type, name, extra, more) {
  const k = rnd();
  const kyc = k < 0.1 ? 'Pending' : k < 0.13 ? 'Suspended' : 'Verified';
  const p = Object.assign(
    {
      id: 'PT' + db.pid++,
      svc,
      type,
      name,
      extra,
      area: pick(AREAS),
      rating: +(3.9 + rnd() * 1).toFixed(1),
      jobs: ri(40, 1800),
      online: kyc === 'Verified' && rnd() < 0.72,
      kyc,
      phone: phone(),
      payout: ri(1400, 18000),
      paid: false,
      last4: String(ri(1000, 9999)),
    },
    more || {}
  );
  db.partners.push(p);
  return p;
}

/* ---------- orders ---------- */
export function genOrder(db, svc, minsAgo, forceIdx) {
  const s = SVC[svc];
  const o = {
    id: s.prefix + '-' + db.nextId[svc]++,
    svc,
    customer: person(),
    phone: phone(),
    area: pick(AREAS),
    pay: pick(['UPI', 'UPI', 'UPI', 'Card', 'Cash', 'Wallet']),
    t: Date.now() - minsAgo * 60000,
    notes: '',
    refunded: false,
    partner: null,
    cancelled: false,
    cancelReason: '',
    hist: {},
  };
  if (svc === 'food') {
    const r = pick(db.partners.filter((p) => p.svc === 'food' && p.type === 'Restaurant' && p.kyc === 'Verified'));
    const its = [];
    for (let i = ri(1, 3); i > 0; i--) its.push(pick(FOOD_I) + ' ×' + ri(1, 2));
    o.merchant = r.name;
    o.amount = ri(180, 1150);
    o.detail = r.name + ' · ' + its.join(', ');
    o.kv = [['Restaurant', r.name], ['Items', its.join(', ')]];
  }
  if (svc === 'grocery') {
    const st = pick(db.partners.filter((p) => p.svc === 'grocery' && p.type === 'Store' && p.kyc === 'Verified'));
    const n = ri(4, 16);
    const its = [];
    for (let i = 0; i < 3; i++) its.push(pick(GROC_I));
    o.merchant = st.name;
    o.amount = ri(240, 2400);
    o.detail = `${st.name} · ${its.join(', ')} +${n - 3} more`;
    o.kv = [['Store', st.name], ['Basket', n + ' items — ' + its.join(', ') + '…']];
  }
  if (svc === 'ride') {
    const v = pick(['Bike', 'Bike', 'Auto', 'Auto', 'Cab']);
    const a = pick(LAND);
    let b = pick(LAND);
    while (b === a) b = pick(LAND);
    const km = +(2 + rnd() * 16).toFixed(1);
    o.vehicle = v;
    o.amount = Math.round(db.pricing.ride.fields[3][2] + km * rideFare(db, v));
    o.detail = `${v} · ${a} → ${b} · ${km} km`;
    o.kv = [['Vehicle', v], ['Pickup', a], ['Drop', b], ['Distance', km + ' km at ₹' + rideFare(db, v) + '/km']];
  }
  if (svc === 'care') {
    const d = pick(assignable(db, 'care'));
    const sl = slot(o.t);
    o.amount = d.fee;
    o.partner = d.id;
    o.detail = `${d.name} · ${d.extra.split(' · ')[0]} · ${sl}`;
    o.kv = [['Doctor', d.name], ['Department', d.extra.split(' · ')[0]], ['Clinic', d.extra.split(' · ')[1]], ['Slot', sl]];
  }
  if (svc === 'home') {
    const h = pick(HOME_S);
    const sl = slot(o.t);
    o.amount = ri(h[1], h[2]);
    o.skill = h[0];
    o.detail = `${h[0]} · ${sl}`;
    o.kv = [['Service', h[0]], ['Slot', sl], ['Address', ri(1, 48) + '-' + ri(1, 12) + ', ' + o.area]];
  }
  let idx;
  if (forceIdx != null) idx = forceIdx;
  else {
    const p = Math.min(1, minsAgo / 85);
    idx = Math.min(3, Math.floor(p * 3.1 + rnd() * 1.2));
    if (minsAgo > 20 && rnd() < 0.05) o.cancelled = true;
  }
  o.idx = idx;
  for (let i = 0; i <= idx; i++) o.hist[i] = o.t + (i * Math.max(1, Math.min(minsAgo, 80))) / 4 * 60000;
  if (o.cancelled) o.cancelReason = pick(['Customer changed mind', 'Partner unavailable', 'Payment failed', 'Address not serviceable']);
  if (!o.partner && idx >= s.assignAt) {
    const c = assignable(db, svc);
    if (c.length) o.partner = pick(c).id;
  }
  return o;
}

/* ---------- activity feed entries ---------- */
export function activityFor(o, kind, t) {
  const s = SVC[o.svc];
  return { svc: o.svc, kind, oid: o.id, t: t || Date.now(), freshAt: t ? 0 : Date.now(), customer: o.customer, area: o.area, amount: o.amount, status: s.statuses[o.idx], reason: o.cancelReason, unit: s.unit };
}

export const describeActivity = (a) =>
  a.kind === 'new'
    ? { id: a.oid, pre: `New ${a.unit} `, post: ` · ${a.customer} in ${a.area} · ${inr(a.amount)}` }
    : a.kind === 'status'
    ? { id: a.oid, pre: '', post: ` moved to ${a.status}` }
    : a.kind === 'cancel'
    ? { id: a.oid, pre: '', post: ` cancelled — ${a.reason}` }
    : { id: a.oid, pre: '', post: ` refunded ${inr(a.amount)}` };

/* ---------- pricing defaults ---------- */
export const PRICING_DEFAULT = {
  food: {
    fields: [
      ['Delivery fee (first 3 km)', '₹', 25],
      ['Each extra km', '₹', 6],
      ['Platform fee', '₹', 5],
      ['Restaurant commission', '%', 18],
      ['Minimum order value', '₹', 99],
      ['Climate & bad weather surge', '₹', 25],
      ['Night delivery fee (11 PM – 6 AM)', '₹', 30],
    ],
    toggles: [
      ['Climate & rain surge pricing', true, 'Automatically apply weather surcharge during rain, storms, or severe heatwaves'],
      ['Night delivery service (11 PM – 6 AM)', true, 'Keep service active overnight with late-night rider incentives'],
      ['Cash on delivery', true, 'Allow cash payment upon food delivery'],
      ['Auto-assign nearest rider', true, 'Dispatch active nearby riders automatically'],
    ],
  },
  grocery: {
    fields: [
      ['Delivery fee', '₹', 20],
      ['Free delivery above', '₹', 499],
      ['Handling fee', '₹', 4],
      ['Store commission', '%', 12],
      ['Delivery radius', 'km', 5],
      ['Climate & bad weather surge', '₹', 20],
      ['Night delivery fee (11 PM – 6 AM)', '₹', 25],
    ],
    toggles: [
      ['Climate & rain surge pricing', true, 'Apply weather surcharge to orders during rain, storms, or waterlogging'],
      ['Night delivery service (11 PM – 6 AM)', true, 'Enable dark store and kirana delivery during overnight hours'],
      ['Allow item substitutions', true, 'Permit store partners to suggest alternative brands if out of stock'],
      ['Cash on delivery', true, 'Allow cash payment upon grocery delivery'],
    ],
  },
  ride: {
    fields: [
      ['Bike fare', '₹/km', 8],
      ['Auto fare', '₹/km', 15],
      ['Cab fare', '₹/km', 23],
      ['Base fare', '₹', 20],
      ['Waiting charge', '₹/min', 1.5],
      ['Climate & bad weather surge', '₹', 30],
      ['Night-time ride surcharge (11 PM – 6 AM)', '₹', 40],
    ],
    toggles: [
      ['Climate & bad weather surge', true, 'Adjust fares with weather surge during rain, waterlogging, or severe weather'],
      ['Night-time pricing (11 PM – 6 AM)', true, 'Enable night rates to encourage captain availability after hours'],
      ['Peak-hour surge', true, 'Dynamic surge during morning and evening rush hours'],
      ['Women-preferred captain option', true, 'Allow female riders to match with women captains'],
      ['Allow tips to captains', true, 'Customers can add voluntary tips after trip completion'],
    ],
  },
  care: {
    fields: [
      ['Booking fee', '₹', 29],
      ['Default slot length', 'min', 15],
      ['Free cancellation window', 'hrs', 2],
      ['Doctor commission', '%', 10],
    ],
    toggles: [
      ['Video consultations', true, 'Allow online tele-consultation slots in addition to clinic visits'],
      ['Medicine delivery on prescription', false, 'Direct tie-up with pharmacies for home delivery'],
      ['Reminder 1 hr before visit', true, 'Automated SMS / WhatsApp slot reminder to patients'],
    ],
  },
  home: {
    fields: [
      ['Visit charge', '₹', 99],
      ['Cancellation fee', '₹', 50],
      ['Platform commission', '%', 20],
      ['Rework warranty', 'days', 30],
    ],
    toggles: [
      ['Same-day bookings', true, 'Allow emergency cleaning and repair slots within 2 hours'],
      ['Pros bring their own materials', false, 'Service professionals supply cleaning and repair kits'],
      ['Rework guarantee', true, 'Free rework visit within 30-day warranty'],
    ],
  },
};
export const clone = (x) => JSON.parse(JSON.stringify(x));
