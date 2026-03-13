import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import DashboardShell, { type DashboardView } from '../components/dashboard/DashboardShell';
import { pathViewMap, viewPathMap } from '../router/paths';

export default function DashboardLayoutView() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentView: DashboardView = pathViewMap[location.pathname] ?? 'hall';

  return (
    <>
      <DashboardShell currentView={currentView} onNavigate={(nextView) => navigate(viewPathMap[nextView])} />
      <Outlet />
    </>
  );
}
