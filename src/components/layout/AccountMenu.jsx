import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';

export default function AccountMenu({ onClose, onToggleTheme }) {
  const { setSignedOut } = useAdmin();
  const nav = useNavigate();
  const row = { gridTemplateColumns: 'auto 1fr' };

  return (
    <div className="pop" style={{ width: 240 }}>
      <div className="pop-h">
        <div>
          <b>Ops Admin</b>
          <p className="muted" style={{ fontSize: 12 }}>
            ops@onebuddy.app · Owner
          </p>
        </div>
      </div>
      <button className="pop-item" style={row} onClick={() => { onClose(); nav('/settings'); }}>
        <Icon name="sliders" size={16} />
        <p>Settings</p>
      </button>
      <button className="pop-item" style={row} onClick={onToggleTheme}>
        <Icon name="moon" size={16} />
        <p>Switch theme</p>
      </button>
      <button className="pop-item" style={{ ...row, borderBottom: 0, color: 'var(--bad)' }} onClick={() => { onClose(); setSignedOut(true); }}>
        <Icon name="logout" size={16} />
        <p>Sign out</p>
      </button>
    </div>
  );
}
