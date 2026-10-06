import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar.jsx';
import Topbar from './components/layout/Topbar.jsx';
import SignedOutLock from './components/layout/SignedOutLock.jsx';
import OrderDrawer from './components/overlays/OrderDrawer.jsx';
import ModalHost from './components/overlays/ModalHost.jsx';
import Toasts from './components/overlays/Toasts.jsx';
import { useAdmin } from './context/AdminContext.jsx';
import { SVC, PAGE_TITLES } from './data/constants.js';

import OverviewPage from './pages/OverviewPage.jsx';
import FoodDeliveryPage from './pages/services/FoodDeliveryPage.jsx';
import GroceriesDeliveryPage from './pages/services/GroceriesDeliveryPage.jsx';
import RideBookingPage from './pages/services/RideBookingPage.jsx';
import HealthCarePage from './pages/services/HealthCarePage.jsx';
import HomeServicesPage from './pages/services/HomeServicesPage.jsx';
import PartnersPage from './pages/PartnersPage.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import OffersPage from './pages/OffersPage.jsx';
import PayoutsPage from './pages/PayoutsPage.jsx';
import SupportPage from './pages/SupportPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import HyderabadPage from './pages/HyderabadPage.jsx';
import RefundsPage from './pages/RefundsPage.jsx';

function titleFor(pathname, db) {
  const m = pathname.match(/^\/services\/(\w+)/);
  if (m && SVC[m[1]]) {
    const s = SVC[m[1]];
    return [s.name, db.paused[s.id] ? 'Paused — not accepting new ' + s.units.toLowerCase() : 'Live in Hyderabad'];
  }
  return PAGE_TITLES[pathname.slice(1)] || PAGE_TITLES.overview;
}

export default function App() {
  const { db, modal, closeModal, drawerId, openOrder, closeDrawer } = useAdmin();
  const location = useLocation();
  const [sideOpen, setSideOpen] = useState(false);

  // Route change: close the drawer and mobile menu; open an order if search asked for it.
  useEffect(() => {
    setSideOpen(false);
    closeDrawer();
    if (location.state && location.state.openOrder) openOrder(location.state.openOrder);
  }, [location.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escape closes the top-most overlay.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (modal) closeModal();
      else if (drawerId) closeDrawer();
      setSideOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modal, drawerId, closeModal, closeDrawer]);

  const [title, subtitle] = titleFor(location.pathname, db);

  return (
    <>
      <div className="app">
        <Sidebar open={sideOpen} onClose={() => setSideOpen(false)} />
        <div className="main">
          <Topbar title={title} subtitle={subtitle} onOpenMenu={() => setSideOpen(true)} />
          <main className="content">
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/services/food" element={<FoodDeliveryPage />} />
              <Route path="/services/grocery" element={<GroceriesDeliveryPage />} />
              <Route path="/services/ride" element={<RideBookingPage />} />
              <Route path="/services/care" element={<HealthCarePage />} />
              <Route path="/services/home" element={<HomeServicesPage />} />
              <Route path="/partners" element={<PartnersPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/offers" element={<OffersPage />} />
              <Route path="/payouts" element={<PayoutsPage />} />
              <Route path="/refunds" element={<RefundsPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/hyderabad" element={<HyderabadPage />} />
              <Route path="/zones" element={<Navigate to="/hyderabad" replace />} />
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Routes>
          </main>
        </div>
      </div>
      <OrderDrawer />
      <ModalHost />
      <Toasts />
      <SignedOutLock />
    </>
  );
}
