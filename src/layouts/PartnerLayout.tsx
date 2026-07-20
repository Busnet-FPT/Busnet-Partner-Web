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
  ClipboardList,
  Ticket,
  CreditCard,
  User,
  ChevronDown,
  Edit,
  KeyRound,
  LogOut,
  Settings,
  BookOpen,
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
  { label: 'Subscription', path: '/subscription', icon: CreditCard },
  { label: 'Buses', path: '/buses', icon: Bus },
  { label: 'Routes', path: '/routes', icon: Route },
  { label: 'Schedules', path: '/schedules', icon: CalendarClock },
  { label: 'Bookings', path: '/bookings', icon: ClipboardList },
  { label: 'Tickets', path: '/tickets', icon: Ticket },
  { label: 'Blogs', path: '/blogs', icon: BookOpen },
  { label: 'Profile', path: '/profile', icon: User },
]

export type PartnerLayoutContext = {
  setProfileEditDisabled: (disabled: boolean) => void
  setProfileEditHandler: (handler: (() => void) | null) => void
}

type PartnerInfo = {
  operatorName?: string
  profilePicture?: string
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
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null)

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
        const res = await api.get('/partner/profile/me')
        setPartnerInfo(res.data.data)
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
      <aside className="fixed left-0 top-0 h-screen w-64 border-r bg-white flex flex-col justify-between">
        <div className="flex flex-col flex-1 min-h-0">
          <Link
            to="/"
            className="flex items-center gap-3 border-b px-6 py-5 hover:opacity-90 transition duration-150"
          >
            <img
              src="/logo.jpg"
              alt="BusNet logo"
              className="h-9 w-9 rounded-lg object-cover border border-slate-200 shadow-2xs"
              onError={(e) => {
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60'
              }}
            />
            <span className="text-lg font-bold tracking-tight text-slate-900">
              BusNet-Partner
            </span>
          </Link>

          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => {
                    const isProfileSection =
                      item.path === '/profile' &&
                      location.pathname === '/change-password'

                    return [
                      'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition',
                      isActive || isProfileSection
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    ].join(' ')
                  }}
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {partnerInfo && (
          <div className="flex items-center gap-3 border-t px-6 py-4 bg-slate-50/50">
            <img
              src={
                partnerInfo.profilePicture
                  ? partnerInfo.profilePicture.startsWith('http')
                    ? partnerInfo.profilePicture
                    : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${partnerInfo.profilePicture}`
                  : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60'
              }
              alt={partnerInfo.operatorName}
              className="h-10 w-10 rounded-full object-cover border border-slate-200 shadow-2xs"
              onError={(e) => {
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60'
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 leading-snug">
                {partnerInfo.operatorName}
              </p>
              <p className="text-xs text-slate-500 font-medium">Partner Operator</p>
            </div>
          </div>
        )}
      </aside>

      <div className="ml-64 min-h-screen">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6">
          <div>
            <h1 className="text-lg font-semibold">Partner Panel</h1>
            <p className="text-sm text-slate-500">
              Manage buses, routes and schedules
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
