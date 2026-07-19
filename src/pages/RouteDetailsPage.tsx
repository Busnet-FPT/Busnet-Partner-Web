import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import api from '@/services/api'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import {
  ArrowLeft,
  MapPin,
  Route,
  Clock,
  Star,
} from 'lucide-react'

interface RouteDetail {
  _id: string
  routeName: string

  origin_provinceName: string
  origin_districtName?: string
  origin_representativeAddress?: string
  origin_representativeLat?: number | null
  origin_representativeLng?: number | null

  destination_provinceName: string
  destination_districtName?: string
  destination_representativeAddress?: string
  destination_representativeLat?: number | null
  destination_representativeLng?: number | null

  distanceKm: number
  estimatedDuration: number

  isActive: boolean
  isPopular: boolean

  createdAt: string
  updatedAt: string
}

function RouteDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [route, setRoute] = useState<RouteDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const res = await api.get(`/partner/routes/${id}`)
        setRoute(res.data?.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchRoute()
  }, [id])

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours === 0) return `${mins} mins`
    return `${hours}h ${mins}m`
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        Loading route...
      </div>
    )
  }

  if (!route) {
    return (
      <div className="py-20 text-center text-red-500">
        Route not found
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button
        variant="outline"
        onClick={() => navigate('/routes')}
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Routes
      </Button>

      {/* Header */}
      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {route.routeName}
            </h1>

            <p className="mt-2 text-slate-500">
              {route.origin_provinceName} →{' '}
              {route.destination_provinceName}
            </p>
          </div>

          <div className="flex gap-2">
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
                <Star size={12} className="mr-1" />
                Popular
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <Route className="text-blue-600" />
            <div>
              <p className="text-sm text-slate-500">
                Distance
              </p>
              <p className="text-xl font-semibold">
                {route.distanceKm} km
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <Clock className="text-blue-600" />
            <div>
              <p className="text-sm text-slate-500">
                Estimated Duration
              </p>
              <p className="text-xl font-semibold">
                {formatDuration(route.estimatedDuration)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Origin */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <MapPin size={18} />
          Origin
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-500">
              Province
            </label>
            <p>{route.origin_provinceName}</p>
          </div>

          <div>
            <label className="text-sm text-slate-500">
              District
            </label>
            <p>{route.origin_districtName || '-'}</p>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-500">
              Address
            </label>
            <p>
              {route.origin_representativeAddress || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Destination */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <MapPin size={18} />
          Destination
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-500">
              Province
            </label>
            <p>{route.destination_provinceName}</p>
          </div>

          <div>
            <label className="text-sm text-slate-500">
              District
            </label>
            <p>{route.destination_districtName || '-'}</p>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-500">
              Address
            </label>
            <p>
              {route.destination_representativeAddress ||
                '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Coordinates */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">
          Coordinates
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Origin</h3>
            <p>
              Lat:{' '}
              {route.origin_representativeLat ?? 'N/A'}
            </p>
            <p>
              Lng:{' '}
              {route.origin_representativeLng ?? 'N/A'}
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">
              Destination
            </h3>
            <p>
              Lat:{' '}
              {route.destination_representativeLat ??
                'N/A'}
            </p>
            <p>
              Lng:{' '}
              {route.destination_representativeLng ??
                'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">
          Metadata
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-500">
              Created At
            </label>
            <p>
              {new Date(route.createdAt).toLocaleString()}
            </p>
          </div>

          <div>
            <label className="text-sm text-slate-500">
              Updated At
            </label>
            <p>
              {new Date(route.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RouteDetailsPage