// Chemin du dashboard selon le rôle. 'admin' retombe sur '/' tant que son
// dashboard n'est pas implémenté (Phase 6).
export const DASHBOARD_PATH_BY_ROLE = {
  client: '/client',
  commercial: '/commercial',
  technicien: '/technicien',
  admin: '/admin',
};