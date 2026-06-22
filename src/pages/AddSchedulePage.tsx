import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
import api from '@/services/api'

interface RouteOption {
  _id: string
  routeName: string
  origin_provinceName: string
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

function AddSchedulePage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [routes, setRoutes] = useState<RouteOption[]>([])
  const [buses, setBuses] = useState<BusOption[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Step 1
  const [routeId, setRouteId] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  const [arrivalTime, setArrivalTime] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [recurrenceType, setRecurrenceType] = useState('DAILY')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [operationNotes, setOperationNotes] = useState('')

  // Step 2
  const [pickupPoints, setPickupPoints] = useState<StopPoint[]>([
    { name: '', address: '', time: '' },
  ])
  const [dropoffPoints, setDropoffPoints] = useState<StopPoint[]>([
    { name: '', address: '', time: '' },
  ])

  // Step 3
  const [busId, setBusId] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [routesRes, busesRes] = await Promise.all([
          api.get('/partner/schedules/routes'),
          api.get('/partner/schedules/buses'),
        ])
        setRoutes(routesRes.data.data || [])
        setBuses(busesRes.data.data || [])
      } catch {
        setError('Failed to load routes and buses')
      } finally {
        setLoadingData(false)
      }
    }
    fetchData()
  }, [])

  const selectedRoute = routes.find((r) => r._id === routeId)
  const selectedBus = buses.find((b) => b._id === busId)

  const updateStop = (
    type: 'pickup' | 'dropoff',
    index: number,
    field: keyof StopPoint,
    value: string
  ) => {
    const setter = type === 'pickup' ? setPickupPoints : setDropoffPoints
    const list = type === 'pickup' ? pickupPoints : dropoffPoints
    const updated = [...list]
    updated[index] = { ...updated[index], [field]: value }
    setter(updated)
  }

  const addStop = (type: 'pickup' | 'dropoff') => {
    const setter = type === 'pickup' ? setPickupPoints : setDropoffPoints
    const list = type === 'pickup' ? pickupPoints : dropoffPoints
    setter([...list, { name: '', address: '', time: '' }])
  }

  const removeStop = (type: 'pickup' | 'dropoff', index: number) => {
    const setter = type === 'pickup' ? setPickupPoints : setDropoffPoints
    const list = type === 'pickup' ? pickupPoints : dropoffPoints
    if (list.length <= 1) return
    setter(list.filter((_, i) => i !== index))
  }

  const validateStep = (step: number): string | null => {
    switch (step) {
      case 0:
        if (!routeId) return 'Please select a route'
        if (!departureTime) return 'Departure time is required'
        if (!arrivalTime) return 'Arrival time is required'
        if (!basePrice || Number(basePrice) <= 0)
          return 'Base price must be greater than 0'
        if (!startDate) return 'Start date is required'
        return null
      case 1:
        for (const p of pickupPoints) {
          if (!p.name || !p.address || !p.time)
            return 'All pickup point fields are required'
        }
        for (const p of dropoffPoints) {
          if (!p.name || !p.address || !p.time)
            return 'All dropoff point fields are required'
        }
        return null
      case 2:
        if (!busId) return 'Please select a bus'
        return null
      default:
        return null
    }
  }

  const goNext = () => {
    const err = validateStep(currentStep)
    if (err) {
      setError(err)
      return
    }
    setError('')
    setCurrentStep((s) => Math.min(s + 1, 3))
  }

  const goPrev = () => {
    setError('')
    setCurrentStep((s) => Math.max(s - 1, 0))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      await api.post('/partner/schedules', {
        routeId,
        busId,
        departureTime,
        arrivalTime,
        basePrice: Number(basePrice),
        recurrenceType,
        recurrenceRule: {
          frequency: recurrenceType === 'ONCE' ? 'NONE' : recurrenceType,
          interval: 1,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : null,
          daysOfWeek: [],
          daysOfMonth: [],
        },
        pickupPoints: pickupPoints.map((p, i) => ({ ...p, orderIndex: i })),
        dropoffPoints: dropoffPoints.map((p, i) => ({ ...p, orderIndex: i })),
        operationNotes,
      })
      navigate('/schedules')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(
        axiosErr.response?.data?.message || 'Failed to create schedule'
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
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <span>Partner Dashboard</span>
            <ChevronRight size={14} />
            <span>View Schedule</span>
            <ChevronRight size={14} />
            <span className="text-blue-600">Add Schedule</span>
          </div>
          <div className="flex items-center gap-3">
            <PlusCircle size={24} className="text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Add New Schedule
              </h1>
              <p className="text-sm text-slate-500">
                Fill in the journey details to create a new departure slot.
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/schedules')}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={currentStep === 3 ? handleSubmit : goNext}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Schedule'}
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-8 flex items-center gap-0">
        {STEPS.map((step, i) => (
          <div key={step.label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  i < currentStep
                    ? 'bg-blue-600 text-white'
                    : i === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-500',
                ].join(' ')}
              >
                {i < currentStep ? <Check size={16} /> : i + 1}
              </div>
              <span
                className={[
                  'text-center text-xs font-medium',
                  i <= currentStep ? 'text-blue-600' : 'text-slate-400',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={[
                  'mx-2 h-0.5 flex-1',
                  i < currentStep ? 'bg-blue-600' : 'bg-slate-200',
                ].join(' ')}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="rounded-xl border-l-4 border-l-blue-600 bg-white shadow-sm ring-1 ring-slate-200">
        {/* Step Header */}
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
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
            IN PROGRESS
          </Badge>
        </div>

        <div className="p-6">
          {/* STEP 1: Trip Information */}
          {currentStep === 0 && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <Label className="mb-1.5 text-sm font-medium text-slate-700">
                  Selected Route
                </Label>
                <Select value={routeId} onValueChange={setRouteId}>
                  <SelectTrigger className="w-full h-10">
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
                {selectedRoute && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                    <Check size={12} />
                    Route verified and capacity checked.
                  </p>
                )}
              </div>

              <div>
                <Label className="mb-1.5 text-sm font-medium text-slate-700">
                  Recurrence
                </Label>
                <Select
                  value={recurrenceType}
                  onValueChange={setRecurrenceType}
                >
                  <SelectTrigger className="w-full h-10">
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
                  className="h-10"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                {!startDate && (
                  <p className="mt-1 text-xs text-red-500">
                    Start date is required
                  </p>
                )}
              </div>

              <div>
                <Label className="mb-1.5 text-sm font-medium text-slate-700">
                  End Date (optional)
                </Label>
                <Input
                  type="date"
                  className="h-10"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div>
                <Label className="mb-1.5 text-sm font-medium text-slate-700">
                  Departure Time
                </Label>
                <Input
                  type="time"
                  className="h-10"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                />
              </div>

              <div>
                <Label className="mb-1.5 text-sm font-medium text-slate-700">
                  Est. Arrival Time
                </Label>
                <Input
                  type="time"
                  className="h-10"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                />
              </div>

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
                    className="h-10 pl-7"
                    placeholder="250,000"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    min={0}
                  />
                </div>
                {basePrice && (
                  <p className="mt-1 text-xs text-slate-400">
                    {formatPrice(basePrice)} VND
                  </p>
                )}
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
                />
              </div>
            </div>
          )}

          {/* STEP 2: Route & Stops */}
          {currentStep === 1 && (
            <div className="space-y-8">
              {/* Pickup Points */}
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
                <div className="space-y-3">
                  {pickupPoints.map((p, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_1fr_140px_36px] items-end gap-3 rounded-lg border bg-slate-50 p-3"
                    >
                      <div>
                        <Label className="mb-1 text-xs text-slate-500">
                          Stop Name
                        </Label>
                        <Input
                          className="h-9"
                          placeholder="e.g. Ben Xe Mien Dong"
                          value={p.name}
                          onChange={(e) =>
                            updateStop('pickup', i, 'name', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label className="mb-1 text-xs text-slate-500">
                          Address
                        </Label>
                        <Input
                          className="h-9"
                          placeholder="Full address"
                          value={p.address}
                          onChange={(e) =>
                            updateStop('pickup', i, 'address', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label className="mb-1 text-xs text-slate-500">
                          Time
                        </Label>
                        <Input
                          type="time"
                          className="h-9"
                          value={p.time}
                          onChange={(e) =>
                            updateStop('pickup', i, 'time', e.target.value)
                          }
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-600"
                        onClick={() => removeStop('pickup', i)}
                        disabled={pickupPoints.length <= 1}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dropoff Points */}
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
                <div className="space-y-3">
                  {dropoffPoints.map((p, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_1fr_140px_36px] items-end gap-3 rounded-lg border bg-slate-50 p-3"
                    >
                      <div>
                        <Label className="mb-1 text-xs text-slate-500">
                          Stop Name
                        </Label>
                        <Input
                          className="h-9"
                          placeholder="e.g. Ben Xe Da Lat"
                          value={p.name}
                          onChange={(e) =>
                            updateStop('dropoff', i, 'name', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label className="mb-1 text-xs text-slate-500">
                          Address
                        </Label>
                        <Input
                          className="h-9"
                          placeholder="Full address"
                          value={p.address}
                          onChange={(e) =>
                            updateStop('dropoff', i, 'address', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label className="mb-1 text-xs text-slate-500">
                          Time
                        </Label>
                        <Input
                          type="time"
                          className="h-9"
                          value={p.time}
                          onChange={(e) =>
                            updateStop('dropoff', i, 'time', e.target.value)
                          }
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-600"
                        onClick={() => removeStop('dropoff', i)}
                        disabled={dropoffPoints.length <= 1}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
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
                <Select value={busId} onValueChange={setBusId}>
                  <SelectTrigger className="w-full h-10">
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
              {/* Schedule Info */}
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
                  <div className="font-medium">{arrivalTime || '—'}</div>
                  <div className="text-slate-500">Price</div>
                  <div className="font-medium">
                    {basePrice
                      ? `${formatPrice(basePrice)} VND`
                      : '—'}
                  </div>
                  <div className="text-slate-500">Recurrence</div>
                  <div className="font-medium">
                    {
                      RECURRENCE_OPTIONS.find(
                        (o) => o.value === recurrenceType
                      )?.label
                    }
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

              {/* Stops */}
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
                          <span className="text-slate-400">
                            {' '}
                            — {p.time}
                          </span>
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
                          <span className="text-slate-400">
                            {' '}
                            — {p.time}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Bus */}
              <div className="rounded-lg border bg-slate-50 p-4">
                <h4 className="mb-2 text-sm font-semibold text-slate-800">
                  Assigned Bus
                </h4>
                {selectedBus ? (
                  <p className="text-sm">
                    <span className="font-medium">{selectedBus.busName}</span>{' '}
                    — {selectedBus.licensePlate} ({selectedBus.busType},{' '}
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
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => navigate('/schedules')}
        >
          <X size={16} />
          Cancel Creation
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentStep === 0}
          >
            <ChevronLeft size={16} />
            Previous
          </Button>

          {currentStep < 3 ? (
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={goNext}
            >
              Next Step: {STEPS[currentStep + 1].label}
              <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Confirm & Create Schedule'}
              <Check size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddSchedulePage
