import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import {
  DollarSign,
  Route,
  Package,
  Clock,
  Eye,
  CreditCard,
  Calendar
} from 'lucide-react'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Search } from 'lucide-react'

interface SubscriptionItem {
  _id: string

  subscriptionDate: string
  expirationDate: string
  subscriptionStatus:
  | 'ACTIVE'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'PENDING'

  plan: {
    _id: string
    planName: string
    code: string
    price: number
    durationDays: number
    discount: number
  }
}

function SubscriptionHistoryPage() {
  const navigate = useNavigate()

  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [loading, setLoading] = useState(true)

  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const fetchSubscriptions = async () => {
    setLoading(true)

    try {
      const params: any = {}

      if (keyword.trim()) {
        params.keyword = keyword
      }

      if (statusFilter !== 'ALL') {
        params.subscriptionStatus = statusFilter
      }

      const res = await api.get(
        '/partner/subscription',
        {
          params,
        }
      )

      setSubscriptions(res.data.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading subscriptions...
      </div>
    )
  }



  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Subscription History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            View all subscription plans you have purchased.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

        <div className="relative w-full md:max-w-md">

          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <Input
            placeholder="Search by plan name or code..."
            value={keyword}
            onChange={(e) =>
              setKeyword(e.target.value)
            }
            className="pl-9"
          />

        </div>

        <div className="flex gap-3">

          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">
                All Status
              </SelectItem>

              <SelectItem value="ACTIVE">
                Active
              </SelectItem>

              <SelectItem value="EXPIRED">
                Expired
              </SelectItem>

              <SelectItem value="CANCELLED">
                Cancelled
              </SelectItem>

              <SelectItem value="PENDING">
                Pending
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={fetchSubscriptions}
          >
            Search
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setKeyword('')
              setStatusFilter('ALL')

              api
                .get('/partner/subscriptions')
                .then((res) =>
                  setSubscriptions(res.data.data)
                )
            }}
          >
            Reset
          </Button>

        </div>

      </div>

      {subscriptions.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white py-16 text-center">
          <Route size={48} className="mx-auto mb-3 text-slate-300" />

          <p className="text-slate-500">No subscriptions history found.</p>

        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((subscription) => (
            <div
              key={subscription._id}
              className="flex items-center justify-between rounded-xl border bg-white p-5 shadow-xs hover:shadow-sm"
            >
              <div className="flex gap-4">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <CreditCard size={20} />
                </div>

                <div>

                  <div className="flex items-center gap-2">

                    <h3 className="font-semibold">
                      {subscription.plan.planName}
                    </h3>

                    <Badge variant="outline">
                      {subscription.plan.code}
                    </Badge>

                    {subscription.subscriptionStatus ===
                      'ACTIVE' && (
                        <Badge className="bg-green-100 text-green-700">
                          Active
                        </Badge>
                      )}

                    {subscription.subscriptionStatus ===
                      'EXPIRED' && (
                        <Badge className="bg-gray-100 text-gray-700">
                          Expired
                        </Badge>
                      )}

                    {subscription.subscriptionStatus ===
                      'CANCELLED' && (
                        <Badge className="bg-red-100 text-red-700">
                          Cancelled
                        </Badge>
                      )}

                    {subscription.subscriptionStatus ===
                      'PENDING' && (
                        <Badge className="bg-yellow-100 text-yellow-700">
                          Pending
                        </Badge>
                      )}

                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">

                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      Start:
                      {new Date(
                        subscription.subscriptionDate
                      ).toLocaleDateString()}
                    </span>

                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Expire:
                      {new Date(
                        subscription.expirationDate
                      ).toLocaleDateString()}
                    </span>

                    <span className="flex items-center gap-1">
                      <DollarSign size={12} />
                      {subscription.plan.price.toLocaleString()} VND
                    </span>

                    <span className="flex items-center gap-1">
                      <Package size={12} />
                      {subscription.plan.durationDays} days
                    </span>

                  </div>

                </div>

              </div>

              <Button
                variant="outline"
                size="icon"
                className="text-blue-600 hover:bg-blue-50"
                onClick={() =>
                  navigate(
                    `/subscriptions/${subscription._id}`
                  )
                }
              >
                <Eye size={16} />
              </Button>

            </div>
          ))}
        </div>
      )}

    </div>
  )

}

export default SubscriptionHistoryPage