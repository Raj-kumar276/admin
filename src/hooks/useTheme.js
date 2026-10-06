import { useCallback, useEffect, useState } from 'react';
import { store } from '../utils/format.js';

const systemDark = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

/** Light/dark theme toggle that respects the OS setting until the user picks one. */
export default function useTheme() {
  const read = () => {
    const t = document.documentElement.dataset.theme;
    return t ? t === 'dark' : systemDark();
  };
  const [dark, setDark] = useState(read);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => setDark(read());
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const toggle = useCallback(() => {
    const next = read() ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    store.set('ob-theme', next);
    setDark(next === 'dark');
  }, []);

  return { dark, toggle };
}
