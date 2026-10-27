import React, { useState, useMemo, useRef, useEffect } from 'react';
import ModalFrame, { FieldError } from './ModalFrame.jsx';
import ServiceTile from '../common/ServiceTile.jsx';
import Icon from '../common/Icon.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';
import { SVCS, AREAS, BANNER_PLACEMENTS } from '../../data/constants.js';
import imgBiryani from '../../assets/banners/biryani.jpg';
import imgGrocery from '../../assets/banners/grocery.jpg';
import imgDoctor from '../../assets/banners/doctor.jpg';
import imgRide from '../../assets/banners/ride.jpg';
import imgHome from '../../assets/banners/home.jpg';

const THEMES = [
  { id: 'orange', name: 'Warm Orange', gradient: 'linear-gradient(135deg, #F97316 0%, #C2410C 100%)', text: '#FFFFFF' },
  { id: 'green', name: 'Emerald Green', gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)', text: '#FFFFFF' },
  { id: 'amber', name: 'Amber Warning', gradient: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)', text: '#FFFFFF' },
  { id: 'blue', name: 'Sky Blue', gradient: 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)', text: '#FFFFFF' },
  { id: 'yellow', name: 'Gold Yellow', gradient: 'linear-gradient(135deg, #EAB308 0%, #A16207 100%)', text: '#151912' },
  { id: 'purple', name: 'Royal Purple', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #5B21B6 100%)', text: '#FFFFFF' },
  { id: 'crimson', name: 'Crimson Alert', gradient: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)', text: '#FFFFFF' },
];

export default function NewBannerModal({ defaultPlacement = 'home_hero', defaultBadge = 'Featured Deal', defaultSvc = 'all' }) {
  const { db, toast, refresh } = useAdmin();
  const d = new Date();
  d.setDate(d.getDate() + 30);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [badge, setBadge] = useState(defaultBadge);
  const [svc, setSvc] = useState(defaultSvc);
  const [placement, setPlacement] = useState(defaultPlacement);
  const [themeId, setThemeId] = useState(defaultPlacement === 'city_alert' ? 'amber' : 'orange');
  const [targetArea, setTargetArea] = useState('All Hyderabad');
  const [ctaText, setCtaText] = useState('Explore Now');
  const [image, setImage] = useState(null);

  // Phone number targeting with live suggestions from registered users
  const [phone, setPhone] = useState('');
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const phoneContainerRef = useRef(null);

  // Compile list of registered users (customers and partners) from db
  const registeredUsers = useMemo(() => {
    const list = [];
    const seen = new Set();

    (db.customers || []).forEach((c) => {
      if (c.phone && !seen.has(c.phone)) {
        seen.add(c.phone);
        list.push({
          phone: String(c.phone),
          name: c.name,
          id: c.id,
          role: 'Customer',
          area: c.area || 'Hyderabad',
          status: c.status || 'Active',
        });
      }
    });

    (db.partners || []).forEach((p) => {
      if (p.phone && !seen.has(p.phone)) {
        seen.add(p.phone);
        list.push({
          phone: String(p.phone),
          name: p.name,
          id: p.id,
          role: `${p.type || 'Partner'} (${p.svc || 'fleet'})`,
          area: p.area || 'Hyderabad',
          status: p.kyc || 'Verified',
        });
      }
    });

    return list;
  }, [db.customers, db.partners]);

  // Dynamic filter for suggestions as user types
  const matchingPhones = useMemo(() => {
    const q = phone.trim().toLowerCase().replace(/[^\d+a-z]/g, '');
    if (!q) return registeredUsers.slice(0, 8);
    return registeredUsers
      .filter(
        (u) =>
          u.phone.includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [registeredUsers, phone]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (phoneContainerRef.current && !phoneContainerRef.current.contains(event.target)) {
        setPhoneDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImageFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const selectedTheme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  const submit = (f, err) => {
    let bad = false;
    const bannerTitle = (f.title || title || '').trim();
    if (!bannerTitle) {
      err('title', 'Please provide a banner title.');
      bad = true;
    } else if (bannerTitle.length > 20) {
      err('title', `Headline / Title must be within 20 letters (currently ${bannerTitle.length}).`);
      bad = true;
    }

    const bannerDesc = (f.desc || desc || '').trim();
    if (!bannerDesc) {
      err('desc', 'Add a subtitle or customer message.');
      bad = true;
    } else if (bannerDesc.length < 50 || bannerDesc.length > 60) {
      err('desc', `Subtitle must be within 50 to 60 letters only (currently ${bannerDesc.length} letters).`);
      bad = true;
    }

    const expDate = f.exp || d.toISOString().slice(0, 10);
    // Safe date check that accounts for timezone offsets
    if (new Date(expDate + 'T23:59:59') < new Date()) {
      err('exp', 'Pick today or a future end date.');
      bad = true;
    }

    if (bad) return false;

    const newId = 'BN-' + (db.bnid || 107);
    db.bnid = (db.bnid || 107) + 1;

    const targetPhone = (phone || '').trim();
    const matchedUser = selectedUser || registeredUsers.find((u) => u.phone === targetPhone);

    const bannerObj = {
      id: newId,
      title: bannerTitle,
      desc: bannerDesc,
      svc: f.svc || svc,
      placement: f.placement || placement,
      badge: (f.badge || badge || 'Featured').trim(),
      theme: themeId,
      gradient: selectedTheme.gradient,
      targetArea: f.targetArea || targetArea,
      phone: targetPhone || null,
      targetCustomer: matchedUser ? matchedUser.name : null,
      targetRole: matchedUser ? matchedUser.role : null,
      targetUserId: matchedUser ? matchedUser.id : null,
      ctaText: (f.ctaText || ctaText || 'View').trim(),
      ctaLink: (f.ctaLink || (svc === 'all' ? 'onebuddy://hyderabad' : `onebuddy://services/${f.svc || svc}`)).trim(),
      image: image || null,
      active: true,
      impressions: 0,
      clicks: 0,
      ctr: '0.0%',
      startsAt: new Date().toISOString().slice(0, 10),
      exp: expDate,
    };

    db.banners = [bannerObj, ...(db.banners || [])];
    toast(`${newId} banner created & published`);
    refresh();
    return true;
  };

  return (
    <ModalFrame title="Create App & Operations Banner" ok="Publish banner" onSubmit={submit} width={580}>
      {(e) => (
        <>
          {/* Live Preview Card */}
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>
              Live In-App Preview
            </span>
            <div
              style={{
                background: selectedTheme.gradient,
                color: selectedTheme.text,
                padding: '16px 18px',
                borderRadius: 14,
                boxShadow: 'var(--shadow-pop)',
                position: 'relative',
                overflow: 'hidden',
                minHeight: 110,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {svc !== 'all' ? (
                    <span style={{ background: 'rgba(255,255,255,0.22)', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                      {svc.toUpperCase()}
                    </span>
                  ) : (
                    <span style={{ background: 'rgba(255,255,255,0.22)', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                      ALL SERVICES
                    </span>
                  )}
                  <span style={{ background: 'rgba(0,0,0,0.25)', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                    {badge || 'Badge'}
                  </span>
                  {phone && (
                    <span style={{ background: 'rgba(0,0,0,0.35)', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, color: '#FFFFFF' }}>
                      📱 {phone} {selectedUser?.name ? `(${selectedUser.name})` : ''}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 500 }}>
                  📍 {targetArea}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '4px 0' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 16, fontWeight: 700, display: 'block', lineHeight: 1.25, marginBottom: 4 }}>
                    {title || 'Biryani Fest 50% Off'}
                  </b>
                  <p style={{ fontSize: 12.5, opacity: 0.9, lineHeight: 1.35, margin: 0 }}>
                    {desc || 'Order fresh dum biryani with free delivery across the city.'}
                  </p>
                </div>
                {image && (
                  <div className="bn-sq-thumb" style={{ width: 72, height: 72, minWidth: 72 }}>
                    <img src={image} alt="Preview" />
                  </div>
                )}
              </div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, opacity: 0.75 }}>
                  Placement: {BANNER_PLACEMENTS.find((p) => p.id === placement)?.name || placement}
                </span>
                <span
                  style={{
                    background: selectedTheme.text === '#151912' ? '#151912' : '#FFFFFF',
                    color: selectedTheme.text === '#151912' ? '#FFFFFF' : '#151912',
                    padding: '4px 12px',
                    borderRadius: 99,
                    fontSize: 11.5,
                    fontWeight: 700,
                  }}
                >
                  {ctaText || 'Order Now'} &rarr;
                </span>
              </div>
            </div>
          </div>

          {/* Square Image Upload Field */}
          <div className="field">
            <label>Square Banner Image (1:1 aspect ratio)</label>
            <div className="bn-upload-box" onClick={() => document.getElementById('bn-img-file-input')?.click()}>
              <div className="bn-upload-preview-sq">
                {image ? (
                  <img src={image} alt="Upload preview" />
                ) : (
                  <Icon name="image" size={26} style={{ color: 'var(--muted)' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: 13, display: 'block' }}>
                  {image ? 'Square image selected' : 'Upload square banner photo'}
                </b>
                <small style={{ color: 'var(--muted)', display: 'block', marginTop: 2 }}>
                  Click to choose file from your device (JPG, PNG, WebP) · Cropped as 1:1 square
                </small>
                <div className="row" style={{ gap: 8, marginTop: 6 }}>
                  <button
                    type="button"
                    className="btn sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById('bn-img-file-input')?.click();
                    }}
                  >
                    Choose Image File
                  </button>
                  {image && (
                    <button
                      type="button"
                      className="btn sm ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImage(null);
                      }}
                      style={{ color: 'var(--bad)' }}
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              </div>
              <input
                type="file"
                id="bn-img-file-input"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageFile}
              />
            </div>

            {/* Quick Sample Presets */}
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Or choose a preset square photo:</span>
              <div className="bn-preset-pills">
                <button
                  type="button"
                  className={`bn-preset-btn ${image === imgBiryani ? 'active' : ''}`}
                  onClick={() => setImage(imgBiryani)}
                >
                  🍲 Food
                </button>
                <button
                  type="button"
                  className={`bn-preset-btn ${image === imgGrocery ? 'active' : ''}`}
                  onClick={() => setImage(imgGrocery)}
                >
                  🥦 Grocery
                </button>
                <button
                  type="button"
                  className={`bn-preset-btn ${image === imgRide ? 'active' : ''}`}
                  onClick={() => setImage(imgRide)}
                >
                  🛺 Ride
                </button>
                <button
                  type="button"
                  className={`bn-preset-btn ${image === imgDoctor ? 'active' : ''}`}
                  onClick={() => setImage(imgDoctor)}
                >
                  👩‍⚕️ Doctor
                </button>
                <button
                  type="button"
                  className={`bn-preset-btn ${image === imgHome ? 'active' : ''}`}
                  onClick={() => setImage(imgHome)}
                >
                  🧹 Home
                </button>
              </div>
            </div>
          </div>

          {/* Form fields */}
          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="bt">Banner Headline / Title (Within 20 letters)</label>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: title.trim().length > 20 ? 'var(--bad)' : 'var(--muted)',
                }}
              >
                {title.trim().length}/20 letters
              </span>
            </div>
            <input
              className="inp"
              id="bt"
              name="title"
              maxLength={20}
              placeholder="e.g. 50% Off Biryani"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <FieldError msg={e.title} />
          </div>

          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="bdesc">Subtitle / Customer Message (50–60 letters only)</label>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color:
                    desc.trim().length === 0
                      ? 'var(--muted)'
                      : desc.trim().length >= 50 && desc.trim().length <= 60
                      ? 'var(--good)'
                      : 'var(--bad)',
                }}
              >
                {desc.trim().length} letters {desc.trim().length >= 50 && desc.trim().length <= 60 ? '(Valid ✓)' : '(Must be 50–60)'}
              </span>
            </div>
            <textarea
              className="inp"
              id="bdesc"
              name="desc"
              rows={2}
              maxLength={60}
              placeholder="Order fresh dum biryani with free delivery across the city."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              style={{ resize: 'vertical' }}
            />
            <FieldError msg={e.desc} />
          </div>

          <div className="two">
            <div className="field">
              <label htmlFor="bsvc">Target Service</label>
              <select className="sel" id="bsvc" name="svc" value={svc} onChange={(e) => setSvc(e.target.value)}>
                <option value="all">All Services (Super App)</option>
                {SVCS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="bpl">Banner Placement</label>
              <select className="sel" id="bpl" name="placement" value={placement} onChange={(e) => setPlacement(e.target.value)}>
                <option value="home_hero">App Home Hero Carousel</option>
                <option value="service_top">Service Header Banner</option>
                <option value="city_alert">Operational City Notice</option>
                <option value="checkout_strip">Checkout Offer Strip</option>
              </select>
            </div>
          </div>

          <div className="two">
            <div className="field">
              <label htmlFor="bbadge">Pill / Badge Text</label>
              <input
                className="inp"
                id="bbadge"
                name="badge"
                placeholder="e.g. Hot Deal, Advisory, Flash"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="barea">Target Geographic Area</label>
              <select className="sel" id="barea" name="targetArea" value={targetArea} onChange={(e) => setTargetArea(e.target.value)}>
                <option value="All Hyderabad">All Hyderabad (Entire City)</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Registered Phone Number Field with Dynamic Autocomplete */}
          <div className="field phone-suggest-wrap" ref={phoneContainerRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="bphone">
                Target Phone Number{' '}
                <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11.5 }}>
                  (Optional · Broadcasts to everyone if blank)
                </span>
              </label>
              {phone && (
                <button
                  type="button"
                  className="btn sm ghost"
                  style={{ fontSize: 11, padding: '1px 8px', height: 'auto', color: 'var(--bad)' }}
                  onClick={() => {
                    setPhone('');
                    setSelectedUser(null);
                    setPhoneDropdownOpen(false);
                  }}
                >
                  ✕ Clear phone
                </button>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                className="inp"
                id="bphone"
                name="phone"
                autoComplete="off"
                placeholder="Type phone digits (e.g. 98480...) to search registered numbers"
                value={phone}
                onFocus={() => setPhoneDropdownOpen(true)}
                onChange={(e) => {
                  const val = e.target.value;
                  setPhone(val);
                  setPhoneDropdownOpen(true);
                  const exact = registeredUsers.find((u) => u.phone === val.trim());
                  setSelectedUser(exact || null);
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  fontSize: 14,
                  opacity: 0.7,
                }}
              >
                📱
              </span>
            </div>

            {/* Dynamic Suggestions Dropdown */}
            {phoneDropdownOpen && (
              <div className="phone-suggest-dropdown">
                <div className="phone-suggest-header">
                  <span>
                    {phone.trim()
                      ? `Matching Registered Numbers (${matchingPhones.length})`
                      : `Registered Phone Numbers (${registeredUsers.length} total)`}
                  </span>
                  <span style={{ fontSize: 10, opacity: 0.8 }}>Click number to select</span>
                </div>
                {matchingPhones.length === 0 ? (
                  <div style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--muted)' }}>
                    No registered phone number matching "{phone}". You can still save this custom phone or clear it.
                  </div>
                ) : (
                  matchingPhones.map((u) => (
                    <div
                      key={u.id + '-' + u.phone}
                      className={`phone-suggest-item ${phone === u.phone ? 'active' : ''}`}
                      onClick={() => {
                        setPhone(u.phone);
                        setSelectedUser(u);
                        setPhoneDropdownOpen(false);
                      }}
                    >
                      <div>
                        <div className="phone-suggest-phone">
                          <span>📱 {u.phone}</span>
                          <span className="phone-suggest-badge">{u.role}</span>
                        </div>
                        <div className="phone-suggest-name">
                          <b>{u.name}</b> · ID: {u.id} · 📍 {u.area}
                        </div>
                      </div>
                      <span className="btn sm ghost" style={{ fontSize: 11, padding: '2px 8px' }}>
                        Select &rarr;
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Verified Selected User Pill */}
            {selectedUser && (
              <div className="phone-verified-card">
                <div className="row" style={{ gap: 8 }}>
                  <Icon name="check" size={15} style={{ color: 'var(--good)' }} />
                  <div>
                    <b>Registered {selectedUser.role}:</b> {selectedUser.name} (<span className="mono">{selectedUser.phone}</span>) · 📍 {selectedUser.area}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn sm ghost"
                  style={{ padding: '1px 6px', fontSize: 11, height: 'auto', color: 'var(--bad)' }}
                  onClick={() => {
                    setSelectedUser(null);
                    setPhone('');
                  }}
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>

          <div className="field">
            <label>Color Theme & Visual Style</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setThemeId(th.id)}
                  style={{
                    background: th.gradient,
                    width: 34,
                    height: 34,
                    borderRadius: 99,
                    border: themeId === th.id ? '3px solid var(--text)' : '2px solid transparent',
                    cursor: 'pointer',
                    boxShadow: themeId === th.id ? '0 0 0 2px var(--surface)' : 'none',
                    transition: 'transform .1s',
                    transform: themeId === th.id ? 'scale(1.15)' : 'none',
                  }}
                  title={th.name}
                  aria-label={th.name}
                />
              ))}
            </div>
          </div>

          <div className="two">
            <div className="field">
              <label htmlFor="bcta">CTA Button Label</label>
              <input
                className="inp"
                id="bcta"
                name="ctaText"
                placeholder="Explore Now"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="blink">Deep Link URL / Route</label>
              <input
                className="inp mono"
                id="blink"
                name="ctaLink"
                placeholder="onebuddy://services/food"
                defaultValue={svc === 'all' ? 'onebuddy://services/food' : `onebuddy://services/${svc}`}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="bexp">Active Until (Expiry Date)</label>
            <input className="inp" id="bexp" name="exp" type="date" defaultValue={d.toISOString().slice(0, 10)} />
            <FieldError msg={e.exp} />
          </div>
        </>
      )}
    </ModalFrame>
  );
}
