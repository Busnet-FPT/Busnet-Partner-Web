import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import api from '@/services/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
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

type Plan = {
  _id: string
  planName: string
  code: string
  description: string
  price: number
  discount: number
  renewalPrice: number
  durationDays: number
  planFeatures: string[]
  maxBuses: number
  maxRoutes: number
  status: string
}

type Subscription = {
  _id: string
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING'
  subscriptionDate: string
  expirationDate: string
  daysRemaining: number
  remainingTime: {
    milliseconds: number
    days: number
    hours: number
    minutes: number
    expired: boolean
  }
  autoRenew: boolean
  canExtend: boolean
  canRenew: boolean
  plan: Plan | null
}

type Payment = {
  transactionId: string
  amount: number
  currency: string
  content: string
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELLED'
  expiresAt: string
  qrUrl: string
  bank: string
  accountNumber: string
  operation?: 'EXTEND' | 'RENEW' | null
  planName?: string | null
  queuedSubscription?: {
    status: string
    scheduledStartDate: string
    scheduledExpirationDate: string
    plan: Pick<Plan, '_id' | 'planName' | 'code' | 'durationDays'> | null
  } | null
}

type Overview = {
  subscription: Subscription | null
  pendingPayment: Payment | null
  queue: QueueItem[]
}

type QueueItem = {
  position: number
  _id: string
  operation: 'INITIAL' | 'EXTEND' | 'RENEW'
  scheduledStartDate: string
  scheduledExpirationDate: string
  status: string
  plan: Pick<Plan, '_id' | 'planName' | 'code' | 'durationDays'> | null
}

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat('vi-VN').format(value)} VND`

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

const getErrorMessage = (error: unknown) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = error.response as { data?: { message?: string } }
    if (response.data?.message) return response.data.message
  }
  return 'Something went wrong. Please try again.'
}

const statusClass: Record<string, string> = {
  ACTIVE: 'border-green-200 bg-green-50 text-green-700',
  EXPIRED: 'border-red-200 bg-red-50 text-red-700',
  CANCELLED: 'border-slate-200 bg-slate-100 text-slate-600',
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  SUCCESS: 'border-green-200 bg-green-50 text-green-700',
  FAILED: 'border-red-200 bg-red-50 text-red-700',
}

function CurrentSubscriptionPage() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [renewing, setRenewing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copied, setCopied] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [renewOptions, setRenewOptions] = useState<Plan[]>([])
  const [renewDialogOpen, setRenewDialogOpen] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState('')

  const fetchOverview = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true)
    try {
      const response = await api.get('/partner/subscription/overview')
      const data = response.data.data as Overview
      setOverview(data)
      if (data.pendingPayment) {
        setPayment(data.pendingPayment)
        setPaymentOpen(true)
      }
      setError('')
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchOverview(true), 0)
    return () => window.clearTimeout(timer)
  }, [fetchOverview])

  const paymentTransactionId = payment?.transactionId
  const paymentStatus = payment?.status
  const paymentExpiresAt = payment?.expiresAt

  useEffect(() => {
    if (
      !paymentTransactionId ||
      !paymentStatus ||
      !paymentExpiresAt ||
      !['PENDING', 'PROCESSING'].includes(paymentStatus)
    ) return

    const updateCountdown = () => {
      setSecondsLeft(
        Math.max(0, Math.floor((new Date(paymentExpiresAt).getTime() - Date.now()) / 1000)),
      )
    }
    const countdown = window.setInterval(updateCountdown, 1000)

    const poll = window.setInterval(async () => {
      try {
        const response = await api.get(
          `/partner/subscription/payments/${paymentTransactionId}/status`,
        )
        const next = response.data.data as Payment
        setPayment(next)

        if (next.status === 'SUCCESS') {
          const action = next.operation === 'RENEW' ? 'renewal' : 'extension'
          setSuccess(`Payment confirmed. Your ${action} has been added to the subscription queue.`)
          await fetchOverview()
        } else if (['FAILED', 'EXPIRED', 'CANCELLED'].includes(next.status)) {
          setError(`Renewal payment is ${next.status.toLowerCase()}.`)
        }
      } catch (pollError) {
        setError(getErrorMessage(pollError))
      }
    }, 3000)

    return () => {
      window.clearInterval(countdown)
      window.clearInterval(poll)
    }
  }, [paymentTransactionId, paymentStatus, paymentExpiresAt, fetchOverview])

  const projectedExpiration = useMemo(() => {
    const subscription = overview?.subscription
    const plan = subscription?.plan
    if (!subscription || !plan) return null
    const currentExpiration = new Date(subscription.expirationDate)
    const base = currentExpiration > new Date() ? currentExpiration : new Date()
    return new Date(base.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
  }, [overview])

  const startPayment = async (operation: 'EXTEND' | 'RENEW', planId?: string) => {
    setRenewing(true)
    setError('')
    setSuccess('')
    try {
      const response = operation === 'EXTEND'
        ? await api.post('/partner/subscription/extend')
        : await api.post('/partner/subscription/renew', { planId })
      const nextPayment = response.data.data.payment as Payment
      setPayment(nextPayment)
      setPaymentOpen(true)
      setRenewDialogOpen(false)
    } catch (renewError) {
      setError(getErrorMessage(renewError))
    } finally {
      setRenewing(false)
    }
  }

  const openRenewDialog = async () => {
    setRenewDialogOpen(true)
    setLoadingPlans(true)
    setError('')
    try {
      const response = await api.get('/partner/subscription/renew-options')
      const options = response.data.data as Plan[]
      setRenewOptions(options)
      setSelectedPlanId(options[0]?._id || '')
    } catch (plansError) {
      setError(getErrorMessage(plansError))
    } finally {
      setLoadingPlans(false)
    }
  }

  const cancelPayment = async () => {
    if (!payment) return
    setCancelling(true)
    try {
      await api.post(`/partner/subscription/payments/${payment.transactionId}/cancel`)
      setPayment(null)
      setPaymentOpen(false)
      setSuccess('Pending renewal payment cancelled.')
      await fetchOverview()
    } catch (cancelError) {
      setError(getErrorMessage(cancelError))
    } finally {
      setCancelling(false)
    }
  }

  const copyValue = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1500)
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center text-slate-500">
        <LoaderCircle className="mr-2 animate-spin" size={20} />
        Loading subscription...
      </div>
    )
  }

  const subscription = overview?.subscription
  const plan = subscription?.plan

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/subscription')}>
            <ArrowLeft size={17} />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Current subscription</h2>
            <p className="text-slate-500">View your current plan, remaining time and upcoming plans.</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => fetchOverview()}>
          <RefreshCw size={15} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      {!subscription || !plan ? (
        <Card>
          <CardContent className="py-14 text-center">
            <XCircle className="mx-auto mb-3 text-slate-300" size={44} />
            <h3 className="font-semibold">No subscription found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Contact BusNet support to review your partner subscription.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-blue-600" />
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <CardTitle className="text-xl">{plan.planName}</CardTitle>
                    <Badge variant="outline">{plan.code}</Badge>
                  </div>
                  <CardDescription>{plan.description || 'Your BusNet partner plan'}</CardDescription>
                </div>
                <Badge className={statusClass[subscription.status]}>
                  {subscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">Expires</p>
                  <p className="mt-1 font-semibold">{formatDate(subscription.expirationDate)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">Remaining</p>
                  <p className="mt-1 font-semibold">
                    {subscription.remainingTime.expired
                      ? 'Expired'
                      : `${subscription.remainingTime.days}d ${subscription.remainingTime.hours}h ${subscription.remainingTime.minutes}m`}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">Plan duration</p>
                  <p className="mt-1 font-semibold">{plan.durationDays} days</p>
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold">Included in your plan</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[`Up to ${plan.maxBuses} buses`, `Up to ${plan.maxRoutes} routes`, ...(plan.planFeatures || [])]
                    .filter(Boolean)
                    .map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="text-green-600" size={15} />
                        {feature}
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="text-blue-600" size={18} />
                Manage subscription
              </CardTitle>
              <CardDescription>
                Extend this plan or renew with a different available plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-slate-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Extension</span>
                  <span className="font-medium">+{plan.durationDays} days</span>
                </div>
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-slate-500">New expiration</span>
                  <span className="font-medium">
                    {projectedExpiration ? formatDate(projectedExpiration.toISOString()) : '—'}
                  </span>
                </div>
                <div className="mt-4 border-t pt-4">
                  <div className="flex items-end justify-between">
                    <span className="text-sm text-slate-500">Renewal total</span>
                    <span className="text-xl font-bold text-blue-700">
                      {formatCurrency(plan.renewalPrice)}
                    </span>
                  </div>
                  {plan.discount > 0 && (
                    <p className="mt-1 text-right text-xs text-green-600">
                      Includes {plan.discount}% discount
                    </p>
                  )}
                </div>
              </div>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!subscription.canExtend || renewing}
                onClick={() => startPayment('EXTEND')}
              >
                {renewing ? <LoaderCircle className="animate-spin" /> : <CreditCard />}
                {renewing ? 'Preparing payment...' : 'Extend current plan'}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={!subscription.canRenew || renewing}
                onClick={openRenewDialog}
              >
                <RefreshCw />
                Renew with another plan
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck size={13} /> Secure payment confirmation via SePay
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays size={18} className="text-blue-600" />
            Subscription queue
          </CardTitle>
          <CardDescription>
            Paid plans start automatically in this order after the current plan expires.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!overview?.queue?.length ? (
            <div className="py-8 text-center text-sm text-slate-400">No plans are waiting in the queue.</div>
          ) : (
            <div className="space-y-3">
              {overview.queue.map((item) => (
                <div key={item._id} className="flex flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-700">
                      {item.position}
                    </div>
                    <div>
                      <p className="font-semibold">{item.plan?.planName || 'Unknown plan'}</p>
                      <p className="text-xs text-slate-500">
                        {item.operation === 'EXTEND' ? 'Extension' : 'Plan renewal'} · {item.plan?.code}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm sm:text-right">
                    <p className="font-medium">
                      {formatDate(item.scheduledStartDate)} – {formatDate(item.scheduledExpirationDate)}
                    </p>
                    <Badge className="mt-1 border-amber-200 bg-amber-50 text-amber-700">Waiting</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Renew with another plan</DialogTitle>
            <DialogDescription>
              Choose a different plan. If your current plan still has time left, the new plan will wait in the queue.
            </DialogDescription>
          </DialogHeader>
          {loadingPlans ? (
            <div className="flex justify-center py-12 text-slate-500">
              <LoaderCircle className="mr-2 animate-spin" /> Loading plans...
            </div>
          ) : renewOptions.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-slate-500">
              No other active subscription plans are available.
            </div>
          ) : (
            <div className="grid max-h-[420px] gap-3 overflow-y-auto py-1 sm:grid-cols-2">
              {renewOptions.map((option) => {
                const finalPrice = Math.max(0, Math.round(option.price * (1 - (option.discount || 0) / 100)))
                const selected = selectedPlanId === option._id
                return (
                  <button
                    type="button"
                    key={option._id}
                    onClick={() => setSelectedPlanId(option._id)}
                    className={`rounded-xl border p-4 text-left transition ${selected ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'hover:border-slate-300'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{option.planName}</p>
                        <p className="text-xs text-slate-500">{option.code}</p>
                      </div>
                      {selected && <CheckCircle2 className="text-blue-600" size={20} />}
                    </div>
                    <p className="mt-3 text-xl font-bold text-blue-700">{formatCurrency(finalPrice)}</p>
                    <p className="mt-1 text-xs text-slate-500">{option.durationDays} days · {option.maxBuses} buses · {option.maxRoutes} routes</p>
                  </button>
                )
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!selectedPlanId || renewing}
              onClick={() => startPayment('RENEW', selectedPlanId)}
            >
              {renewing ? <LoaderCircle className="animate-spin" /> : <CreditCard />}
              Continue to payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentOpen} onOpenChange={(open) => {
        if (!open && payment?.status === 'PROCESSING') return
        setPaymentOpen(open)
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{payment?.operation === 'RENEW' ? 'Renew subscription payment' : 'Extend subscription payment'}</DialogTitle>
            <DialogDescription>
              Scan the QR code or transfer with the exact amount and content below.
            </DialogDescription>
          </DialogHeader>

          {payment && (
            payment.status === 'SUCCESS' ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto mb-3 text-green-600" size={52} />
                <h3 className="text-lg font-semibold">Payment confirmed</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Your paid plan has been added to the queue and will activate automatically.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-[220px_1fr]">
                <div className="flex flex-col items-center rounded-xl border bg-white p-3">
                  <img src={payment.qrUrl} alt="Subscription renewal QR code" className="h-48 w-48" />
                  <Badge className="mt-2 border-amber-200 bg-amber-50 text-amber-700">
                    {payment.status === 'PROCESSING' ? 'Confirming payment' : 'Awaiting payment'}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {[
                    ['Bank', payment.bank],
                    ['Account number', payment.accountNumber],
                    ['Amount', formatCurrency(payment.amount)],
                    ['Transfer content', payment.content],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border px-3 py-2.5">
                      <p className="text-xs text-slate-400">{label}</p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="break-all text-sm font-semibold">{value}</p>
                        {label !== 'Bank' && (
                          <Button variant="ghost" size="icon-sm" onClick={() => copyValue(label, value)}>
                            {copied === label ? <Check className="text-green-600" /> : <Copy />}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock3 size={14} />
                    {secondsLeft > 0
                      ? `Payment expires in ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`
                      : 'Payment window expired'}
                  </div>
                </div>
              </div>
            )
          )}

          <DialogFooter>
            {payment && payment.status === 'PENDING' && (
              <Button variant="outline" disabled={cancelling} onClick={cancelPayment}>
                {cancelling ? 'Cancelling...' : 'Cancel payment'}
              </Button>
            )}
            <Button
              onClick={() => setPaymentOpen(false)}
              disabled={payment?.status === 'PROCESSING'}
            >
              {payment?.status === 'SUCCESS' ? 'Done' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CurrentSubscriptionPage
