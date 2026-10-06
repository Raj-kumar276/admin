import React from 'react';
import { useAdmin } from '../context/AdminContext.jsx';
import RejectPartnerModal from '../components/modals/RejectPartnerModal.jsx';

/** KYC / status actions shared by the Overview, Partners and Service pages. */
export default function usePartnerActions() {
  const { toast, refresh, confirm, openModal } = useAdmin();
  return {
    approve: (p) => {
      p.kyc = 'Verified';
      toast(`${p.name} approved — they can now go online`);
      refresh();
    },
    reject: (p) => openModal(<RejectPartnerModal partner={p} />),
    suspend: (p) =>
      confirm({
        title: `Suspend ${p.name}?`,
        text: "They go offline immediately and can't take new jobs until reinstated.",
        ok: 'Suspend',
        onOk: () => {
          p.kyc = 'Suspended';
          p.online = false;
          toast(`${p.name} suspended`);
          refresh();
        },
      }),
    reinstate: (p) => {
      p.kyc = 'Verified';
      toast(`${p.name} reinstated`);
      refresh();
    },
    setOnline: (p, on) => {
      p.online = on;
      toast(`${p.name} is now ${on ? 'online' : 'offline'}`);
      refresh();
    },
  };
}
