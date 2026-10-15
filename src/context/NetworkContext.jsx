import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const NetworkContext = createContext(null);

const DEFAULT_SUBSYSTEMS = [
  { id: 'dns', name: 'DNS Resolution', target: 'api.onebuddy.in', status: 'pass', latency: 14 },
  { id: 'gateway', name: 'API Gateway (Hyderabad-01)', target: 'gw-hyd.onebuddy.in', status: 'pass', latency: 32 },
  { id: 'db', name: 'Primary DB Replica', target: 'hyd-db-cluster-01', status: 'pass', latency: 45 },
  { id: 'ws', name: 'Live Orders WebSocket', target: 'wss://dispatch.onebuddy.in', status: 'pass', latency: 28 },
  { id: 'cdn', name: 'Edge CDN & Static Assets', target: 'cdn.onebuddy.in', status: 'pass', latency: 11 },
];

export function NetworkProvider({ children }) {
  const [simulation, setSimulation] = useState('auto'); // 'auto' | 'online' | 'slow' | 'offline' | 'timeout'
  const [rawOnline, setRawOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [latency, setLatency] = useState(38);
  const [latencyHistory, setLatencyHistory] = useState([32, 35, 41, 38, 44, 39, 36, 42, 38]);
  const [subsystems, setSubsystems] = useState(DEFAULT_SUBSYSTEMS);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(Date.now());
  const [modalOpen, setModalOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Offline queue for actions taken during disconnection
  const [offlineQueue, setOfflineQueue] = useState([
    { id: 'q-1', action: 'Update Partner Status', target: 'Kishan Express (Kondapur)', time: '2m ago', synced: false },
    { id: 'q-2', action: 'Approval Verification', target: 'Swagath Grand Kitchen', time: '1m ago', synced: false },
  ]);

  // Determine effective status based on simulation or native connection
  let status = 'online';
  if (simulation !== 'auto') {
    status = simulation;
  } else if (!rawOnline) {
    status = 'offline';
  } else if (latency > 350) {
    status = 'slow';
  }

  // Monitor native browser events
  useEffect(() => {
    const handleOnline = () => {
      setRawOnline(true);
      setBannerDismissed(false);
      checkConnection();
    };
    const handleOffline = () => {
      setRawOnline(false);
      setBannerDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update subsystems based on active status
  useEffect(() => {
    if (status === 'offline' || status === 'timeout') {
      setSubsystems((prev) =>
        prev.map((s) => ({
          ...s,
          status: 'fail',
          latency: null,
        }))
      );
    } else if (status === 'slow') {
      setSubsystems((prev) =>
        prev.map((s, idx) => ({
          ...s,
          status: idx === 1 || idx === 3 ? 'warn' : 'pass',
          latency: (s.latency || 30) * 8 + Math.floor(Math.random() * 80),
        }))
      );
    } else {
      setSubsystems(DEFAULT_SUBSYSTEMS);
    }
  }, [status]);

  // Manual Ping / Connection Recheck
  const checkConnection = useCallback(async () => {
    setChecking(true);
    const start = performance.now();
    try {
      if (simulation === 'offline') {
        throw new Error('Simulated offline');
      }

      // Ping check using a lightweight fetch or cache buster
      await fetch('/vite.svg?t=' + Date.now(), { method: 'HEAD', cache: 'no-cache' }).catch(() => null);

      const elapsed = Math.round(performance.now() - start);
      const measuredLatency = simulation === 'slow' ? 480 + Math.floor(Math.random() * 90) : Math.max(18, elapsed);

      setLatency(measuredLatency);
      setLatencyHistory((h) => [...h.slice(-14), measuredLatency]);
      setLastChecked(Date.now());
      setRawOnline(true);
    } catch {
      setLatency(null);
      setRawOnline(false);
    } finally {
      setTimeout(() => setChecking(false), 400);
    }
  }, [simulation]);

  // Periodic lightweight heartbeat ping when online
  useEffect(() => {
    if (status === 'offline') return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && simulation === 'auto') {
        const simJitter = Math.floor(Math.random() * 16) - 8;
        const newLat = Math.max(22, 38 + simJitter);
        setLatency(newLat);
        setLatencyHistory((h) => [...h.slice(-14), newLat]);
        setLastChecked(Date.now());
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [status, simulation]);

  // Sync offline queue items
  const syncOfflineQueue = useCallback(() => {
    setChecking(true);
    setTimeout(() => {
      setOfflineQueue((q) => q.map((item) => ({ ...item, synced: true })));
      setChecking(false);
      setTimeout(() => {
        setOfflineQueue([]);
      }, 1800);
    }, 800);
  }, []);

  const addOfflineAction = useCallback((action, target) => {
    setOfflineQueue((q) => [
      ...q,
      {
        id: 'q-' + Date.now(),
        action,
        target,
        time: 'Just now',
        synced: false,
      },
    ]);
  }, []);

  const value = {
    status,
    isOnline: status === 'online',
    isSlow: status === 'slow',
    isOffline: status === 'offline' || status === 'timeout',
    simulation,
    setSimulation,
    latency,
    latencyHistory,
    subsystems,
    checking,
    checkConnection,
    lastChecked,
    modalOpen,
    openModal: () => setModalOpen(true),
    closeModal: () => setModalOpen(false),
    toggleModal: () => setModalOpen((v) => !v),
    bannerDismissed,
    dismissBanner: () => setBannerDismissed(true),
    restoreBanner: () => setBannerDismissed(false),
    offlineQueue,
    addOfflineAction,
    syncOfflineQueue,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider');
  return ctx;
}
