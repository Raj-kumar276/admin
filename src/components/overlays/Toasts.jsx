import React from 'react';
import Icon from '../common/Icon.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';

export default function Toasts() {
  const { toasts } = useAdmin();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={'toast' + (t.bad ? ' bad' : '')} style={t.leaving ? { transition: 'opacity .3s', opacity: 0 } : undefined}>
          <Icon name={t.bad ? 'alert' : 'check'} size={16} />
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
