import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';
import { ago } from '../../utils/format.js';

export default function NotificationsPopover({ onClose }) {
  const { db, refresh } = useAdmin();
  const nav = useNavigate();

  const markAll = () => {
    db.notifs.forEach((n) => (n.read = true));
    refresh();
  };
  const openNotif = (n) => {
    n.read = true;
    refresh();
    onClose();
    nav(n.route);
  };

  return (
    <div className="pop">
      <div className="pop-h">
        <b>Notifications</b>
        <button className="btn sm ghost" onClick={markAll}>
          Mark all as read
        </button>
      </div>
      <div className="pop-list">
        {db.notifs.length ? (
          db.notifs.slice(0, 12).map((n) => (
            <button key={n.id} className={'pop-item' + (n.read ? '' : ' unread')} onClick={() => openNotif(n)}>
              <Icon name={n.icon} size={17} />
              <div>
                <p>{n.text}</p>
                <small>{ago(n.t)}</small>
              </div>
            </button>
          ))
        ) : (
          <div className="empty">You're all caught up.</div>
        )}
      </div>
    </div>
  );
}
