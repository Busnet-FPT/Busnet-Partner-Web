import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowLeft,
  Banknote,
  Bus,
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit,
  MapPin,
  Plus,
  RotateCcw,
  Save,
  Ticket,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import api from '@/services/api'

type EffectiveStatus = 'ACTIVE' | 'UPCOMING' | 'EXPIRED'

interface TicketPrice {
  _id: string
  seatType: string
  basePrice: number
  discount: number
  finalPrice: number
  effectiveFrom: string
  effectiveTo: string | null
  effectiveStatus: EffectiveStatus
  isActive: boolean
}

interface ScheduleSummary {
  _id: string
  scheduleCode: string
  basePrice: number
  departureTime: string
  arrivalTime: string
  route?: {
    routeName: string
    origin_provinceName: string
    destination_provinceName: string
  }
  bus?: {
    busName: string
    licensePlate: string
  }
}

interface PriceForm {
  seatType: string
  price: string
  discount: string
  effectiveFrom: string
  effectiveTo: string
  isActive: boolean
}

interface TicketPricesResponseData {
  schedule: ScheduleSummary | null
  tickets: TicketPrice[]
}

const emptyForm: PriceForm = {
  seatType: '',
  price: '',
  discount: '0',
  effectiveFrom: '',
  effectiveTo: '',
  isActive: true,
}

const statusStyles: Record<EffectiveStatus, string> = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  UPCOMING: 'border-amber-200 bg-amber-50 text-amber-700',
  EXPIRED: 'border-slate-200 bg-slate-100 text-slate-600',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string | null) {
  if (!value) return 'No end date'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function toDateTimeLocal(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || 'Failed to save ticket price.'
  }
  return 'Failed to save ticket price.'
}

function SetTicketPricePage() {
  const navigate = useNavigate()
  const { scheduleId } = useParams<{ scheduleId: string }>()
  const [schedule, setSchedule] = useState<ScheduleSummary | null>(null)
  const [ticketPrices, setTicketPrices] = useState<TicketPrice[]>([])
  const [form, setForm] = useState<PriceForm>(emptyForm)
  const [editTarget, setEditTarget] = useState<TicketPrice | null>(null)
  const [editForm, setEditForm] = useState<PriceForm>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [editError, setEditError] = useState('')
  const [success, setSuccess] = useState('')

  const requestTicketPrices = useCallback(async (): Promise<TicketPricesResponseData> => {
    const response = await api.get(
      `/partner/schedules/${scheduleId}/ticket-prices`,
      { params: { page: 1, limit: 100, includeInactive: true } },
    )
    return {
      schedule: response.data.data?.schedule ?? null,
      tickets: response.data.data?.tickets ?? [],
    }
  }, [scheduleId])

  useEffect(() => {
    let active = true

    requestTicketPrices()
      .then((data) => {
        if (!active) return
        setSchedule(data.schedule)
        setTicketPrices(data.tickets)
      })
      .catch(() => {
        if (active) setError('Failed to load ticket price configurations.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [requestTicketPrices])

  const finalPrice = useMemo(() => {
    const price = Number(form.price) || 0
    const discount = Number(form.discount) || 0
    return Math.max(price - discount, 0)
  }, [form.discount, form.price])

  const editFinalPrice = useMemo(() => {
    const price = Number(editForm.price) || 0
    const discount = Number(editForm.discount) || 0
    return Math.max(price - discount, 0)
  }, [editForm.discount, editForm.price])

  const updateField = <K extends keyof PriceForm>(key: K, value: PriceForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
    setSuccess('')
  }

  const resetForm = () => {
    setForm(emptyForm)
    setError('')
    setSuccess('')
  }

  const startEditing = (ticketPrice: TicketPrice) => {
    setEditTarget(ticketPrice)
    setEditForm({
      seatType: ticketPrice.seatType,
      price: String(ticketPrice.basePrice),
      discount: String(ticketPrice.discount),
      effectiveFrom: toDateTimeLocal(ticketPrice.effectiveFrom),
      effectiveTo: toDateTimeLocal(ticketPrice.effectiveTo),
      isActive: ticketPrice.isActive,
    })
    setEditError('')
  }

  const validateForm = (targetForm: PriceForm) => {
    const price = Number(targetForm.price)
    const discount = Number(targetForm.discount || 0)

    if (!targetForm.seatType.trim()) return 'Seat type is required.'
    if (!targetForm.price || Number.isNaN(price) || price < 0) {
      return 'Base price must be a non-negative number.'
    }
    if (Number.isNaN(discount) || discount < 0) {
      return 'Discount must be a non-negative number.'
    }
    if (discount > price) return 'Discount cannot exceed the base price.'
    if (!targetForm.effectiveFrom) return 'Effective from is required.'
    if (
      targetForm.effectiveTo &&
      new Date(targetForm.effectiveFrom) >= new Date(targetForm.effectiveTo)
    ) {
      return 'Effective from must be earlier than effective to.'
    }
    return ''
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validateForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    const payload = {
      seatType: form.seatType.trim().toUpperCase(),
      price: Number(form.price),
      discount: Number(form.discount || 0),
      effectiveFrom: new Date(form.effectiveFrom).toISOString(),
      effectiveTo: form.effectiveTo
        ? new Date(form.effectiveTo).toISOString()
        : null,
      isActive: form.isActive,
    }

    try {
      await api.post(
        `/partner/schedules/${scheduleId}/ticket-prices`,
        payload,
      )
      setSuccess('Ticket price created successfully.')

      setForm(emptyForm)
      const refreshedData = await requestTicketPrices()
      setSchedule(refreshedData.schedule)
      setTicketPrices(refreshedData.tickets)
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  const updateEditField = <K extends keyof PriceForm>(
    key: K,
    value: PriceForm[K],
  ) => {
    setEditForm((current) => ({ ...current, [key]: value }))
    setEditError('')
  }

  const handleEditSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!editTarget) return

    const validationError = validateForm(editForm)
    if (validationError) {
      setEditError(validationError)
      return
    }

    setEditSubmitting(true)
    setEditError('')

    try {
      await api.put(
        `/partner/schedules/${scheduleId}/ticket-prices/${editTarget._id}`,
        {
          seatType: editForm.seatType.trim().toUpperCase(),
          price: Number(editForm.price),
          discount: Number(editForm.discount || 0),
          effectiveFrom: new Date(editForm.effectiveFrom).toISOString(),
          effectiveTo: editForm.effectiveTo
            ? new Date(editForm.effectiveTo).toISOString()
            : null,
          isActive: editForm.isActive,
        },
      )

      const refreshedData = await requestTicketPrices()
      setSchedule(refreshedData.schedule)
      setTicketPrices(refreshedData.tickets)
      setEditTarget(null)
      setSuccess('Ticket price updated successfully.')
    } catch (submitError) {
      setEditError(getErrorMessage(submitError))
    } finally {
      setEditSubmitting(false)
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Loading ticket prices...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/schedules/${scheduleId}`)}
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Set Ticket Price</h2>
            <p className="mt-1 text-sm text-slate-500">
              {schedule
                ? `${schedule.scheduleCode} · ${schedule.route?.routeName || 'Schedule'}`
                : 'Create and manage fare configurations for this schedule.'}
            </p>
          </div>
        </div>
      </div>

      {schedule && (
        <Card>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">Route</p>
              <p className="mt-1 flex items-center gap-2 font-medium text-slate-900">
                <MapPin size={15} className="text-blue-600" />
                {schedule.route
                  ? `${schedule.route.origin_provinceName} → ${schedule.route.destination_provinceName}`
                  : 'Not assigned'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">Time</p>
              <p className="mt-1 flex items-center gap-2 font-medium text-slate-900">
                <Clock size={15} className="text-blue-600" />
                {schedule.departureTime} → {schedule.arrivalTime}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">Bus</p>
              <p className="mt-1 flex items-center gap-2 font-medium text-slate-900">
                <Bus size={15} className="text-blue-600" />
                {schedule.bus
                  ? `${schedule.bus.busName} (${schedule.bus.licensePlate})`
                  : 'Not assigned'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">
                Schedule Base Price
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatCurrency(schedule.basePrice)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus size={18} />
              New Ticket Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="seatType">Seat Type *</Label>
                <Input
                  id="seatType"
                  value={form.seatType}
                  onChange={(event) => updateField('seatType', event.target.value)}
                  placeholder="e.g. STANDARD, VIP"
                  maxLength={50}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Base Price (VND) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="1000"
                    value={form.price}
                    onChange={(event) => updateField('price', event.target.value)}
                    placeholder="150000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (VND)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    step="1000"
                    value={form.discount}
                    onChange={(event) => updateField('discount', event.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-medium uppercase text-blue-600">Final Price</p>
                <p className="mt-1 text-xl font-bold text-blue-700">
                  {formatCurrency(finalPrice)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveFrom">Effective From *</Label>
                <Input
                  id="effectiveFrom"
                  type="datetime-local"
                  value={form.effectiveFrom}
                  onChange={(event) =>
                    updateField('effectiveFrom', event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="effectiveTo">Effective To</Label>
                <Input
                  id="effectiveTo"
                  type="datetime-local"
                  value={form.effectiveTo}
                  min={form.effectiveFrom || undefined}
                  onChange={(event) => updateField('effectiveTo', event.target.value)}
                />
                <p className="text-xs text-slate-400">
                  Leave empty if this price has no end date.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="isActive">Active price</Label>
                  <p className="mt-1 text-xs text-slate-400">
                    Inactive prices are not used for booking.
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(checked) => updateField('isActive', checked)}
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle2 size={16} />
                  {success}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                  disabled={submitting}
                >
                  <Save size={16} />
                  {submitting ? 'Saving...' : 'Set Price'}
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={resetForm}>
                  <RotateCcw size={16} />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h3 className="font-semibold text-slate-900">Price Configurations</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {ticketPrices.length} configuration{ticketPrices.length === 1 ? '' : 's'}
              </p>
            </div>
            <Ticket size={20} className="text-blue-600" />
          </div>

          {ticketPrices.length === 0 ? (
            <div className="py-16 text-center">
              <Banknote size={44} className="mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-600">No ticket prices yet</p>
              <p className="mt-1 text-sm text-slate-400">
                Use the form to create the first fare configuration.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="px-5">Seat Type</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Final Price</TableHead>
                  <TableHead>Effective Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="px-5 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketPrices.map((ticketPrice) => (
                  <TableRow key={ticketPrice._id}>
                    <TableCell className="px-5 font-semibold text-slate-900">
                      {ticketPrice.seatType}
                    </TableCell>
                    <TableCell>{formatCurrency(ticketPrice.basePrice)}</TableCell>
                    <TableCell className="text-red-600">
                      {ticketPrice.discount > 0
                        ? `−${formatCurrency(ticketPrice.discount)}`
                        : '—'}
                    </TableCell>
                    <TableCell className="font-semibold text-blue-700">
                      {formatCurrency(ticketPrice.finalPrice)}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p className="flex items-center gap-1 font-medium text-slate-700">
                          <CalendarDays size={12} />
                          {formatDate(ticketPrice.effectiveFrom)}
                        </p>
                        <p className="mt-0.5 text-slate-400">
                          to {formatDate(ticketPrice.effectiveTo)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ticketPrice.isActive ? (
                        <Badge className={statusStyles[ticketPrice.effectiveStatus]}>
                          {ticketPrice.effectiveStatus}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-100 text-slate-500">
                          DISABLED
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 hover:bg-blue-50"
                        onClick={() => startEditing(ticketPrice)}
                      >
                        <Edit size={15} />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <Dialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open && !editSubmitting) {
            setEditTarget(null)
            setEditError('')
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Ticket Price</DialogTitle>
            <DialogDescription>
              Update the {editTarget?.seatType} fare configuration without
              changing the new-price form.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleEditSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editSeatType">Seat Type *</Label>
                <Input
                  id="editSeatType"
                  value={editForm.seatType}
                  onChange={(event) =>
                    updateEditField('seatType', event.target.value)
                  }
                  maxLength={50}
                />
              </div>
              <div className="flex items-end">
                <div className="flex w-full items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="editIsActive">Active price</Label>
                    <p className="mt-1 text-xs text-slate-400">
                      Used for customer booking.
                    </p>
                  </div>
                  <Switch
                    id="editIsActive"
                    checked={editForm.isActive}
                    onCheckedChange={(checked) =>
                      updateEditField('isActive', checked)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editPrice">Base Price (VND) *</Label>
                <Input
                  id="editPrice"
                  type="number"
                  min="0"
                  step="1000"
                  value={editForm.price}
                  onChange={(event) =>
                    updateEditField('price', event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDiscount">Discount (VND)</Label>
                <Input
                  id="editDiscount"
                  type="number"
                  min="0"
                  step="1000"
                  value={editForm.discount}
                  onChange={(event) =>
                    updateEditField('discount', event.target.value)
                  }
                />
              </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-medium uppercase text-blue-600">
                Final Price
              </p>
              <p className="mt-1 text-xl font-bold text-blue-700">
                {formatCurrency(editFinalPrice)}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editEffectiveFrom">Effective From *</Label>
                <Input
                  id="editEffectiveFrom"
                  type="datetime-local"
                  value={editForm.effectiveFrom}
                  onChange={(event) =>
                    updateEditField('effectiveFrom', event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEffectiveTo">Effective To</Label>
                <Input
                  id="editEffectiveTo"
                  type="datetime-local"
                  value={editForm.effectiveTo}
                  min={editForm.effectiveFrom || undefined}
                  onChange={(event) =>
                    updateEditField('effectiveTo', event.target.value)
                  }
                />
              </div>
            </div>

            {editError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {editError}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={editSubmitting}
                onClick={() => setEditTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 text-white hover:bg-blue-700"
                disabled={editSubmitting}
              >
                <Save size={16} />
                {editSubmitting ? 'Updating...' : 'Update Price'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SetTicketPricePage
