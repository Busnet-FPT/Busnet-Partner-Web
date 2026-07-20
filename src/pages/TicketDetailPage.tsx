import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bus,
  CheckCircle2,
  Download,
  Mail,
  MapPin,
  Phone,
  QrCode,
  UserRound,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import api from '@/services/api'

type TicketStatus = 'ISSUED' | 'CANCELLED' | 'EXPIRED' | 'USED' | 'NO_SHOW'

interface TicketData {
  _id: string
  ticketCode: string
  seatCode: string
  qrCode: string | null
  pdfUrl: string | null
  checkInStatus: boolean
  checkedInAt: string | null
  ticketExpiredAt: string | null
  issuedAt: string
  status: TicketStatus
  createdAt: string
  updatedAt: string
}

interface BookingData {
  _id: string
  bookingCode: string
  passengerName: string
  passengerPhone: string
  passengerEmail: string | null
  pickupPoint_name: string
  pickupPoint_address: string
  pickupPoint_time: string
  dropoffPoint_name: string
  dropoffPoint_address: string
  dropoffPoint_time: string
  total: number
  status: string
  payment_status: string
  payment_amount: number
  payment_paymentType: string | null
  confirmedAt: string | null
  createdAt: string
}

interface TripData {
  _id: string
  tripCode: string
  departureDate: string
  actualDepartureTime: number
  actualArrivalTime: number | null
  status: string
}

interface ScheduleData {
  _id: string
  scheduleCode: string
  departureTime: string
  arrivalTime: string
  recurrenceType: string
}

interface RouteData {
  _id: string
  routeName: string
  origin_provinceName: string
  origin_districtName?: string
  origin_representativeAddress?: string
  destination_provinceName: string
  destination_districtName?: string
  destination_representativeAddress?: string
  distanceKm?: number
  estimatedDuration?: number
}

interface BusData {
  _id: string
  busName: string
  licensePlate: string
  busType: string
  totalSeats: number
  amenities?: string[]
}

interface TicketDetailResponse {
  ticket: TicketData
  booking: BookingData
  trip: TripData
  schedule: ScheduleData | null
  route: RouteData | null
  bus: BusData | null
}

const statusStyles: Record<TicketStatus, string> = {
  ISSUED: 'border-blue-200 bg-blue-50 text-blue-700',
  USED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CANCELLED: 'border-red-200 bg-red-50 text-red-700',
  EXPIRED: 'border-slate-200 bg-slate-100 text-slate-600',
  NO_SHOW: 'border-amber-200 bg-amber-50 text-amber-700',
}

function formatCurrency(value?: number) {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  )
}

function TicketDetailPage() {
  const navigate = useNavigate()
  const { ticketId } = useParams<{ ticketId: string }>()
  const [data, setData] = useState<TicketDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const fetchTicket = async () => {
      try {
        const response = await api.get(`/partner/tickets/${ticketId}`)
        if (active) setData(response.data.data)
      } catch {
        if (active) setError('Failed to load ticket details.')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchTicket()
    return () => {
      active = false
    }
  }, [ticketId])

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Loading ticket...</div>
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate('/tickets')}>
          <ArrowLeft size={16} />
          Back to Tickets
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || 'Ticket not found.'}
        </div>
      </div>
    )
  }

  const { ticket, booking, trip, schedule, route, bus } = data
  const qrIsImage = Boolean(ticket.qrCode?.match(/^(https?:\/\/|data:image\/)/i))

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/tickets')}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">Ticket Details</h2>
              <Badge className={statusStyles[ticket.status]}>
                {ticket.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="mt-1 font-mono text-sm text-slate-500">
              {ticket.ticketCode}
            </p>
          </div>
        </div>
        {ticket.pdfUrl && (
          <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
            <a href={ticket.pdfUrl} target="_blank" rel="noreferrer">
              <Download size={16} />
              Open Ticket PDF
            </a>
          </Button>
        )}
      </div>

      <Card className="border-blue-100 bg-linear-to-br from-blue-50 to-white">
        <CardContent className="grid gap-5 md:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Seat</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">{ticket.seatCode}</p>
          </div>
          <DetailItem label="Booking Code" value={booking.bookingCode} />
          <DetailItem label="Trip Code" value={trip.tripCode} />
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Check-in</p>
            <div className="mt-2">
              {ticket.checkInStatus ? (
                <span className="inline-flex items-center gap-2 font-semibold text-emerald-700">
                  <CheckCircle2 size={18} /> Checked in
                </span>
              ) : (
                <span className="font-medium text-slate-600">Not checked in</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin size={18} className="text-blue-600" />
              Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-base font-semibold text-slate-900">
              <span>{route?.origin_provinceName || 'Origin'}</span>
              <ArrowRight size={18} className="text-blue-600" />
              <span>{route?.destination_provinceName || 'Destination'}</span>
            </div>
            {route?.routeName && <p className="text-sm text-slate-500">{route.routeName}</p>}
            <div className="grid gap-5 border-t pt-5 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem label="Departure Date" value={formatDateTime(trip.departureDate)} />
              <DetailItem label="Departure Time" value={formatMinutes(trip.actualDepartureTime)} />
              <DetailItem label="Arrival Time" value={formatMinutes(trip.actualArrivalTime)} />
              <DetailItem label="Schedule" value={schedule?.scheduleCode || '—'} />
            </div>
            <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-emerald-600">Pickup</p>
                <p className="mt-1 font-medium text-slate-900">{booking.pickupPoint_name}</p>
                <p className="mt-1 text-xs text-slate-500">{booking.pickupPoint_address}</p>
                <p className="mt-1 text-xs font-medium text-slate-700">{booking.pickupPoint_time}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-blue-600">Drop-off</p>
                <p className="mt-1 font-medium text-slate-900">{booking.dropoffPoint_name}</p>
                <p className="mt-1 text-xs text-slate-500">{booking.dropoffPoint_address}</p>
                <p className="mt-1 text-xs font-medium text-slate-700">{booking.dropoffPoint_time}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode size={18} className="text-blue-600" />
              Ticket QR
            </CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-48 items-center justify-center">
            {ticket.qrCode ? (
              qrIsImage ? (
                <img
                  src={ticket.qrCode}
                  alt={`QR code for ${ticket.ticketCode}`}
                  className="h-44 w-44 rounded-lg border bg-white object-contain p-2"
                />
              ) : (
                <div className="w-full rounded-lg bg-slate-50 p-4 text-center">
                  <QrCode size={48} className="mx-auto text-slate-300" />
                  <p className="mt-3 break-all font-mono text-xs text-slate-600">
                    {ticket.qrCode}
                  </p>
                </div>
              )
            ) : (
              <div className="text-center text-slate-400">
                <QrCode size={48} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm">QR code not available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound size={18} className="text-blue-600" />
              Passenger & Booking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="font-semibold text-slate-900">{booking.passengerName}</p>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <p className="flex items-center gap-2"><Phone size={14} />{booking.passengerPhone}</p>
                {booking.passengerEmail && (
                  <p className="flex items-center gap-2"><Mail size={14} />{booking.passengerEmail}</p>
                )}
              </div>
            </div>
            <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
              <DetailItem label="Booking Status" value={booking.status.replaceAll('_', ' ')} />
              <DetailItem label="Payment Status" value={booking.payment_status} />
              <DetailItem label="Booking Total" value={formatCurrency(booking.total)} />
              <DetailItem label="Payment Method" value={booking.payment_paymentType || '—'} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus size={18} className="text-blue-600" />
              Bus & Ticket Status
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <DetailItem label="Bus" value={bus?.busName || '—'} />
            <DetailItem label="License Plate" value={bus?.licensePlate || '—'} />
            <DetailItem label="Bus Type" value={bus?.busType || '—'} />
            <DetailItem label="Trip Status" value={trip.status} />
            <DetailItem label="Issued At" value={formatDateTime(ticket.issuedAt)} />
            <DetailItem label="Expires At" value={formatDateTime(ticket.ticketExpiredAt)} />
            <DetailItem label="Checked In At" value={formatDateTime(ticket.checkedInAt)} />
            <DetailItem label="Ticket ID" value={ticket._id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default TicketDetailPage
