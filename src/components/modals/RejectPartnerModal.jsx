import React from 'react';
import ModalFrame from './ModalFrame.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';
import { REJECT_REASONS } from '../../data/constants.js';

export default function RejectPartnerModal({ partner }) {
  const { toast, refresh } = useAdmin();
  return (
    <ModalFrame
      title={`Reject ${partner.name}?`}
      ok="Reject application"
      danger
      onSubmit={(f) => {
        partner.kyc = 'Rejected';
        toast(`${partner.name} rejected: ${f.r}`);
        refresh();
      }}
    >
      <div className="field">
        <label htmlFor="rr">Reason sent to the partner</label>
        <select className="sel" id="rr" name="r">
          {REJECT_REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
    </ModalFrame>
  );
}
