export const ROLES = {
  admin: {
    modules: ['dashboard', 'registrations', 'assets', 'reviews', 'reports', 'permissions', 'companies'],
  },
  viewer: {
    modules: ['dashboard', 'assets', 'reviews', 'reports', 'companies'],
  },
};

export function getRole() {
  return localStorage.getItem('assetlife_role') || 'admin';
}

export function getVisibleMenuForRole(role) {
  const map = {
    dashboard: '/dashboard',
    registrations: '/cadastros',
    assets: '/assets',
    reviews: '/reviews',
    reports: '/reports',
    permissions: '/permissions',
  };
  const allowed = ROLES[role]?.modules || [];
  return Object.entries(map)
    .filter(([key]) => allowed.includes(key))
    .map(([, to]) => to);
}