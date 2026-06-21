import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  LayoutDashboard,
  Bus,
  Route,
  CalendarClock,
  MapPinned,
  ClipboardList,
  Ticket,
  User,
  LogOut,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Buses', path: '/buses', icon: Bus },
  { label: 'Routes', path: '/routes', icon: Route },
  { label: 'Schedules', path: '/schedules', icon: CalendarClock },
  { label: 'Trips', path: '/trips', icon: MapPinned },
  { label: 'Bookings', path: '/bookings', icon: ClipboardList },
  { label: 'Tickets', path: '/tickets', icon: Ticket },
  { label: 'Profile', path: '/profile', icon: User },
]

function PartnerLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const partnerToken = localStorage.getItem('partnerToken')

  if (!partnerToken) {
    const redirectTo = `${location.pathname}${location.search}`
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirectTo)}`}
        replace
      />
    )
  }

  const handleLogout = () => {
    localStorage.removeItem('partnerToken')
    localStorage.removeItem('partnerAccount')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed left-0 top-0 h-screen w-64 border-r bg-white">
        <div className="flex h-16 items-center border-b px-6">
          <Link to="/" className="text-xl font-bold text-blue-600">
            BusNet Partner
          </Link>
        </div>

        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  ].join(' ')
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <div className="ml-64 min-h-screen">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6">
          <div>
            <h1 className="text-lg font-semibold">Partner Panel</h1>
            <p className="text-sm text-slate-500">
              Manage buses, routes, schedules and trips
            </p>
          </div>

          <button
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={16} />
            Logout
          </button>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default PartnerLayout
