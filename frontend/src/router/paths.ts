import type { DashboardView } from '../components/dashboard/DashboardShell';

export const viewPathMap: Record<DashboardView, string> = {
  hall: '/hall',
  'my-tasks': '/my-tasks',
  portfolio: '/portfolio',
  wallet: '/wallet',
  ability: '/ability',
  publish: '/publish',
};

export const pathViewMap: Record<string, DashboardView> = {
  '/hall': 'hall',
  '/my-tasks': 'my-tasks',
  '/portfolio': 'portfolio',
  '/wallet': 'wallet',
  '/ability': 'ability',
  '/publish': 'publish',
};
