import React from 'react';
import { ICON_PATHS } from './iconPaths.js';

/** Stroke icon. `name` is a key of ICON_PATHS. */
export default function Icon({ name, size = 18, className = '' }) {
  return (
    <svg
      className={('i ' + className).trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] || '' }}
    />
  );
}
