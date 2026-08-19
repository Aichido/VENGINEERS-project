// Constantes pour les vues statistiques Admin (Overview, futurs rapports).
// Réutilisables partout où priorité intervention / rôle utilisateur doivent
// être affichés avec un label + un ordre + une couleur cohérents.

export const PRIORITY_LABELS = {
  basse: 'Low',
  normale: 'Normal',
  haute: 'High',
  urgente: 'Urgent',
};

export const PRIORITY_ORDER = ['basse', 'normale', 'haute', 'urgente'];

export const PRIORITY_TONE = {
  basse: 'bg-[#F7F7F7] text-[#707070]',
  normale: 'bg-[#ECB115]/20 text-[#8a6b0e]',
  haute: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-[#C62221]',
};

export const ROLE_LABELS = {
  admin: 'Admin',
  commercial: 'Commercial',
  technicien: 'Technicien',
  client: 'Client',
};

export const ROLE_ORDER = ['admin', 'commercial', 'technicien', 'client'];

// Formateur de devise partagé (MUR, 2 décimales) — utilisé partout où un
// montant issu de l'API doit être affiché (Admin stats, futurs rapports CA).
export const muCurrency = new Intl.NumberFormat('en-MU', {
  style: 'currency',
  currency: 'MUR',
  minimumFractionDigits: 2,
});

export const STAFF_ROLE_OPTIONS = ['admin', 'commercial', 'technicien'];


export const ROLE_BADGE_TONE = {
  admin: 'bg-black text-white',
  commercial: 'bg-blue-100 text-blue-700',
  technicien: 'bg-purple-100 text-purple-700',
  client: 'bg-[#F7F7F7] text-[#707070]',
};
export const ROLE_AVATAR_TONE = {
  admin: 'bg-black',
  commercial: 'bg-blue-500',
  technicien: 'bg-purple-500',
  client: 'bg-[#707070]',
};

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}