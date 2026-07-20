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
  Crown,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"


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

interface Province {
  code: number
  name: string
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

  const [provinces, setProvinces] = useState<
    Province[]
  >([])
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

  const [originProvince, setOriginProvince] = useState("all")
  const [destinationProvince, setDestinationProvince] = useState("all")

  const [popular, setPopular] = useState("all")

  const [distance, setDistance] =
    useState("all")
  const [duration, setDuration] =
    useState("all")

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
        limit: 5,
      }

      // Search
      if (keyword.trim()) {
        params.keyword = keyword.trim()
      }

      // Status
      if (status !== "all") {
        params.isActive = status
      }

      // Popular
      if (popular !== "all") {
        params.isPopular = popular
      }

      // Provinces
      if (originProvince !== "all") {
        params.originProvince = originProvince
      }

      if (destinationProvince !== "all") {
        params.destinationProvince =
          destinationProvince
      }

      // Distance
      switch (distance) {
        case "0-50":
          params.minDistance = 0
          params.maxDistance = 50
          break

        case "50-100":
          params.minDistance = 50
          params.maxDistance = 100
          break

        case "100-300":
          params.minDistance = 100
          params.maxDistance = 300
          break

        case "300+":
          params.minDistance = 300
          break
      }

      // Duration
      switch (duration) {
        case "0-60":
          params.minDuration = 0
          params.maxDuration = 60
          break

        case "60-180":
          params.minDuration = 60
          params.maxDuration = 180
          break

        case "180-360":
          params.minDuration = 180
          params.maxDuration = 360
          break

        case "360+":
          params.minDuration = 360
          break
      }

      const res = await api.get(
        "/partner/routes",
        {
          params,
        }
      )

      setRoutes(res.data.data)

      if (res.data.usage) {
        setRouteLimit({
          current: res.data.usage.currentRoutes,
          max: res.data.usage.maxRoutes,
          canCreate: res.data.usage.canCreate,
        })
      }

      setTotalPages(
        res.data.pagination.totalPages
      )

      setTotalRoutes(
        res.data.pagination.total
      )
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoutes()
  }, [
    keyword,
    status,
    popular,
    originProvince,
    destinationProvince,
    distance,
    duration,
    page,
  ])

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch(
          "https://provinces.open-api.vn/api/p/"
        )

        const data = await res.json()

        setProvinces(data)
      } catch (err) {
        console.error(err)
      }
    }

    fetchProvinces()
  }, [])

  const applyFilters = () => {
    setPage(1)
    setKeyword(inputKeyword.trim())
  }

  const resetFilters = () => {
    setInputKeyword("")
    setKeyword("")

    setStatus("all")
    setPopular("all")

    setOriginProvince("all")
    setDestinationProvince("all")

    setDistance("all")
    setDuration("all")

    setPage(1)
  }

  const clearFilter = (filter: string) => {
    switch (filter) {
      case "status":
        setStatus("all")
        break

      case "popular":
        setPopular("all")
        break

      case "origin":
        setOriginProvince("all")
        break

      case "destination":
        setDestinationProvince("all")
        break

      case "distance":
        setDistance("all")
        break

      case "duration":
        setDuration("all")
        break

      case "keyword":
        setInputKeyword("")
        setKeyword("")
        break
    }

    setPage(1)
  }

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

      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex flex-1 gap-2">
          <Input
            className="max-w-sm"
            placeholder="Search routes..."
            value={inputKeyword}
            onChange={(e) =>
              setInputKeyword(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                applyFilters()
              }
            }}
          />

          <Button onClick={applyFilters}>
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>

        {/* Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-[650px] max-w-[95vw] p-6"
            align="end"
          >
            <div>
              <h3 className="font-semibold text-lg">
                Filter Routes
              </h3>

              <p className="text-sm text-slate-500">
                Choose filters to narrow results.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-5">

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Status
                </label>

                <Select
                  value={status}
                  onValueChange={setStatus}
                >
                  <SelectTrigger>
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
              </div>

              {/* Popular */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Popular
                </label>

                <Select
                  value={popular}
                  onValueChange={setPopular}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">
                      All
                    </SelectItem>

                    <SelectItem value="true">
                      Popular
                    </SelectItem>

                    <SelectItem value="false">
                      Not Popular
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Origin Province */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Origin Province
                </label>

                <Select
                  value={originProvince}
                  onValueChange={setOriginProvince}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select origin" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">
                      All Provinces
                    </SelectItem>

                    {provinces.map((province) => (
                      <SelectItem
                        key={province.code}
                        value={String(province.code)}
                      >
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Destination Province */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Destination Province
                </label>

                <Select
                  value={destinationProvince}
                  onValueChange={
                    setDestinationProvince
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">
                      All Provinces
                    </SelectItem>

                    {provinces.map((province) => (
                      <SelectItem
                        key={province.code}
                        value={String(province.code)}
                      >
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Distance */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Distance
                </label>

                <Select
                  value={distance}
                  onValueChange={setDistance}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">
                      All
                    </SelectItem>

                    <SelectItem value="0-50">
                      0 - 50 km
                    </SelectItem>

                    <SelectItem value="50-100">
                      50 - 100 km
                    </SelectItem>

                    <SelectItem value="100-300">
                      100 - 300 km
                    </SelectItem>

                    <SelectItem value="300+">
                      More than 300 km
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Duration
                </label>

                <Select
                  value={duration}
                  onValueChange={setDuration}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">
                      All
                    </SelectItem>

                    <SelectItem value="0-60">
                      Under 1 hour
                    </SelectItem>

                    <SelectItem value="60-180">
                      1 - 3 hours
                    </SelectItem>

                    <SelectItem value="180-360">
                      3 - 6 hours
                    </SelectItem>

                    <SelectItem value="360+">
                      More than 6 hours
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={resetFilters}
              >
                Reset
              </Button>

              <Button onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {keyword && (
          <Badge
            variant="secondary"
            className="flex items-center gap-1"
          >
            Search: {keyword}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setInputKeyword("")
                setKeyword("")
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {status !== "all" && (
          <Badge
            variant="secondary"
            className="flex items-center gap-1"
          >
            {status === "true"
              ? "Active"
              : "Inactive"}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                clearFilter("status")
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {popular !== "all" && (
          <Badge
            variant="secondary"
            className="flex items-center gap-1"
          >
            {popular === "true"
              ? "Popular"
              : "Not Popular"}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                clearFilter("popular")
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {originProvince !== "all" && (
          <Badge
            variant="secondary"
            className="flex items-center gap-1"
          >
            Origin:{" "}
            {
              provinces.find(
                (p) =>
                  String(p.code) ===
                  originProvince
              )?.name
            }

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                clearFilter("origin")
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {destinationProvince !== "all" && (
          <Badge
            variant="secondary"
            className="flex items-center gap-1"
          >
            Destination:{" "}
            {
              provinces.find(
                (p) =>
                  String(p.code) ===
                  destinationProvince
              )?.name
            }

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                clearFilter("destination")
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {distance !== "all" && (
          <Badge
            variant="secondary"
            className="flex items-center gap-1"
          >
            Distance: {distance} km

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                clearFilter("distance")
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {duration !== "all" && (
          <Badge
            variant="secondary"
            className="flex items-center gap-1"
          >
            Duration:{" "}
            {duration === "0-60"
              ? "<1h"
              : duration === "60-180"
                ? "1-3h"
                : duration === "180-360"
                  ? "3-6h"
                  : ">6h"}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                clearFilter("duration")
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
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