import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  PlusCircle,
  CalendarClock,
  Clock,
  MapPin,
  Bus,
  Trash2,
  Eye,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import api from '@/services/api'

interface Schedule {
  _id: string
  scheduleCode: string
  departureTime: string
  arrivalTime: string
  arrivalDayOffset?: number
  basePrice: number
  recurrenceType: string
  isActive: boolean
  routeId?: {
    _id: string
    routeName: string
    origin_provinceName: string
    destination_provinceName: string
  }
  busId?: {
    _id: string
    busName: string
    licensePlate: string
    busType: string
    totalSeats: number
  }
  pickupPoints?: { name: string; time: string }[]
  dropoffPoints?: { name: string; time: string }[]
  createdAt: string
}

const RECURRENCE_BADGE_STYLES: Record<string, string> = {
  DAILY: 'border-blue-200 bg-blue-50 text-blue-700',
  WEEKLY: 'border-violet-200 bg-violet-50 text-violet-700',
  MONTHLY: 'border-amber-200 bg-amber-50 text-amber-700',
  ONCE: 'border-slate-200 bg-slate-50 text-slate-700',
}

function SchedulesPage() {
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await api.get('/partner/schedules')
        setSchedules(res.data.data?.schedules || [])
      } catch (err: any) {
        setLoadError(err.response?.data?.message || 'Failed to load schedules.')
      } finally {
        setLoading(false)
      }
    }
    fetchSchedules()
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await api.delete(`/partner/schedules/${deleteTarget._id}`)
      setSchedules((prev) => prev.filter((s) => s._id !== deleteTarget._id))
      setDeleteTarget(null)
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Failed to delete schedule.')
    } finally {
      setDeleting(false)
    }
  }

  const formatPrice = (val: number) => val.toLocaleString('vi-VN')

  return (
    <div>
      <div className="motion-safe:animate-in fade-in slide-in-from-bottom-1 mb-6 flex items-center justify-between duration-500 fill-mode-both">
        <div>
          <h2 className="text-2xl font-bold">Schedules</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage recurring departure and arrival schedules.
          </p>
        </div>
        <Button
          className="bg-blue-600 text-white transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
          onClick={() => navigate('/schedules/add')}
        >
          <PlusCircle size={16} />
          Add Schedule
        </Button>
      </div>

      {loadError && (
        <div className="motion-safe:animate-in fade-in slide-in-from-top-1 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 duration-300">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border bg-white px-5 py-4 shadow-xs">
              <div className="flex items-start gap-4">
                <div className="size-10 animate-pulse rounded-lg bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-64 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
              <div className="h-8 w-20 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <div className="motion-safe:animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-dashed bg-white py-16 text-center duration-500 fill-mode-both">
          <CalendarClock size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No schedules yet.</p>
          <p className="mt-1 text-sm text-slate-400">
            Create your first schedule to start generating trips.
          </p>
          <Button
            className="mt-4 bg-blue-600 text-white transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
            onClick={() => navigate('/schedules/add')}
          >
            <PlusCircle size={16} />
            Add Schedule
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((s, i) => (
            <div
              key={s._id}
              className="motion-safe:animate-in fade-in slide-in-from-bottom-2 flex items-center justify-between rounded-xl border bg-white px-5 py-4 shadow-xs duration-500 fill-mode-both transition-shadow hover:shadow-md"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <CalendarClock size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {s.routeId
                        ? `${s.routeId.origin_provinceName} → ${s.routeId.destination_provinceName}`
                        : s.scheduleCode}
                    </span>
                    <Badge className={RECURRENCE_BADGE_STYLES[s.recurrenceType] ?? 'border-blue-200 bg-blue-50 text-blue-700'}>
                      {s.recurrenceType}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {s.departureTime} → {s.arrivalTime}
                      {!!s.arrivalDayOffset && (
                        <span className="text-blue-600"> (+{s.arrivalDayOffset} day{s.arrivalDayOffset > 1 ? 's' : ''})</span>
                      )}
                    </span>
                    {s.busId && (
                      <span className="flex items-center gap-1">
                        <Bus size={12} />
                        {s.busId.busName} ({s.busId.licensePlate})
                      </span>
                    )}
                    {s.pickupPoints && s.pickupPoints.length > 0 && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {s.pickupPoints.length} pickup
                        {s.pickupPoints.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900">
                    {formatPrice(s.basePrice)}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      VND
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {s.scheduleCode}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-blue-600 transition-all hover:-translate-y-0.5 hover:bg-blue-50 active:translate-y-0"
                  onClick={() => navigate(`/schedules/${s._id}`)}
                >
                  <Eye size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-red-500 transition-all hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-600 active:translate-y-0"
                  onClick={() => {
                    setDeleteTarget(s)
                    setDeleteError(null)
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete schedule{' '}
              <span className="font-semibold text-slate-900">
                {deleteTarget?.scheduleCode}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {deleteError}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
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

export default SchedulesPage
