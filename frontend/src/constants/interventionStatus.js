import { Clock, Wrench, Check } from 'lucide-react';

export const INTERVENTION_STATUS = {
  nouvelle: { label: 'New', tone: 'bg-[#F7F7F7] text-[#707070]', icon: Clock },
  assignee: { label: 'Assigned', tone: 'bg-[#ECB115]/20 text-[#8a6b0e]', icon: Clock },
  en_cours: { label: 'In progress', tone: 'bg-[#000a1e]/10 text-[#000a1e]', icon: Wrench },
  terminee: { label: 'Completed', tone: 'bg-green-100 text-green-700', icon: Check },
};


// Filter tabs for Interventions.jsx (mirrors STATUS_TABS in commercialStatus.js)
export const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'assignee', label: 'Assigned' },
  { value: 'en_cours', label: 'In Progress' },
  { value: 'terminee', label: 'Completed' },
];
 
export const STATUS_BADGE = Object.fromEntries(
  Object.entries(INTERVENTION_STATUS).map(([key, { tone }]) => [key, tone])
);
 
export const STATUS_LABEL = Object.fromEntries(
  Object.entries(INTERVENTION_STATUS).map(([key, { label }]) => [key, label])
);
 
// ⚠️ ASSUMPTION TO VERIFY: the exact string values of the `priorite` enum
// column were not confirmed against the migration during this session.
// Adjust these keys (currently basse/normale/haute) to match the real
// values returned by GET /technicien/interventions before shipping.
export const PRIORITY_BADGE = {
  basse: 'bg-[#F7F7F7] text-[#707070]',
  normale: 'bg-black/10 text-black',
  haute: 'bg-[#ECB115]/20 text-[#8a6b0e]',
  urgente: 'bg-red-100 text-[#C62221]',
};