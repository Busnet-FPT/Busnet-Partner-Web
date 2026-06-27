import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Bus,
  Route,
  CalendarClock,
  MapPinned,
  ClipboardList,
  Banknote,
  Star,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Clock,
  User,
  CheckCircle,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import api from '@/services/api'

interface DashboardStats {
  totalBuses: number
  totalRoutes: number
  totalSchedules: number
  totalTrips: number
  totalBookings: number
  confirmedBookings: number
  revenue: number
  avgRating: number
  totalReviews: number
}

interface RevenueChartItem {
  month: string
  label: string
  revenue: number
  bookings: number
}

interface BookingStatusItem {
  status: string
  count: number
}

interface RecentBooking {
  _id: string
  bookingCode: string
  passengerName: string
  passengerPhone: string
  total: number
  status: string
  createdAt: string
  tripId?: { tripCode: string; departureDate: string }
}

interface UpcomingTrip {
  _id: string
  tripCode: string
  departureDate: string
  totalSeats: number
  availableSeats: number
  bookedSeats: number
  status: string
  routeId?: {
    origin_provinceName: string
    destination_provinceName: string
  }
  busId?: { busName: string; licensePlate: string }
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: '#22c55e',
  PENDING_PAYMENT: '#f59e0b',
  COMPLETED: '#3b82f6',
  CANCELLED_BY_CUSTOMER: '#ef4444',
  CANCELLED_BY_OPERATOR: '#dc2626',
  CANCEL_REQUESTED: '#f97316',
  REFUNDED: '#8b5cf6',
  NO_SHOW: '#6b7280',
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmed',
  PENDING_PAYMENT: 'Pending',
  COMPLETED: 'Completed',
  CANCELLED_BY_CUSTOMER: 'Cancelled (Customer)',
  CANCELLED_BY_OPERATOR: 'Cancelled (Operator)',
  CANCEL_REQUESTED: 'Cancel Requested',
  REFUNDED: 'Refunded',
  NO_SHOW: 'No Show',
}

function formatCurrency(val: number) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`
  return val.toLocaleString('vi-VN')
}

function formatFullCurrency(val: number) {
  return val.toLocaleString('vi-VN')
}

function formatDate(val: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(val))
}

function AnimatedNumber({
  value,
  duration = 1200,
}: {
  value: number
  duration?: number
}) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === 0) {
      setDisplay(0)
      return
    }
    let start = 0
    const startTime = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      start = Math.round(eased * value)
      setDisplay(start)
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value, duration])

  return <>{display.toLocaleString('vi-VN')}</>
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  suffix,
  delay = 0,
  isCurrency = false,
}: {
  title: string
  value: number
  icon: React.ElementType
  color: string
  suffix?: string
  delay?: number
  isCurrency?: boolean
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <Card
      className={`transition-all duration-500 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
    >
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-900">
            {isCurrency ? (
              <>
                <AnimatedNumber value={value} />
                <span className="ml-1 text-sm font-normal text-slate-400">
                  {suffix}
                </span>
              </>
            ) : (
              <>
                <AnimatedNumber value={value} />
                {suffix && (
                  <span className="ml-1 text-sm font-normal text-slate-400">
                    {suffix}
                  </span>
                )}
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [revenueChart, setRevenueChart] = useState<RevenueChartItem[]>([])
  const [bookingStatus, setBookingStatus] = useState<BookingStatusItem[]>([])
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [upcomingTrips, setUpcomingTrips] = useState<UpcomingTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [chartView, setChartView] = useState<'revenue' | 'bookings'>('revenue')

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, chartRes, statusRes, bookingsRes, tripsRes] =
          await Promise.all([
            api.get('/partner/dashboard/stats'),
            api.get('/partner/dashboard/revenue-chart'),
            api.get('/partner/dashboard/booking-status'),
            api.get('/partner/dashboard/recent-bookings'),
            api.get('/partner/dashboard/upcoming-trips'),
          ])
        setStats(statsRes.data.data)
        setRevenueChart(chartRes.data.data || [])
        setBookingStatus(statusRes.data.data || [])
        setRecentBookings(bookingsRes.data.data || [])
        setUpcomingTrips(tripsRes.data.data || [])
      } catch {
        // silently fail — cards will show 0
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-slate-500">Loading your dashboard...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const s = stats || {
    totalBuses: 0,
    totalRoutes: 0,
    totalSchedules: 0,
    totalTrips: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    revenue: 0,
    avgRating: 0,
    totalReviews: 0,
  }

  const getBookingBadge = (status: string) => {
    const map: Record<string, string> = {
      CONFIRMED: 'border-green-200 bg-green-50 text-green-700',
      COMPLETED: 'border-blue-200 bg-blue-50 text-blue-700',
      PENDING_PAYMENT: 'border-amber-200 bg-amber-50 text-amber-700',
      CANCELLED_BY_CUSTOMER: 'border-red-200 bg-red-50 text-red-700',
      CANCELLED_BY_OPERATOR: 'border-red-200 bg-red-50 text-red-700',
      CANCEL_REQUESTED: 'border-orange-200 bg-orange-50 text-orange-700',
      REFUNDED: 'border-violet-200 bg-violet-50 text-violet-700',
      NO_SHOW: 'border-slate-200 bg-slate-50 text-slate-700',
    }
    return map[status] || 'border-slate-200 bg-slate-50 text-slate-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-slate-500">
          Overview of your transport business performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Buses"
          value={s.totalBuses}
          icon={Bus}
          color="bg-blue-100 text-blue-600"
          delay={0}
        />
        <StatCard
          title="Total Routes"
          value={s.totalRoutes}
          icon={Route}
          color="bg-emerald-100 text-emerald-600"
          delay={80}
        />
        <StatCard
          title="Active Schedules"
          value={s.totalSchedules}
          icon={CalendarClock}
          color="bg-violet-100 text-violet-600"
          delay={160}
        />
        <StatCard
          title="Total Trips"
          value={s.totalTrips}
          icon={MapPinned}
          color="bg-amber-100 text-amber-600"
          delay={240}
        />
        <StatCard
          title="Total Bookings"
          value={s.totalBookings}
          icon={ClipboardList}
          color="bg-cyan-100 text-cyan-600"
          delay={320}
        />
        <StatCard
          title="Confirmed"
          value={s.confirmedBookings}
          icon={CheckCircle}
          color="bg-green-100 text-green-600"
          delay={400}
        />
        <StatCard
          title="Revenue"
          value={s.revenue}
          icon={Banknote}
          color="bg-rose-100 text-rose-600"
          suffix="VND"
          delay={480}
          isCurrency
        />
        <StatCard
          title="Avg Rating"
          value={s.avgRating}
          icon={Star}
          color="bg-yellow-100 text-yellow-600"
          suffix={`/ 5 (${s.totalReviews})`}
          delay={560}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp size={18} className="text-blue-600" />
                Revenue Overview
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant={chartView === 'revenue' ? 'default' : 'outline'}
                  size="sm"
                  className={
                    chartView === 'revenue'
                      ? 'h-7 bg-blue-600 text-xs hover:bg-blue-700'
                      : 'h-7 text-xs'
                  }
                  onClick={() => setChartView('revenue')}
                >
                  Revenue
                </Button>
                <Button
                  variant={chartView === 'bookings' ? 'default' : 'outline'}
                  size="sm"
                  className={
                    chartView === 'bookings'
                      ? 'h-7 bg-blue-600 text-xs hover:bg-blue-700'
                      : 'h-7 text-xs'
                  }
                  onClick={() => setChartView('bookings')}
                >
                  Bookings
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {revenueChart.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                No revenue data yet. Start accepting bookings to see your chart.
              </div>
            ) : chartView === 'revenue' ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(v) => formatCurrency(v)}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: any) => [
                      `${formatFullCurrency(Number(value))} VND`,
                      'Revenue',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ fill: '#2563eb', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: any) => [value, 'Bookings']}
                  />
                  <Bar
                    dataKey="bookings"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Booking Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList size={18} className="text-blue-600" />
              Booking Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookingStatus.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                No bookings yet.
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={bookingStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="status"
                      animationBegin={200}
                      animationDuration={800}
                    >
                      {bookingStatus.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] || '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                      }}
                      formatter={(value: any, name: any) => [
                        value,
                        STATUS_LABELS[name as string] || name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {bookingStatus.map((item) => (
                    <div
                      key={item.status}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            STATUS_COLORS[item.status] || '#94a3b8',
                        }}
                      />
                      <span className="text-slate-600">
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Recent Bookings */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList size={18} className="text-blue-600" />
                Recent Bookings
              </CardTitle>
              {recentBookings.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-blue-600 hover:text-blue-700"
                  onClick={() => navigate('/bookings')}
                >
                  View All
                  <ArrowRight size={14} />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <ClipboardList
                  size={40}
                  className="mb-2 text-slate-200"
                />
                <p className="text-sm text-slate-400">
                  No bookings yet. They will appear here once customers start
                  booking.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((b, i) => (
                  <div
                    key={b._id}
                    className="flex items-center justify-between rounded-lg border bg-slate-50/50 px-4 py-3 transition-all duration-300"
                    style={{
                      animationDelay: `${i * 100}ms`,
                      animation: 'fadeInUp 0.4s ease-out forwards',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {b.passengerName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{b.bookingCode}</span>
                          <span>·</span>
                          <span>{formatDate(b.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatFullCurrency(b.total)}
                        <span className="ml-0.5 text-xs font-normal text-slate-400">
                          ₫
                        </span>
                      </span>
                      <Badge
                        className={`text-xs ${getBookingBadge(b.status)}`}
                      >
                        {STATUS_LABELS[b.status] || b.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Trips */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPinned size={18} className="text-blue-600" />
                Upcoming Trips
              </CardTitle>
              {upcomingTrips.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-blue-600 hover:text-blue-700"
                  onClick={() => navigate('/trips')}
                >
                  View All
                  <ArrowRight size={14} />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {upcomingTrips.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <MapPinned size={40} className="mb-2 text-slate-200" />
                <p className="text-sm text-slate-400">
                  No upcoming trips. Create schedules to generate trips
                  automatically.
                </p>
                <Button
                  className="mt-3 h-8 bg-blue-600 text-xs hover:bg-blue-700"
                  onClick={() => navigate('/schedules/add')}
                >
                  Create Schedule
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTrips.map((t, i) => {
                  const occupancy =
                    t.totalSeats > 0
                      ? Math.round((t.bookedSeats / t.totalSeats) * 100)
                      : 0

                  return (
                    <div
                      key={t._id}
                      className="rounded-lg border bg-slate-50/50 px-4 py-3 transition-all duration-300"
                      style={{
                        animationDelay: `${i * 100}ms`,
                        animation: 'fadeInUp 0.4s ease-out forwards',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <MapPinned size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {t.routeId
                                ? `${t.routeId.origin_provinceName} → ${t.routeId.destination_provinceName}`
                                : t.tripCode}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Clock size={10} />
                              <span>{formatDate(t.departureDate)}</span>
                              {t.busId && (
                                <>
                                  <span>·</span>
                                  <span>
                                    {t.busId.busName} ({t.busId.licensePlate})
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            {t.bookedSeats}/{t.totalSeats}
                            <span className="ml-1 text-xs font-normal text-slate-400">
                              seats
                            </span>
                          </p>
                          <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${occupancy}%`,
                                backgroundColor:
                                  occupancy > 80
                                    ? '#ef4444'
                                    : occupancy > 50
                                      ? '#f59e0b'
                                      : '#22c55e',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <span className="text-sm font-medium text-slate-500">
            Quick Actions:
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => navigate('/schedules/add')}
          >
            <CalendarClock size={14} />
            New Schedule
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => navigate('/buses')}
          >
            <Bus size={14} />
            Manage Buses
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => navigate('/routes')}
          >
            <Route size={14} />
            Manage Routes
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => navigate('/profile')}
          >
            <MessageSquare size={14} />
            View Profile
          </Button>
        </CardContent>
      </Card>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default DashboardPage
