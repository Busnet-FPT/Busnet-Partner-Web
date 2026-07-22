import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'

import api from '@/services/api'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { ArrowLeft, Bus, ImagePlus, Trash2, Star } from 'lucide-react'

interface BusForm {
  busName: string
  licensePlate: string
  busType: string
  totalSeats: number | ''

  seatLayout_totalRows: number | ''
  seatLayout_totalColumns: number | ''
  seatLayout_totalFloors: number | ''

  description: string

  amenities: string[]

  images: string[]

  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE'

}

function AddBusPage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)

  const [showLayoutDialog, setShowLayoutDialog] = useState(false)

  const [createdBusId, setCreatedBusId] = useState('')


  const [form, setForm] = useState<BusForm>({
    busName: '',
    licensePlate: '',
    busType: '',
    totalSeats: 0,

    seatLayout_totalRows: 0,
    seatLayout_totalColumns: 0,
    seatLayout_totalFloors: 1,

    description: '',

    amenities: [],

    images: [],

    status: 'INACTIVE',

  })

  const [uploading, setUploading] = useState(false)

  const availableAmenities = [
    'WiFi',
    'USB Charging',
    'Air Conditioner',
    'Blanket',
    'Water',
    'TV',
    'Toilet',
    'Reading Light',
  ]

  const toggleAmenity = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  const handleImageUpload = async (files: File[]) => {
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      const uploadedUrls: string[] = []

      for (const file of files) {
        const formData = new FormData()

        formData.append('image', file)

        const res = await api.post(
          '/upload?folder=buses',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )

        uploadedUrls.push(res.data.url)
      }

      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }))
    } catch (err) {
      console.error(err)
      alert('Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = async (acceptedFiles: File[]) => {
    await handleImageUpload(acceptedFiles)
  }

  const {
    getRootProps,
    getInputProps,
    isDragActive,
  } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
    },
    multiple: true,
    disabled: uploading,
  })

  const validateForm = () => {
    if (!form.busName.trim()) {
      alert('Bus name is required')
      return false
    }

    if (!form.licensePlate.trim()) {
      alert('License plate is required')
      return false
    }

    if (!form.busType) {
      alert('Please select bus type')
      return false
    }


    if (form.images.length === 0) {
      alert('Please upload at least one image')
      return false
    }

    return true
  }

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const res = await api.post('/partner/buses', form)

      const busId = res.data.data._id

      setCreatedBusId(busId)

      setShowLayoutDialog(true)

    } catch (err) {
      console.error(err)
      alert('Failed to create bus.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Bus size={28} />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              Add New Bus
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Register a new bus for your fleet.
            </p>
          </div>

        </div>

        <Button
          variant="outline"
          onClick={() => navigate('/buses')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

      </div>

      {/* Basic Information */}

      <Card>

        <CardHeader>
          <CardTitle>
            Basic Information
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">

          <div>

            <Label>Bus Name *</Label>

            <Input
              placeholder="VIP Sleeper 01"
              value={form.busName}
              onChange={(e) =>
                setForm({
                  ...form,
                  busName: e.target.value,
                })
              }
            />

          </div>

          <div>

            <Label>License Plate *</Label>

            <Input
              placeholder="51B-12345"
              value={form.licensePlate}
              onChange={(e) =>
                setForm({
                  ...form,
                  licensePlate: e.target.value.toUpperCase(),
                })
              }
            />

          </div>

          <div className="grid gap-5 md:grid-cols-2">

            <div>

              <Label>Bus Type *</Label>

              <Select
                value={form.busType}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    busType: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bus type" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Sleeper">
                    Sleeper
                  </SelectItem>

                  <SelectItem value="Seater">
                    Seater
                  </SelectItem>

                  <SelectItem value="Limousine">
                    Limousine
                  </SelectItem>
                </SelectContent>

              </Select>

            </div>

          </div>

        </CardContent>

      </Card>

      {/* Description */}

      <Card>

        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>

        <CardContent>

          <Textarea
            rows={5}
            placeholder="Describe this bus..."
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
          />

        </CardContent>

      </Card>
          
      {/* Bus Images */}

      <Card>

        <CardHeader>
          <CardTitle>Bus Images</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${uploading
              ? 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-60'
              : isDragActive
                ? 'cursor-pointer border-blue-500 bg-blue-50'
                : 'cursor-pointer border-slate-300 hover:border-blue-400'
              }`}
          >
            <input {...getInputProps()} />

            <ImagePlus className="mb-4 h-12 w-12 text-slate-400" />

            <p className="text-lg font-medium">
              {uploading
                ? 'Uploading images...'
                : isDragActive
                  ? 'Drop the images here...'
                  : 'Drag & Drop Images Here'}
            </p>

            {!uploading && (
              <>
                <p className="mt-2 text-sm text-slate-500">
                  or click to browse
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  PNG, JPG or WEBP
                </p>
              </>
            )}
          </div>

          {/* Uploading */}

          {uploading && (
            <div className="rounded-lg border bg-blue-50 p-4 text-center text-blue-600">
              Uploading images...
            </div>
          )}

          {/* Preview */}

          {form.images.length > 0 && (

            <div>

              <h3 className="mb-4 text-sm font-semibold">
                Uploaded Images
              </h3>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

                {form.images.map((image, index) => (

                  <div
                    key={index}
                    className="group relative"
                  >

                    <img
                      src={image}
                      alt={`Bus ${index + 1}`}
                      className="h-40 w-full rounded-lg border object-cover"
                    />

                    {/* Cover Image */}

                    {index === 0 && (

                      <div className="absolute left-2 top-2 rounded-full bg-yellow-500 px-2 py-1 text-xs font-medium text-white">

                        <div className="flex items-center gap-1">

                          <Star
                            size={12}
                            fill="currentColor"
                          />

                          Cover

                        </div>

                      </div>

                    )}

                    {/* Remove */}

                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100"
                      onClick={() => removeImage(index)}
                    >
                      <Trash2 size={16} />
                    </Button>

                  </div>

                ))}

              </div>

              <p className="mt-3 text-xs text-slate-500">
                The first image will be used as the cover image.
              </p>

            </div>

          )}

        </CardContent>

      </Card>


      {/* Amenities */}

      <Card>

        <CardHeader>
          <CardTitle>Amenities</CardTitle>
        </CardHeader>

        <CardContent>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

            {availableAmenities.map((amenity) => (

              <label
                key={amenity}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition hover:border-blue-500 hover:bg-blue-50"
              >

                <input
                  type="checkbox"
                  checked={form.amenities.includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                />

                <span className="text-sm">
                  {amenity}
                </span>

              </label>

            ))}

          </div>

        </CardContent>

      </Card>

      {/* Status */}

      <Card>

        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          <div>

            <Label>Bus Status</Label>

            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm({
                  ...form,
                  status: value as
                    | 'ACTIVE'
                    | 'MAINTENANCE'
                    | 'INACTIVE',
                })
              }
            >

              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>

                <SelectItem value="ACTIVE">
                  ACTIVE
                </SelectItem>

                <SelectItem value="MAINTENANCE">
                  MAINTENANCE
                </SelectItem>

                <SelectItem value="INACTIVE">
                  INACTIVE
                </SelectItem>

              </SelectContent>

            </Select>

          </div>

        </CardContent>

      </Card>
      <div className="flex justify-end gap-3 pb-10">

        <Button
          variant="outline"
          onClick={() => navigate('/buses')}
        >
          Cancel
        </Button>

        <Button
          disabled={loading || uploading}
          onClick={handleSubmit}
        >
          {loading
            ? 'Creating...'
            : uploading
              ? 'Uploading Images...'
              : 'Create Bus'}
        </Button>

      </div>

      <Dialog
        open={showLayoutDialog}
        onOpenChange={setShowLayoutDialog}
      >
        <DialogContent className="sm:max-w-md">

          <DialogHeader>

            <DialogTitle>
              Bus Created Successfully
            </DialogTitle>

            <DialogDescription>
              Your bus has been created successfully.

              <br />
              <br />

              This bus cannot be assigned to schedules until
              its seat layout has been configured.

              <br />
              <br />

              Would you like to configure it now?
            </DialogDescription>

          </DialogHeader>

          <div className="flex justify-end gap-2">

            <Button
              variant="outline"
              onClick={() => {
                setShowLayoutDialog(false)
                navigate('/buses')
              }}
            >
              Later
            </Button>

            <Button
              onClick={() =>
                navigate(`/buses/${createdBusId}/layout`)
              }
            >
              Configure Layout
            </Button>

          </div>

        </DialogContent>
      </Dialog>
    </div>

  )
}

export default AddBusPage