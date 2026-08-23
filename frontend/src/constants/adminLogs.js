// Labels et styles de badge par type de log, alignés sur la charte Vengineers.
// Utilisé par AdminLogs.jsx pour l'onglet de filtre et le badge de chaque entrée.

export const LOG_TYPE_TABS = [
  { value: '', label: 'All' },
  { value: 'activity_log', label: 'Activity' },
  { value: 'order_history', label: 'Orders' },
  { value: 'intervention_history', label: 'Interventions' },
  { value: 'login_audit', label: 'Auth' },
];

export const LOG_TYPE_LABEL = {
  activity_log: 'Activity',
  order_history: 'Order',
  intervention_history: 'Intervention',
  login_audit: 'Auth',
};

export const LOG_TYPE_BADGE = {
  activity_log: 'bg-[#F7F7F7] text-[#404040]',
  order_history: 'bg-[#ECB115]/15 text-[#8a6408]',
  intervention_history: 'bg-[#F80000]/10 text-[#C62221]',
  login_audit: 'bg-black/5 text-black',
};