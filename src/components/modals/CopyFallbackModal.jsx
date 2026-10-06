import React, { useEffect, useRef } from 'react';
import ModalFrame from './ModalFrame.jsx';

/** Shown when the browser blocks clipboard access. */
export default function CopyFallbackModal({ text }) {
  const ref = useRef(null);
  useEffect(() => {
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus();
        ref.current.select();
      }
    }, 50);
  }, []);
  return (
    <ModalFrame title="Copy this text" ok="Done">
      <textarea ref={ref} className="inp" rows={8} readOnly defaultValue={text} />
      <p className="muted" style={{ fontSize: 12.5 }}>
        Your browser blocked the clipboard. Select all and copy it manually.
      </p>
    </ModalFrame>
  );
}
