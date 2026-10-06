import React from 'react';
import { useAdmin } from '../../context/AdminContext.jsx';

/** Renders whichever dialog is currently open (set via openModal / confirm). */
export default function ModalHost() {
  const { modal } = useAdmin();
  return <div id="modalRoot">{modal}</div>;
}
