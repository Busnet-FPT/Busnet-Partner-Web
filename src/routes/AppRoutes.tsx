import { createBrowserRouter } from 'react-router-dom'
import PartnerLayout from '@/layouts/PartnerLayout'
import DashboardPage from '@/pages/DashboardPage'
import BusesPage from '@/pages/BusesPage'
import RoutesPage from '@/pages/RoutesPage'
import SchedulesPage from '@/pages/SchedulesPage'
// import TripsPage from '@/pages/TripsPage'
// import BookingsPage from '@/pages/BookingsPage'
// import TicketsPage from '@/pages/TicketsPage'
// import ProfilePage from '@/pages/ProfilePage'
// import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    // element: <LoginPage />,
  },
  {
    path: '/',
    element: <PartnerLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'buses', element: <BusesPage /> },
      { path: 'routes', element: <RoutesPage /> },
      { path: 'schedules', element: <SchedulesPage /> },
      // { path: 'trips', element: <TripsPage /> },
      // { path: 'bookings', element: <BookingsPage /> },
      // { path: 'tickets', element: <TicketsPage /> },
      // { path: 'profile', element: <ProfilePage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])