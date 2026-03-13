import { Navigate, createBrowserRouter } from 'react-router-dom';
import AdminConsoleView from '../views/AdminConsoleView';
import DashboardLayoutView from '../views/DashboardLayoutView';
import SsoCallbackView from '../views/SsoCallbackView';

export const router = createBrowserRouter([
  { path: '/sso/callback', element: <SsoCallbackView /> },
  { path: '/admin', element: <AdminConsoleView /> },
  {
    path: '/',
    element: <DashboardLayoutView />,
    children: [
      { index: true, element: <Navigate to="/hall" replace /> },
      { path: 'hall', element: null },
      { path: 'tasks', element: <Navigate to="/my-tasks" replace /> },
      { path: 'my-tasks', element: null },
      { path: 'portfolio', element: null },
      { path: 'wallet', element: null },
      { path: 'ability', element: null },
      { path: 'publish', element: null },
    ],
  },
  { path: '*', element: <Navigate to="/hall" replace /> },
]);
