import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bus,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  LoaderCircle,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  ReceiptText,
  Ticket,
  UserRound,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import api from '@/services/api'

type CancellationAction = 'APPROVE' | 'REJECT'

interface BookingDetailResponse {
  booking: {
    _id: string
    bookingCode: string
    status: string
    createdAt: string
    confirmedAt?: string | null
    expiresAt?: string | null
    updatedAt: string
  }
  passenger: {
    name: string
    phone: string
    email?: string | null
    customerNote?: string | null
  }
  journey: {
    pickupPoint: {
      name: string
      address: string
      time: string
    }
    dropoffPoint: {
      name: string
      address: string
      time: string
    }
    trip: {
      _id: string
      tripCode: string
      status: string
      departureDate: string
      actualDepartureTime: number
      actualArrivalTime?: number | null
    }
    schedule?: {
      _id: string
      scheduleCode: string
      departureTime?: string
      arrivalTime?: string
      recurrenceType?: string
      operationNotes?: string
      isActive?: boolean
    } | null
    route?: {
      _id: string
      routeName?: string
      origin_provinceName?: string
      origin_districtName?: string
      origin_representativeAddress?: string
      destination_provinceName?: string
      destination_districtName?: string
      destination_representativeAddress?: string
      distanceKm?: number
      estimatedDuration?: number
    } | null
    bus?: {
      _id: string
      busName?: string
      licensePlate?: string
      busType?: string
      totalSeats?: number
      amenities?: string[]
      status?: string
    } | null
  }
  seats: Array<{
    _id: string
    seatCode: string
    seatType: string
    price: number
    discount: number
    finalPrice: number
    passengerName?: string
  }>
  payment: {
    status: string
    total: number
    paidAmount: number
    paymentType?: string | null
    transaction?: {
      _id: string
      status: string
      amount: number
      currency?: string
      gateway?: string
      transactionDate?: string | null
      referenceCode?: string | null
      description?: string | null
    } | null
  }
  tickets: Array<{
    _id: string
    seatCode: string
    ticketCode: string
    checkInStatus: boolean
    checkedInAt?: string | null
    ticketExpiredAt?: string | null
    issuedAt?: string | null
    status: string
  }>
  cancellation: {
    reason?: string | null
    partnerResponse?: string | null
    decision?: string | null
    respondedAt?: string | null
    refundAmount?: number
    refundPolicy?: {
      refundPercentage?: number
      cancellationPolicy?: string | null
      refundPolicy?: string | null
    } | null
    cancelledAt?: string | null
  }
}

interface CancellationResult {
  decision: 'APPROVED' | 'REJECTED'
  status: string
  releasedSeatCodes?: string[]
  cancelledTicketCount?: number
  refund?: {
    amount: number
    percentage: number
    status: string
  }
}

function getApiErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response
  ) {
    const data = error.response.data as {
      message?: string
      errors?: Array<{ msg?: string }>
    }
    return data.message || data.errors?.[0]?.msg || 'Unable to process this request.'
  }

  return 'Unable to process this request. Please try again.'
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

function statusStyle(status?: string) {
  switch (status) {
    case 'PAID':
    case 'CONFIRMED':
    case 'COMPLETED':
    case 'ISSUED':
    case 'USED':
    case 'APPROVED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'PENDING':
    case 'PENDING_PAYMENT':
    case 'CANCEL_REQUESTED':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'CANCELLED':
    case 'CANCELLED_BY_CUSTOMER':
    case 'CANCELLED_BY_OPERATOR':
    case 'FAILED':
    case 'REJECTED':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'REFUNDED':
      return 'border-violet-200 bg-violet-50 text-violet-700'
    default:
      return 'border-slate-200 bg-slate-100 text-slate-600'
  }
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-slate-900">{value || '—'}</div>
    </div>
  )
}

function BookingDetailPage() {
  const navigate = useNavigate()
  const { bookingId } = useParams<{ bookingId: string }>()
  const [data, setData] = useState<BookingDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellationAction, setCancellationAction] =
    useState<CancellationAction | null>(null)
  const [cancellationResponse, setCancellationResponse] = useState('')
  const [refundReference, setRefundReference] = useState('')
  const [processingCancellation, setProcessingCancellation] = useState(false)
  const [cancellationError, setCancellationError] = useState('')
  const [cancellationSuccess, setCancellationSuccess] = useState('')

  useEffect(() => {
    let active = true

    const fetchBooking = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await api.get(`/partner/bookings/${bookingId}`)
        if (active) setData(response.data.data)
      } catch {
        if (active) {
          setData(null)
          setError('Failed to load this booking. It may not exist or you may not have access.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchBooking()
    return () => {
      active = false
    }
  }, [bookingId])

  const openCancellationDialog = (action: CancellationAction) => {
    setCancellationAction(action)
    setCancellationResponse('')
    setRefundReference('')
    setCancellationError('')
  }

  const closeCancellationDialog = () => {
    if (processingCancellation) return
    setCancellationAction(null)
    setCancellationError('')
  }

  const handleCancellationResponse = async () => {
    if (!cancellationAction || !bookingId) return

    const responseText = cancellationResponse.trim()
    if (cancellationAction === 'REJECT' && !responseText) {
      setCancellationError('A rejection reason is required.')
      return
    }

    setProcessingCancellation(true)
    setCancellationError('')
    setCancellationSuccess('')

    try {
      const response = await api.patch(
        `/partner/bookings/${bookingId}/cancellation-response`,
        {
          decision: cancellationAction,
          ...(responseText && { response: responseText }),
          ...(refundReference.trim() && {
            refundReference: refundReference.trim(),
          }),
        },
      )
      const result = response.data.data as CancellationResult
      const refreshed = await api.get(`/partner/bookings/${bookingId}`)
      setData(refreshed.data.data)

      if (result.decision === 'APPROVED') {
        setCancellationSuccess(
          `Cancellation approved. ${result.cancelledTicketCount ?? 0} ticket(s) cancelled, ${result.releasedSeatCodes?.length ?? 0} seat(s) released and ${formatCurrency(result.refund?.amount ?? 0)} refunded.`,
        )
      } else {
        setCancellationSuccess(
          'Cancellation request rejected. The booking, seats and issued tickets remain active.',
        )
      }
      setCancellationAction(null)
      setCancellationResponse('')
      setRefundReference('')
    } catch (requestError) {
      setCancellationError(getApiErrorMessage(requestError))
    } finally {
      setProcessingCancellation(false)
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Loading booking...</div>
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate('/bookings')}>
          <ArrowLeft size={16} />
          Back to Bookings
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || 'Booking not found.'}
        </div>
      </div>
    )
  }

  const { booking, passenger, journey, seats, payment, tickets, cancellation } = data
  const { trip, schedule, route, bus, pickupPoint, dropoffPoint } = journey
  const hasCancellation = Boolean(
    cancellation.reason ||
      cancellation.partnerResponse ||
      cancellation.decision ||
      cancellation.cancelledAt,
  )

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            aria-label="Back to bookings"
            onClick={() => navigate('/bookings')}
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">Booking Details</h2>
              <Badge className={statusStyle(booking.status)}>
                {formatLabel(booking.status)}
              </Badge>
            </div>
            <p className="mt-1 font-mono text-sm text-slate-500">
              {booking.bookingCode}
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>Booked {formatDateTime(booking.createdAt)}</p>
          <p className="mt-1">Last updated {formatDateTime(booking.updatedAt)}</p>
        </div>
      </div>

      {cancellationSuccess && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
          <p>{cancellationSuccess}</p>
        </div>
      )}

      <Card className="border-blue-100 bg-linear-to-br from-blue-50 to-white">
        <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem
            label="Booking Status"
            value={
              <Badge className={statusStyle(booking.status)}>
                {formatLabel(booking.status)}
              </Badge>
            }
          />
          <DetailItem
            label="Payment Status"
            value={
              <Badge className={statusStyle(payment.status)}>
                {formatLabel(payment.status)}
              </Badge>
            }
          />
          <DetailItem label="Seats" value={`${seats.length} · ${seats.map((seat) => seat.seatCode).join(', ') || 'None'}`} />
          <DetailItem label="Booking Total" value={formatCurrency(payment.total)} />
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
            <div>
              <div className="flex flex-wrap items-center gap-3 text-lg font-semibold text-slate-900">
                <span>{route?.origin_provinceName || 'Origin'}</span>
                <ArrowRight size={18} className="text-blue-600" />
                <span>{route?.destination_provinceName || 'Destination'}</span>
              </div>
              {route?.routeName && (
                <p className="mt-1 text-sm text-slate-500">{route.routeName}</p>
              )}
            </div>

            <div className="grid gap-5 border-y py-5 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem label="Trip Code" value={trip.tripCode} />
              <DetailItem label="Departure Date" value={formatDate(trip.departureDate)} />
              <DetailItem label="Departure" value={formatMinutes(trip.actualDepartureTime)} />
              <DetailItem label="Arrival" value={formatMinutes(trip.actualArrivalTime)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-xs font-semibold uppercase text-emerald-700">Pickup</p>
                <p className="mt-2 font-semibold text-slate-900">{pickupPoint.name}</p>
                <p className="mt-1 text-sm text-slate-500">{pickupPoint.address}</p>
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Clock3 size={14} /> {pickupPoint.time}
                </p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-xs font-semibold uppercase text-blue-700">Drop-off</p>
                <p className="mt-2 font-semibold text-slate-900">{dropoffPoint.name}</p>
                <p className="mt-1 text-sm text-slate-500">{dropoffPoint.address}</p>
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Clock3 size={14} /> {dropoffPoint.time}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound size={18} className="text-blue-600" />
              Passenger
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-base font-semibold text-slate-900">{passenger.name}</p>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <Phone size={15} className="text-blue-600" />
                  {passenger.phone}
                </p>
                {passenger.email && (
                  <p className="flex items-center gap-2 break-all">
                    <Mail size={15} className="shrink-0 text-blue-600" />
                    {passenger.email}
                  </p>
                )}
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="flex items-center gap-2 text-xs font-medium uppercase text-slate-400">
                <MessageSquareText size={14} /> Customer note
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                {passenger.customerNote || 'No note provided.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus size={18} className="text-blue-600" />
              Trip, Schedule & Bus
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <DetailItem label="Trip Status" value={formatLabel(trip.status)} />
            <DetailItem label="Schedule" value={schedule?.scheduleCode || '—'} />
            <DetailItem label="Bus" value={bus?.busName || '—'} />
            <DetailItem label="License Plate" value={bus?.licensePlate || '—'} />
            <DetailItem label="Bus Type" value={bus?.busType || '—'} />
            <DetailItem
              label="Distance"
              value={route?.distanceKm !== undefined ? `${route.distanceKm} km` : '—'}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays size={18} className="text-blue-600" />
              Booking Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <DetailItem label="Created At" value={formatDateTime(booking.createdAt)} />
            <DetailItem label="Confirmed At" value={formatDateTime(booking.confirmedAt)} />
            <DetailItem label="Payment Expires At" value={formatDateTime(booking.expiresAt)} />
            <DetailItem label="Cancelled At" value={formatDateTime(cancellation.cancelledAt)} />
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-5">
          <CardTitle className="flex items-center gap-2">
            <ReceiptText size={18} className="text-blue-600" />
            Assigned Seats
          </CardTitle>
        </CardHeader>
        {seats.length === 0 ? (
          <CardContent className="py-10 text-center text-sm text-slate-500">
            No assigned seats found for this booking.
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="px-6">Seat</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Passenger</TableHead>
                <TableHead className="text-right">Base Price</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="px-6 text-right">Final Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seats.map((seat) => (
                <TableRow key={seat._id}>
                  <TableCell className="px-6 font-semibold text-blue-700">
                    {seat.seatCode}
                  </TableCell>
                  <TableCell>{formatLabel(seat.seatType)}</TableCell>
                  <TableCell>{seat.passengerName || passenger.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(seat.price)}</TableCell>
                  <TableCell className="text-right text-red-600">
                    {seat.discount > 0 ? `−${formatCurrency(seat.discount)}` : formatCurrency(0)}
                  </TableCell>
                  <TableCell className="px-6 text-right font-semibold text-slate-900">
                    {formatCurrency(seat.finalPrice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={18} className="text-blue-600" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Payment Status"
                value={
                  <Badge className={statusStyle(payment.status)}>
                    {formatLabel(payment.status)}
                  </Badge>
                }
              />
              <DetailItem label="Payment Method" value={formatLabel(payment.paymentType)} />
              <DetailItem label="Booking Total" value={formatCurrency(payment.total)} />
              <DetailItem label="Paid Amount" value={formatCurrency(payment.paidAmount)} />
            </div>
            {payment.transaction && (
              <div className="grid gap-5 border-t pt-5 sm:grid-cols-2">
                <DetailItem label="Gateway" value={formatLabel(payment.transaction.gateway)} />
                <DetailItem
                  label="Transaction Status"
                  value={formatLabel(payment.transaction.status)}
                />
                <DetailItem
                  label="Transaction Date"
                  value={formatDateTime(payment.transaction.transactionDate)}
                />
                <DetailItem
                  label="Reference Code"
                  value={payment.transaction.referenceCode || '—'}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket size={18} className="text-blue-600" />
              Issued Tickets
              <Badge variant="outline" className="ml-auto">
                {tickets.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <div className="rounded-lg border border-dashed py-8 text-center">
                <Ticket size={36} className="mx-auto text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  No tickets have been issued for this booking.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <button
                    key={ticket._id}
                    type="button"
                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {ticket.ticketCode}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Seat {ticket.seatCode} · Issued {formatDateTime(ticket.issuedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge className={statusStyle(ticket.status)}>
                        {formatLabel(ticket.status)}
                      </Badge>
                      <ArrowRight size={16} className="text-slate-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {hasCancellation && (
        <Card className="border-orange-200 bg-orange-50/40">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <CircleDollarSign size={18} className="text-orange-600" />
                Cancellation Information
              </CardTitle>
              {booking.status === 'CANCEL_REQUESTED' && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => openCancellationDialog('REJECT')}
                  >
                    <XCircle size={16} />
                    Reject
                  </Button>
                  <Button
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => openCancellationDialog('APPROVE')}
                  >
                    <CheckCircle2 size={16} />
                    Approve Cancellation
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem label="Customer Reason" value={cancellation.reason || '—'} />
            <DetailItem label="Partner Response" value={cancellation.partnerResponse || '—'} />
            <DetailItem
              label="Decision"
              value={
                cancellation.decision ? (
                  <Badge className={statusStyle(cancellation.decision)}>
                    {formatLabel(cancellation.decision)}
                  </Badge>
                ) : (
                  'Awaiting response'
                )
              }
            />
            <DetailItem label="Refund Amount" value={formatCurrency(cancellation.refundAmount)} />
          </CardContent>
        </Card>
      )}

      <Dialog
        open={cancellationAction !== null}
        onOpenChange={(open) => !open && closeCancellationDialog()}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {cancellationAction === 'APPROVE'
                ? 'Approve Cancellation Request'
                : 'Reject Cancellation Request'}
            </DialogTitle>
            <DialogDescription>
              {cancellationAction === 'APPROVE'
                ? 'The backend will validate the departure time and refund policy, cancel issued tickets, release eligible seats and record the applicable refund.'
                : 'The booking will return to Confirmed. Assigned seats and issued tickets will remain active.'}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-slate-50 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Booking</span>
              <span className="font-mono font-semibold text-slate-900">
                {booking.bookingCode}
              </span>
            </div>
            <div className="mt-2 flex items-start justify-between gap-4">
              <span className="shrink-0 text-slate-500">Customer reason</span>
              <span className="text-right font-medium text-slate-800">
                {cancellation.reason || 'No reason provided'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancellation-response">
              Partner response {cancellationAction === 'REJECT' && '*'}
            </Label>
            <Textarea
              id="cancellation-response"
              value={cancellationResponse}
              maxLength={1000}
              disabled={processingCancellation}
              aria-invalid={Boolean(
                cancellationError &&
                  cancellationAction === 'REJECT' &&
                  !cancellationResponse.trim(),
              )}
              onChange={(event) => {
                setCancellationResponse(event.target.value)
                setCancellationError('')
              }}
              placeholder={
                cancellationAction === 'APPROVE'
                  ? 'Optional message to the customer...'
                  : 'Explain why this cancellation cannot be approved...'
              }
              className="min-h-24 resize-y"
            />
            <p className="text-right text-xs text-slate-400">
              {cancellationResponse.length}/1000
            </p>
          </div>

          {cancellationAction === 'APPROVE' && (
            <div className="space-y-2">
              <Label htmlFor="refund-reference">Refund reference (optional)</Label>
              <Input
                id="refund-reference"
                value={refundReference}
                maxLength={200}
                disabled={processingCancellation}
                onChange={(event) => {
                  setRefundReference(event.target.value)
                  setCancellationError('')
                }}
                placeholder="Bank or internal refund reference"
              />
            </div>
          )}

          {cancellationError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {cancellationError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={processingCancellation}
              onClick={closeCancellationDialog}
            >
              Keep Reviewing
            </Button>
            <Button
              type="button"
              disabled={processingCancellation}
              className={
                cancellationAction === 'APPROVE'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }
              onClick={handleCancellationResponse}
            >
              {processingCancellation ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  Processing...
                </>
              ) : cancellationAction === 'APPROVE' ? (
                <>
                  <CheckCircle2 size={16} />
                  Confirm Approval
                </>
              ) : (
                <>
                  <XCircle size={16} />
                  Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BookingDetailPage
