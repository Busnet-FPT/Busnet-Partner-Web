import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  MapPin,
  Bus,
  Route,
  Banknote,
  Edit,
  Trash2,
  ArrowRight,
  CalendarDays,
  FileText,
} from 'lucide-react'
import api from '@/services/api'

interface StopPoint {
  _id: string
  name: string
  address: string
  time: string
  orderIndex: number
}

interface ScheduleDetail {
  _id: string
  scheduleCode: string
  departureTime: string
  arrivalTime: string
  basePrice: number
  recurrenceType: string
  recurrenceRule: {
    frequency: string
    interval: number
    daysOfWeek: number[]
    daysOfMonth: number[]
    startDate: string
    endDate: string | null
  }
  operationNotes: string
  isActive: boolean
  routeId?: {
    _id: string
    routeName: string
    origin_provinceName: string
    destination_provinceName: string
    distanceKm?: number
    estimatedDuration?: string
  }
  busId?: {
    _id: string
    busName: string
    licensePlate: string
    busType: string
    totalSeats: number
  }
  pickupPoints: StopPoint[]
  dropoffPoints: StopPoint[]
  createdAt: string
  updatedAt: string
}

function formatDate(value?: string) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function ScheduleDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [schedule, setSchedule] = useState<ScheduleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/partner/schedules/${id}`)
        setSchedule(res.data.data)
      } catch {
        setError('Failed to load schedule details.')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/partner/schedules/${id}`)
      navigate('/schedules')
    } catch {
      setError('Failed to delete schedule.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading schedule...
      </div>
    )
  }

  if (!schedule) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate('/schedules')}>
          <ArrowLeft size={16} />
          Back to Schedules
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || 'Schedule not found.'}
        </div>
      </div>
    )
  }

  const formatPrice = (val: number) => val.toLocaleString('vi-VN')

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/schedules')}
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Schedule Details</h2>
              <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                {schedule.recurrenceType}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {schedule.scheduleCode}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="text-emerald-700 hover:bg-emerald-50"
            onClick={() => navigate(`/schedules/${id}/ticket-prices`)}
          >
            <Banknote size={16} />
            Set Ticket Price
          </Button>
          <Button
            variant="outline"
            className="text-blue-600 hover:bg-blue-50"
            onClick={() => navigate(`/schedules/${id}/edit`)}
          >
            <Edit size={16} />
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:bg-red-50"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 size={16} />
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Route & Time Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock size={18} className="text-blue-600" />
            Schedule Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-slate-400">
                Route
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <Route size={14} className="text-blue-600" />
                {schedule.routeId
                  ? `${schedule.routeId.origin_provinceName} → ${schedule.routeId.destination_provinceName}`
                  : '—'}
              </div>
              {schedule.routeId?.routeName && (
                <p className="text-xs text-slate-500">
                  {schedule.routeId.routeName}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-slate-400">
                Time
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <Clock size={14} className="text-blue-600" />
                {schedule.departureTime}
                <ArrowRight size={12} className="text-slate-400" />
                {schedule.arrivalTime}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-slate-400">
                Base Price
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <Banknote size={14} className="text-blue-600" />
                {formatPrice(schedule.basePrice)} VND
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-slate-400">
                Recurrence
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <CalendarDays size={14} className="text-blue-600" />
                {schedule.recurrenceType}
                {schedule.recurrenceRule?.interval > 1 &&
                  ` (every ${schedule.recurrenceRule.interval})`}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-slate-400">
                Start Date
              </p>
              <p className="text-sm font-medium text-slate-900">
                {formatDate(schedule.recurrenceRule?.startDate)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-slate-400">
                End Date
              </p>
              <p className="text-sm font-medium text-slate-900">
                {schedule.recurrenceRule?.endDate
                  ? formatDate(schedule.recurrenceRule.endDate)
                  : 'No end date'}
              </p>
            </div>

            {schedule.operationNotes && (
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs font-medium uppercase text-slate-400">
                  Operation Notes
                </p>
                <div className="flex items-start gap-2 text-sm text-slate-700">
                  <FileText size={14} className="mt-0.5 text-blue-600" />
                  {schedule.operationNotes}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bus Info */}
      {schedule.busId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bus size={18} className="text-blue-600" />
              Assigned Bus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-slate-400">
                  Bus Name
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {schedule.busId.busName}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-slate-400">
                  License Plate
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {schedule.busId.licensePlate}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-slate-400">
                  Type
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {schedule.busId.busType}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-slate-400">
                  Total Seats
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {schedule.busId.totalSeats}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stops */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRight size={18} className="text-emerald-600" />
              Pickup Points ({schedule.pickupPoints.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {schedule.pickupPoints.length === 0 ? (
              <p className="text-sm text-slate-400">No pickup points</p>
            ) : (
              <ol className="space-y-3">
                {schedule.pickupPoints.map((p, i) => (
                  <li
                    key={p._id}
                    className="rounded-lg border bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">
                        {i + 1}. {p.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-emerald-200 text-emerald-700"
                      >
                        {p.time}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{p.address}</p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin size={18} className="text-blue-600" />
              Dropoff Points ({schedule.dropoffPoints.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {schedule.dropoffPoints.length === 0 ? (
              <p className="text-sm text-slate-400">No dropoff points</p>
            ) : (
              <ol className="space-y-3">
                {schedule.dropoffPoints.map((p, i) => (
                  <li
                    key={p._id}
                    className="rounded-lg border bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">
                        {i + 1}. {p.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-blue-200 text-blue-700"
                      >
                        {p.time}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{p.address}</p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span>Created: {formatDate(schedule.createdAt)}</span>
        <span>Last updated: {formatDate(schedule.updatedAt)}</span>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete schedule{' '}
              <span className="font-semibold text-slate-900">
                {schedule.scheduleCode}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDelete(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ScheduleDetailPage
