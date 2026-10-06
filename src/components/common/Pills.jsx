import React from 'react';
import { SVC } from '../../data/constants.js';

const TONES = ['t-info', 't-warn', 't-vio', 't-good'];

export function StatusPill({ order }) {
  if (order.cancelled) return <span className="pill t-bad">Cancelled</span>;
  return <span className={'pill ' + TONES[order.idx]}>{SVC[order.svc].statuses[order.idx]}</span>;
}

export function KycPill({ kyc }) {
  const tone = kyc === 'Verified' ? 't-good' : kyc === 'Pending' ? 't-warn' : kyc === 'Rejected' ? 't-mute' : 't-bad';
  return <span className={'pill ' + tone}>{kyc}</span>;
}

export function PriorityPill({ pri }) {
  const tone = pri === 'High' ? 't-bad' : pri === 'Medium' ? 't-warn' : 't-mute';
  return <span className={'pill ' + tone}>{pri}</span>;
}
