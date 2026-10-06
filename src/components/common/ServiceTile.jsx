import React from 'react';
import Icon from './Icon.jsx';

/** Coloured square with the service icon. size: '' | 'sm' | 'lg' */
export default function ServiceTile({ svc, size = '' }) {
  const px = size === 'sm' ? 15 : size === 'lg' ? 24 : 19;
  return (
    <span className={('tile ' + size).trim()} style={{ '--c': `var(--s-${svc})` }}>
      <Icon name={svc} size={px} />
    </span>
  );
}
