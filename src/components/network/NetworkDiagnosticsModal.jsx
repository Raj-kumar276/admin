import React, { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext.jsx';
import Icon from '../common/Icon.jsx';

export default function NetworkDiagnosticsModal() {
  const {
    modalOpen,
    closeModal,
    status,
    isOnline,
    isSlow,
    isOffline,
    latency,
    latencyHistory,
    subsystems,
    checking,
    checkConnection,
    simulation,
    setSimulation,
    offlineQueue,
    syncOfflineQueue,
  } = useNetwork();

  const [activeTab, setActiveTab] = useState('diagnostics'); // 'diagnostics' | 'queue' | 'troubleshoot'
  const [expandedStep, setExpandedStep] = useState(0);

  if (!modalOpen) return null;

  // Compute SVG sparkline path for latency history
  const width = 280;
  const height = 46;
  const points = latencyHistory.map((val, idx) => {
    const x = (idx / Math.max(1, latencyHistory.length - 1)) * width;
    const maxVal = Math.max(100, ...latencyHistory);
    const y = height - (Math.min(val, maxVal) / maxVal) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  const getStatusColor = () => {
    if (status === 'online') return 'var(--green)';
    if (status === 'slow') return '#F0B84A';
    return 'var(--bad)';
  };

  const troubleshootingSteps = [
    {
      title: 'Verify Local Wi-Fi or Ethernet',
      desc: 'Check if your machine has an active IP address and that airplane mode is switched off. If on Wi-Fi, try toggling it off and on.',
    },
    {
      title: 'Hyderabad Regional Gateway Health',
      desc: 'The OneBuddy admin panel connects to the primary South Asia (Hyderabad) region. Check your VPN or local proxy settings.',
    },
    {
      title: 'WebSocket Realtime Dispatcher',
      desc: 'Live order updates stream through wss://dispatch.onebuddy.in. If blocked by a corporate firewall, enable WebSocket port 443.',
    },
    {
      title: 'Flush Local DNS & Browser Cache',
      desc: 'Press Ctrl+F5 (or Cmd+Shift+R) to perform a hard reload. In severe cases, run `ipconfig /flushdns` in your terminal.',
    },
  ];

  return (
    <>
      <div className="mscrim" onClick={closeModal} style={{ zIndex: 90 }} />
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Network Health & Diagnostics"
        style={{
          maxWidth: 680,
          width: '92%',
          zIndex: 91,
          border: '1px solid var(--line)',
          boxShadow: '0 24px 64px -12px rgba(0,0,0,0.45)',
          borderRadius: 20,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Modal Header */}
        <div
          className="mh"
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--line)',
            background: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'color-mix(in oklab, var(--primary) 15%, var(--surface))',
                color: 'var(--primary)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Icon name={isOffline ? 'wifiOff' : 'wifi'} size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Network Health & Diagnostics</h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                Hyderabad Zone Infrastructure & Admin Connectivity
              </p>
            </div>
          </div>

          <button
            type="button"
            className="ib"
            onClick={closeModal}
            aria-label="Close"
            style={{ width: 32, height: 32 }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--line)',
            background: 'var(--surface-2)',
            padding: '0 20px',
            gap: 16,
          }}
        >
          {[
            { id: 'diagnostics', label: 'Diagnostics & Latency', icon: 'activity' },
            { id: 'queue', label: `Offline Sync Queue (${offlineQueue.filter(q => !q.synced).length})`, icon: 'table' },
            { id: 'troubleshoot', label: 'Troubleshooting Guide', icon: 'shield' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 6px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--text)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--text)' : 'var(--muted)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                transition: 'all 0.15s ease',
              }}
            >
              <Icon name={tab.icon} size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Content Body */}
        <div
          className="mb"
          style={{
            padding: 24,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            background: 'var(--surface)',
          }}
        >
          {/* Admin Simulation Controller Pill Bar */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="sliders" size={13} />
              <b>Simulation Mode:</b>
            </span>
            <div className="net-sim-pills">
              {[
                { id: 'auto', label: 'Auto (Live Network)' },
                { id: 'online', label: 'Force Online' },
                { id: 'slow', label: 'Simulate Slow' },
                { id: 'offline', label: 'Simulate Offline' },
              ].map((sim) => (
                <button
                  key={sim.id}
                  type="button"
                  className={`net-sim-pill ${simulation === sim.id ? `active pill-${sim.id}` : ''}`}
                  onClick={() => setSimulation(sim.id)}
                  style={{ height: 26, fontSize: 11, padding: '0 9px' }}
                >
                  {sim.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'diagnostics' && (
            <>
              {/* Latency & Connectivity Status Card */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  gap: 16,
                  padding: 16,
                  borderRadius: 14,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: getStatusColor(),
                        boxShadow: `0 0 10px ${getStatusColor()}`,
                      }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 700, textTransform: 'capitalize' }}>
                      {status === 'online' ? 'Connected & Healthy' : status === 'slow' ? 'High Latency / Slow' : 'Disconnected'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                    {isOffline
                      ? 'No active connection to Hyderabad dispatch services.'
                      : `Live Round-Trip Latency: ${latency || 38}ms (Avg ${Math.round(latencyHistory.reduce((a,b)=>a+b,0)/latencyHistory.length)}ms)`}
                  </p>
                </div>

                {/* SVG Latency Sparkline */}
                {!isOffline && (
                  <div style={{ width: 140, height: 42, overflow: 'hidden' }}>
                    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
                      <polyline
                        fill="none"
                        stroke={isSlow ? '#F0B84A' : 'var(--green)'}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Subsystems List */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Subsystem Health Checks
                </h4>
                <div className="net-diag-list">
                  {subsystems.map((sub) => {
                    const isPass = sub.status === 'pass';
                    const isWarn = sub.status === 'warn';
                    return (
                      <div key={sub.id} className="net-diag-item">
                        <div className={`net-diag-icon ${sub.status}`}>
                          <Icon name={isPass ? 'check' : isWarn ? 'alert' : 'x'} size={15} />
                        </div>
                        <div className="net-diag-details">
                          <b>{sub.name}</b>
                          <span>{sub.target}</span>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {sub.latency && (
                            <span style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'monospace' }}>
                              {sub.latency}ms
                            </span>
                          )}
                          <span className={`net-diag-status-pill ${sub.status}`}>
                            {isPass ? 'Operational' : isWarn ? 'Degraded' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'queue' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Pending Action Sync Queue</h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                    Edits performed while offline are recorded here and automatically synchronized once reconnected.
                  </p>
                </div>
                {offlineQueue.length > 0 && (
                  <button
                    className="btn primary sm"
                    onClick={syncOfflineQueue}
                    disabled={isOffline || checking}
                    style={{ gap: 6 }}
                  >
                    <Icon name="refresh" size={13} className={checking ? 'spin' : ''} />
                    Sync Now
                  </button>
                )}
              </div>

              {offlineQueue.length === 0 ? (
                <div
                  style={{
                    padding: 36,
                    textAlign: 'center',
                    background: 'var(--surface-2)',
                    borderRadius: 14,
                    border: '1px dashed var(--line)',
                    color: 'var(--muted)',
                  }}
                >
                  <Icon name="check" size={24} style={{ marginBottom: 8, color: 'var(--green)' }} />
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>All actions synchronized with the server</p>
                </div>
              ) : (
                <div className="net-queue-list">
                  {offlineQueue.map((item) => (
                    <div key={item.id} className={`net-queue-item ${item.synced ? 'synced' : ''}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: item.synced ? 'var(--green)' : 'var(--bad)',
                          }}
                        />
                        <div>
                          <b style={{ fontSize: 13, display: 'block' }}>{item.action}</b>
                          <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{item.target} • {item.time}</span>
                        </div>
                      </div>
                      <span className={`pill ${item.synced ? 'green' : 'gray'}`} style={{ fontSize: 11 }}>
                        {item.synced ? 'Synced' : 'Pending Sync'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'troubleshoot' && (
            <div className="net-troubleshoot-steps">
              {troubleshootingSteps.map((step, idx) => (
                <div key={idx} className="net-ts-step">
                  <button
                    type="button"
                    className="net-ts-head"
                    onClick={() => setExpandedStep(expandedStep === idx ? -1 : idx)}
                  >
                    <b>
                      <span className="net-ts-num">{idx + 1}</span>
                      {step.title}
                    </b>
                    <Icon
                      name="chev"
                      size={14}
                      style={{
                        transform: expandedStep === idx ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  </button>
                  {expandedStep === idx && <div className="net-ts-body">{step.desc}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="mf"
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--line)',
            background: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            type="button"
            className="btn sm"
            onClick={checkConnection}
            disabled={checking}
            style={{ gap: 6 }}
          >
            <Icon name="refresh" size={13} className={checking ? 'spin' : ''} />
            {checking ? 'Testing Ping...' : 'Test Connection'}
          </button>

          <button type="button" className="btn primary sm" onClick={closeModal}>
            Done
          </button>
        </div>
      </div>
    </>
  );
}
