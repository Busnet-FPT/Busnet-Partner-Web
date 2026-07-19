import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PlusCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Info,
  MapPin,
  Bus,
  ClipboardCheck,
  Trash2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  Wallet,
  AlertCircle,
  Route as RouteIcon,
} from 'lucide-react'
import api from '@/services/api'
import { cn } from '@/lib/utils'
import { getStationsForProvince } from '@/lib/busStations'

interface RouteOption {
  _id: string
  routeName: string
  origin_province: string
  origin_provinceName: string
  destination_province: string
  destination_provinceName: string
}

interface BusOption {
  _id: string
  busName: string
  licensePlate: string
  busType: string
  totalSeats: number
}

interface StopPoint {
  name: string
  address: string
  time: string
}

const STEPS = [
  { label: 'Trip Information', icon: Info },
  { label: 'Route & Stops', icon: MapPin },
  { label: 'Bus & Driver', icon: Bus },
  { label: 'Review & Confirm', icon: ClipboardCheck },
]

const RECURRENCE_OPTIONS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'ONCE', label: 'One-time only' },
]

// 0-indexed Sunday=0..Saturday=6, matching JS Date.getDay() and the backend's
// recurrenceRule.daysOfWeek validation range.
const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]

// Local calendar date ("YYYY-MM-DD") — NOT toISOString(), which converts to
// UTC first and would report the wrong day for part of the evening/early
// morning in timezones ahead of UTC (e.g. Vietnam, UTC+7).
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
// Local wall-clock time ("HH:mm"), same reasoning — departureTime is a plain
// local HH:mm string the partner picks, so "now" must be local too.
const nowTimeStr = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Maps each stop's index to the earlier stop it conflicts with — checked
// independently on time and on location, since either alone is invalid:
// 'exact'    same name + address + time (a stray double "Add Stop" click or
//            a quick-fill picked twice)
// 'location' same name + address but a different time (the same physical
//            stop can't appear twice in one schedule, no matter the time)
// 'time'     same time but a different place (a bus can't be at two stops
//            at once)
interface StopConflict {
  firstIndex: number
  kind: 'exact' | 'location' | 'time'
}

const findStopConflicts = (points: StopPoint[]): Record<number, StopConflict> => {
  const seenByTime = new Map<string, number>()
  const seenByLocation = new Map<string, number>()
  const conflicts: Record<number, StopConflict> = {}

  points.forEach((p, i) => {
    const timeKey = p.time || null
    const locationKey = p.name && p.address ? `${p.name.trim().toLowerCase()}|${p.address.trim().toLowerCase()}` : null

    const timeMatch = timeKey ? seenByTime.get(timeKey) : undefined
    const locationMatch = locationKey ? seenByLocation.get(locationKey) : undefined

    if (locationMatch !== undefined && locationMatch === timeMatch) {
      conflicts[i] = { firstIndex: locationMatch, kind: 'exact' }
    } else if (locationMatch !== undefined) {
      conflicts[i] = { firstIndex: locationMatch, kind: 'location' }
    } else if (timeMatch !== undefined) {
      conflicts[i] = { firstIndex: timeMatch, kind: 'time' }
    }

    if (timeKey && timeMatch === undefined) seenByTime.set(timeKey, i)
    if (locationKey && locationMatch === undefined) seenByLocation.set(locationKey, i)
  })

  return conflicts
}

// Pickup points are assumed to happen on the departure day (day 0), dropoff
// points on the arrival day (day arrivalDayOffset). Same-day schedule
// (offset 0): pickups must fall in [departure, arrival), dropoffs in
// (departure, arrival], and every dropoff must be strictly after the latest
// pickup — a single bus can't be picking up and dropping off at once.
// Multi-day schedule (offset >= 1): pickups just need to be at/after
// departure ("day 0") and dropoffs at/before arrival ("day N") — the two
// groups can never collide since they're on different calendar days.
const findStopWindowErrors = (
  pickupPoints: StopPoint[],
  dropoffPoints: StopPoint[],
  departureTime: string,
  arrivalTime: string,
  arrivalDayOffset: number
): Record<string, string> => {
  const errors: Record<string, string> = {}
  if (!departureTime || !arrivalTime) return errors

  pickupPoints.forEach((p, i) => {
    if (!p.time) return
    if (p.time < departureTime) {
      errors[`pickup-${i}-window`] = `Cannot be before departure (${departureTime})`
    } else if (!arrivalDayOffset && p.time >= arrivalTime) {
      errors[`pickup-${i}-window`] = `Must be before arrival (${arrivalTime})`
    }
  })

  if (!arrivalDayOffset) {
    let maxPickupTime = ''
    pickupPoints.forEach((p) => {
      if (p.time && p.time > maxPickupTime) maxPickupTime = p.time
    })

    dropoffPoints.forEach((p, i) => {
      if (!p.time) return
      if (p.time <= departureTime || p.time > arrivalTime) {
        errors[`dropoff-${i}-window`] = `Must be between departure (${departureTime}) and arrival (${arrivalTime})`
      } else if (maxPickupTime && p.time <= maxPickupTime) {
        errors[`dropoff-${i}-window`] = `Must be after the last pickup time (${maxPickupTime})`
      }
    })
  } else {
    dropoffPoints.forEach((p, i) => {
      if (!p.time) return
      if (p.time > arrivalTime) {
        errors[`dropoff-${i}-window`] = `Must be at or before arrival (${arrivalTime}) on day ${arrivalDayOffset + 1} of the trip`
      }
    })
  }

  return errors
}

// Small inline error, rendered directly under the field it belongs to.
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
      <AlertCircle size={12} />
      {message}
    </p>
  )
}

function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: typeof Calendar
  children: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
      <Icon size={13} />
      {children}
    </div>
  )
}

function EditSchedulePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [routes, setRoutes] = useState<RouteOption[]>([])
  const [buses, setBuses] = useState<BusOption[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [routeId, setRouteId] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  // As loaded from the server — see the startDate/originalStartDate comment
  // below; same reasoning applies to "today + already-past departure time".
  const [originalDepartureTime, setOriginalDepartureTime] = useState('')
  const [arrivalTime, setArrivalTime] = useState('')
  const [arrivalDayOffset, setArrivalDayOffset] = useState(0)
  const [basePrice, setBasePrice] = useState('')
  const [recurrenceType, setRecurrenceType] = useState('DAILY')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])
  const [daysOfMonth, setDaysOfMonth] = useState<number[]>([])
  const [startDate, setStartDate] = useState('')
  // The schedule's start date as loaded from the server — a running
  // schedule's start date is often already in the past, which is fine as
  // long as the partner doesn't try to change it to a *new* past date.
  const [originalStartDate, setOriginalStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [operationNotes, setOperationNotes] = useState('')

  const [pickupPoints, setPickupPoints] = useState<StopPoint[]>([
    { name: '', address: '', time: '' },
  ])
  const [dropoffPoints, setDropoffPoints] = useState<StopPoint[]>([
    { name: '', address: '', time: '' },
  ])

  const [busId, setBusId] = useState('')

  // Validation UX: a field's error is only shown once the user has left it
  // (blurred) or once they've tried to advance past its step.
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [stepAttempted, setStepAttempted] = useState<Record<number, boolean>>({})
  const touch = (field: string) => setTouched((t) => (t[field] ? t : { ...t, [field]: true }))

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek((d) => (d.includes(day) ? d.filter((x) => x !== day) : [...d, day].sort((a, b) => a - b)))
    touch('daysOfWeek')
  }
  const toggleDayOfMonth = (day: number) => {
    setDaysOfMonth((d) => (d.includes(day) ? d.filter((x) => x !== day) : [...d, day].sort((a, b) => a - b)))
    touch('daysOfMonth')
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [routesRes, busesRes, scheduleRes] = await Promise.all([
          api.get('/partner/schedules/routes'),
          api.get('/partner/schedules/buses'),
          api.get(`/partner/schedules/${id}`),
        ])
        setRoutes(routesRes.data.data || [])
        setBuses(busesRes.data.data || [])

        const s = scheduleRes.data.data
        if (s) {
          setRouteId(s.routeId?._id || '')
          setDepartureTime(s.departureTime || '')
          setOriginalDepartureTime(s.departureTime || '')
          setArrivalTime(s.arrivalTime || '')
          setArrivalDayOffset(s.arrivalDayOffset || 0)
          setBasePrice(String(s.basePrice || ''))
          setRecurrenceType(s.recurrenceType || 'DAILY')
          setDaysOfWeek(s.recurrenceRule?.daysOfWeek || [])
          setDaysOfMonth(s.recurrenceRule?.daysOfMonth || [])
          setOperationNotes(s.operationNotes || '')

          if (s.recurrenceRule?.startDate) {
            const loadedStartDate = new Date(s.recurrenceRule.startDate).toISOString().split('T')[0]
            setStartDate(loadedStartDate)
            setOriginalStartDate(loadedStartDate)
          }
          if (s.recurrenceRule?.endDate) {
            setEndDate(
              new Date(s.recurrenceRule.endDate).toISOString().split('T')[0],
            )
          }

          if (s.pickupPoints?.length > 0) {
            setPickupPoints(
              s.pickupPoints.map(
                (p: { name: string; address: string; time: string }) => ({
                  name: p.name,
                  address: p.address,
                  time: p.time,
                }),
              ),
            )
          }
          if (s.dropoffPoints?.length > 0) {
            setDropoffPoints(
              s.dropoffPoints.map(
                (p: { name: string; address: string; time: string }) => ({
                  name: p.name,
                  address: p.address,
                  time: p.time,
                }),
              ),
            )
          }

          setBusId(s.busId?._id || '')
        }
      } catch {
        setError('Failed to load schedule data')
      } finally {
        setLoadingData(false)
      }
    }
    fetchData()
  }, [id])

  const selectedRoute = routes.find((r) => r._id === routeId)
  const selectedBus = buses.find((b) => b._id === busId)
  // Scoped to the route's actual origin/destination province — a Hà Nội →
  // Quảng Ninh route must only ever suggest Hà Nội stations for pickup and
  // Quảng Ninh stations for dropoff, never e.g. a Sài Gòn station.
  const pickupStations = getStationsForProvince(selectedRoute?.origin_province)
  const dropoffStations = getStationsForProvince(selectedRoute?.destination_province)

  const updateStop = (
    type: 'pickup' | 'dropoff',
    index: number,
    field: keyof StopPoint,
    value: string,
  ) => {
    const setter = type === 'pickup' ? setPickupPoints : setDropoffPoints
    const list = type === 'pickup' ? pickupPoints : dropoffPoints
    const updated = [...list]
    updated[index] = { ...updated[index], [field]: value }
    setter(updated)
  }

  // Setting name+address from a quick-picked station needs to land in a
  // single state update — two sequential updateStop() calls would each read
  // the same stale pre-update array from the render closure and the second
  // call would silently clobber the first.
  const updateStopFields = (
    type: 'pickup' | 'dropoff',
    index: number,
    fields: Partial<StopPoint>,
  ) => {
    const setter = type === 'pickup' ? setPickupPoints : setDropoffPoints
    const list = type === 'pickup' ? pickupPoints : dropoffPoints
    const updated = [...list]
    updated[index] = { ...updated[index], ...fields }
    setter(updated)
  }

  const addStop = (type: 'pickup' | 'dropoff') => {
    const setter = type === 'pickup' ? setPickupPoints : setDropoffPoints
    const list = type === 'pickup' ? pickupPoints : dropoffPoints
    setter([...list, { name: '', address: '', time: '' }])
  }

  // No "must keep at least one" guard here anymore — a partner who doesn't
  // want the default/lone stop needs to be able to remove it rather than be
  // forced to fill it in. The "at least one required" rule is enforced as a
  // proper validation error instead (see fieldErrors below), same as any
  // other required field.
  const removeStop = (type: 'pickup' | 'dropoff', index: number) => {
    const setter = type === 'pickup' ? setPickupPoints : setDropoffPoints
    const list = type === 'pickup' ? pickupPoints : dropoffPoints
    setter(list.filter((_, i) => i !== index))
  }

  // Every field's error, recomputed live — only rendered for fields that
  // are "touched" (blurred, or whose step was already attempted).
  const fieldErrors = useMemo(() => {
    const e: Record<string, string> = {}

    if (!routeId) e.routeId = 'Please select a route'

    if (recurrenceType === 'WEEKLY' && daysOfWeek.length === 0)
      e.daysOfWeek = 'Select at least one day of the week'
    if (recurrenceType === 'MONTHLY' && daysOfMonth.length === 0)
      e.daysOfMonth = 'Select at least one day of the month'

    if (!departureTime) e.departureTime = 'Departure time is required'
    else if (
      startDate === todayStr() &&
      departureTime < nowTimeStr() &&
      !(startDate === originalStartDate && departureTime === originalDepartureTime)
    )
      e.departureTime = 'Cannot be earlier than the current time today'

    if (!arrivalTime) e.arrivalTime = 'Arrival time is required'
    else if (!arrivalDayOffset && departureTime && arrivalTime <= departureTime)
      e.arrivalTime = 'Must be after departure time (or set "Arrives after" to 1+ days)'

    if (!basePrice || Number(basePrice) <= 0)
      e.basePrice = 'Price must be greater than 0'

    if (!startDate) e.startDate = 'Start date is required'
    else if (startDate < todayStr() && startDate !== originalStartDate)
      e.startDate = 'Cannot be in the past'

    if (endDate) {
      if (endDate < todayStr()) e.endDate = 'Cannot be in the past'
      else if (startDate && new Date(endDate) <= new Date(startDate))
        e.endDate = 'Must be after start date'
    }

    // Stops can now be deleted all the way down to zero (see removeStop —
    // the "must keep at least one" rule used to be enforced by disabling the
    // delete button, which meant a partner who didn't want to fill in the
    // lone default stop had no way to back out of it). So the "at least
    // one" rule has to be validated explicitly here instead.
    if (pickupPoints.length === 0) e.pickupPointsCount = 'At least one pickup point is required'
    if (dropoffPoints.length === 0) e.dropoffPointsCount = 'At least one dropoff point is required'

    pickupPoints.forEach((p, i) => {
      if (!p.name) e[`pickup-${i}-name`] = 'Required'
      if (!p.address) e[`pickup-${i}-address`] = 'Required'
      if (!p.time) e[`pickup-${i}-time`] = 'Required'
    })
    dropoffPoints.forEach((p, i) => {
      if (!p.name) e[`dropoff-${i}-name`] = 'Required'
      if (!p.address) e[`dropoff-${i}-address`] = 'Required'
      if (!p.time) e[`dropoff-${i}-time`] = 'Required'
    })

    const pickupConflicts = findStopConflicts(pickupPoints)
    Object.entries(pickupConflicts).forEach(([i, c]) => {
      e[`pickup-${i}-duplicate`] =
        c.kind === 'exact' ? `Same as pickup stop #${c.firstIndex + 1} — remove one or change it`
        : c.kind === 'location' ? `Same stop as pickup stop #${c.firstIndex + 1} — a stop can only appear once`
        : `Same time as pickup stop #${c.firstIndex + 1} — a bus cannot be at two places at once`
    })
    const dropoffConflicts = findStopConflicts(dropoffPoints)
    Object.entries(dropoffConflicts).forEach(([i, c]) => {
      e[`dropoff-${i}-duplicate`] =
        c.kind === 'exact' ? `Same as dropoff stop #${c.firstIndex + 1} — remove one or change it`
        : c.kind === 'location' ? `Same stop as dropoff stop #${c.firstIndex + 1} — a stop can only appear once`
        : `Same time as dropoff stop #${c.firstIndex + 1} — a bus cannot be at two places at once`
    })

    Object.assign(e, findStopWindowErrors(pickupPoints, dropoffPoints, departureTime, arrivalTime, arrivalDayOffset))

    if (!busId) e.busId = 'Please select a bus'

    return e
  }, [routeId, recurrenceType, daysOfWeek, daysOfMonth, departureTime, originalDepartureTime, arrivalTime, arrivalDayOffset, basePrice, startDate, originalStartDate, endDate, pickupPoints, dropoffPoints, busId])

  const show = (field: string) => (touched[field] || stepAttempted[currentStep]) && !!fieldErrors[field]

  const stepHasErrors = (step: number) => {
    if (step === 0)
      return ['routeId', 'departureTime', 'arrivalTime', 'basePrice', 'startDate', 'endDate', 'daysOfWeek', 'daysOfMonth'].some(
        (k) => fieldErrors[k]
      )
    if (step === 1)
      return Object.keys(fieldErrors).some(
        (k) => k.startsWith('pickup-') || k.startsWith('dropoff-') || k === 'pickupPointsCount' || k === 'dropoffPointsCount'
      )
    if (step === 2) return !!fieldErrors.busId
    return false
  }

  const goNext = () => {
    setStepAttempted((s) => ({ ...s, [currentStep]: true }))
    if (stepHasErrors(currentStep)) return
    setError('')
    setCurrentStep((s) => Math.min(s + 1, 3))
  }

  const goPrev = () => {
    setCurrentStep((s) => Math.max(s - 1, 0))
  }

  const handleSubmit = async () => {
    const attempted = { 0: true, 1: true, 2: true, 3: true }
    setStepAttempted(attempted)
    for (const step of [0, 1, 2]) {
      if (stepHasErrors(step)) {
        setCurrentStep(step)
        return
      }
    }

    setSubmitting(true)
    setError('')
    try {
      await api.put(`/partner/schedules/${id}`, {
        routeId,
        busId,
        departureTime,
        arrivalTime,
        arrivalDayOffset,
        basePrice: Number(basePrice),
        recurrenceType,
        recurrenceRule: {
          frequency: recurrenceType === 'ONCE' ? 'NONE' : recurrenceType,
          interval: 1,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : null,
          daysOfWeek: recurrenceType === 'WEEKLY' ? daysOfWeek : [],
          daysOfMonth: recurrenceType === 'MONTHLY' ? daysOfMonth : [],
        },
        pickupPoints: pickupPoints.map((p, i) => ({ ...p, orderIndex: i })),
        dropoffPoints: dropoffPoints.map((p, i) => ({ ...p, orderIndex: i })),
        operationNotes,
      })
      navigate(`/schedules/${id}`)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(
        axiosErr.response?.data?.message || 'Failed to update schedule',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (val: string) => {
    const num = Number(val)
    if (!val || isNaN(num)) return ''
    return num.toLocaleString('vi-VN')
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-500">Loading schedule...</div>
      </div>
    )
  }

  return (
    <div className="motion-safe:animate-in fade-in mx-auto max-w-4xl duration-500">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <button
              className="hover:text-slate-700"
              onClick={() => navigate('/schedules')}
            >
              Schedules
            </button>
            <ChevronRight size={14} />
            <button
              className="hover:text-slate-700"
              onClick={() => navigate(`/schedules/${id}`)}
            >
              Detail
            </button>
            <ChevronRight size={14} />
            <span className="text-blue-600">Edit</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/schedules/${id}`)}
            >
              <ArrowLeft size={16} />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Edit Schedule
              </h1>
              <p className="text-sm text-slate-500">
                Update schedule details below.
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="transition-all hover:-translate-y-0.5 active:translate-y-0"
            onClick={() => navigate(`/schedules/${id}`)}
          >
            Cancel
          </Button>
          <Button
            className="bg-blue-600 text-white transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
            onClick={currentStep === 3 ? handleSubmit : goNext}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-8 flex items-center gap-0">
        {STEPS.map((step, i) => (
          <div key={step.label} className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => {
                if (i < currentStep) setCurrentStep(i)
              }}
              className={cn(
                'flex flex-col items-center gap-1.5',
                i < currentStep && 'cursor-pointer'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  i < currentStep || i === currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500',
                  stepAttempted[i] && stepHasErrors(i) && 'bg-red-500'
                )}
              >
                {i < currentStep ? <Check size={16} /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-center text-xs font-medium',
                  i <= currentStep ? 'text-blue-600' : 'text-slate-400',
                  stepAttempted[i] && stepHasErrors(i) && 'text-red-500'
                )}
              >
                {step.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-0.5 flex-1',
                  i < currentStep ? 'bg-blue-600' : 'bg-slate-200'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error (submission/network errors only — field-level issues show inline) */}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="rounded-xl border-l-4 border-l-blue-600 bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            {currentStep === 0 && <Info size={18} className="text-blue-600" />}
            {currentStep === 1 && (
              <MapPin size={18} className="text-blue-600" />
            )}
            {currentStep === 2 && <Bus size={18} className="text-blue-600" />}
            {currentStep === 3 && (
              <ClipboardCheck size={18} className="text-blue-600" />
            )}
            <h2 className="text-base font-semibold text-slate-900">
              Step {currentStep + 1}: {STEPS[currentStep].label}
            </h2>
          </div>
          <Badge className="border-amber-200 bg-amber-50 text-amber-700">
            EDITING
          </Badge>
        </div>

        <div key={currentStep} className="motion-safe:animate-in fade-in slide-in-from-right-2 p-6 duration-300 fill-mode-both">
          {/* STEP 1: Trip Information */}
          {currentStep === 0 && (
            <div className="space-y-7">
              {/* Route */}
              <div>
                <SectionHeading icon={RouteIcon}>Route</SectionHeading>
                <Label className="mb-1.5 text-sm font-medium text-slate-700">
                  Selected Route
                </Label>
                <Select
                  value={routeId}
                  onValueChange={(v) => {
                    setRouteId(v)
                    touch('routeId')
                  }}
                >
                  <SelectTrigger
                    onBlur={() => touch('routeId')}
                    className={cn(
                      'h-10 w-full',
                      show('routeId') && 'border-red-400 ring-1 ring-red-200'
                    )}
                  >
                    <SelectValue placeholder="Choose a route..." />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((r) => (
                      <SelectItem key={r._id} value={r._id}>
                        {r.origin_provinceName} → {r.destination_provinceName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRoute && !show('routeId') && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                    <Check size={12} />
                    Route verified and capacity checked.
                  </p>
                )}
                <FieldError message={show('routeId') ? fieldErrors.routeId : undefined} />
              </div>

              {/* Schedule Window */}
              <div>
                <SectionHeading icon={Calendar}>Schedule Window</SectionHeading>
                <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                  <div>
                    <Label className="mb-1.5 text-sm font-medium text-slate-700">
                      Recurrence
                    </Label>
                    <Select value={recurrenceType} onValueChange={setRecurrenceType}>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RECURRENCE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-1.5 text-sm font-medium text-slate-700">
                      Start Date
                    </Label>
                    <Input
                      type="date"
                      className={cn('h-10', show('startDate') && 'border-red-400 focus-visible:ring-red-200')}
                      min={todayStr()}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      onBlur={() => touch('startDate')}
                    />
                    <FieldError message={show('startDate') ? fieldErrors.startDate : undefined} />
                  </div>

                  <div>
                    <Label className="mb-1.5 text-sm font-medium text-slate-700">
                      End Date (optional)
                    </Label>
                    <Input
                      type="date"
                      className={cn('h-10', show('endDate') && 'border-red-400 focus-visible:ring-red-200')}
                      min={startDate || todayStr()}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      onBlur={() => touch('endDate')}
                    />
                    <FieldError message={show('endDate') ? fieldErrors.endDate : undefined} />
                  </div>
                </div>

                {recurrenceType === 'WEEKLY' && (
                  <div className="mt-5">
                    <Label className="mb-1.5 text-sm font-medium text-slate-700">
                      Repeats on
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAY_OPTIONS.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleDayOfWeek(d.value)}
                          className={cn(
                            'h-9 w-14 rounded-md border text-sm font-medium transition-colors',
                            daysOfWeek.includes(d.value)
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                          )}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                    <FieldError message={show('daysOfWeek') ? fieldErrors.daysOfWeek : undefined} />
                  </div>
                )}

                {recurrenceType === 'MONTHLY' && (
                  <div className="mt-5">
                    <Label className="mb-1.5 text-sm font-medium text-slate-700">
                      Repeats on day(s) of month
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDayOfMonth(d)}
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-md border text-xs font-medium transition-colors',
                            daysOfMonth.includes(d)
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                    <FieldError message={show('daysOfMonth') ? fieldErrors.daysOfMonth : undefined} />
                  </div>
                )}
              </div>

              {/* Daily Timing */}
              <div>
                <SectionHeading icon={Clock}>Daily Timing</SectionHeading>
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <Label className="mb-1.5 text-sm font-medium text-slate-700">
                      Departure Time
                    </Label>
                    <Input
                      type="time"
                      className={cn('h-10', show('departureTime') && 'border-red-400 focus-visible:ring-red-200')}
                      min={startDate === todayStr() && startDate !== originalStartDate ? nowTimeStr() : undefined}
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      onBlur={() => touch('departureTime')}
                    />
                    <FieldError message={show('departureTime') ? fieldErrors.departureTime : undefined} />
                  </div>

                  <div>
                    <Label className="mb-1.5 text-sm font-medium text-slate-700">
                      Est. Arrival Time
                    </Label>
                    <Input
                      type="time"
                      className={cn('h-10', show('arrivalTime') && 'border-red-400 focus-visible:ring-red-200')}
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      onBlur={() => touch('arrivalTime')}
                    />
                    <FieldError message={show('arrivalTime') ? fieldErrors.arrivalTime : undefined} />
                  </div>

                  <div className="col-span-2 rounded-lg border bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium text-slate-700 whitespace-nowrap">
                        Arrives after
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        className="h-9 w-20"
                        value={arrivalDayOffset}
                        onChange={(e) => setArrivalDayOffset(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                      />
                      <span className="text-sm text-slate-600">
                        day(s) {arrivalDayOffset === 0 ? '(same day)' : arrivalDayOffset === 1 ? '(overnight)' : '(multi-night route)'}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      0 = arrives same day. 1 = arrives the next day (e.g. depart 22:00, arrive 06:00). 2+ for long-haul multi-night routes.
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Notes */}
              <div>
                <SectionHeading icon={Wallet}>Pricing & Notes</SectionHeading>
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <Label className="mb-1.5 text-sm font-medium text-slate-700">
                      Standard Ticket Price (VND)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        ₫
                      </span>
                      <Input
                        type="number"
                        className={cn(
                          'h-10 pl-7',
                          show('basePrice') && 'border-red-400 focus-visible:ring-red-200'
                        )}
                        placeholder="250,000"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        onBlur={() => touch('basePrice')}
                        min={0}
                      />
                    </div>
                    {basePrice && !show('basePrice') && (
                      <p className="mt-1 text-xs text-slate-400">
                        {formatPrice(basePrice)} VND
                      </p>
                    )}
                    <FieldError message={show('basePrice') ? fieldErrors.basePrice : undefined} />
                  </div>

                  <div>
                    <Label className="mb-1.5 text-sm font-medium text-slate-700">
                      Operation Notes (Internal)
                    </Label>
                    <Input
                      className="h-10"
                      placeholder="Add special instructions for the driver..."
                      value={operationNotes}
                      onChange={(e) => setOperationNotes(e.target.value)}
                      maxLength={1000}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Route & Stops */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <ArrowRight size={16} className="text-emerald-600" />
                    Pickup Points
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addStop('pickup')}
                  >
                    <PlusCircle size={14} />
                    Add Stop
                  </Button>
                </div>
                {pickupPoints.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-400">
                    No pickup point yet — click "Add Stop" to add one.
                    <FieldError message={show('pickupPointsCount') ? fieldErrors.pickupPointsCount : undefined} />
                  </div>
                ) : (
                <div className="space-y-3">
                  {pickupPoints.map((p, i) => (
                    <div
                      key={i}
                      className="space-y-2 rounded-lg border bg-slate-50 p-3"
                    >
                      {pickupStations.length > 0 && (
                        <Select
                          value=""
                          onValueChange={(stationName) => {
                            const station = pickupStations.find((s) => s.name === stationName)
                            if (station) updateStopFields('pickup', i, { name: station.name, address: station.address })
                            touch(`pickup-${i}-duplicate`)
                          }}
                        >
                          <SelectTrigger className="h-8 w-full text-xs text-slate-500">
                            <SelectValue
                              placeholder={`Quick-fill from a known ${selectedRoute?.origin_provinceName} station...`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {pickupStations.map((s) => (
                              <SelectItem key={s.name} value={s.name}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <div className="grid grid-cols-[1fr_1fr_140px_36px] items-start gap-3">
                      <div>
                        <Label className="mb-1 text-xs text-slate-500">
                          Stop Name
                        </Label>
                        <Input
                          className={cn(
                            'h-9',
                            show(`pickup-${i}-name`) && 'border-red-400 focus-visible:ring-red-200'
                          )}
                          placeholder="e.g. Ben Xe Mien Dong"
                          value={p.name}
                          onChange={(e) => updateStop('pickup', i, 'name', e.target.value)}
                          onBlur={() => { touch(`pickup-${i}-name`); touch(`pickup-${i}-duplicate`) }}
                        />
                        <FieldError message={show(`pickup-${i}-name`) ? fieldErrors[`pickup-${i}-name`] : undefined} />
                      </div>
                      <div>
                        <Label className="mb-1 text-xs text-slate-500">
                          Address
                        </Label>
                        <Input
                          className={cn(
                            'h-9',
                            show(`pickup-${i}-address`) && 'border-red-400 focus-visible:ring-red-200'
                          )}
                          placeholder="Full address"
                          value={p.address}
                          onChange={(e) => updateStop('pickup', i, 'address', e.target.value)}
                          onBlur={() => { touch(`pickup-${i}-address`); touch(`pickup-${i}-duplicate`) }}
                        />
                        <FieldError message={show(`pickup-${i}-address`) ? fieldErrors[`pickup-${i}-address`] : undefined} />
                      </div>
                      <div>
                        <Label className="mb-1 text-xs text-slate-500">
                          Time
                        </Label>
                        <Input
                          type="time"
                          className={cn(
                            'h-9',
                            show(`pickup-${i}-time`) && 'border-red-400 focus-visible:ring-red-200'
                          )}
                          value={p.time}
                          onChange={(e) => updateStop('pickup', i, 'time', e.target.value)}
                          onBlur={() => { touch(`pickup-${i}-time`); touch(`pickup-${i}-duplicate`); touch(`pickup-${i}-window`) }}
                        />
                        <FieldError message={show(`pickup-${i}-time`) ? fieldErrors[`pickup-${i}-time`] : undefined} />
                        <FieldError message={show(`pickup-${i}-window`) ? fieldErrors[`pickup-${i}-window`] : undefined} />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-5 text-red-400 hover:text-red-600"
                        onClick={() => removeStop('pickup', i)}
                        title="Remove this stop"
                      >
                        <Trash2 size={16} />
                      </Button>
                      </div>
                      <FieldError message={show(`pickup-${i}-duplicate`) ? fieldErrors[`pickup-${i}-duplicate`] : undefined} />
                    </div>
                  ))}
                </div>
                )}
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <MapPin size={16} className="text-blue-600" />
                    Dropoff Points
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addStop('dropoff')}
                  >
                    <PlusCircle size={14} />
                    Add Stop
                  </Button>
                </div>
                {dropoffPoints.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-400">
                    No dropoff point yet — click "Add Stop" to add one.
                    <FieldError message={show('dropoffPointsCount') ? fieldErrors.dropoffPointsCount : undefined} />
                  </div>
                ) : (
                <div className="space-y-3">
                  {dropoffPoints.map((p, i) => (
                    <div
                      key={i}
                      className="space-y-2 rounded-lg border bg-slate-50 p-3"
                    >
                      {dropoffStations.length > 0 && (
                        <Select
                          value=""
                          onValueChange={(stationName) => {
                            const station = dropoffStations.find((s) => s.name === stationName)
                            if (station) updateStopFields('dropoff', i, { name: station.name, address: station.address })
                            touch(`dropoff-${i}-duplicate`)
                          }}
                        >
                          <SelectTrigger className="h-8 w-full text-xs text-slate-500">
                            <SelectValue
                              placeholder={`Quick-fill from a known ${selectedRoute?.destination_provinceName} station...`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {dropoffStations.map((s) => (
                              <SelectItem key={s.name} value={s.name}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <div className="grid grid-cols-[1fr_1fr_140px_36px] items-start gap-3">
                      <div>
                        <Label className="mb-1 text-xs text-slate-500">
                          Stop Name
                        </Label>
                        <Input
                          className={cn(
                            'h-9',
                            show(`dropoff-${i}-name`) && 'border-red-400 focus-visible:ring-red-200'
                          )}
                          placeholder="e.g. Ben Xe Da Lat"
                          value={p.name}
                          onChange={(e) => updateStop('dropoff', i, 'name', e.target.value)}
                          onBlur={() => { touch(`dropoff-${i}-name`); touch(`dropoff-${i}-duplicate`) }}
                        />
                        <FieldError message={show(`dropoff-${i}-name`) ? fieldErrors[`dropoff-${i}-name`] : undefined} />
                      </div>
                      <div>
                        <Label className="mb-1 text-xs text-slate-500">
                          Address
                        </Label>
                        <Input
                          className={cn(
                            'h-9',
                            show(`dropoff-${i}-address`) && 'border-red-400 focus-visible:ring-red-200'
                          )}
                          placeholder="Full address"
                          value={p.address}
                          onChange={(e) => updateStop('dropoff', i, 'address', e.target.value)}
                          onBlur={() => { touch(`dropoff-${i}-address`); touch(`dropoff-${i}-duplicate`) }}
                        />
                        <FieldError message={show(`dropoff-${i}-address`) ? fieldErrors[`dropoff-${i}-address`] : undefined} />
                      </div>
                      <div>
                        <Label className="mb-1 flex items-center gap-1 text-xs text-slate-500">
                          Time
                          {arrivalDayOffset > 0 && (
                            <span className="rounded bg-blue-50 px-1 py-0.5 text-[10px] font-medium text-blue-600">
                              day {arrivalDayOffset + 1}
                            </span>
                          )}
                        </Label>
                        <Input
                          type="time"
                          className={cn(
                            'h-9',
                            show(`dropoff-${i}-time`) && 'border-red-400 focus-visible:ring-red-200'
                          )}
                          value={p.time}
                          onChange={(e) => updateStop('dropoff', i, 'time', e.target.value)}
                          onBlur={() => { touch(`dropoff-${i}-time`); touch(`dropoff-${i}-duplicate`); touch(`dropoff-${i}-window`) }}
                        />
                        <FieldError message={show(`dropoff-${i}-time`) ? fieldErrors[`dropoff-${i}-time`] : undefined} />
                        <FieldError message={show(`dropoff-${i}-window`) ? fieldErrors[`dropoff-${i}-window`] : undefined} />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-5 text-red-400 hover:text-red-600"
                        onClick={() => removeStop('dropoff', i)}
                        title="Remove this stop"
                      >
                        <Trash2 size={16} />
                      </Button>
                      </div>
                      <FieldError message={show(`dropoff-${i}-duplicate`) ? fieldErrors[`dropoff-${i}-duplicate`] : undefined} />
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Bus Selection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 text-sm font-medium text-slate-700">
                  Select Bus
                </Label>
                <Select
                  value={busId}
                  onValueChange={(v) => {
                    setBusId(v)
                    touch('busId')
                  }}
                >
                  <SelectTrigger
                    onBlur={() => touch('busId')}
                    className={cn(
                      'h-10 w-full',
                      show('busId') && 'border-red-400 ring-1 ring-red-200'
                    )}
                  >
                    <SelectValue placeholder="Choose a bus..." />
                  </SelectTrigger>
                  <SelectContent>
                    {buses.map((b) => (
                      <SelectItem key={b._id} value={b._id}>
                        {b.busName} — {b.licensePlate} ({b.busType},{' '}
                        {b.totalSeats} seats)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={show('busId') ? fieldErrors.busId : undefined} />
              </div>

              {selectedBus && (
                <div className="rounded-lg border bg-slate-50 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-slate-800">
                    Bus Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Name:</span>{' '}
                      <span className="font-medium">{selectedBus.busName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">License:</span>{' '}
                      <span className="font-medium">
                        {selectedBus.licensePlate}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Type:</span>{' '}
                      <span className="font-medium">{selectedBus.busType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Seats:</span>{' '}
                      <span className="font-medium">
                        {selectedBus.totalSeats}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Review & Confirm */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="rounded-lg border bg-slate-50 p-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-800">
                  Schedule Information
                </h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-slate-500">Route</div>
                  <div className="font-medium">
                    {selectedRoute
                      ? `${selectedRoute.origin_provinceName} → ${selectedRoute.destination_provinceName}`
                      : '—'}
                  </div>
                  <div className="text-slate-500">Departure</div>
                  <div className="font-medium">{departureTime || '—'}</div>
                  <div className="text-slate-500">Arrival</div>
                  <div className="font-medium">
                    {arrivalTime || '—'}
                    {arrivalDayOffset > 0 && (
                      <span className="ml-1.5 text-xs text-blue-600">
                        (+{arrivalDayOffset} day{arrivalDayOffset > 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500">Price</div>
                  <div className="font-medium">
                    {basePrice ? `${formatPrice(basePrice)} VND` : '—'}
                  </div>
                  <div className="text-slate-500">Recurrence</div>
                  <div className="font-medium">
                    {
                      RECURRENCE_OPTIONS.find(
                        (o) => o.value === recurrenceType,
                      )?.label
                    }
                    {recurrenceType === 'WEEKLY' && daysOfWeek.length > 0 && (
                      <span className="ml-1.5 text-xs text-slate-500">
                        ({daysOfWeek.map((d) => WEEKDAY_OPTIONS[d].label).join(', ')})
                      </span>
                    )}
                    {recurrenceType === 'MONTHLY' && daysOfMonth.length > 0 && (
                      <span className="ml-1.5 text-xs text-slate-500">
                        (day {daysOfMonth.join(', ')})
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500">Start Date</div>
                  <div className="font-medium">{startDate || '—'}</div>
                  {endDate && (
                    <>
                      <div className="text-slate-500">End Date</div>
                      <div className="font-medium">{endDate}</div>
                    </>
                  )}
                  {operationNotes && (
                    <>
                      <div className="text-slate-500">Notes</div>
                      <div className="font-medium">{operationNotes}</div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border bg-slate-50 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-emerald-700">
                    Pickup Points ({pickupPoints.length})
                  </h4>
                  <ol className="space-y-1 text-sm">
                    {pickupPoints.map((p, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-slate-400">{i + 1}.</span>
                        <span>
                          <span className="font-medium">{p.name}</span>
                          <span className="text-slate-400"> — {p.time}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-blue-700">
                    Dropoff Points ({dropoffPoints.length})
                  </h4>
                  <ol className="space-y-1 text-sm">
                    {dropoffPoints.map((p, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-slate-400">{i + 1}.</span>
                        <span>
                          <span className="font-medium">{p.name}</span>
                          <span className="text-slate-400"> — {p.time}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="rounded-lg border bg-slate-50 p-4">
                <h4 className="mb-2 text-sm font-semibold text-slate-800">
                  Assigned Bus
                </h4>
                {selectedBus ? (
                  <p className="text-sm">
                    <span className="font-medium">{selectedBus.busName}</span> —{' '}
                    {selectedBus.licensePlate} ({selectedBus.busType},{' '}
                    {selectedBus.totalSeats} seats)
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">No bus selected</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Locked future steps */}
      {currentStep < 3 && (
        <div className="mt-4 space-y-3">
          {STEPS.slice(currentStep + 1).map((step, i) => (
            <div
              key={step.label}
              className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-white/60 px-6 py-3 text-slate-400"
            >
              <div className="flex items-center gap-2">
                <step.icon size={16} />
                <span className="text-sm font-medium">
                  Step {currentStep + 2 + i}: {step.label}
                </span>
              </div>
              <Lock size={14} />
            </div>
          ))}
        </div>
      )}

      {/* Bottom Nav */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          className="border-red-200 text-red-600 transition-all hover:-translate-y-0.5 hover:bg-red-50 active:translate-y-0"
          onClick={() => navigate(`/schedules/${id}`)}
        >
          <X size={16} />
          Cancel Editing
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="transition-all hover:-translate-y-0.5 active:translate-y-0"
            onClick={goPrev}
            disabled={currentStep === 0}
          >
            <ChevronLeft size={16} />
            Previous
          </Button>

          {currentStep < 3 ? (
            <Button
              className="bg-blue-600 text-white transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
              onClick={goNext}
            >
              Next Step: {STEPS[currentStep + 1].label}
              <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              className="bg-blue-600 text-white transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Confirm & Update Schedule'}
              <Check size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default EditSchedulePage
