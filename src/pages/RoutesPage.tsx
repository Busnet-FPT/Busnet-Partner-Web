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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  PlusCircle,
  Route,
  MapPin,
  Clock,
  Eye,
  Pencil,
  AlertTriangle,
  Crown
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

  // Route pending confirmation before navigating to its edit page,
  // shown only when the route is currently active (isActive === true).
  const [editTarget, setEditTarget] = useState<RouteItem | null>(null)
  const [disablingForEdit, setDisablingForEdit] = useState(false)

  const [page, setPage] = useState(1)

  const [totalPages, setTotalPages] = useState(1)
  const [totalRoutes, setTotalRoutes] = useState(0)


  const [inputKeyword, setInputKeyword] = useState("")
  const [keyword, setKeyword] = useState("")
  const [status, setStatus] = useState("all")

  const [routeLimit, setRouteLimit] = useState({
    current: 0,
    max: 0,
    canCreate: true,
  })


  const fetchRoutes = async () => {
    setLoading(true)

    try {
      const params: any = {
        page,
      }

      if (keyword) params.keyword = keyword
      if (status !== "all") params.isActive = status

      const res = await api.get("/partner/routes", {
        params,
      })

      setRoutes(res.data.data)

      setRouteLimit({
        current: res.data.usage.currentRoutes,
        max: res.data.usage.maxRoutes,
        canCreate: res.data.usage.canCreate,
      })

      setTotalPages(res.data.pagination.totalPages)
      setTotalRoutes(res.data.pagination.total)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoutes()
  }, [keyword, status, page])

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
      await api.patch(
        `/partner/routes/${statusTarget._id}/status`,
        { isActive: newStatus }
      )

      await fetchRoutes()

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

  // Clicking the pencil on an active route asks for confirmation first
  // (editing a live route can affect existing trips). Disabled routes
  // go straight to the edit page.
  const handleEditClick = (route: RouteItem) => {
    if (route.isActive) {
      setEditTarget(route)
    } else {
      navigate(`/routes/${route._id}/update`)
    }
  }

  const confirmEdit = async () => {
    if (!editTarget) return

    setDisablingForEdit(true)

    try {
      await api.patch(
        `/partner/routes/${editTarget._id}/status`,
        { isActive: false }
      )

      await fetchRoutes()

      navigate(`/routes/${editTarget._id}/update`)
      setEditTarget(null)
    } catch (error: any) {
      console.error(error)

      if (error.response?.status === 409) {
        setConflictMessage(
          error.response?.data?.message ||
          'This route has future trips and cannot be disabled.'
        )

        setTripConflictOpen(true)
      }

      setEditTarget(null)
    } finally {
      setDisablingForEdit(false)
    }
  }

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, i) => i + 1
  )

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
          disabled={!routeLimit.canCreate}
          onClick={() => navigate('/routes/add')}
        >
          <PlusCircle size={16} />
          Add Route
        </Button>
      </div>
      {routeLimit.max > 0 && (
        <div className="mb-6 rounded-xl border border-yellow-300 bg-yellow-50 p-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />

              <div>
                <p className="font-semibold text-yellow-900">
                  Route Usage
                </p>

                <p className="text-sm text-yellow-700">
                  You are using{" "}
                  <span className="font-bold">
                    {routeLimit.current}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold">
                    {routeLimit.max}
                  </span>{" "}
                  routes allowed by your subscription.
                </p>

                {!routeLimit.canCreate && (
                  <p className="mt-1 text-sm font-medium text-red-600">
                    You have reached your route limit. Upgrade your subscription to create more routes.
                  </p>
                )}
              </div>
            </div>

            <Button
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Crown className="mr-2 h-4 w-4" />
              Upgrade
            </Button>
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-3">
        <Input
          value={inputKeyword}
          onChange={(e) =>
            setInputKeyword(e.target.value)
          }
        />

        <Select
          value={status}
          onValueChange={setStatus}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All
            </SelectItem>

            <SelectItem value="true">
              Active
            </SelectItem>

            <SelectItem value="false">
              Inactive
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            setPage(1)
            setKeyword(inputKeyword)
          }}
        >
          Search
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
                  className="text-black-500 hover:bg-red-50"
                  onClick={() => handleEditClick(route)}
                >
                  <Pencil size={16} />
                </Button>

              </div>
            </div>
          ))}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Total {totalRoutes} routes
            </p>

            <Pagination>
              <PaginationContent>

                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()

                      if (page > 1) {
                        setPage(page - 1)
                      }
                    }}
                    className={
                      page === 1
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>

                {pageNumbers.map((number) => (
                  <PaginationItem key={number}>
                    <PaginationLink
                      href="#"
                      isActive={page === number}
                      onClick={(e) => {
                        e.preventDefault()
                        setPage(number)
                      }}
                    >
                      {number}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()

                      if (page < totalPages) {
                        setPage(page + 1)
                      }
                    }}
                    className={
                      page === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>

              </PaginationContent>
            </Pagination>
          </div>
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

      <Dialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open && !disablingForEdit) setEditTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Route to Edit</DialogTitle>

            <DialogDescription>
              <span className="font-semibold text-slate-900">
                {editTarget?.routeName}
              </span>{' '}
              is currently <span className="font-semibold">active</span>.
              Active routes must be disabled before they can be edited, so
              no trips are affected mid-edit. Disable this route and
              continue to the edit page?
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={disablingForEdit}
            >
              Cancel
            </Button>

            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={confirmEdit}
              disabled={disablingForEdit}
            >
              {disablingForEdit
                ? 'Disabling...'
                : 'Disable & Continue to Edit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )

}

export default RoutesPage