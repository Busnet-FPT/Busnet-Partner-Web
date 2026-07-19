import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  PlusCircle,
  Bus,
  Trash2,
  Eye,
  Pencil,
  Armchair,
  Crown,
  AlertTriangle,
  RotateCcw
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import api from '@/services/api'

interface Bus {
  _id: string
  busName: string
  licensePlate: string
  busType: string
  totalSeats: number

  description: string

  amenities: string[]

  images: string[]

  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE'

  isActive: boolean

  seatLayout_totalRows: number
  seatLayout_totalColumns: number
  seatLayout_totalFloors: number

  createdAt: string
  isInUse: boolean
}

function BusesPage() {
  const navigate = useNavigate()

  const [buses, setBuses] = useState<Bus[]>([])
  const [loading, setLoading] = useState(true)

  const [deleteTarget, setDeleteTarget] = useState<Bus | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [inputKeyword, setInputKeyword] = useState("")
  const [keyword, setKeyword] = useState("")

  const [inputStatus, setInputStatus] = useState("all")
  const [status, setStatus] = useState("all")

  const [inputBusType, setInputBusType] = useState("all")
  const [busType, setBusType] = useState("all")

  const [inputCapacity, setInputCapacity] = useState("all")
  const [capacity, setCapacity] = useState("all")

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalBuses, setTotalBuses] = useState(0)

  const [busLimit, setBusLimit] = useState({
    current: 0,
    max: 0,
    canCreate: true,
  })
  useEffect(() => {
    const fetchBuses = async () => {
      try {
        setLoading(true)
        const params: any = {
          page
        }

        if (keyword) params.keyword = keyword

        if (status !== "all") params.status = status

        if (busType !== "all") {
          params.busType = busType
        }

        switch (capacity) {
          case "small":
            params.minSeats = 1
            params.maxSeats = 20
            break

          case "medium":
            params.minSeats = 21
            params.maxSeats = 40
            break

          case "large":
            params.minSeats = 41
            break
        }

        const res = await api.get('/partner/buses', {
          params
        })

        setBuses(res.data.data || [])

        setBusLimit({
          current: res.data.usage.currentBuses,
          max: res.data.usage.maxBuses,
          canCreate: res.data.usage.canCreate,
        })

        setTotalPages(res.data.pagination.totalPages)
        setTotalBuses(res.data.pagination.total)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchBuses()
  }, [
    page,
    keyword,
    status,
    busType,
    capacity
  ])

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      setDeleting(true)

      await api.patch(`/partner/buses/${deleteTarget._id}`)

      setBuses((prev) =>
        prev.filter((b) => b._id !== deleteTarget._id)
      )

      setDeleteTarget(null)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: Bus['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700'

      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-700'

      case 'INACTIVE':
        return 'bg-slate-100 text-slate-600'

      default:
        return ''
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Buses</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage your buses and their availability.
          </p>
        </div>

        <Button
          className="bg-blue-600 text-white hover:bg-blue-700"
          disabled={!busLimit?.canCreate}
          onClick={() => navigate('/buses/add')}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Bus
        </Button>
      </div>

      {busLimit.max > 0 && (
        <div className="mb-6 rounded-xl border border-yellow-300 bg-yellow-50 p-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />

              <div>
                <p className="font-semibold text-yellow-900">
                  Bus Usage
                </p>

                <p className="text-sm text-yellow-700">
                  You are using{" "}
                  <span className="font-bold">
                    {busLimit.current}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold">
                    {busLimit.max}
                  </span>{" "}
                  buses allowed by your subscription.
                </p>

                {!busLimit.canCreate && (
                  <p className="mt-1 text-sm font-medium text-red-600">
                    You have reached your bus limit. Upgrade your subscription to create more buses.
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
          value={inputStatus}
          onValueChange={setInputStatus}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All
            </SelectItem>

            <SelectItem value="ACTIVE">
              Active
            </SelectItem>

            <SelectItem value="INACTIVE">
              Inactive
            </SelectItem>

            <SelectItem value="MAINTENANCE">
              Maintenance
            </SelectItem>

          </SelectContent>
        </Select>

        <Select
          value={inputBusType}
          onValueChange={setInputBusType}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Bus Type" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All Types
            </SelectItem>

            <SelectItem value="Seater">
              Seater
            </SelectItem>

            <SelectItem value="Sleeper">
              Sleeper
            </SelectItem>

            <SelectItem value="Limousine">
              Limousine
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={inputCapacity}
          onValueChange={setInputCapacity}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Capacity" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All Capacities
            </SelectItem>

            <SelectItem value="small">
              Small (1–20 Seats)
            </SelectItem>

            <SelectItem value="medium">
              Medium (21–40 Seats)
            </SelectItem>

            <SelectItem value="large">
              Large (41+ Seats)
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={() => {
            setPage(1)

            setKeyword(inputKeyword)
            setStatus(inputStatus)
            setBusType(inputBusType)
            setCapacity(inputCapacity)
          }}
        >
          Search
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setInputKeyword("")
            setKeyword("")

            setInputStatus("all")
            setStatus("all")

            setInputBusType("all")
            setBusType("all")

            setInputCapacity("all")
            setCapacity("all")

            setPage(1)
          }}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>

      </div>

      {/* Loading */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          Loading buses...
        </div>
      ) : buses.length === 0 ? (
        /* Empty */
        <div className="rounded-xl border border-dashed bg-white py-16 text-center">
          <Bus className="mx-auto mb-4 h-12 w-12 text-slate-300" />

          <h3 className="text-lg font-semibold text-slate-700">
            No buses found
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Create your first bus to start assigning schedules.
          </p>

          <Button
            className="mt-5 bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate('/buses/add')}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Bus
          </Button>
        </div>

      ) : (
        <div className="space-y-4">
          {buses.map((bus) => (
            <div
              key={bus._id}
              className="flex items-center justify-between rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              {/* Left */}
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Bus size={24} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      {bus.busName}
                    </h3>

                    <Badge className={getStatusBadge(bus.status)}>
                      {bus.status}
                    </Badge>

                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {bus.licensePlate}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                    <span>
                      <strong>Type:</strong> {bus.busType}
                    </span>

                    {bus.totalSeats === 0 ? (
                      <Badge
                        variant="outline"
                        className="border-amber-400 bg-amber-50 text-amber-700"
                      >
                        Seat Layout Not Configured
                      </Badge>
                    ) : (
                      <>
                        <span>
                          <strong>Seats:</strong> {bus.totalSeats}
                        </span>

                        <span>
                          <strong>Floors:</strong> {bus.seatLayout_totalFloors}
                        </span>
                      </>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-slate-400">
                    Created{" "}
                    {new Date(bus.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-3">

                {bus.totalSeats === 0 ? (

                  <Button
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() =>
                      navigate(`/buses/${bus._id}/layout`)
                    }
                  >
                    <Armchair className="mr-2 h-4 w-4" />
                    Configure Layout
                  </Button>

                ) : (

                  <TooltipProvider>

                    <Tooltip>

                      <TooltipTrigger asChild>

                        <span>

                          <Button
                            variant="outline"
                            disabled={bus.isInUse}
                            onClick={() =>
                              navigate(`/buses/${bus._id}/layout`)
                            }
                          >
                            <Armchair className="mr-2 h-4 w-4" />
                            Edit Layout
                          </Button>

                        </span>

                      </TooltipTrigger>

                      {bus.status !== "INACTIVE" && (

                        <TooltipContent>

                          <p>
                            Seat layout can only be modified when the bus is inactive.
                          </p>

                        </TooltipContent>

                      )}

                    </Tooltip>

                  </TooltipProvider>

                )}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate(`/buses/${bus._id}`)}
                >
                  <Eye size={16} />
                </Button>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={bus.isInUse}
                          onClick={() => navigate(`/buses/${bus._id}/edit`)}
                        >
                          <Pencil size={16} />
                        </Button>
                      </span>
                    </TooltipTrigger>

                    {bus.isInUse && (
                      <TooltipContent>
                        <p>This bus is assigned to future trips.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={bus.isInUse}
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => setDeleteTarget(bus)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bus</DialogTitle>

            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deleteTarget?.busName}
              </span>
              ?
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>

            <Button
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <p className="text-sm text-slate-500">
        {totalBuses} bus{totalBuses !== 1 ? "es" : ""} found
      </p>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNumber) => (
              <Button
                key={pageNumber}
                variant={
                  page === pageNumber ? "default" : "outline"
                }
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            )
          )}

          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

export default BusesPage
