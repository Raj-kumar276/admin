import React from 'react';
import Icon from './Icon.jsx';

/** Percentage change badge, e.g. ▲ 4.2% vs prev. 7 days */
export default function Delta({ cur, prev, label }) {
  if (!prev) return null;
  const p = ((cur - prev) / prev) * 100;
  const up = p >= 0;
  return (
    <span className={'delta ' + (up ? 'up' : 'down')}>
      <Icon name={up ? 'up' : 'down'} size={14} />
      {Math.abs(p).toFixed(1)}% <small>{label}</small>
    </span>
  );
}
