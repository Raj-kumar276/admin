import React from 'react';
import { useNetwork } from '../../context/NetworkContext.jsx';
import Icon from '../common/Icon.jsx';

export default function NetworkPill() {
  const { status, latency, toggleModal, checking } = useNetwork();

  const getSignalClass = () => {
    if (status === 'online') return 'sig-4';
    if (status === 'slow') return 'sig-2';
    return 'sig-0';
  };

  const getLabel = () => {
    if (checking) return 'Checking...';
    if (status === 'online') return `${latency || 38}ms`;
    if (status === 'slow') return `Slow (${latency || 480}ms)`;
    if (status === 'timeout') return 'Timeout';
    return 'Offline';
  };

  return (
    <button
      className={`net-indicator-pill ${status}`}
      onClick={toggleModal}
      type="button"
      title="Click to view Network Health & Diagnostics"
      aria-label={`Network status: ${status}`}
    >
      <div className={`net-signal-bars ${getSignalClass()}`}>
        <span />
        <span />
        <span />
        <span />
      </div>

      <span>{getLabel()}</span>

      {status === 'offline' && (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--bad)',
            boxShadow: '0 0 8px var(--bad)',
          }}
        />
      )}
    </button>
  );
}
