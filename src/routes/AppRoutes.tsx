import { useRoutes } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import BusinessPage from '../pages/Business'
import DashboardPage from '../pages/Dashboard'
import DataManagementPage from '../pages/DataManagement'
import FixedDepositsPage from '../pages/FixedDeposits'
import InvestmentsPage from '../pages/Investments'
import NotFoundPage from '../pages/NotFound'
import SettingsPage from '../pages/Settings'

const AppRoutes = () => {
  const element = useRoutes([
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { index: true, element: <DashboardPage /> },
        { path: 'investments', element: <InvestmentsPage /> },
        { path: 'business', element: <BusinessPage /> },
        { path: 'fixed-deposits', element: <FixedDepositsPage /> },
        { path: 'settings', element: <SettingsPage /> },
        { path: 'data', element: <DataManagementPage /> },
      ],
    },
    { path: '*', element: <NotFoundPage /> },
  ])

  return element
}

export default AppRoutes
