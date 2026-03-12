import { useNavigate } from 'react-router-dom';
import DashboardShell, { type DashboardView } from '../components/dashboard/DashboardShell';
import { viewPathMap } from '../router/paths';

interface DashboardRouteViewProps {
  view: DashboardView;
}

export default function DashboardRouteView({ view }: DashboardRouteViewProps) {
  const navigate = useNavigate();

  return (
    <DashboardShell
      currentView={view}
      onNavigate={(nextView) => navigate(viewPathMap[nextView])}
    />
  );
}
