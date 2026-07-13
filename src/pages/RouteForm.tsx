import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface Province {
  code: number
  name: string
}

export interface District {
  code: number
  name: string
}

export interface RouteFormData {
  routeName: string

  origin_province: string
  origin_provinceName: string
  origin_district: string
  origin_districtName: string
  origin_representativeAddress: string


  destination_province: string
  destination_provinceName: string
  destination_district: string
  destination_districtName: string
  destination_representativeAddress: string


  isActive: boolean
  isPopular: boolean
}

export interface ValidationError {
  field: string
  message: string
}

interface RouteFormProps {
  form: RouteFormData
  errors: ValidationError[]
  loading: boolean

  title: string
  submitText: string

  onChange: (
    field: keyof RouteFormData,
    value: RouteFormData[keyof RouteFormData]
  ) => void

  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

function RouteForm({
  form,
  errors,
  loading,
  title,
  submitText,
  onChange,
  onSubmit,
  onCancel,
}: RouteFormProps) {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [provincesError, setProvincesError] = useState<string | null>(null)

  const [originDistricts, setOriginDistricts] = useState<District[]>([])
  const [originDistrictsError, setOriginDistrictsError] = useState<string | null>(null)

  const [destinationDistricts, setDestinationDistricts] = useState<District[]>([])
  const [destinationDistrictsError, setDestinationDistrictsError] = useState<string | null>(null)

  // Request tokens guard against out-of-order responses when the user
  // switches provinces quickly (avoids a slow earlier response clobbering
  // a faster later one).
  const originRequestId = useRef(0)
  const destinationRequestId = useRef(0)

  // -----------------------------
  // Load Provinces
  // -----------------------------

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch('https://provinces.open-api.vn/api/p/')
        const data = await res.json()
        setProvinces(data)
        setProvincesError(null)
      } catch (err) {
        console.error(err)
        setProvincesError('Could not load provinces. Please retry.')
      }
    }

    fetchProvinces()
  }, [])

  // -----------------------------
  // Fetch Origin Districts
  // (single source of truth: fires whenever origin_province changes,
  // whether from user selection or from the form being populated for edit)
  // -----------------------------

  useEffect(() => {
    if (!form.origin_province) {
      setOriginDistricts([])
      return
    }

    const requestId = ++originRequestId.current

    const fetchOriginDistricts = async () => {
      try {
        const res = await fetch(
          `https://provinces.open-api.vn/api/p/${form.origin_province}?depth=2`
        )
        const data = await res.json()

        // Ignore this response if a newer request has since been made
        if (requestId === originRequestId.current) {
          setOriginDistricts(data.districts || [])
          setOriginDistrictsError(null)
        }
      } catch (err) {
        console.error(err)
        if (requestId === originRequestId.current) {
          setOriginDistrictsError('Could not load districts. Please retry.')
        }
      }
    }

    fetchOriginDistricts()
  }, [form.origin_province])

  // -----------------------------
  // Fetch Destination Districts
  // -----------------------------

  useEffect(() => {
    if (!form.destination_province) {
      setDestinationDistricts([])
      return
    }

    const requestId = ++destinationRequestId.current

    const fetchDestinationDistricts = async () => {
      try {
        const res = await fetch(
          `https://provinces.open-api.vn/api/p/${form.destination_province}?depth=2`
        )
        const data = await res.json()

        if (requestId === destinationRequestId.current) {
          setDestinationDistricts(data.districts || [])
          setDestinationDistrictsError(null)
        }
      } catch (err) {
        console.error(err)
        if (requestId === destinationRequestId.current) {
          setDestinationDistrictsError('Could not load districts. Please retry.')
        }
      }
    }

    fetchDestinationDistricts()
  }, [form.destination_province])

  // -----------------------------
  // Origin Province Changed
  // -----------------------------

  const handleOriginProvinceChange = (provinceCode: string) => {
    const province = provinces.find((p) => String(p.code) === provinceCode)

    onChange('origin_province', provinceCode)
    onChange('origin_provinceName', province?.name || '')
    onChange('origin_district', '')
    onChange('origin_districtName', '')
    // District fetch is handled by the effect above, keyed on origin_province.
  }

  // -----------------------------
  // Destination Province Changed
  // -----------------------------

  const handleDestinationProvinceChange = (provinceCode: string) => {
    const province = provinces.find((p) => String(p.code) === provinceCode)

    onChange('destination_province', provinceCode)
    onChange('destination_provinceName', province?.name || '')
    onChange('destination_district', '')
    onChange('destination_districtName', '')
    // District fetch is handled by the effect above, keyed on destination_province.
  }

  // -----------------------------
  // Helper
  // -----------------------------

  const getError = (field: string) =>
    errors.find((e) => e.field === field)?.message

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Route Name */}
          <div>
            <Label htmlFor="routeName">Route Name</Label>

            <Input
              id="routeName"
              name="routeName"
              value={form.routeName}
              onChange={(e) => onChange('routeName', e.target.value)}
              placeholder="Enter route name"
            />

            {getError('routeName') && (
              <p className="mt-1 text-sm text-red-500">
                {getError('routeName')}
              </p>
            )}
          </div>

          {provincesError && (
            <p className="text-sm text-red-500">{provincesError}</p>
          )}

          {/* Origin & Destination */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Origin */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Origin</h3>

              <div>
                <Label htmlFor="origin_province">Province</Label>

                <Select
                  key={`origin-province-${form.origin_province || 'empty'}-${provinces.length}`}
                  value={form.origin_province}
                  onValueChange={handleOriginProvinceChange}
                >
                  <SelectTrigger id="origin_province">
                    <SelectValue placeholder="Select Province" />
                  </SelectTrigger>

                  <SelectContent>
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

                {getError('origin_province') && (
                  <p className="mt-1 text-sm text-red-500">
                    {getError('origin_province')}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="origin_district">District</Label>

                <Select
                  key={`origin-district-${form.origin_district || 'empty'}-${originDistricts.length}`}
                  value={form.origin_district}
                  onValueChange={(districtCode) => {
                    const district = originDistricts.find(
                      (d) => String(d.code) === districtCode
                    )

                    onChange('origin_district', districtCode)
                    onChange('origin_districtName', district?.name || '')
                  }}
                  disabled={!form.origin_province}
                >
                  <SelectTrigger id="origin_district">
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>

                  <SelectContent>
                    {originDistricts.map((district) => (
                      <SelectItem
                        key={district.code}
                        value={String(district.code)}
                      >
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {originDistrictsError && (
                  <p className="mt-1 text-sm text-red-500">
                    {originDistrictsError}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="origin_representativeAddress">
                  Representative Address
                </Label>

                <Input
                  id="origin_representativeAddress"
                  placeholder="Enter representative address"
                  value={form.origin_representativeAddress}
                  onChange={(e) =>
                    onChange(
                      'origin_representativeAddress',
                      e.target.value
                    )
                  }
                />

                {getError('origin_representativeAddress') && (
                  <p className="mt-1 text-sm text-red-500">
                    {getError('origin_representativeAddress')}
                  </p>
                )}
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Destination</h3>

              <div>
                <Label htmlFor="destination_province">Province</Label>

                <Select
                  key={`destination-province-${form.destination_province || 'empty'}-${provinces.length}`}
                  value={form.destination_province}
                  onValueChange={handleDestinationProvinceChange}
                >
                  <SelectTrigger id="destination_province">
                    <SelectValue placeholder="Select Province" />
                  </SelectTrigger>

                  <SelectContent>
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

                {getError('destination_province') && (
                  <p className="mt-1 text-sm text-red-500">
                    {getError('destination_province')}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="destination_district">District</Label>

                <Select
                  key={`destination-district-${form.destination_district || 'empty'}-${destinationDistricts.length}`}
                  value={form.destination_district}
                  onValueChange={(districtCode) => {
                    const district = destinationDistricts.find(
                      (d) => String(d.code) === districtCode
                    )

                    onChange('destination_district', districtCode)
                    onChange(
                      'destination_districtName',
                      district?.name || ''
                    )
                  }}
                  disabled={!form.destination_province}
                >
                  <SelectTrigger id="destination_district">
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>

                  <SelectContent>
                    {destinationDistricts.map((district) => (
                      <SelectItem
                        key={district.code}
                        value={String(district.code)}
                      >
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {destinationDistrictsError && (
                  <p className="mt-1 text-sm text-red-500">
                    {destinationDistrictsError}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="destination_representativeAddress">
                  Representative Address
                </Label>

                <Input
                  id="destination_representativeAddress"
                  placeholder="Enter representative address"
                  value={form.destination_representativeAddress}
                  onChange={(e) =>
                    onChange(
                      'destination_representativeAddress',
                      e.target.value
                    )
                  }
                />

                {getError('destination_representativeAddress') && (
                  <p className="mt-1 text-sm text-red-500">
                    {getError('destination_representativeAddress')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Switches */}
          <div className="flex gap-10">
            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => onChange('isActive', checked)}
              />

              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="isPopular"
                checked={form.isPopular}
                onCheckedChange={(checked) => onChange('isPopular', checked)}
              />

              <Label htmlFor="isPopular">Popular</Label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : submitText}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default RouteForm