import React from 'react';
import { useNetwork } from '../../context/NetworkContext.jsx';
import Icon from '../common/Icon.jsx';

export default function NetworkBanner() {
  const { status, isOnline, bannerDismissed, dismissBanner, openModal, checkConnection, checking, offlineQueue } = useNetwork();

  // Only show when not online and not dismissed
  if (isOnline || bannerDismissed) return null;

  const isSlow = status === 'slow';
  const queueCount = offlineQueue.filter((q) => !q.synced).length;

  return (
    <aside className={`net-floating-banner ${status}`} role="alert" aria-live="assertive">
      <div className="net-banner-info">
        <span className="net-banner-badge">
          <Icon name={isSlow ? 'alert' : 'wifiOff'} size={14} />
          {isSlow ? 'Slow Connection' : 'Offline Mode'}
        </span>

        <span className="net-banner-text">
          {isSlow ? (
            <>
              <b>High Latency Detected:</b> Live dispatch updates may be delayed. Data is still syncing.
            </>
          ) : (
            <>
              <b>No Internet Connection:</b> Showing cached Hyderabad dashboard data.{' '}
              {queueCount > 0 ? (
                <span>
                  <b>{queueCount}</b> action{queueCount > 1 ? 's' : ''} queued to sync when reconnected.
                </span>
              ) : (
                'You can continue navigating safely.'
              )}
            </>
          )}
        </span>
      </div>

      <div className="net-banner-actions">
        <button
          className="btn sm"
          onClick={checkConnection}
          disabled={checking}
          style={{ gap: 6, height: 30, padding: '0 10px', fontSize: 12 }}
        >
          <Icon name="refresh" size={13} className={checking ? 'spin' : ''} />
          {checking ? 'Checking...' : 'Reconnect'}
        </button>

        <button
          className="btn sm"
          onClick={openModal}
          style={{ height: 30, padding: '0 10px', fontSize: 12 }}
        >
          Diagnostics
        </button>

        <button
          className="ib sm"
          onClick={dismissBanner}
          title="Dismiss banner"
          aria-label="Dismiss banner"
          style={{ width: 28, height: 28 }}
        >
          <Icon name="x" size={14} />
        </button>
      </div>
    </aside>
  );
}
