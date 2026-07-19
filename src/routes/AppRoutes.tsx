import { createBrowserRouter } from 'react-router-dom'
import PartnerLayout from '@/layouts/PartnerLayout'
import DashboardPage from '@/pages/DashboardPage'
import BusesPage from '@/pages/BusesPage'
import RoutesPage from '@/pages/RoutesPage'
import SchedulesPage from '@/pages/SchedulesPage'
import AddSchedulePage from '@/pages/AddSchedulePage'
import ScheduleDetailPage from '@/pages/ScheduleDetailPage'
import EditSchedulePage from '@/pages/EditSchedulePage'
// import TripsPage from '@/pages/TripsPage'
// import BookingsPage from '@/pages/BookingsPage'
// import TicketsPage from '@/pages/TicketsPage'
import ProfilePage from '@/pages/ProfilePage'
import LoginPage from '@/pages/LoginPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import NotFoundPage from '@/pages/NotFoundPage'
import BusDetailsPage from '@/pages/BusDetailsPage'
import AddBusPage from '@/pages/AddBusPage'
import UpdateBusPage from '@/pages/UpdateBusPage'
import ConfigureSeatPage from '@/pages/ConfigureSeatPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/',
    element: <PartnerLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'buses', element: <BusesPage /> },
      { path: 'buses/:id', element: <BusDetailsPage /> },
      { path: 'buses/add', element: <AddBusPage /> },
      { path: 'buses/:id/edit', element: <UpdateBusPage /> },
      { path: 'buses/:id/layout', element: <ConfigureSeatPage /> },
      { path: 'routes', element: <RoutesPage /> },
      { path: 'schedules', element: <SchedulesPage /> },
      { path: 'schedules/add', element: <AddSchedulePage /> },
      { path: 'schedules/:id', element: <ScheduleDetailPage /> },
      { path: 'schedules/:id/edit', element: <EditSchedulePage /> },
      // { path: 'trips', element: <TripsPage /> },
      // { path: 'bookings', element: <BookingsPage /> },
      // { path: 'tickets', element: <TicketsPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
