import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  Search,
  Ticket,
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

type TicketStatus = 'ISSUED' | 'CANCELLED' | 'EXPIRED' | 'USED' | 'NO_SHOW'

interface IssuedTicket {
  _id: string
  ticketCode: string
  seatCode: string
  status: TicketStatus
  checkInStatus: boolean
  checkedInAt: string | null
  ticketExpiredAt: string | null
  issuedAt: string
  booking: {
    _id: string
    bookingCode: string
    passengerName: string
    passengerPhone: string
    passengerEmail: string | null
    status: string
    paymentStatus: string
    total: number
  }
  trip: {
    _id: string
    tripCode: string
    departureDate: string
    actualDepartureTime: number
    actualArrivalTime: number | null
    status: string
  }
  route?: {
    _id?: string
    routeName?: string
    originProvinceName?: string
    destinationProvinceName?: string
  }
  bus?: {
    _id?: string
    busName?: string
    licensePlate?: string
    busType?: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface BusOption {
  _id: string
  busName: string
  licensePlate: string
}

const statusStyles: Record<TicketStatus, string> = {
  ISSUED: 'border-blue-200 bg-blue-50 text-blue-700',
  USED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CANCELLED: 'border-red-200 bg-red-50 text-red-700',
  EXPIRED: 'border-slate-200 bg-slate-100 text-slate-600',
  NO_SHOW: 'border-amber-200 bg-amber-50 text-amber-700',
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatMinutes(value?: number | null) {
  if (value === null || value === undefined) return '—'
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function TicketsPage() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<IssuedTicket[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [checkInStatus, setCheckInStatus] = useState('ALL')
  const [busId, setBusId] = useState('ALL')
  const [buses, setBuses] = useState<BusOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const fetchTickets = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await api.get('/partner/tickets', {
          params: {
            page,
            limit: 10,
            ...(search && { search }),
            ...(status !== 'ALL' && { status }),
            ...(checkInStatus !== 'ALL' && { checkInStatus }),
            ...(busId !== 'ALL' && { busId }),
          },
        })

        if (active) {
          setTickets(response.data.data?.tickets ?? [])
          setBuses(response.data.data?.filterOptions?.buses ?? [])
          setPagination(response.data.data?.pagination ?? null)
        }
      } catch {
        if (active) setError('Failed to load issued tickets. Please try again.')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchTickets()
    return () => {
      active = false
    }
  }, [busId, checkInStatus, page, search, status])

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setStatus('ALL')
    setCheckInStatus('ALL')
    setBusId('ALL')
    setPage(1)
  }

  const hasFilters = Boolean(
    search || status !== 'ALL' || checkInStatus !== 'ALL' || busId !== 'ALL',
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tickets</h2>
        <p className="mt-1 text-sm text-slate-500">
          View issued passenger tickets, trip information and check-in status.
        </p>
      </div>

      <Card>
        <CardContent>
          <form
            className="flex flex-col gap-3 lg:flex-row lg:items-center"
            onSubmit={handleSearch}
          >
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="pl-9"
                placeholder="Search ticket, booking, passenger, phone or trip..."
              />
            </div>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                setPage(1)
              }}
              className="h-9 rounded-md border bg-white px-3 text-sm text-slate-700 shadow-xs outline-none focus:border-blue-500"
            >
              <option value="ALL">All statuses</option>
              <option value="ISSUED">Issued</option>
              <option value="USED">Used</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
              <option value="NO_SHOW">No show</option>
            </select>
            <select
              value={checkInStatus}
              onChange={(event) => {
                setCheckInStatus(event.target.value)
                setPage(1)
              }}
              className="h-9 rounded-md border bg-white px-3 text-sm text-slate-700 shadow-xs outline-none focus:border-blue-500"
            >
              <option value="ALL">All check-ins</option>
              <option value="true">Checked in</option>
              <option value="false">Not checked in</option>
            </select>
            <select
              value={busId}
              onChange={(event) => {
                setBusId(event.target.value)
                setPage(1)
              }}
              className="h-9 rounded-md border bg-white px-3 text-sm text-slate-700 shadow-xs outline-none focus:border-blue-500"
              aria-label="Filter by bus"
            >
              <option value="ALL">All buses</option>
              {buses.map((bus) => (
                <option key={bus._id} value={bus._id}>
                  {bus.busName} ({bus.licensePlate})
                </option>
              ))}
            </select>
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
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-500">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white py-16 text-center">
          <Ticket size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-600">No issued tickets found</p>
          <p className="mt-1 text-sm text-slate-400">
            {hasFilters
              ? 'Try changing or clearing the current filters.'
              : 'Tickets will appear after a customer completes a paid booking.'}
          </p>
        </div>
      ) : (
        <Card className="gap-0 py-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="px-5">Ticket</TableHead>
                <TableHead>Passenger</TableHead>
                <TableHead>Trip & Route</TableHead>
                <TableHead>Bus</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Seat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead className="px-5 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket._id}>
                  <TableCell className="px-5">
                    <p className="font-semibold text-slate-900">{ticket.ticketCode}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {ticket.booking.bookingCode}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="flex items-center gap-1.5 font-medium text-slate-800">
                      <UserRound size={14} className="text-blue-600" />
                      {ticket.booking.passengerName}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {ticket.booking.passengerPhone}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-slate-800">{ticket.trip.tripCode}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      <MapPin size={12} />
                      {ticket.route?.originProvinceName || '—'} →{' '}
                      {ticket.route?.destinationProvinceName || '—'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-slate-800">
                      {ticket.bus?.busName || '—'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {ticket.bus?.licensePlate || '—'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="flex items-center gap-1.5 text-slate-700">
                      <CalendarDays size={14} className="text-blue-600" />
                      {formatDate(ticket.trip.departureDate)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatMinutes(ticket.trip.actualDepartureTime)}
                    </p>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    {ticket.seatCode}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusStyles[ticket.status]}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ticket.checkInStatus ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                        <CheckCircle2 size={15} />
                        Checked in
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Not checked in</span>
                    )}
                  </TableCell>
                  <TableCell className="px-5 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:bg-blue-50"
                      onClick={() => navigate(`/tickets/${ticket._id}`)}
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
                Showing {tickets.length} of {pagination.total} tickets · Page{' '}
                {pagination.page} of {Math.max(pagination.totalPages, 1)}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
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

export default TicketsPage
