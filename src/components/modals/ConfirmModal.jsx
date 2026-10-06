import React from 'react';
import ModalFrame from './ModalFrame.jsx';

export default function ConfirmModal({ title, text, ok, danger = true, onOk }) {
  return (
    <ModalFrame title={title} ok={ok} danger={danger} onSubmit={() => onOk && onOk()}>
      <p style={{ color: 'var(--text-2)' }}>{text}</p>
    </ModalFrame>
  );
}
