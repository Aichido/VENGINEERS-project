// Onglets de filtre statut spécifiques à la vue Admin — contrairement à la
// vue Technicien (constants/interventionStatus.js), l'Admin doit aussi voir
// les interventions non encore assignées ('nouvelle').
export const ADMIN_STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'nouvelle', label: 'New' },
  { value: 'assignee', label: 'Assigned' },
  { value: 'en_cours', label: 'In Progress' },
  { value: 'terminee', label: 'Completed' },
];

// Statuts pour lesquels une (ré)assignation est autorisée côté backend
// (InterventionAssignmentController::assign) — bloqué dès en_cours/terminee.
export const ASSIGNABLE_STATUSES = ['nouvelle', 'assignee'];