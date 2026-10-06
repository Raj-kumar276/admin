# OneBuddy Admin — React (Vite)

The OneBuddy admin console, rebuilt as a React app with one file per page and component.
It runs on sample data (no backend yet) and simulates live orders every 7 seconds.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build → dist/
```

Routing uses `HashRouter`, so the built `dist/` works on any static host (Vercel, Netlify, Firebase Hosting) without rewrite rules.

## Folder structure

```
src/
├── main.jsx                     # entry: router + AdminProvider + CSS
├── App.jsx                      # layout shell + all routes
├── pages/                       # one file per page
│   ├── OverviewPage.jsx         #   /overview
│   ├── HyderabadPage.jsx        #   /hyderabad (zones & live partners)
│   ├── services/
│   │   ├── FoodDeliveryPage.jsx       #   /services/food
│   │   ├── GroceriesDeliveryPage.jsx  #   /services/grocery
│   │   ├── RideBookingPage.jsx        #   /services/ride
│   │   ├── HealthCarePage.jsx         #   /services/care
│   │   └── HomeServicesPage.jsx       #   /services/home
│   ├── PartnersPage.jsx         #   /partners
│   ├── CustomersPage.jsx        #   /customers
│   ├── OffersPage.jsx           #   /offers
│   ├── PayoutsPage.jsx          #   /payouts
│   ├── RefundsPage.jsx          #   /refunds
│   ├── SupportPage.jsx          #   /support
│   └── SettingsPage.jsx         #   /settings
├── components/
│   ├── layout/      Sidebar, Topbar, GlobalSearch, NotificationsPopover, AccountMenu, SignedOutLock
│   ├── overview/    KpiCards, OrderValueChart, ServiceHealth, LiveFeed, ApprovalsCard, TicketsMini
│   ├── service/     ServiceDashboard (shared by the 5 service pages), OrdersTab, PricingTab
│   ├── partners/    PartnersTable (Partners page + each service's partners tab)
│   ├── modals/      ModalFrame, ConfirmModal, AddPartnerModal, NewOfferModal, IssueRefundModal,
│   │                CreditModal, RejectPartnerModal, CopyFallbackModal
│   ├── overlays/    OrderDrawer, ModalHost, Toasts
│   └── common/      Icon (+ iconPaths), ServiceTile, Pills, Sparkline, Delta, Switch
├── context/AdminContext.jsx     # shared state: data, toasts, modal, drawer, live simulation
├── hooks/                       # useTheme, usePartnerActions
├── data/
│   ├── constants.js             # services, areas, menus, labels
│   ├── generators.js            # order / partner generators and lookups
│   ├── seed.js                  # builds the sample database
│   └── selectors.js             # derived numbers (active orders, totals, ranges)
├── utils/                       # format (₹, times, CSV), seeded random
├── styles/                      # theme, layout, controls, surfaces, overlays, pages, responsive
└── assets/onebuddy-logo.png
```

## Connecting a real backend

All data lives in `src/data/seed.js` → `createDb()`. Pages read `db` from `useAdmin()` and call
`refresh()` after changing it. To go live, load the same shapes from Firebase/your API in
`AdminContext.jsx` and write changes back where each page currently mutates `db`.
Turn off the demo stream by removing the `setInterval` block in `AdminContext.jsx`.
