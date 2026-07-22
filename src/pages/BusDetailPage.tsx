import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import api from '@/services/api'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {
  ArrowLeft,
  Bus,
  Pencil,
} from 'lucide-react'

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
  updatedAt: string
}

function BusDetailsPage() {
  const { id } = useParams()

  const navigate = useNavigate()

  const [bus, setBus] = useState<Bus | null>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBus()
  }, [])

  const fetchBus = async () => {
    try {
      const res = await api.get(`/partner/buses/${id}`)

      setBus(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: Bus['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700'

      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-700'

      case 'INACTIVE':
        return 'bg-slate-200 text-slate-700'

      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading bus details...
      </div>
    )
  }

  if (!bus) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">
          Bus not found.
        </p>

        <Button
          className="mt-4"
          onClick={() => navigate('/buses')}
        >
          Back to Buses
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Header */}

      <div className="flex items-start justify-between">

        <div className="flex items-center gap-4">

          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Bus size={32} />
          </div>

          <div>

            <div className="flex items-center gap-2">

              <h1 className="text-3xl font-bold">
                {bus.busName}
              </h1>

              <Badge className={getStatusBadge(bus.status)}>
                {bus.status}
              </Badge>

              {!bus.isActive && (
                <Badge variant="secondary">
                  Disabled
                </Badge>
              )}

            </div>

            <p className="mt-2 text-slate-500">
              {bus.licensePlate}
            </p>

          </div>

        </div>

        <div className="flex gap-2">

          <Button
            variant="outline"
            onClick={() => navigate('/buses')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() =>
              navigate(`/buses/edit/${bus._id}`)
            }
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>

        </div>

      </div>

      {/* Basic Information */}

      <Card>

        <CardHeader>
          <CardTitle>
            Basic Information
          </CardTitle>
        </CardHeader>

        <CardContent>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            <div>

              <p className="text-sm text-slate-500">
                Bus Name
              </p>

              <p className="mt-1 font-medium">
                {bus.busName}
              </p>

            </div>

            <div>

              <p className="text-sm text-slate-500">
                License Plate
              </p>

              <p className="mt-1 font-medium">
                {bus.licensePlate}
              </p>

            </div>

            <div>

              <p className="text-sm text-slate-500">
                Bus Type
              </p>

              <p className="mt-1 font-medium">
                {bus.busType}
              </p>

            </div>

            <div>

              <p className="text-sm text-slate-500">
                Total Seats
              </p>

              <p className="mt-1 font-medium">
                {bus.totalSeats}
              </p>

            </div>

          </div>

        </CardContent>

      </Card>

      {/* Description */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>

        <CardContent>
          {bus?.description ? (
            <p className="text-sm leading-7 text-slate-700">
              {bus.description}
            </p>
          ) : (
            <p className="text-sm text-slate-500 italic">
              No description provided.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Amenities</CardTitle>
        </CardHeader>

        <CardContent>
          {bus?.amenities && bus.amenities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {bus.amenities.map((amenity) => (
                <Badge
                  key={amenity}
                  variant="secondary"
                  className="px-3 py-1"
                >
                  {amenity}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">
              No amenities available.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Seat Layout */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Seat Layout</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Rows
              </p>

              <p className="mt-2 text-2xl font-bold">
                {bus?.seatLayout_totalRows}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Columns
              </p>

              <p className="mt-2 text-2xl font-bold">
                {bus?.seatLayout_totalColumns}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Floors
              </p>

              <p className="mt-2 text-2xl font-bold">
                {bus?.seatLayout_totalFloors}
              </p>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Bus Images</CardTitle>
        </CardHeader>

        <CardContent>
          {bus?.images && bus.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {bus.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Bus ${index + 1}`}
                  className="h-40 w-full rounded-lg border object-cover"
                />
              ))}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
              <p className="text-sm text-slate-400">
                No images uploaded.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            <div>
              <p className="text-sm text-slate-500">
                Created At
              </p>

              <p className="mt-1 font-medium">
                {new Date(bus!.createdAt).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Last Updated
              </p>

              <p className="mt-1 font-medium">
                {new Date(bus!.updatedAt).toLocaleString()}
              </p>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Footer Buttons */}
      <div className="mt-8 flex justify-between">

        <Button
          variant="outline"
          onClick={() => navigate('/buses')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate(`/buses/edit/${bus?._id}`)}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit Bus
        </Button>

      </div>
    </div>
  )
}

export default BusDetailsPage
