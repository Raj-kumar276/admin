import React, { useState, useMemo } from 'react';
import Icon from '../components/common/Icon.jsx';
import ServiceTile from '../components/common/ServiceTile.jsx';
import Switch from '../components/common/Switch.jsx';
import NewBannerModal from '../components/modals/NewBannerModal.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import { SVCS, SVC, BANNER_PLACEMENTS } from '../data/constants.js';

export default function BannersPage() {
  const { db, openModal, confirm, toast, refresh, copyText, copyTable } = useAdmin();

  // Filters & State
  const [svcFilter, setSvcFilter] = useState('all');
  const [placementFilter, setPlacementFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  const banners = db.banners || [];

  // Toggle active/paused
  const toggle = (b, on) => {
    b.active = on;
    db.banners = [...banners];
    toast(`${b.id} ${on ? 'is now live in app' : 'paused'}`);
    refresh();
  };

  // Delete banner
  const remove = (b) =>
    confirm({
      title: `Delete banner ${b.id}?`,
      text: `Are you sure you want to remove "${b.title}"? It will immediately stop showing in customer app sessions.`,
      ok: 'Delete banner',
      onOk: () => {
        db.banners = (db.banners || []).filter((x) => x.id !== b.id);
        toast(`${b.id} deleted`);
        refresh();
      },
    });

  // Filtered list - re-computed reactively on every render
  const q = query.trim().toLowerCase();
  const filteredBanners = banners.filter((b) => {
    if (svcFilter !== 'all' && b.svc !== 'all' && b.svc !== svcFilter) return false;
    if (placementFilter !== 'all' && b.placement !== placementFilter) return false;
    if (statusFilter === 'live' && !b.active) return false;
    if (statusFilter === 'paused' && b.active) return false;
    if (q) {
      const discStr = b.discountType && b.discountType !== 'none' ? `${b.discountValue}${b.discountType} off min ${b.minOrder} max ${b.maxDiscount}` : '';
      const text = `${b.id} ${b.title} ${b.desc} ${b.badge} ${b.targetArea} ${b.placement} ${b.phone || ''} ${b.targetCustomer || ''} ${discStr}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  // Calculations
  const liveCount = banners.filter((b) => b.active).length;
  const totalImpressions = banners.reduce((sum, b) => sum + (b.impressions || 0), 0);
  const totalClicks = banners.reduce((sum, b) => sum + (b.clicks || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';
  const alertBanners = banners.filter((b) => b.placement === 'city_alert' && b.active).length;

  // Copy table to clipboard
  const handleCopyTable = () => {
    copyTable(
      {
        headers: ['ID', 'Title', 'Service', 'Placement', 'Area', 'Target Phone', 'Discount', 'Impressions', 'Clicks', 'CTR', 'Status', 'Expiry'],
        rows: filteredBanners.map((b) => [
          b.id,
          b.title,
          b.svc === 'all' ? 'All Services' : (SVC[b.svc]?.name || b.svc),
          b.placement,
          b.targetArea,
          b.phone ? `${b.phone} (${b.targetCustomer || 'Registered'})` : 'All Users',
          b.discountType && b.discountType !== 'none' ? `${b.discountType === '%' ? `${b.discountValue}% OFF` : `₹${b.discountValue} OFF`} (Min ₹${b.minOrder || 0}, Max ₹${b.maxDiscount || 0})` : 'None',
          (b.impressions || 0).toLocaleString('en-IN'),
          (b.clicks || 0).toLocaleString('en-IN'),
          b.ctr || '0%',
          b.active ? 'Live' : 'Paused',
          b.exp,
        ]),
      },
      'Copied banners table to clipboard'
    );
  };

  const getPlacementName = (id) => {
    const pl = BANNER_PLACEMENTS.find((p) => p.id === id);
    return pl ? pl.name : id;
  };

  return (
    <>
      {/* Page Header */}
      <div className="pagehead">
        <div>
          <h2>Banners & Campaigns</h2>
          <p>
            {liveCount} live campaigns · {banners.length} total banners · {totalImpressions.toLocaleString('en-IN')} impressions
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn ghost" onClick={handleCopyTable} title="Copy table data as TSV">
            <Icon name="copy" size={15} />
            Copy table
          </button>
          <button className="btn primary" onClick={() => openModal(<NewBannerModal />)}>
            <Icon name="plus" size={16} />
            Create banner
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="kpis">
        <div className="card kpi">
          <div className="lab">Active Banners</div>
          <div className="val" style={{ color: 'var(--good)' }}>
            <span className="pulse-dot" />
            {liveCount} <small style={{ fontSize: 16, color: 'var(--muted)' }}>/ {banners.length}</small>
          </div>
          <div className="foot">
            <span className="delta up">
              {Math.round((liveCount / Math.max(1, banners.length)) * 100)}% active
              <small>Displaying across Hyderabad</small>
            </span>
          </div>
        </div>

        <div className="card kpi">
          <div className="lab">Total Impressions</div>
          <div className="val">{totalImpressions.toLocaleString('en-IN')}</div>
          <div className="foot">
            <span className="delta up">
              Views in app
              <small>Across home & service headers</small>
            </span>
          </div>
        </div>

        <div className="card kpi">
          <div className="lab">Clicks & Overall CTR</div>
          <div className="val">
            {totalClicks.toLocaleString('en-IN')} <small style={{ fontSize: 15, color: 'var(--muted)' }}>({avgCtr}%)</small>
          </div>
          <div className="foot">
            <span className="delta up">
              High engagement
              <small>Top: Biryani Fest ({banners[0]?.ctr || '14.1%'})</small>
            </span>
          </div>
        </div>

        <div className="card kpi">
          <div className="lab">Operational Notices</div>
          <div className="val" style={{ color: alertBanners > 0 ? 'var(--warn)' : 'var(--text)' }}>
            {alertBanners}
          </div>
          <div className="foot">
            <span className="delta">
              {alertBanners > 0 ? 'City weather / zone alert active' : 'No active weather alerts'}
              <small>Targeting Hyderabad zones</small>
            </span>
          </div>
        </div>
      </div>

      {/* Filter and View Bar */}
      <div className="card" style={{ padding: '14px 16px' }}>
        <div className="row" style={{ justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          {/* Service Filters */}
          <div className="seg" role="group" aria-label="Service filter">
            <button aria-pressed={svcFilter === 'all'} onClick={() => setSvcFilter('all')}>
              All ({banners.length})
            </button>
            {SVCS.map((s) => {
              const count = banners.filter((b) => b.svc === s.id).length;
              return (
                <button key={s.id} aria-pressed={svcFilter === s.id} onClick={() => setSvcFilter(s.id)}>
                  {s.short} ({count})
                </button>
              );
            })}
          </div>

          {/* View toggle */}
          <div className="seg" role="group" aria-label="View mode">
            <button aria-pressed={viewMode === 'cards'} onClick={() => setViewMode('cards')} title="Card Grid View">
              <Icon name="grid" size={14} /> Cards
            </button>
            <button aria-pressed={viewMode === 'table'} onClick={() => setViewMode('table')} title="Data Table View">
              <Icon name="table" size={14} /> Table
            </button>
          </div>
        </div>

        {/* Secondary filters row: Placements, Status, Search */}
        <div className="row" style={{ marginTop: 12, gap: 10, flexWrap: 'wrap' }}>
          <select
            className="sel"
            style={{ width: 'auto', minWidth: 170 }}
            value={placementFilter}
            onChange={(e) => setPlacementFilter(e.target.value)}
            aria-label="Filter by banner placement"
          >
            <option value="all">All Placements</option>
            <option value="home_hero">App Home Hero Carousel</option>
            <option value="service_top">Service Header Banners</option>
            <option value="city_alert">Operational Notices</option>
            <option value="checkout_strip">Checkout Offer Strips</option>
          </select>

          <select
            className="sel"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses ({banners.length})</option>
            <option value="live">Live Only ({liveCount})</option>
            <option value="paused">Paused Only ({banners.length - liveCount})</option>
          </select>

          <div className="lsearch" style={{ flex: 1, minWidth: 200 }}>
            <Icon name="search" size={15} />
            <input
              className="inp"
              placeholder="Search by title, badge, zone or ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search banners"
            />
          </div>
        </div>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' ? (
        filteredBanners.length === 0 ? (
          <div className="card empty">
            <Icon name="banner" size={32} />
            <b>No banners match the selected filters</b>
            <p>Try clearing your search terms or create a new campaign banner for Hyderabad operations.</p>
            <button
              className="btn sm"
              onClick={() => {
                setSvcFilter('all');
                setPlacementFilter('all');
                setStatusFilter('all');
                setQuery('');
              }}
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="banners-grid">
            {filteredBanners.map((b) => (
              <div key={b.id} className={`bn-card ${b.active ? '' : 'paused'}`}>
                {/* Visual Banner Preview Head */}
                <div
                  className="bn-card-visual"
                  style={{
                    background: b.gradient || 'linear-gradient(135deg, #FF6B4A 0%, #D83A1E 100%)',
                    color: '#FFFFFF',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="bn-badge" style={{ background: 'rgba(255,255,255,0.22)' }}>
                        {b.badge || 'PROMO'}
                      </span>
                      {b.svc !== 'all' ? (
                        <span className="bn-badge" style={{ background: 'rgba(0,0,0,0.25)' }}>
                          {b.svc.toUpperCase()}
                        </span>
                      ) : (
                        <span className="bn-badge" style={{ background: 'rgba(0,0,0,0.25)' }}>
                          ALL SERVICES
                        </span>
                      )}
                    </div>
                    <div className="row" style={{ gap: 6, alignItems: 'center' }}>
                      {b.phone && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 99 }}>
                          📱 {b.phone}
                        </span>
                      )}
                      <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 600 }}>📍 {b.targetArea}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: 15, display: 'block', lineHeight: 1.25 }}>{b.title}</b>
                      <p style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.35, margin: '4px 0 0' }}>{b.desc}</p>
                      {b.discountType && b.discountType !== 'none' && b.discountValue > 0 && (
                        <div className="bn-discount-strip">
                          🏷️ {b.discountType === '%' ? `${b.discountValue}% OFF` : `₹${b.discountValue} FLAT OFF`}
                          {b.minOrder > 0 && <span>Min ₹{b.minOrder}</span>}
                          {b.maxDiscount > 0 && <span>Max ₹{b.maxDiscount}</span>}
                        </div>
                      )}
                    </div>
                    {b.image && (
                      <div className="bn-sq-thumb">
                        <img src={b.image} alt={b.title} />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <span style={{ fontSize: 10.5, opacity: 0.8 }}>ID: {b.id}</span>
                    <span
                      style={{
                        background: '#FFFFFF',
                        color: '#151912',
                        padding: '3px 10px',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {b.ctaText || 'Action'} &rarr;
                    </span>
                  </div>
                </div>

                {/* Card Meta & Stats */}
                <div className="bn-card-body">
                  <div className="bn-meta-row">
                    <span className="row" style={{ gap: 6 }}>
                      <ServiceTile svc={b.svc} size="sm" />
                      <span>{getPlacementName(b.placement)}</span>
                    </span>
                    <span style={{ fontSize: 11.5 }}>
                      Ends: <b>{new Date(b.exp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</b>
                    </span>
                  </div>

                  <div className="bn-stats-row">
                    <div className="bn-stat-cell">
                      <b>{(b.impressions || 0).toLocaleString('en-IN')}</b>
                      <small>Impressions</small>
                    </div>
                    <div className="bn-stat-cell">
                      <b>{(b.clicks || 0).toLocaleString('en-IN')}</b>
                      <small>Clicks</small>
                    </div>
                    <div className="bn-stat-cell">
                      <b style={{ color: 'var(--good)' }}>{b.ctr || '0%'}</b>
                      <small>CTR</small>
                    </div>
                  </div>

                  {/* Actions & Switch */}
                  <div className="bn-card-foot">
                    <label className="row" style={{ gap: 8, fontSize: 12.5, fontWeight: 600 }}>
                      <Switch
                        checked={b.active}
                        onChange={(e) => toggle(b, e.target.checked)}
                        aria-label={`${b.title} active`}
                      />
                      {b.active ? 'Live' : 'Paused'}
                    </label>

                    <div className="row" style={{ gap: 4 }}>
                      <button
                        className="btn sm ghost"
                        onClick={() => copyText(b.ctaLink, `Copied link: ${b.ctaLink}`)}
                        title="Copy Deep Link"
                        aria-label="Copy Deep Link"
                      >
                        <Icon name="copy" size={14} />
                      </button>
                      <button
                        className="btn sm ghost"
                        onClick={() => remove(b)}
                        title="Delete banner"
                        aria-label="Delete banner"
                        style={{ color: 'var(--bad)' }}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Data Table View */
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Banner Title</th>
                  <th>Service</th>
                  <th>Placement</th>
                  <th>Target Zone</th>
                  <th>Discount / Terms</th>
                  <th style={{ textAlign: 'right' }}>Impressions</th>
                  <th style={{ textAlign: 'right' }}>Clicks</th>
                  <th style={{ textAlign: 'right' }}>CTR</th>
                  <th>Expiry</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBanners.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <span className="mono" style={{ fontWeight: 600 }}>
                        {b.id}
                      </span>
                    </td>
                    <td>
                      <span className={`pill ${b.active ? 't-good' : 't-warn'}`}>{b.active ? 'Live' : 'Paused'}</span>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 10, alignItems: 'center' }}>
                        {b.image && (
                          <div className="bn-table-sq">
                            <img src={b.image} alt="" />
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <b>{b.title}</b>
                          <small style={{ color: 'var(--muted)', fontSize: 11.5 }}>{b.desc}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <ServiceTile svc={b.svc} size="sm" />
                        <span>{b.svc === 'all' ? 'All Services' : SVC[b.svc]?.short}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12 }}>{getPlacementName(b.placement)}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 12 }}>{b.targetArea}</span>
                        {b.phone && (
                          <span className="mono" style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
                            📱 {b.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {b.discountType && b.discountType !== 'none' && b.discountValue > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span className="bn-discount-pill">
                            🏷️ {b.discountType === '%' ? `${b.discountValue}% OFF` : `₹${b.discountValue} OFF`}
                          </span>
                          {(b.minOrder > 0 || b.maxDiscount > 0) && (
                            <small style={{ fontSize: 10.5, color: 'var(--muted)' }}>
                              {b.minOrder > 0 ? `Min ₹${b.minOrder}` : ''}
                              {b.minOrder > 0 && b.maxDiscount > 0 ? ' · ' : ''}
                              {b.maxDiscount > 0 ? `Max ₹${b.maxDiscount}` : ''}
                            </small>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {(b.impressions || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {(b.clicks || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--good)' }}>{b.ctr || '0%'}</td>
                    <td style={{ fontSize: 12 }}>
                      {new Date(b.exp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <div className="row" style={{ justifyContent: 'flex-end', gap: 4 }}>
                        <Switch
                          checked={b.active}
                          onChange={(e) => toggle(b, e.target.checked)}
                          aria-label={`${b.title} active`}
                        />
                        <button
                          className="btn sm ghost"
                          onClick={() => copyText(b.ctaLink, `Copied link: ${b.ctaLink}`)}
                          title="Copy deep link"
                        >
                          <Icon name="copy" size={13} />
                        </button>
                        <button
                          className="btn sm ghost"
                          onClick={() => remove(b)}
                          title="Delete banner"
                          style={{ color: 'var(--bad)' }}
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
