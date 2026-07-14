import { createBrowserRouter } from 'react-router-dom'
import PartnerLayout from '@/layouts/PartnerLayout'
import DashboardPage from '@/pages/DashboardPage'
import BusesPage from '@/pages/BusesPage'
import RoutesPage from '@/pages/RoutesPage'
import SchedulesPage from '@/pages/SchedulesPage'
import AddSchedulePage from '@/pages/AddSchedulePage'
import ScheduleDetailPage from '@/pages/ScheduleDetailPage'
import EditSchedulePage from '@/pages/EditSchedulePage'
import SetTicketPricePage from '@/pages/SetTicketPricePage'
// import TripsPage from '@/pages/TripsPage'
// import BookingsPage from '@/pages/BookingsPage'
import TicketsPage from '@/pages/TicketsPage'
import TicketDetailPage from '@/pages/TicketDetailPage'
import ProfilePage from '@/pages/ProfilePage'
import LoginPage from '@/pages/LoginPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import NotFoundPage from '@/pages/NotFoundPage'
import RouteDetailsPage from '@/pages/RouteDetailsPage'
import BlogsPage from '@/pages/blog-management/BlogsPage'
import AddBlogPage from '@/pages/blog-management/AddBlogPage'
import EditBlogPage from '@/pages/blog-management/EditBlogPage'

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
      { path: 'routes', element: <RoutesPage /> },
      { path: 'routes/:id', element: <RouteDetailsPage /> },
      { path: 'schedules', element: <SchedulesPage /> },
      { path: 'schedules/add', element: <AddSchedulePage /> },
      { path: 'schedules/:id', element: <ScheduleDetailPage /> },
      { path: 'schedules/:id/edit', element: <EditSchedulePage /> },
      {
        path: 'schedules/:scheduleId/ticket-prices',
        element: <SetTicketPricePage />,
      },
      // { path: 'trips', element: <TripsPage /> },
      // { path: 'bookings', element: <BookingsPage /> },
      { path: 'tickets', element: <TicketsPage /> },
      { path: 'tickets/:ticketId', element: <TicketDetailPage /> },
      { path: 'blogs', element: <BlogsPage /> },
      { path: 'blogs/add', element: <AddBlogPage /> },
      { path: 'blogs/:id/edit', element: <EditBlogPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
