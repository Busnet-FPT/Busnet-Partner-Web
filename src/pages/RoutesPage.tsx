import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Switch } from '@/components/ui/switch'
import api from '@/services/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import {
  PlusCircle,
  Route,
  MapPin,
  Clock,
  Eye,
  Trash2,
} from 'lucide-react'

interface RouteItem {
  _id: string
  routeName: string

  origin_provinceName: string
  destination_provinceName: string

  distanceKm: number
  estimatedDuration: number

  isActive: boolean
  isPopular: boolean

  createdAt: string
}

function RoutesPage() {
  const navigate = useNavigate()

  const [routes, setRoutes] = useState<RouteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusTarget, setStatusTarget] = useState<RouteItem | null>(null)
  const [newStatus, setNewStatus] = useState<boolean>(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [tripConflictOpen, setTripConflictOpen] =
    useState(false)
  const [conflictMessage, setConflictMessage] =
    useState('')

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await api.get('/partner/routes')

        setRoutes(res.data?.data || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchRoutes()
  }, [])

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours === 0) return `${mins} mins`

    return `${hours}h ${mins}m`
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading routes...
      </div>
    )
  }

  const handleToggleStatus = async () => {
    if (!statusTarget) return

    setUpdatingStatus(true)

    try {
      const res = await api.patch(
        `/partner/routes/${statusTarget._id}/status`,
        { isActive: newStatus }
      )

      const updatedRoute = res.data.data

      setRoutes((prev) =>
        prev.map((route) =>
          route._id === statusTarget._id
            ? updatedRoute
            : route
        )
      )

      setStatusTarget(null)
    } catch (error: any) {
      console.error(error)

      if (error.response?.status === 409) {
        setConflictMessage(
          error.response?.data?.message ||
          'This route has future trips and cannot be disabled.'
        )

        setTripConflictOpen(true)
        setStatusTarget(null)
      }
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Routes</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage transportation routes.
          </p>
        </div>

        <Button
          className="bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => navigate('/routes/add')}
        >
          <PlusCircle size={16} />
          Add Route
        </Button>
      </div>

      {routes.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white py-16 text-center">
          <Route size={48} className="mx-auto mb-3 text-slate-300" />

          <p className="text-slate-500">No routes found.</p>

          <Button
            className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => navigate('/routes/add')}
          >
            <PlusCircle size={16} />
            Add Route
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {routes.map((route) => (
            <div
              key={route._id}
              className="flex items-center justify-between rounded-xl border bg-white p-5 shadow-xs transition hover:shadow-sm"
            >
              <div className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Route size={20} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      {route.routeName}
                    </h3>

                    <Badge
                      className={
                        route.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }
                    >
                      {route.isActive ? 'Active' : 'Inactive'}
                    </Badge>

                    {route.isPopular && (
                      <Badge className="bg-yellow-100 text-yellow-700">
                        Popular
                      </Badge>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {route.origin_provinceName} →
                      {route.destination_provinceName}
                    </span>

                    <span className="flex items-center gap-1">
                      <Route size={12} />
                      {route.distanceKm} km
                    </span>

                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDuration(
                        route.estimatedDuration
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">

                <Switch
                  checked={route.isActive}
                  onCheckedChange={(checked) => {
                    setStatusTarget(route)
                    setNewStatus(checked)
                  }}
                />

                <Button
                  variant="outline"
                  size="icon"
                  className="text-blue-600 hover:bg-blue-50"
                  onClick={() =>
                    navigate(`/routes/${route._id}`)
                  }
                >
                  <Eye size={16} />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>

              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => {
          if (!open) setStatusTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newStatus ? 'Enable Route' : 'Disable Route'}
            </DialogTitle>

            <DialogDescription>
              Are you sure you want to{' '}
              <span className="font-semibold">
                {newStatus ? 'enable' : 'disable'}
              </span>{' '}
              route{' '}
              <span className="font-semibold text-slate-900">
                {statusTarget?.routeName}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setStatusTarget(null)}
              disabled={updatingStatus}
            >
              Cancel
            </Button>

            <Button
              className={
                newStatus
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }
              onClick={handleToggleStatus}
              disabled={updatingStatus}
            >
              {updatingStatus
                ? 'Processing...'
                : newStatus
                  ? 'Enable'
                  : 'Disable'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={tripConflictOpen}
        onOpenChange={setTripConflictOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Cannot Disable Route
            </DialogTitle>

            <DialogDescription>
              {conflictMessage}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end pt-4">
            <Button
              onClick={() => setTripConflictOpen(false)}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
    </div>
  )

}

export default RoutesPage