import React, { useEffect, useRef, useState } from 'react';
import Icon from '../common/Icon.jsx';
import GlobalSearch from './GlobalSearch.jsx';
import NotificationsPopover from './NotificationsPopover.jsx';
import AccountMenu from './AccountMenu.jsx';
import NetworkPill from '../network/NetworkPill.jsx';
import useTheme from '../../hooks/useTheme.js';
import { useAdmin } from '../../context/AdminContext.jsx';

export default function Topbar({ title, subtitle, onOpenMenu }) {
  const { db, live, setLive, toast } = useAdmin();
  const { dark, toggle } = useTheme();
  const [pop, setPop] = useState(null); // 'bell' | 'avatar' | null
  const bellRef = useRef(null);
  const avatarRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      const inside = (bellRef.current && bellRef.current.contains(e.target)) || (avatarRef.current && avatarRef.current.contains(e.target));
      if (!inside) setPop(null);
    };
    const onKey = (e) => e.key === 'Escape' && setPop(null);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const unread = db.notifs.filter((n) => !n.read).length;
  const flip = (name) => setPop((p) => (p === name ? null : name));

  return (
    <header className="top">
      <button className="ib menu-btn" onClick={onOpenMenu} aria-label="Open menu">
        <Icon name="menu" size={18} />
      </button>
      <div className="ttl">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="grow" />
      <GlobalSearch />
      <NetworkPill />
      <button
        className="live"
        aria-pressed={live}
        title="Simulate live orders"
        onClick={() => {
          setLive(!live);
          toast(!live ? 'Live updates on' : 'Live updates paused');
        }}
      >
        <i />
        <span>Live</span>
      </button>
      <button className="ib" onClick={toggle} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
        <Icon name={dark ? 'sun' : 'moon'} />
      </button>
      <div className="anchor" ref={bellRef}>
        <button className="ib" onClick={() => flip('bell')} aria-label="Notifications">
          <Icon name="bell" />
          {unread > 0 && <span className="badge">{unread}</span>}
        </button>
        {pop === 'bell' && <NotificationsPopover onClose={() => setPop(null)} />}
      </div>
      <div className="anchor" ref={avatarRef}>
        <button className="avatar" onClick={() => flip('avatar')} aria-label="Account menu">
          OA
        </button>
        {pop === 'avatar' && <AccountMenu onClose={() => setPop(null)} onToggleTheme={toggle} />}
      </div>
    </header>
  );
}
