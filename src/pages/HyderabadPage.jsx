import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/common/Icon.jsx';
import ServiceTile from '../components/common/ServiceTile.jsx';
import Switch from '../components/common/Switch.jsx';
import { KycPill } from '../components/common/Pills.jsx';
import NewBannerModal from '../components/modals/NewBannerModal.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import usePartnerActions from '../hooks/usePartnerActions.jsx';
import { SVC, SVCS } from '../data/constants.js';
import { isActive } from '../data/selectors.js';

export default function HyderabadPage() {
  const { db, refresh, toast, confirm, copyText, openOrder, openModal } = useAdmin();
  const nav = useNavigate();
  const act = usePartnerActions();
  const partnersSectionRef = useRef(null);

  // Filters & State
  const [selectedZone, setSelectedZone] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all'); // 'all' | 'live' | 'paused'
  const [zoneQuery, setZoneQuery] = useState('');
  const [partnerStatus, setPartnerStatus] = useState('working'); // 'working' | 'all' | 'offline'
  const [partnerSvc, setPartnerSvc] = useState('all');
  const [partnerQuery, setPartnerQuery] = useState('');

  // Calculations
  const totalZones = db.zones.length;
  const liveZones = db.zones.filter((z) => z.on).length;
  const pausedZones = totalZones - liveZones;

  const totalPartners = db.partners.length;
  const workingPartners = db.partners.filter((p) => p.online);
  const offlinePartners = db.partners.filter((p) => !p.online);
  const [bannerTab, setBannerTab] = useState('all'); // 'all' | 'alert' | 'promo'
  const allBanners = db.banners || [];
  const cityBanners = allBanners.filter((b) => {
    if (bannerTab === 'alert') return b.placement === 'city_alert' || (b.badge && b.badge.toLowerCase().includes('notice'));
    if (bannerTab === 'promo') return b.placement !== 'city_alert';
    return true;
  });

  // Zone toggling
  const toggleZone = (z, e) => {
    if (e) e.stopPropagation();
    z.on = !z.on;
    toast(`${z.z} ${z.on ? 'is now live and taking orders' : 'paused — orders blocked'}`);
    refresh();
  };

  const enableAllZones = () => {
    db.zones.forEach((z) => (z.on = true));
    toast('All 14 Hyderabad zones are now live');
    refresh();
  };

  const pauseAllZones = () => {
    confirm({
      title: 'Pause all 14 zones?',
      text: 'Customers across Hyderabad will not be able to place new orders until zones are resumed.',
      ok: 'Pause all zones',
      onOk: () => {
        db.zones.forEach((z) => (z.on = false));
        toast('All zones have been paused', true);
        refresh();
      },
    });
  };

  // Select zone & scroll to partners table
  const handleSelectZone = (zoneName) => {
    if (selectedZone === zoneName) {
      setSelectedZone('all');
    } else {
      setSelectedZone(zoneName);
      if (partnersSectionRef.current) {
        partnersSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Filtered zones
  const filteredZones = useMemo(() => {
    const q = zoneQuery.trim().toLowerCase();
    return db.zones.filter((z) => {
      if (zoneFilter === 'live' && !z.on) return false;
      if (zoneFilter === 'paused' && z.on) return false;
      if (q && !z.z.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [db.zones, zoneFilter, zoneQuery]);

  // Zone statistics map
  const zoneStats = useMemo(() => {
    const map = {};
    db.zones.forEach((z) => {
      const inZone = db.partners.filter((p) => p.area === z.z);
      const working = inZone.filter((p) => p.online);
      const orders = db.orders.filter((o) => o.area === z.z && isActive(o));
      
      const bySvc = {};
      SVCS.forEach((s) => {
        bySvc[s.id] = working.filter((p) => p.svc === s.id).length;
      });

      map[z.z] = {
        total: inZone.length,
        working: working.length,
        activeOrders: orders.length,
        bySvc,
      };
    });
    return map;
  }, [db.zones, db.partners, db.orders]);

  // Ranked zones for distribution chart
  const rankedZones = useMemo(() => {
    return [...db.zones]
      .map((z) => ({
        ...z,
        working: (zoneStats[z.z] && zoneStats[z.z].working) || 0,
        activeOrders: (zoneStats[z.z] && zoneStats[z.z].activeOrders) || 0,
      }))
      .sort((a, b) => b.working - a.working || b.activeOrders - a.activeOrders);
  }, [db.zones, zoneStats]);

  const maxWorkingZone = Math.max(...rankedZones.map((z) => z.working), 1);

  // Filtered partners
  const filteredPartners = useMemo(() => {
    const q = partnerQuery.trim().toLowerCase();
    return db.partners.filter((p) => {
      // Status filter
      if (partnerStatus === 'working' && !p.online) return false;
      if (partnerStatus === 'offline' && p.online) return false;

      // Zone filter
      if (selectedZone !== 'all' && p.area !== selectedZone) return false;

      // Service filter
      if (partnerSvc !== 'all' && p.svc !== partnerSvc) return false;

      // Query search
      if (q) {
        const text = `${p.name} ${p.id} ${p.type} ${p.extra || ''} ${p.phone} ${p.area}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [db.partners, partnerStatus, selectedZone, partnerSvc, partnerQuery]);

  return (
    <>
      {/* Page Header */}
      <div className="pagehead">
        <div>
          <h2>Hyderabad City Operations</h2>
          <p>
            Real-time status of <b>{totalZones} service zones</b> and <b>{workingPartners.length} working partners</b> across Hyderabad
          </p>
        </div>
        <div className="hz-head-actions">
          <button className="btn sm" onClick={enableAllZones} title="Turn on all zones taking orders">
            <Icon name="check" size={14} />
            Enable all zones
          </button>
          <button className="btn sm danger" onClick={pauseAllZones} title="Emergency pause across city">
            <Icon name="pause" size={14} />
            Pause all zones
          </button>
        </div>
      </div>

      {/* Alert banner if any zone is paused */}
      {pausedZones > 0 && (
        <div className="banner">
          <Icon name="alert" size={18} />
          <div>
            <b>{pausedZones} of {totalZones} zones paused</b>: Customer orders are temporarily blocked in{' '}
            {db.zones
              .filter((z) => !z.on)
              .map((z) => z.z)
              .join(', ')}
            . Partners in paused zones cannot receive new incoming orders.
          </div>
        </div>
      )}

      {/* Hyderabad Operations Banners & Broadcasts Section */}
      <div className="card" style={{ padding: '16px 18px' }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div className="row" style={{ gap: 8 }}>
              <span className="pill t-good" style={{ fontWeight: 700 }}>
                <Icon name="megaphone" size={13} /> Operations Banners
              </span>
              <b style={{ fontSize: 15 }}>City Announcements & Customer Banners</b>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
              {allBanners.filter((b) => b.active).length} active campaigns running across Hyderabad zones
            </p>
          </div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <div className="seg" role="group" aria-label="Banner filter tab">
              <button aria-pressed={bannerTab === 'all'} onClick={() => setBannerTab('all')}>
                All ({allBanners.length})
              </button>
              <button aria-pressed={bannerTab === 'alert'} onClick={() => setBannerTab('alert')}>
                City Alerts ({allBanners.filter((b) => b.placement === 'city_alert' || (b.badge && b.badge.toLowerCase().includes('notice'))).length})
              </button>
              <button aria-pressed={bannerTab === 'promo'} onClick={() => setBannerTab('promo')}>
                Promos ({allBanners.filter((b) => b.placement !== 'city_alert').length})
              </button>
            </div>
            <button className="btn sm ghost" onClick={() => nav('/banners')} title="Open full Banners page">
              All Banners &rarr;
            </button>
            <button
              className="btn sm primary"
              onClick={() =>
                openModal(
                  <NewBannerModal
                    defaultPlacement={bannerTab === 'alert' ? 'city_alert' : 'home_hero'}
                    defaultBadge={bannerTab === 'alert' ? 'Operational Notice' : 'Featured Deal'}
                  />
                )
              }
            >
              <Icon name="plus" size={14} />
              Create banner
            </button>
          </div>
        </div>

        {cityBanners.length === 0 ? (
          <div className="card empty" style={{ margin: 0, padding: '24px 16px' }}>
            <Icon name="banner" size={28} />
            <b>No banners match the selected tab</b>
            <p style={{ fontSize: 12.5 }}>Create a new notice or promo banner to broadcast to Hyderabad customers.</p>
            <button
              className="btn sm primary"
              onClick={() => openModal(<NewBannerModal />)}
            >
              <Icon name="plus" size={13} /> Create banner
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cityBanners.map((bn) => (
              <div
                key={bn.id}
                style={{
                  background: bn.gradient || 'linear-gradient(135deg, #FF6B4A 0%, #D83A1E 100%)',
                  color: '#FFFFFF',
                  borderRadius: 12,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                  flexWrap: 'wrap',
                  opacity: bn.active ? 1 : 0.72,
                  boxShadow: bn.active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 260, flex: 1 }}>
                  {bn.image && (
                    <div className="bn-sq-thumb" style={{ width: 68, height: 68, minWidth: 68 }}>
                      <img src={bn.image} alt={bn.title} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                        {bn.badge || 'Advisory'}
                      </span>
                      <span style={{ background: 'rgba(0,0,0,0.22)', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                        {bn.placement === 'city_alert' ? 'City Notice' : bn.placement === 'home_hero' ? 'Home Carousel' : bn.placement}
                      </span>
                      <span style={{ fontSize: 11.5, opacity: 0.9 }}>📍 {bn.targetArea}</span>
                      {bn.phone && (
                        <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                          📱 {bn.phone} {bn.targetCustomer ? `(${bn.targetCustomer})` : ''}
                        </span>
                      )}
                      <span style={{ fontSize: 11, opacity: 0.75 }}>ID: {bn.id}</span>
                    </div>
                    <b style={{ fontSize: 14.5, display: 'block', lineHeight: 1.3 }}>{bn.title}</b>
                    <span style={{ fontSize: 12.5, opacity: 0.92, display: 'block', marginTop: 2 }}>{bn.desc}</span>
                  </div>
                </div>

                <div className="row" style={{ gap: 10, background: 'rgba(0,0,0,0.25)', padding: '6px 12px', borderRadius: 10 }}>
                  <label className="row" style={{ gap: 6, fontSize: 12, fontWeight: 600, color: '#FFFFFF', cursor: 'pointer' }}>
                    <Switch
                      checked={bn.active}
                      onChange={(e) => {
                        bn.active = e.target.checked;
                        db.banners = [...allBanners];
                        toast(`${bn.id} banner is now ${bn.active ? 'live' : 'paused'}`);
                        refresh();
                      }}
                    />
                    {bn.active ? 'Live' : 'Paused'}
                  </label>
                  <button
                    className="btn sm ghost"
                    style={{ color: '#FFFFFF', padding: '3px 8px' }}
                    onClick={() => copyText(bn.ctaLink, 'Copied deep link')}
                    title="Copy deep link"
                  >
                    <Icon name="copy" size={13} />
                  </button>
                  <button
                    className="btn sm ghost"
                    style={{ color: '#FFB4B4', padding: '3px 8px' }}
                    onClick={() =>
                      confirm({
                        title: `Delete banner ${bn.id}?`,
                        text: `Are you sure you want to remove "${bn.title}"?`,
                        ok: 'Delete',
                        onOk: () => {
                          db.banners = (db.banners || []).filter((x) => x.id !== bn.id);
                          toast(`${bn.id} deleted`);
                          refresh();
                        },
                      })
                    }
                    title="Delete banner"
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="kpis">
        <div className="card kpi">
          <div className="lab">Service Zones Live</div>
          <div className="val">
            {liveZones} <small style={{ fontSize: 16, color: 'var(--muted)' }}>/ {totalZones}</small>
          </div>
          <div className="foot">
            <span className="delta up">
              {Math.round((liveZones / totalZones) * 100)}% coverage
              <small>{pausedZones === 0 ? 'All zones operational' : `${pausedZones} zone paused`}</small>
            </span>
            <div className="meter" style={{ maxWidth: 100 }}>
              <i style={{ width: (liveZones / totalZones) * 100 + '%', background: 'var(--green)' }} />
            </div>
          </div>
        </div>

        <div className="card kpi">
          <div className="lab">Partners Working Now</div>
          <div className="val" style={{ color: 'var(--good)' }}>
            <span className="pulse-dot" />
            {workingPartners.length}
          </div>
          <div className="foot">
            <span className="delta up">
              {Math.round((workingPartners.length / totalPartners) * 100)}% online
              <small>{offlinePartners.length} offline · {totalPartners} registered</small>
            </span>
          </div>
        </div>

        <div className="card kpi">
          <div className="lab">Active Orders in City</div>
          <div className="val">{activeOrders.length}</div>
          <div className="foot">
            <span className="delta">
              Delivering now
              <small>Across {db.zones.filter((z) => (zoneStats[z.z] && zoneStats[z.z].activeOrders > 0)).length} active zones</small>
            </span>
          </div>
        </div>

        <div className="card kpi">
          <div className="lab">Highest Partner Density</div>
          <div className="val" style={{ fontSize: 20 }}>
            {rankedZones[0]?.z || '—'}
          </div>
          <div className="foot">
            <span className="delta">
              {rankedZones[0]?.working || 0} partners active
              <small>{rankedZones[0]?.activeOrders || 0} ongoing live orders</small>
            </span>
          </div>
        </div>
      </div>

      {/* Service Working Partners Breakdown Bar */}
      <div className="card" style={{ padding: '12px 16px' }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <b style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)' }}>
            Working Partners by Service
          </b>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Click to filter partners list below</span>
        </div>
        <div className="hz-service-bar">
          <button
            className="chip"
            aria-pressed={partnerSvc === 'all'}
            onClick={() => setPartnerSvc('all')}
          >
            All Services <b>{workingPartners.length}</b>
          </button>
          {SVCS.map((s) => {
            const count = db.partners.filter((p) => p.svc === s.id && p.online).length;
            const total = db.partners.filter((p) => p.svc === s.id).length;
            return (
              <button
                key={s.id}
                className="chip"
                aria-pressed={partnerSvc === s.id}
                onClick={() => setPartnerSvc(partnerSvc === s.id ? 'all' : s.id)}
              >
                <ServiceTile svc={s.id} size="sm" />
                <span>{s.short}</span>
                <b>{count}</b>
                <small style={{ color: 'var(--muted)', fontSize: 11 }}>/ {total}</small>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 1: Service Zones Breakdown Grid */}
      <div className="card">
        <div className="card-h">
          <div>
            <h3>Hyderabad Service Zones ({db.zones.length})</h3>
            <p>
              Live operational status and working fleet density per zone. Tap a card to inspect its partners.
            </p>
          </div>
          <div className="row">
            <div className="seg" role="group" aria-label="Zone filter">
              <button aria-pressed={zoneFilter === 'all'} onClick={() => setZoneFilter('all')}>
                All ({totalZones})
              </button>
              <button aria-pressed={zoneFilter === 'live'} onClick={() => setZoneFilter('live')}>
                Live ({liveZones})
              </button>
              <button aria-pressed={zoneFilter === 'paused'} onClick={() => setZoneFilter('paused')}>
                Paused ({pausedZones})
              </button>
            </div>
            <div className="lsearch">
              <Icon name="search" size={15} />
              <input
                className="inp"
                placeholder="Search zone name..."
                value={zoneQuery}
                onChange={(e) => setZoneQuery(e.target.value)}
                aria-label="Search zones"
              />
            </div>
          </div>
        </div>

        <div className="card-b">
          <div className="hz-zones-grid">
            {filteredZones.map((z) => {
              const st = zoneStats[z.z] || { total: 0, working: 0, activeOrders: 0, bySvc: {} };
              const isSelected = selectedZone === z.z;

              return (
                <div
                  key={z.z}
                  className={`hz-zone-card ${z.on ? '' : 'paused'} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectZone(z.z)}
                  style={{ cursor: 'pointer' }}
                  title="Click to view partners in this zone"
                >
                  <div className="hz-zone-head">
                    <div className="hz-zone-title">
                      <Icon name="pin" size={16} />
                      <span>{z.z}</span>
                    </div>
                    <div className="hz-zone-actions" onClick={(e) => e.stopPropagation()}>
                      <span className={`pill ${z.on ? 't-good' : 't-warn'}`}>{z.on ? 'Live' : 'Paused'}</span>
                      <Switch
                        checked={z.on}
                        onChange={(e) => toggleZone(z, e)}
                        aria-label={`Toggle orders in ${z.z}`}
                        title={z.on ? `Pause ${z.z}` : `Enable ${z.z}`}
                      />
                    </div>
                  </div>

                  <div className="hz-zone-metrics">
                    <div className="hz-metric-box">
                      <b style={{ color: st.working > 0 ? 'var(--good)' : 'var(--muted)' }}>
                        {st.working}
                      </b>
                      <span>Working Now</span>
                    </div>
                    <div className="hz-metric-box">
                      <b>{st.total}</b>
                      <span>Total Partners</span>
                    </div>
                  </div>

                  <div className="hz-zone-tags">
                    {SVCS.map((s) => {
                      const c = st.bySvc[s.id] || 0;
                      if (!c) return null;
                      return (
                        <span key={s.id} className="hz-zone-tag" style={{ borderLeft: `3px solid var(--s-${s.id})` }}>
                          {s.short}: {c}
                        </span>
                      );
                    })}
                  </div>

                  <div className="hz-zone-foot">
                    <span>
                      <b>{st.activeOrders}</b> active orders
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--green-ink)', fontWeight: 600 }}>
                      {isSelected ? 'Selected ✓' : 'View partners →'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: Zone Activity Ranking Bar Chart */}
      <div className="card">
        <div className="card-h">
          <div>
            <h3>Zone Activity Distribution</h3>
            <p>Zones ranked by active working partner count right now</p>
          </div>
          {selectedZone !== 'all' && (
            <button className="btn sm ghost" onClick={() => setSelectedZone('all')}>
              Clear zone filter ({selectedZone})
            </button>
          )}
        </div>
        <div className="card-b">
          <div className="hz-rank-list">
            {rankedZones.map((z, idx) => {
              const pct = Math.round((z.working / maxWorkingZone) * 100);
              const isSelected = selectedZone === z.z;

              return (
                <div
                  key={z.z}
                  className={`hz-rank-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectZone(z.z)}
                  title={`Click to filter partners for ${z.z}`}
                >
                  <div className="hz-rank-name">
                    <span style={{ color: 'var(--muted)', fontSize: 11, width: 18 }}>#{idx + 1}</span>
                    <Icon name="pin" size={13} />
                    <b>{z.z}</b>
                    {!z.on && <span className="pill t-warn plain" style={{ height: 18, fontSize: 10, padding: '0 5px' }}>Paused</span>}
                  </div>
                  <div className="hz-rank-bar-bg">
                    <div
                      className="hz-rank-bar-fill"
                      style={{
                        width: `${Math.max(pct, 6)}%`,
                        background: z.on ? 'var(--green)' : 'var(--muted)',
                      }}
                    />
                  </div>
                  <div className="hz-rank-count">
                    <span style={{ color: z.working > 0 ? 'var(--good)' : 'var(--muted)' }}>
                      {z.working} working
                    </span>
                    <small style={{ color: 'var(--muted)', marginLeft: 4 }}>({z.activeOrders} ord)</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 3: Working Partners Table */}
      <div className="card" ref={partnersSectionRef}>
        <div className="card-h">
          <div>
            <h3>
              Hyderabad Partners Directory{' '}
              <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 14 }}>
                ({filteredPartners.length} of {db.partners.length} shown)
              </span>
            </h3>
            <p>
              {selectedZone !== 'all' ? (
                <span>
                  Filtered to <b>{selectedZone}</b> zone ·{' '}
                  <a
                    href="#clear"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedZone('all');
                    }}
                    style={{ color: 'var(--green-ink)', fontWeight: 600 }}
                  >
                    Show all zones
                  </a>
                </span>
              ) : (
                'Showing partners across all 14 Hyderabad zones'
              )}
            </p>
          </div>
          <div className="row">
            {selectedZone !== 'all' && (
              <span className="pill t-info">
                Zone: {selectedZone}
                <button
                  type="button"
                  onClick={() => setSelectedZone('all')}
                  style={{ background: 'none', border: 0, padding: 0, marginLeft: 4, cursor: 'pointer', color: 'inherit' }}
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="row">
            {/* Status Filter */}
            <div className="seg" role="group" aria-label="Partner working status">
              <button aria-pressed={partnerStatus === 'working'} onClick={() => setPartnerStatus('working')}>
                <span className="pulse-dot" />
                Working ({workingPartners.length})
              </button>
              <button aria-pressed={partnerStatus === 'all'} onClick={() => setPartnerStatus('all')}>
                All ({totalPartners})
              </button>
              <button aria-pressed={partnerStatus === 'offline'} onClick={() => setPartnerStatus('offline')}>
                Offline ({offlinePartners.length})
              </button>
            </div>

            {/* Zone Selector */}
            <select
              className="sel"
              style={{ width: 'auto', minWidth: 150 }}
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              aria-label="Filter by zone"
            >
              <option value="all">All 14 Zones</option>
              {db.zones.map((z) => (
                <option key={z.z} value={z.z}>
                  {z.z} ({zoneStats[z.z]?.working || 0} working / {zoneStats[z.z]?.total || 0})
                </option>
              ))}
            </select>

            {/* Service Filter */}
            <select
              className="sel"
              style={{ width: 'auto', minWidth: 140 }}
              value={partnerSvc}
              onChange={(e) => setPartnerSvc(e.target.value)}
              aria-label="Filter by service"
            >
              <option value="all">All Services</option>
              {SVCS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="row">
            <div className="lsearch">
              <Icon name="search" size={15} />
              <input
                className="inp"
                placeholder="Search partner, phone, ID..."
                value={partnerQuery}
                onChange={(e) => setPartnerQuery(e.target.value)}
                aria-label="Search partners"
              />
            </div>
            {(selectedZone !== 'all' || partnerSvc !== 'all' || partnerQuery || partnerStatus !== 'working') && (
              <button
                className="btn sm"
                onClick={() => {
                  setSelectedZone('all');
                  setPartnerSvc('all');
                  setPartnerQuery('');
                  setPartnerStatus('working');
                }}
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Partners Table */}
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Partner & ID</th>
                <th>Service</th>
                <th>Type</th>
                <th>Zone / Area</th>
                <th>Working Status</th>
                <th>Current Duty / Order</th>
                <th>Rating & Jobs</th>
                <th>KYC</th>
                <th className="r">Toggle Online</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.length ? (
                filteredPartners.map((p) => {
                  // Find if partner is currently assigned to an active order
                  const liveOrder = db.orders.find((o) => o.partner === p.id && isActive(o));

                  return (
                    <tr key={p.id}>
                      <td className="who">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div>
                            <b>{p.name}</b>
                            <small>
                              <span className="mono" style={{ color: 'var(--muted)', marginRight: 6 }}>
                                {p.id}
                              </span>
                              {p.extra}
                              {p.plan ? ' · ' + p.plan : ''}
                            </small>
                          </div>
                          <button
                            className="btn sm ghost"
                            style={{ height: 24, padding: '0 5px' }}
                            onClick={() => copyText(p.phone, `Phone ${p.phone} copied`)}
                            title={`Copy phone: ${p.phone}`}
                          >
                            <Icon name="phone" size={12} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                          <ServiceTile svc={p.svc} size="sm" />
                          <span style={{ fontSize: 13 }}>{SVC[p.svc].short}</span>
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{p.type}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="chip"
                          style={{ height: 26, padding: '0 8px', fontSize: 11.5 }}
                          onClick={() => setSelectedZone(p.area)}
                          title={`Click to filter by ${p.area}`}
                        >
                          <Icon name="pin" size={11} />
                          {p.area}
                        </button>
                      </td>
                      <td>
                        {p.online ? (
                          <span className="pill t-good">
                            <span className="pulse-dot" />
                            Working Now
                          </span>
                        ) : (
                          <span className="pill t-mute">Offline</span>
                        )}
                      </td>
                      <td>
                        {liveOrder ? (
                          <button
                            className="btn sm ghost"
                            style={{ height: 26, padding: '0 8px', color: 'var(--green-ink)', fontWeight: 600 }}
                            onClick={() => openOrder(liveOrder.id)}
                            title="Open order drawer"
                          >
                            <Icon name="play" size={11} />
                            {liveOrder.id} ({liveOrder.status || SVC[liveOrder.svc].statuses[liveOrder.idx]})
                          </button>
                        ) : p.online ? (
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Ready for orders</span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Off duty</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: 12.5 }}>
                          {p.rating ? (
                            <span className="stars">
                              <Icon name="star" size={12} />
                              {p.rating}
                            </span>
                          ) : (
                            <span className="muted">New</span>
                          )}
                          <span style={{ color: 'var(--muted)', marginLeft: 6 }}>
                            ({p.jobs.toLocaleString('en-IN')} jobs)
                          </span>
                        </div>
                      </td>
                      <td>
                        <KycPill kyc={p.kyc} />
                      </td>
                      <td className="r">
                        <label title={p.kyc === 'Verified' ? 'Toggle partner online/offline' : 'Only verified partners can work'}>
                          <Switch
                            checked={p.online}
                            disabled={p.kyc !== 'Verified'}
                            onChange={(e) => act.setOnline(p, e.target.checked)}
                            aria-label={`${p.name} online toggle`}
                          />
                        </label>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9}>
                    <div className="empty">
                      No partners found matching the current filters.
                      <div style={{ marginTop: 8 }}>
                        <button
                          className="btn sm"
                          onClick={() => {
                            setSelectedZone('all');
                            setPartnerSvc('all');
                            setPartnerQuery('');
                            setPartnerStatus('all');
                          }}
                        >
                          View all partners
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
