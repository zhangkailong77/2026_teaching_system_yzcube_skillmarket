import { Navigate, createBrowserRouter } from 'react-router-dom';
import AbilityView from '../views/AbilityView';
import HallView from '../views/HallView';
import MyTasksView from '../views/MyTasksView';
import PortfolioView from '../views/PortfolioView';
import WalletView from '../views/WalletView';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/hall" replace /> },
  { path: '/hall', element: <HallView /> },
  { path: '/my-tasks', element: <MyTasksView /> },
  { path: '/portfolio', element: <PortfolioView /> },
  { path: '/wallet', element: <WalletView /> },
  { path: '/ability', element: <AbilityView /> },
  { path: '*', element: <Navigate to="/hall" replace /> },
]);
