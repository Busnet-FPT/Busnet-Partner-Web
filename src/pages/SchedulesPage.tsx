import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, CalendarClock, Clock, MapPin, Bus } from 'lucide-react'
import api from '@/services/api'

interface Schedule {
  _id: string
  scheduleCode: string
  departureTime: string
  arrivalTime: string
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

function SchedulesPage() {
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await api.get('/partner/schedules')
        setSchedules(res.data.data?.schedules || [])
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchSchedules()
  }, [])

  const formatPrice = (val: number) => val.toLocaleString('vi-VN')

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Schedules</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage recurring departure and arrival schedules.
          </p>
        </div>
        <Button
          className="bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => navigate('/schedules/add')}
        >
          <PlusCircle size={16} />
          Add Schedule
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Loading...</div>
      ) : schedules.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white py-16 text-center">
          <CalendarClock size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No schedules yet.</p>
          <p className="mt-1 text-sm text-slate-400">
            Create your first schedule to start generating trips.
          </p>
          <Button
            className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => navigate('/schedules/add')}
          >
            <PlusCircle size={16} />
            Add Schedule
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => (
            <div
              key={s._id}
              className="flex items-center justify-between rounded-xl border bg-white px-5 py-4 shadow-xs transition hover:shadow-sm"
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
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                      {s.recurrenceType}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {s.departureTime} → {s.arrivalTime}
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

              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900">
                  {formatPrice(s.basePrice)} <span className="text-xs font-normal text-slate-400">VND</span>
                </div>
                <span className="text-xs text-slate-400">{s.scheduleCode}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SchedulesPage
