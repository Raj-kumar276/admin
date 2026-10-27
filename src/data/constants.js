export const SVCS = [
  { id: 'food', name: 'Food Delivery', short: 'Food', prefix: 'FD', unit: 'order', units: 'Orders', statuses: ['Placed', 'Preparing', 'Out for delivery', 'Delivered'], assignAt: 2, assignType: 'Rider', partnerTab: 'Restaurants & riders', kpiTime: 'Avg delivery', time: '28 min', target: '30 min' },
  { id: 'grocery', name: 'Groceries Delivery', short: 'Grocery', prefix: 'GR', unit: 'order', units: 'Orders', statuses: ['Placed', 'Packing', 'Out for delivery', 'Delivered'], assignAt: 2, assignType: 'Rider', partnerTab: 'Stores & riders', kpiTime: 'Avg delivery', time: '19 min', target: '20 min' },
  { id: 'ride', name: 'Ride Booking', short: 'Rides', prefix: 'RD', unit: 'ride', units: 'Rides', statuses: ['Searching', 'Captain assigned', 'On trip', 'Completed'], assignAt: 1, assignType: 'Captain', partnerTab: 'Captains', kpiTime: 'Avg pickup ETA', time: '4.6 min', target: '6 min' },
  { id: 'care', name: 'Health Care', short: 'Care', prefix: 'HC', unit: 'appointment', units: 'Appointments', statuses: ['Requested', 'Confirmed', 'Checked in', 'Completed'], assignAt: 0, assignType: 'Doctor', partnerTab: 'Doctors', kpiTime: 'Avg wait at clinic', time: '12 min', target: '15 min' },
  { id: 'home', name: 'Home Services', short: 'Home', prefix: 'HS', unit: 'booking', units: 'Bookings', statuses: ['Requested', 'Pro assigned', 'In progress', 'Completed'], assignAt: 1, assignType: 'Professional', partnerTab: 'Professionals', kpiTime: 'Avg arrival', time: '41 min', target: '60 min' },
];

export const SVC = Object.fromEntries(SVCS.map((s) => [s.id, s]));

// Stacking order used by the overview chart (bottom → top).
export const CHART_ORDER = ['food', 'care', 'grocery', 'home', 'ride'];

// Which partner types each service accepts.
export const PARTNER_TYPES = {
  food: ['Rider', 'Restaurant'],
  grocery: ['Rider', 'Store'],
  ride: ['Captain'],
  care: ['Doctor'],
  home: ['Professional'],
};

export const FIRST = ['Aarav', 'Sai Kiran', 'Priya', 'Rahul', 'Sneha', 'Vamshi', 'Ananya', 'Karthik', 'Divya', 'Harsha', 'Meghana', 'Rohit', 'Lakshmi', 'Arjun', 'Keerthi', 'Nikhil', 'Pooja', 'Srinivas', 'Tejaswi', 'Varun', 'Bhavana', 'Manoj', 'Swathi', 'Abhishek', 'Revathi', 'Imran', 'Farah', 'Joseph', 'Nandini', 'Pranav'];
export const LAST = ['Reddy', 'Rao', 'Sharma', 'Naidu', 'Varma', 'Goud', 'Khan', 'Iyer', 'Kumar', 'Chowdary', 'Patel', 'Menon', 'Das', 'Yadav', 'Shetty'];
export const AREAS = ['Gachibowli', 'Madhapur', 'Kondapur', 'Hitech City', 'Banjara Hills', 'Jubilee Hills', 'Kukatpally', 'Ameerpet', 'Begumpet', 'Secunderabad', 'Miyapur', 'Manikonda', 'Kothaguda', 'Tolichowki'];
export const LAND = ['Inorbit Mall', 'Raidurg Metro', 'Hitech City Metro', 'Cyber Towers', 'Secunderabad Station', 'RGIA Airport', 'Charminar', 'Necklace Road', 'Forum Mall, KPHB', 'Ameerpet Metro', 'Botanical Garden', 'Gachibowli Stadium', 'Jubilee Hills Checkpost', 'Begumpet Airport Rd'];
export const FOOD_I = ['Chicken Dum Biryani', 'Mutton Haleem', 'Paneer Tikka', 'Masala Dosa', 'Veg Thali', 'Irani Chai', 'Osmania Biscuits', 'Double ka Meetha', 'Chicken 65', 'Idli Sambar', 'Butter Naan', 'Qubani ka Meetha', 'Apollo Fish', 'Pesarattu'];
export const GROC_I = ['Tomatoes 1 kg', 'Toor dal 1 kg', 'Toned milk 1 L', 'Basmati rice 5 kg', 'Onions 2 kg', 'Curd 500 g', 'Eggs ×12', 'Atta 5 kg', 'Bananas, 1 dozen', 'Sunflower oil 1 L', 'Coriander bunch', 'Paneer 200 g', 'Green chillies 250 g', 'Brown bread'];
export const HOME_S = [['Deep home cleaning', 2499, 4999], ['Bathroom cleaning', 499, 999], ['AC service & repair', 599, 1899], ['Plumbing', 249, 899], ['Electrician', 199, 799], ['Pest control', 899, 2199], ['Salon at home', 699, 2499], ['Carpentry', 299, 1499], ['Washing machine repair', 399, 1299], ['Sofa cleaning', 799, 1799]];
export const SPECS = [['General Physician', 400], ['Paediatrics', 600], ['Dermatology', 700], ['Orthopaedics', 800], ['Gynaecology', 700], ['Cardiology', 900], ['ENT', 500]];
export const CLINICS = ['Sunrise Clinic, Kondapur', 'CarePlus Hospital, Madhapur', 'Lotus Health Centre, Ameerpet', 'Medicity OP, Banjara Hills', 'Greenfield Clinic, Kukatpally'];

export const CANCEL_REASONS = ['Customer changed mind', 'Partner unavailable', 'Restaurant / store closed', 'Payment failed', 'Address not serviceable'];
export const REJECT_REASONS = ['Documents are blurry or unreadable', "Name doesn't match ID proof", 'Vehicle RC expired', 'License / registration not valid'];
export const CREDIT_REASONS = ['Goodwill', 'Late delivery', 'Missing item', 'Referral bonus'];

export const REFUND_REASONS = [
  'Missing or incorrect item',
  'Food quality / damaged package',
  'Severe delivery delay (> 30 mins)',
  'Driver / captain overcharged fare',
  'Duplicate payment / double debit',
  'Order cancelled by store/restaurant',
  'Customer cancelled before pickup',
  'Goodwill / customer compensation',
];

export const REFUND_DESTINATIONS = [
  'Original payment method',
  'OneBuddy Wallet (instant credit)',
];

export const QUICK_REPLIES = [
  'Sorry about this — looking into it now.',
  'We have initiated a refund to your original payment method. It reflects in 3–5 working days.',
  'We have added a goodwill credit to your OneBuddy wallet.',
  'Could you share a photo of the issue?',
];

export const BANNER_PLACEMENTS = [
  { id: 'all', name: 'All placements' },
  { id: 'home_hero', name: 'App Home Hero Carousel', desc: 'Prominent top carousel on the OneBuddy main screen' },
  { id: 'service_top', name: 'Service Header Banner', desc: 'Top banner inside Food, Grocery, Ride, Care, or Home' },
  { id: 'city_alert', name: 'Operational City Alert', desc: 'High-priority advisory strip across active zones' },
  { id: 'checkout_strip', name: 'Checkout Offer Strip', desc: 'Promotional strip on payment & checkout screens' },
];

export const PAGE_TITLES = {
  overview: ['Overview', 'All five services · Hyderabad'],
  hyderabad: ['Hyderabad Operations', 'Service zones and active working partners'],
  zones: ['Hyderabad Operations', 'Service zones and active working partners'],
  banners: ['Banners & Campaigns', 'Promotional sliders, app hero banners and operational notices'],
  partners: ['Partners & KYC', 'Restaurants, stores, riders, captains, doctors and pros'],
  customers: ['Customers', 'Everyone who has ordered on OneBuddy'],
  offers: ['Offers & coupons', 'Promotions running across services'],
  payouts: ['Payouts', 'Weekly settlements to partners'],
  refunds: ['Refunds & claims', 'Customer refund requests, disputes and processed reversals'],
  support: ['Support tickets', 'Customer issues across services'],
  settings: ['Settings', 'Platform, zones and admin team'],
};
