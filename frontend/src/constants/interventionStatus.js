import { Clock, Wrench, Check } from 'lucide-react';

export const INTERVENTION_STATUS = {
  nouvelle: { label: 'New', tone: 'bg-[#F7F7F7] text-[#707070]', icon: Clock },
  assignee: { label: 'Assigned', tone: 'bg-[#ECB115]/20 text-[#8a6b0e]', icon: Clock },
  en_cours: { label: 'In progress', tone: 'bg-[#000a1e]/10 text-[#000a1e]', icon: Wrench },
  terminee: { label: 'Completed', tone: 'bg-green-100 text-green-700', icon: Check },
};