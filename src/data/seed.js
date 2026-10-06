import { SVCS, AREAS, SPECS, CLINICS, HOME_S } from './constants.js';
import { rnd, pick, ri } from '../utils/random.js';
import { PRICING_DEFAULT, clone, makePartner, genOrder, activityFor, person, plate } from './generators.js';

export const PLAN_DEFAULTS = [
  ['Bike', 100, '15 rides', 42],
  ['Bike', 200, '25 rides', 66],
  ['Bike', 400, 'Unlimited', 31],
  ['Auto', 200, '20 rides', 24],
  ['Auto', 400, 'Unlimited', 18],
  ['Cab', 250, '20 rides', 12],
  ['Cab', 500, 'Unlimited', 9],
];

/**
 * Builds the in-memory sample database for the admin console.
 * Every page reads and mutates this object; the AdminContext re-renders after changes.
 * Swap this for API calls (Firebase / REST) when the backend is ready.
 */
export function createDb() {
  const db = {
    pid: 101,
    nid: 5,
    nextId: { food: 4201, grocery: 2810, ride: 9120, care: 1340, home: 760 },
    pricing: clone(PRICING_DEFAULT),
    plans: clone(PLAN_DEFAULTS),
    partners: [],
    orders: [],
    daily: {},
    counts: {},
    customers: [],
    offers: [],
    tickets: [],
    refunds: [],
    rfid: 8110,
    activity: [],
    notifs: [],
    admins: [],
    platform: [],
    zones: [],
    paused: { food: false, grocery: false, ride: false, care: false, home: false },
  };

  /* partners */
  ['Deccan Spice House', 'Charminar Kitchen', 'Irani Chai Co.', 'Tiffin Tales', 'Biryani Junction', 'Green Bowl Salads', 'Nizami Grill', 'Dosa Street'].forEach((n) =>
    makePartner(db, 'food', 'Restaurant', n, pick(['Hyderabadi', 'South Indian', 'North Indian', 'Cafe', 'Healthy']) + ' · ' + ri(18, 40) + ' min prep')
  );
  for (let i = 0; i < 8; i++) makePartner(db, 'food', 'Rider', person(), pick(['EV scooter', 'Petrol bike']) + ' · ' + plate());
  ['FreshCart Kondapur', 'Daily Needs Mart', 'GreenLeaf Organics', 'Sai Balaji Kirana', 'QuickBasket Madhapur', 'Farm2Door Miyapur'].forEach((n) =>
    makePartner(db, 'grocery', 'Store', n, ri(900, 2600) + ' SKUs · dark store')
  );
  for (let i = 0; i < 7; i++) makePartner(db, 'grocery', 'Rider', person(), pick(['EV scooter', 'Petrol bike']) + ' · ' + plate());
  for (let i = 0; i < 14; i++) {
    const v = pick(['Bike', 'Bike', 'Auto', 'Auto', 'Cab']);
    const pl = db.plans.filter((p) => p[0] === v);
    const plan = pick(pl);
    makePartner(db, 'ride', 'Captain', person(), v + ' · ' + plate(), { vehicle: v, plan: `${v} ₹${plan[1]} · ${plan[2]}` });
  }
  for (let i = 0; i < 8; i++) {
    const sp = SPECS[i % SPECS.length];
    makePartner(db, 'care', 'Doctor', 'Dr. ' + person(), sp[0] + ' · ' + pick(CLINICS), { fee: sp[1] });
  }
  for (let i = 0; i < 12; i++) {
    const s = HOME_S[i % HOME_S.length];
    makePartner(db, 'home', 'Professional', person(), s[0] + ' · ' + ri(2, 9) + ' yrs exp', { skill: s[0] });
  }
  // Guarantee at least one pending KYC per service.
  SVCS.forEach((s) => {
    const own = db.partners.filter((p) => p.svc === s.id);
    const last = own[own.length - 1];
    last.kyc = 'Pending';
    last.online = false;
    last.jobs = 0;
    last.rating = 0;
  });

  /* orders */
  SVCS.forEach((s) => {
    const n = ri(34, 46);
    for (let i = 0; i < n; i++) db.orders.push(genOrder(db, s.id, Math.floor(Math.pow(rnd(), 1.4) * 700)));
  });
  db.orders.sort((a, b) => b.t - a.t);

  /* 60 days of history for charts */
  const todaySum = (svc) => db.orders.filter((o) => o.svc === svc && !o.cancelled).reduce((a, o) => a + o.amount, 0);
  const todayCount = (svc) => db.orders.filter((o) => o.svc === svc).length;
  SVCS.forEach((s) => {
    const base = todaySum(s.id) * 1.9;
    const cb = todayCount(s.id) * 1.9;
    db.daily[s.id] = [];
    db.counts[s.id] = [];
    for (let i = 0; i < 59; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (59 - i));
      const wk = [0, 6].includes(d.getDay()) ? 1.18 : 1;
      const f = (0.7 + (0.3 * i) / 58) * wk * (0.88 + rnd() * 0.24);
      db.daily[s.id].push(Math.round(base * f));
      db.counts[s.id].push(Math.round(cb * f));
    }
  });

  /* customers */
  for (let i = 0; i < 30; i++) {
    const o = ri(1, 64);
    db.customers.push({
      id: 'CU' + (5100 + i),
      name: person(),
      phone: String(ri(6, 9)) + String(ri(100000000, 999999999)),
      area: pick(AREAS),
      orders: o,
      spend: o * ri(260, 720),
      wallet: pick([0, 0, 50, 100, 150, 20]),
      status: rnd() < 0.07 ? 'Blocked' : 'Active',
      fav: pick(SVCS).id,
      joined: ri(1, 28) + ' ' + pick(['Jan', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug']) + ' 2026',
    });
  }

  /* offers */
  db.offers = [
    { code: 'BUDDY50', desc: '50% off your first order, up to ₹100', kind: '%', value: 50, cap: 100, min: 149, svc: 'all', used: 1284, active: true, exp: '2026-12-31' },
    { code: 'FRESH20', desc: '20% off fruit & vegetables', kind: '%', value: 20, cap: 80, min: 299, svc: 'grocery', used: 412, active: true, exp: '2026-10-31' },
    { code: 'RIDE30', desc: '₹30 off auto rides over 5 km', kind: '₹', value: 30, cap: 30, min: 0, svc: 'ride', used: 903, active: true, exp: '2026-11-15' },
    { code: 'CARE100', desc: '₹100 off your OP consultation', kind: '₹', value: 100, cap: 100, min: 400, svc: 'care', used: 156, active: true, exp: '2026-10-20' },
    { code: 'CLEAN15', desc: '15% off deep home cleaning', kind: '%', value: 15, cap: 500, min: 1999, svc: 'home', used: 88, active: false, exp: '2026-10-05' },
    { code: 'BIRYANI75', desc: '₹75 off biryani orders on weekends', kind: '₹', value: 75, cap: 75, min: 399, svc: 'food', used: 640, active: true, exp: '2026-11-30' },
  ];

  /* support tickets */
  const T = [
    { id: 'TK-2291', svc: 'food', customer: 'Keerthi Rao', subject: 'Biryani arrived cold and one item missing', pri: 'High', status: 'Open', msgs: [['c', 'My order FD-4188 came 25 minutes late, the biryani was cold and the Double ka Meetha is missing.', 95], ['a', 'Sorry about that, Keerthi. Checking with the restaurant and rider now.', 80], ['c', 'Please refund the missing item at least.', 12]] },
    { id: 'TK-2290', svc: 'ride', customer: 'Rohit Varma', subject: 'Captain asked for extra cash', pri: 'High', status: 'Open', msgs: [['c', 'The auto captain asked for ₹40 more than the app fare near Raidurg Metro.', 34]] },
    { id: 'TK-2288', svc: 'care', customer: 'Ananya Menon', subject: 'Need to reschedule paediatrics slot', pri: 'Medium', status: 'Open', msgs: [['c', "Can I move my son's 5:30 PM appointment to tomorrow morning?", 52]] },
    { id: 'TK-2286', svc: 'home', customer: 'Srinivas Goud', subject: 'AC still not cooling after service', pri: 'Medium', status: 'Open', msgs: [['c', 'Technician serviced the AC yesterday but it is still not cooling properly.', 180], ['a', 'We have raised a free rework visit under the 30-day warranty.', 150]] },
    { id: 'TK-2283', svc: 'grocery', customer: 'Divya Iyer', subject: 'Wrong brand of atta delivered', pri: 'Low', status: 'Open', msgs: [['c', 'I ordered 5 kg whole wheat atta, got multigrain instead.', 260]] },
    { id: 'TK-2279', svc: 'ride', customer: 'Farah Khan', subject: 'Charged twice for one ride', pri: 'High', status: 'Open', msgs: [['c', 'UPI shows two debits of ₹146 for ride RD-9131.', 70]] },
    { id: 'TK-2270', svc: 'food', customer: 'Nikhil Shetty', subject: 'Coupon BUDDY50 not applying', pri: 'Low', status: 'Resolved', msgs: [['c', 'BUDDY50 says invalid on my first order.', 900], ['a', 'It applies on orders above ₹149. Your cart was ₹120 — added ₹50 to your wallet as goodwill.', 870]] },
    { id: 'TK-2265', svc: 'home', customer: 'Pooja Naidu', subject: 'Salon professional arrived late', pri: 'Low', status: 'Resolved', msgs: [['c', 'The beautician came 40 minutes late.', 1500], ['a', 'Apologies — we have credited ₹100 and flagged the partner.', 1440]] },
  ];
  db.tickets = T.map((t) => ({ ...t, msgs: t.msgs.map((m) => ({ from: m[0], text: m[1], t: Date.now() - m[2] * 60000 })) }));

  /* refunds & reversal claims */
  db.refunds = [
    {
      id: 'RF-8101',
      orderId: 'FD-4188',
      svc: 'food',
      customer: 'Keerthi Rao',
      phone: '9848022338',
      amount: 280,
      orderTotal: 460,
      pay: 'UPI',
      destination: 'Original payment method',
      reason: 'Missing item & food delivered cold',
      status: 'Pending',
      t: Date.now() - 42 * 60000,
      processedAt: null,
      notes: 'Customer raised ticket TK-2291; restaurant confirmed Double ka Meetha was out of stock.',
    },
    {
      id: 'RF-8102',
      orderId: 'RD-9131',
      svc: 'ride',
      customer: 'Farah Khan',
      phone: '9876543210',
      amount: 146,
      orderTotal: 146,
      pay: 'UPI',
      destination: 'Original payment method',
      reason: 'Duplicate payment / double debit',
      status: 'Pending',
      t: Date.now() - 65 * 60000,
      processedAt: null,
      notes: 'Ticket TK-2279: Customer charged twice on UPI for same trip RD-9131.',
    },
    {
      id: 'RF-8103',
      orderId: 'GR-2804',
      svc: 'grocery',
      customer: 'Divya Iyer',
      phone: '9849123456',
      amount: 195,
      orderTotal: 680,
      pay: 'Card',
      destination: 'OneBuddy Wallet (instant credit)',
      reason: 'Missing or incorrect item',
      status: 'Processed',
      t: Date.now() - 180 * 60000,
      processedAt: Date.now() - 150 * 60000,
      notes: 'Delivered multigrain atta instead of whole wheat. Credited to wallet with customer consent.',
    },
    {
      id: 'RF-8104',
      orderId: 'HS-755',
      svc: 'home',
      customer: 'Pooja Naidu',
      phone: '9988776655',
      amount: 100,
      orderTotal: 699,
      pay: 'UPI',
      destination: 'OneBuddy Wallet (instant credit)',
      reason: 'Severe delivery delay (> 30 mins)',
      status: 'Processed',
      t: Date.now() - 360 * 60000,
      processedAt: Date.now() - 340 * 60000,
      notes: 'Ticket TK-2265: Beautician arrived 40 min late. Goodwill credit added.',
    },
    {
      id: 'RF-8105',
      orderId: 'FD-4172',
      svc: 'food',
      customer: 'Srinivas Goud',
      phone: '9123456780',
      amount: 320,
      orderTotal: 320,
      pay: 'UPI',
      destination: 'Original payment method',
      reason: 'Order cancelled by store/restaurant',
      status: 'Processed',
      t: Date.now() - 720 * 60000,
      processedAt: Date.now() - 710 * 60000,
      notes: 'Restaurant ran out of inventory before food preparation.',
    },
    {
      id: 'RF-8106',
      orderId: 'RD-9118',
      svc: 'ride',
      customer: 'Arjun Das',
      phone: '9871234567',
      amount: 60,
      orderTotal: 60,
      pay: 'Wallet',
      destination: 'OneBuddy Wallet (instant credit)',
      reason: 'Customer cancelled before pickup',
      status: 'Rejected',
      t: Date.now() - 950 * 60000,
      processedAt: Date.now() - 900 * 60000,
      notes: 'Captain waited 14 minutes at pickup point before cancelling. Valid cancellation charge per policy.',
    },
  ];

  /* activity + notifications */
  db.orders.slice(0, 14).forEach((o) => db.activity.push(activityFor(o, 'new', o.t)));
  db.notifs = [
    { id: 1, icon: 'shield', text: '3 new partners are waiting for KYC review', t: Date.now() - 8 * 60000, read: false, route: '/partners' },
    { id: 2, icon: 'chat', text: 'High-priority ticket TK-2290: captain asked for extra cash', t: Date.now() - 34 * 60000, read: false, route: '/support' },
    { id: 3, icon: 'zap', text: 'Rain alert: surge pricing turned on in Madhapur & Gachibowli', t: Date.now() - 62 * 60000, read: false, route: '/services/food' },
    { id: 4, icon: 'wallet', text: 'Weekly partner payouts are ready to release', t: Date.now() - 3 * 3600000, read: true, route: '/payouts' },
  ];

  db.admins = [
    { name: 'Ops Admin', email: 'ops@onebuddy.app', role: 'Owner' },
    { name: 'Sai Kiran Reddy', email: 'saikiran@onebuddy.app', role: 'Operations' },
    { name: 'Meghana Rao', email: 'meghana@onebuddy.app', role: 'Support' },
  ];
  db.platform = [
    ['Maintenance mode', 'Customers see a “back soon” screen; partners stay online.', false],
    ['New customer sign-ups', 'Allow new accounts via OTP or Google.', true],
    ['Cash on delivery', 'Master switch across every service.', true],
    ['SMS OTP login', 'Send one-time passwords over SMS.', true],
  ];
  db.zones = AREAS.map((z, i) => ({ z, on: i !== 11 }));

  return db;
}

let DB = null;
export const getDb = () => {
  if (!DB) DB = createDb();
  if (!DB.refunds) DB.refunds = [];
  if (!DB.rfid) DB.rfid = 8110;
  return DB;
};
