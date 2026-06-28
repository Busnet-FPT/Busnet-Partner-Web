import { useCallback, useEffect, useState } from 'react'
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
  ChevronDown,
  Edit,
  KeyRound,
  LogOut,
  Settings,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import api from '@/services/api'

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

export type PartnerLayoutContext = {
  setProfileEditDisabled: (disabled: boolean) => void
  setProfileEditHandler: (handler: (() => void) | null) => void
}

function PartnerLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const partnerToken = localStorage.getItem('partnerToken')
  const [authStatus, setAuthStatus] = useState<
    'checking' | 'authenticated' | 'unauthenticated'
  >(partnerToken ? 'checking' : 'unauthenticated')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [profileEditHandler, setProfileEditHandlerState] = useState<
    (() => void) | null
  >(null)
  const [isProfileEditDisabled, setIsProfileEditDisabled] = useState(true)

  const setProfileEditDisabled = useCallback((disabled: boolean) => {
    setIsProfileEditDisabled(disabled)
  }, [])

  const setProfileEditHandler = useCallback(
    (handler: (() => void) | null) => {
      setProfileEditHandlerState(() => handler)
    },
    [],
  )

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('partnerToken')

      if (!token) {
        setAuthStatus('unauthenticated')
        return
      }

      setAuthStatus('checking')

      try {
        await api.get('/partner/profile/me')
        setAuthStatus('authenticated')
      } catch {
        localStorage.removeItem('partnerToken')
        localStorage.removeItem('partnerAccount')
        setAuthStatus('unauthenticated')
      }
    }

    validateToken()
  }, [location.pathname, location.search])

  if (authStatus === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Checking partner session...
      </div>
    )
  }

  if (authStatus === 'unauthenticated') {
    const redirectTo = `${location.pathname}${location.search}`
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirectTo)}`}
        replace
      />
    )
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await api.post('/partner/auth/logout')
    } finally {
      localStorage.removeItem('partnerToken')
      localStorage.removeItem('partnerAccount')
      localStorage.removeItem('partnerRememberMe')
      setAuthStatus('unauthenticated')
      navigate('/login', { replace: true })
    }
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" className="bg-blue-600 hover:bg-blue-700">
                <Settings />
                Settings
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                className="cursor-pointer"
                disabled={location.pathname === '/profile' && isProfileEditDisabled}
                onSelect={() => {
                  if (location.pathname === '/profile') {
                    profileEditHandler?.()
                    return
                  }

                  navigate('/profile')
                }}
              >
                <Edit />
                Update Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => navigate('/change-password')}
              >
                <KeyRound />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                disabled={isLoggingOut}
                variant="destructive"
                onSelect={handleLogout}
              >
                <LogOut />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="p-6">
          <Outlet
            context={{
              setProfileEditDisabled,
              setProfileEditHandler,
            }}
          />
        </main>
      </div>
    </div>
  )
}

export default PartnerLayout
