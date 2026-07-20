import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  MapPin,
  Search,
  UserRound,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import api from '@/services/api'

type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'CANCEL_REQUESTED'
  | 'CANCELLED_BY_CUSTOMER'
  | 'CANCELLED_BY_OPERATOR'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'REFUNDED'

type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'CANCELLED'

interface BookingListItem {
  _id: string
  bookingCode: string
  status: BookingStatus
  total: number
  createdAt: string
  passenger: {
    name: string
    phone: string
    email?: string | null
  }
  seats: Array<{
    _id: string
    seatCode: string
    seatType: string
    finalPrice: number
  }>
  payment: {
    status: PaymentStatus
    amount: number
    paymentType?: string | null
  }
  trip: {
    _id: string
    tripCode: string
    departureDate: string
    actualDepartureTime: number
    status: string
  }
  route?: {
    routeName?: string
    originProvinceName?: string
    destinationProvinceName?: string
  } | null
  bus?: {
    busName?: string
    licensePlate?: string
  } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const bookingStatusStyles: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'border-amber-200 bg-amber-50 text-amber-700',
  CONFIRMED: 'border-blue-200 bg-blue-50 text-blue-700',
  CANCEL_REQUESTED: 'border-orange-200 bg-orange-50 text-orange-700',
  CANCELLED_BY_CUSTOMER: 'border-red-200 bg-red-50 text-red-700',
  CANCELLED_BY_OPERATOR: 'border-red-200 bg-red-50 text-red-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  NO_SHOW: 'border-slate-200 bg-slate-100 text-slate-600',
  REFUNDED: 'border-violet-200 bg-violet-50 text-violet-700',
}

const paymentStatusStyles: Record<PaymentStatus, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  FAILED: 'border-red-200 bg-red-50 text-red-700',
  EXPIRED: 'border-slate-200 bg-slate-100 text-slate-600',
  REFUNDED: 'border-violet-200 bg-violet-50 text-violet-700',
  CANCELLED: 'border-red-200 bg-red-50 text-red-700',
}

function formatLabel(value?: string | null) {
  if (!value) return '—'
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatCurrency(value?: number | null) {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatMinutes(value?: number | null) {
  if (value === null || value === undefined) return '—'
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function BookingsPage() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<BookingListItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [bookingStatus, setBookingStatus] = useState('ALL')
  const [paymentStatus, setPaymentStatus] = useState('ALL')
  const [departureDate, setDepartureDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const fetchBookings = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await api.get('/partner/bookings', {
          params: {
            page,
            limit: 10,
            ...(search && { search }),
            ...(bookingStatus !== 'ALL' && { bookingStatus }),
            ...(paymentStatus !== 'ALL' && { paymentStatus }),
            ...(departureDate && { departureDate }),
          },
        })

        if (active) {
          setBookings(response.data.data?.bookings ?? [])
          setPagination(response.data.data?.pagination ?? null)
        }
      } catch {
        if (active) {
          setError('Failed to load customer bookings. Please try again.')
          setBookings([])
          setPagination(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchBookings()
    return () => {
      active = false
    }
  }, [bookingStatus, departureDate, page, paymentStatus, search])

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setBookingStatus('ALL')
    setPaymentStatus('ALL')
    setDepartureDate('')
    setPage(1)
  }

  const hasFilters = Boolean(
    search ||
      bookingStatus !== 'ALL' ||
      paymentStatus !== 'ALL' ||
      departureDate,
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Customer Bookings</h2>
        <p className="mt-1 text-sm text-slate-500">
          Review customer reservations, assigned seats and payment status.
        </p>
      </div>

      <Card>
        <CardContent>
          <form className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_auto_auto_auto_auto]" onSubmit={handleSearch}>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="pl-9"
                placeholder="Search booking, passenger, phone, trip or route..."
              />
            </div>
            <select
              value={bookingStatus}
              onChange={(event) => {
                setBookingStatus(event.target.value)
                setPage(1)
              }}
              className="h-9 rounded-md border bg-white px-3 text-sm text-slate-700 shadow-xs outline-none focus:border-blue-500"
              aria-label="Filter by booking status"
            >
              <option value="ALL">All booking statuses</option>
              <option value="PENDING_PAYMENT">Pending payment</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCEL_REQUESTED">Cancel requested</option>
              <option value="CANCELLED_BY_CUSTOMER">Cancelled by customer</option>
              <option value="CANCELLED_BY_OPERATOR">Cancelled by operator</option>
              <option value="COMPLETED">Completed</option>
              <option value="NO_SHOW">No show</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <select
              value={paymentStatus}
              onChange={(event) => {
                setPaymentStatus(event.target.value)
                setPage(1)
              }}
              className="h-9 rounded-md border bg-white px-3 text-sm text-slate-700 shadow-xs outline-none focus:border-blue-500"
              aria-label="Filter by payment status"
            >
              <option value="ALL">All payment statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
              <option value="EXPIRED">Expired</option>
              <option value="REFUNDED">Refunded</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <Input
              type="date"
              value={departureDate}
              onChange={(event) => {
                setDepartureDate(event.target.value)
                setPage(1)
              }}
              aria-label="Filter by departure date"
              className="w-full xl:w-40"
            />
            <div className="flex gap-2">
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                <Search size={16} />
                Search
              </Button>
              {hasFilters && (
                <Button type="button" variant="outline" onClick={clearFilters}>
                  <X size={16} />
                  Clear
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-500">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white py-16 text-center">
          <ClipboardList size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-600">No customer bookings found</p>
          <p className="mt-1 text-sm text-slate-400">
            {hasFilters
              ? 'Try changing or clearing the current filters.'
              : 'Bookings will appear after customers reserve seats on your trips.'}
          </p>
        </div>
      ) : (
        <Card className="gap-0 py-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="px-5">Booking</TableHead>
                <TableHead>Passenger</TableHead>
                <TableHead>Trip & Route</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="px-5 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking._id}>
                  <TableCell className="px-5">
                    <p className="font-semibold text-slate-900">{booking.bookingCode}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatDateTime(booking.createdAt)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="flex items-center gap-1.5 font-medium text-slate-800">
                      <UserRound size={14} className="text-blue-600" />
                      {booking.passenger.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {booking.passenger.phone}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-slate-800">{booking.trip.tripCode}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      <MapPin size={12} />
                      {booking.route?.originProvinceName || '—'} →{' '}
                      {booking.route?.destinationProvinceName || '—'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="flex items-center gap-1.5 text-slate-700">
                      <CalendarDays size={14} className="text-blue-600" />
                      {formatDate(booking.trip.departureDate)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatMinutes(booking.trip.actualDepartureTime)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-slate-900">
                      {booking.seats.length > 0
                        ? booking.seats.map((seat) => seat.seatCode).join(', ')
                        : '—'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {booking.seats.length} {booking.seats.length === 1 ? 'seat' : 'seats'}
                    </p>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    {formatCurrency(booking.total)}
                  </TableCell>
                  <TableCell>
                    <Badge className={paymentStatusStyles[booking.payment.status]}>
                      {formatLabel(booking.payment.status)}
                    </Badge>
                    <p className="mt-1 text-xs text-slate-400">
                      Paid {formatCurrency(booking.payment.amount)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge className={bookingStatusStyles[booking.status]}>
                      {formatLabel(booking.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:bg-blue-50"
                      onClick={() => navigate(`/bookings/${booking._id}`)}
                    >
                      <Eye size={15} />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
              <p className="text-sm text-slate-500">
                Showing {bookings.length} of {pagination.total} bookings · Page{' '}
                {pagination.page} of {Math.max(pagination.totalPages, 1)}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous page"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next page"
                  disabled={page >= pagination.totalPages}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(pagination.totalPages, current + 1),
                    )
                  }
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default BookingsPage
