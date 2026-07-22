import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  History,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react'

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
  autoRenew: boolean
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
}

type HistoryItem = {
  _id: string
  transactionId: string | null
  subscriptionDate: string
  expirationDate: string
  status: string
  plan: Pick<Plan, '_id' | 'planName' | 'code' | 'price' | 'discount' | 'durationDays'> | null
}

type Overview = {
  subscription: Subscription | null
  pendingPayment: Payment | null
  history: HistoryItem[]
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

function SubscriptionPage() {
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
          `/partner/subscription/renew/${paymentTransactionId}/status`,
        )
        const next = response.data.data as Payment
        setPayment(next)

        if (next.status === 'SUCCESS') {
          setSuccess('Payment confirmed. Your subscription has been extended successfully.')
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

  const startRenewal = async () => {
    setRenewing(true)
    setError('')
    setSuccess('')
    try {
      const response = await api.post('/partner/subscription/renew')
      const nextPayment = response.data.data.payment as Payment
      setPayment(nextPayment)
      setPaymentOpen(true)
    } catch (renewError) {
      setError(getErrorMessage(renewError))
    } finally {
      setRenewing(false)
    }
  }

  const cancelPayment = async () => {
    if (!payment) return
    setCancelling(true)
    try {
      await api.post(`/partner/subscription/renew/${payment.transactionId}/cancel`)
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
        <div>
          <h2 className="text-2xl font-bold">Subscription</h2>
          <p className="text-slate-500">Manage your current plan and extend its validity.</p>
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
                  <p className="mt-1 font-semibold">{subscription.daysRemaining} days</p>
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
                Extend current plan
              </CardTitle>
              <CardDescription>
                Renewal time is added after your current expiration date.
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
                disabled={!subscription.canRenew || renewing}
                onClick={startRenewal}
              >
                {renewing ? <LoaderCircle className="animate-spin" /> : <CreditCard />}
                {renewing ? 'Preparing payment...' : 'Renew subscription'}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck size={13} /> Secure payment confirmation via SePay
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {(() => {
        const historyList = overview?.history || []
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History size={18} className="text-blue-600" />
                Renewal history
              </CardTitle>
              <CardDescription>Up to 20 most recent subscription periods.</CardDescription>
            </CardHeader>
            <CardContent>
              {!historyList.length ? (
                <div className="py-8 text-center text-sm text-slate-400">No renewal history yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyList.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <p className="font-medium">{item.plan?.planName || 'Unknown plan'}</p>
                      <p className="text-xs text-slate-400">{item.plan?.code}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(item.subscriptionDate)} – {formatDate(item.expirationDate)}
                    </TableCell>
                    <TableCell>{item.plan?.durationDays || '—'} days</TableCell>
                    <TableCell>
                      <Badge className={statusClass[item.status] || 'bg-slate-100 text-slate-600'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    )
  })()}

      <Dialog open={paymentOpen} onOpenChange={(open) => {
        if (!open && payment?.status === 'PROCESSING') return
        setPaymentOpen(open)
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Renew subscription payment</DialogTitle>
            <DialogDescription>
              Scan the QR code or transfer with the exact amount and content below.
            </DialogDescription>
          </DialogHeader>

          {payment && (
            payment.status === 'SUCCESS' ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto mb-3 text-green-600" size={52} />
                <h3 className="text-lg font-semibold">Subscription renewed</h3>
                <p className="mt-1 text-sm text-slate-500">Your new expiration date is now active.</p>
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

export default SubscriptionPage
