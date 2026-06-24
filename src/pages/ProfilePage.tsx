import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BadgeCheck,
  Banknote,
  Building2,
  Edit,
  FileText,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import api from '@/services/api'

const SEPAY_BANKS = [
  { code: 'MB', name: 'MBBank' },
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'CTG', name: 'VietinBank' },
  { code: 'BID', name: 'BIDV' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'VPB', name: 'VPBank' },
]

const AMENITY_OPTIONS = [
  'Wifi',
  'Bottled water',
  'Air conditioning',
  'Blanket',
  'Reclining seat',
  'Sleeper seat',
  'USB charging port',
  'Entertainment screen',
  'Restroom',
  'Wet towel',
  'Door-to-door pickup',
  'Luggage compartment',
]

const AMENITY_LABEL_MAP: Record<string, string> = {
  'Nuoc uong': 'Bottled water',
  'Nước uống': 'Bottled water',
  'Dieu hoa': 'Air conditioning',
  'Điều hòa': 'Air conditioning',
  'Chan men': 'Blanket',
  'Chăn mền': 'Blanket',
  'Ghe nga': 'Reclining seat',
  'Ghế ngả': 'Reclining seat',
  'Giuong nam': 'Sleeper seat',
  'Giường nằm': 'Sleeper seat',
  'Cong sac USB': 'USB charging port',
  'Cổng sạc USB': 'USB charging port',
  'Man hinh giai tri': 'Entertainment screen',
  'Màn hình giải trí': 'Entertainment screen',
  'Nha ve sinh': 'Restroom',
  'Nhà vệ sinh': 'Restroom',
  'Khan lanh': 'Wet towel',
  'Khăn lạnh': 'Wet towel',
  'Don tra tan noi': 'Door-to-door pickup',
  'Đón trả tận nơi': 'Door-to-door pickup',
  'Khoang hanh ly': 'Luggage compartment',
  'Khoang hành lý': 'Luggage compartment',
}

type PartnerProfile = {
  _id: string
  accountId: string
  operatorName?: string
  operatorPhone?: string
  description?: string
  amenities?: string[]
  policies?: Record<string, string> | string[]
  profilePicture?: string
  coverImage?: string
  bankName?: string
  bankAccountName?: string
  bankNumber?: string
  bankBranch?: string
  sepayVa?: string
  businessLicense?: string
  taxCode?: string
  isVerified?: boolean
  verifiedAt?: string
  ratingAvg?: number
  totalReviews?: number
  accountInfo?: {
    fullName?: string
    email?: string
    phone?: string
    profilePicture?: string
    isEmailVerified?: boolean
    isPhoneVerified?: boolean
    status?: string
  }
  createdAt?: string
  updatedAt?: string
}

type PartnerProfileResponse = {
  success: boolean
  message: string
  data: PartnerProfile
}

type ApiErrorResponse = {
  message?: string
}

type ProfileFormState = {
  fullName: string
  phone: string
  operatorName: string
  operatorPhone: string
  description: string
  amenitiesText: string
  cancellationPolicy: string
  refundPolicy: string
  luggagePolicy: string
  childrenPolicy: string
  additionalPolicyNotes: string
  bankName: string
  bankAccountName: string
  bankNumber: string
  bankBranch: string
  sepayVa: string
  taxCode: string
}

function getInitials(name?: string) {
  if (!name) {
    return 'BN'
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function formatDate(value?: string) {
  if (!value) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getApiErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response
  ) {
    const data = error.response.data as ApiErrorResponse

    if (data.message) {
      return data.message
    }
  }

  return 'Unable to load partner profile.'
}

function getApiStatus(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'status' in error.response
  ) {
    return error.response.status
  }

  return undefined
}

function createProfileForm(profile: PartnerProfile): ProfileFormState {
  const policies = !Array.isArray(profile.policies) && profile.policies
    ? profile.policies
    : {}
  const amenitiesText =
    profile.amenities
      ?.map((item) => AMENITY_LABEL_MAP[item] || item)
      .join(', ') || ''

  return {
    fullName: profile.accountInfo?.fullName || '',
    phone: profile.accountInfo?.phone || '',
    operatorName: profile.operatorName || '',
    operatorPhone: profile.operatorPhone || '',
    description: profile.description || '',
    amenitiesText,
    cancellationPolicy:
      policies.cancellation || policies.cancel || policies.cancellationPolicy || '',
    refundPolicy: policies.refund || policies.refundPolicy || '',
    luggagePolicy: policies.luggage || policies.luggagePolicy || '',
    childrenPolicy: policies.children || policies.childrenPolicy || '',
    additionalPolicyNotes:
      policies.additionalNotes ||
      (Array.isArray(profile.policies) ? profile.policies.join('\n') : ''),
    bankName: profile.bankName || '',
    bankAccountName: profile.bankAccountName || '',
    bankNumber: profile.bankNumber || '',
    bankBranch: profile.bankBranch || '',
    sepayVa: profile.sepayVa || '',
    taxCode: profile.taxCode || '',
  }
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-900">
        {value || 'Not available'}
      </p>
    </div>
  )
}

function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<PartnerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<ProfileFormState | null>(null)
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null,
  )
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<{
    title: string
    src: string
  } | null>(null)

  const updateFormField = (field: keyof ProfileFormState, value: string) => {
    setForm((current) => (current ? { ...current, [field]: value } : current))
  }

  const toggleAmenity = (amenity: string) => {
    setForm((current) => {
      if (!current) {
        return current
      }

      const selectedAmenities = current.amenitiesText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      const isSelected = selectedAmenities.includes(amenity)
      const nextAmenities = isSelected
        ? selectedAmenities.filter((item) => item !== amenity)
        : [...selectedAmenities, amenity]

      return {
        ...current,
        amenitiesText: nextAmenities.join(', '),
      }
    })
  }

  const startEditing = () => {
    if (!profile) {
      return
    }

    setForm(createProfileForm(profile))
    setProfilePictureFile(null)
    setCoverImageFile(null)
    setSuccessMessage('')
    setErrorMessage('')
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setForm(profile ? createProfileForm(profile) : null)
    setProfilePictureFile(null)
    setCoverImageFile(null)
    setErrorMessage('')
  }

  const handleUpdateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form) {
      return
    }

    const policies = {
      cancellation: form.cancellationPolicy,
      refund: form.refundPolicy,
      luggage: form.luggagePolicy,
      children: form.childrenPolicy,
      additionalNotes: form.additionalPolicyNotes,
    }

    const amenities = form.amenitiesText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    const formData = new FormData()
    formData.append('fullName', form.fullName)
    formData.append('phone', form.phone)
    formData.append('operatorName', form.operatorName)
    formData.append('operatorPhone', form.operatorPhone)
    formData.append('description', form.description)
    formData.append('amenities', JSON.stringify(amenities))
    formData.append('policies', JSON.stringify(policies))
    formData.append('bankName', form.bankName)
    formData.append('bankAccountName', form.bankAccountName)
    formData.append('bankNumber', form.bankNumber)
    formData.append('bankBranch', form.bankBranch)
    formData.append('sepayVa', form.sepayVa)
    formData.append('taxCode', form.taxCode)

    if (profilePictureFile) {
      formData.append('profilePicture', profilePictureFile)
    }

    if (coverImageFile) {
      formData.append('coverImage', coverImageFile)
    }

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await api.patch<PartnerProfileResponse>(
        '/partner/profile/me',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      )

      setProfile(response.data.data)
      setForm(createProfileForm(response.data.data))
      setProfilePictureFile(null)
      setCoverImageFile(null)
      setIsEditing(false)
      setSuccessMessage(response.data.message)
    } catch (error) {
      if (getApiStatus(error) === 401) {
        localStorage.removeItem('partnerToken')
        localStorage.removeItem('partnerAccount')
        navigate('/login?redirect=/profile', { replace: true })
        return
      }

      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const response = await api.get<PartnerProfileResponse>(
          '/partner/profile/me',
        )

        setProfile(response.data.data)
      } catch (error) {
        if (getApiStatus(error) === 401) {
          localStorage.removeItem('partnerToken')
          localStorage.removeItem('partnerAccount')
          navigate('/login?redirect=/profile', { replace: true })
          return
        }

        setErrorMessage(getApiErrorMessage(error))
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [navigate])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Profile</h2>
          <p className="text-slate-500">Loading partner profile...</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="mx-auto h-2 w-40 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Profile</h2>
          <p className="text-slate-500">View your partner account details.</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage || 'Partner profile not found.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const displayName =
    profile.operatorName || profile.accountInfo?.fullName || 'BusNet Partner'
  const avatarUrl =
    profile.profilePicture || profile.accountInfo?.profilePicture || ''

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profile</h2>
          <p className="text-slate-500">View your partner account details.</p>
        </div>

        <Button
          type="button"
          className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto"
          onClick={startEditing}
          disabled={isEditing}
        >
          <Edit />
          Update Profile
        </Button>
      </div>

      {successMessage ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {!isEditing ? (
      <Card className="rounded-lg py-0">
        <div className="h-40 bg-slate-900">
          {profile.coverImage ? (
            <button
              type="button"
              className="group block h-full w-full cursor-zoom-in overflow-hidden text-left"
              onClick={() =>
                setPreviewImage({
                  title: `${displayName} cover image`,
                  src: profile.coverImage || '',
                })
              }
            >
              <img
                src={profile.coverImage}
                alt={`${displayName} cover`}
                className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02] group-hover:opacity-90"
              />
            </button>
          ) : (
            <div className="flex h-full items-center justify-end px-8">
              <button
                type="button"
                className="cursor-zoom-in rounded-lg"
                onClick={() =>
                  setPreviewImage({
                    title: 'BusNet logo',
                    src: '/logo.jpg',
                  })
                }
              >
                <img
                  src="/logo.jpg"
                  alt="BusNet logo"
                  className="h-24 w-32 rounded-lg bg-white object-cover p-2 opacity-95 transition hover:opacity-80"
                />
              </button>
            </div>
          )}
        </div>

        <CardContent className="-mt-10 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <button
                type="button"
                className="cursor-zoom-in rounded-full"
                onClick={() =>
                  setPreviewImage({
                    title: `${displayName} profile picture`,
                    src: avatarUrl || '/logo.jpg',
                  })
                }
              >
                <Avatar className="size-24 bg-white ring-4 ring-white transition hover:opacity-85">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="text-xl font-bold text-blue-700">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </button>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-bold">{displayName}</h3>
                  <Badge
                    variant={profile.isVerified ? 'default' : 'outline'}
                    className={
                      profile.isVerified
                        ? 'bg-blue-600 text-white'
                        : 'bg-white'
                    }
                  >
                    {profile.isVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {profile.description || 'No operator description yet.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-56">
              <div className="rounded-lg border bg-white p-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Star size={16} />
                  Rating
                </div>
                <p className="mt-1 text-xl font-bold">
                  {profile.ratingAvg ?? 0}
                </p>
              </div>
              <div className="rounded-lg border bg-white p-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <BadgeCheck size={16} />
                  Reviews
                </div>
                <p className="mt-1 text-xl font-bold">
                  {profile.totalReviews ?? 0}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      ) : null}

      {isEditing && form ? (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Edit Partner Profile</CardTitle>
            <CardDescription>
              Update your partner information. Email and verification status are
              read-only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleUpdateProfile}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="profilePicture"
                    className="font-semibold text-slate-900"
                  >
                    Profile picture
                  </Label>
                  <div className="rounded-md border border-input bg-transparent px-3 py-3 shadow-xs">
                    <Label
                      htmlFor="profilePicture"
                      className="inline-flex h-9 w-fit cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 shadow-xs hover:bg-slate-50"
                    >
                      Choose file
                    </Label>
                    <p className="mt-2 text-sm text-slate-500">
                      {profilePictureFile?.name || 'No file chosen'}
                    </p>
                  </div>
                  <Input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) =>
                      setProfilePictureFile(event.target.files?.[0] || null)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="coverImage"
                    className="font-semibold text-slate-900"
                  >
                    Cover image
                  </Label>
                  <div className="rounded-md border border-input bg-transparent px-3 py-3 shadow-xs">
                    <Label
                      htmlFor="coverImage"
                      className="inline-flex h-9 w-fit cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 shadow-xs hover:bg-slate-50"
                    >
                      Choose file
                    </Label>
                    <p className="mt-2 text-sm text-slate-500">
                      {coverImageFile?.name || 'No file chosen'}
                    </p>
                  </div>
                  <Input
                    id="coverImage"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) =>
                      setCoverImageFile(event.target.files?.[0] || null)
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="fullName"
                    className="font-semibold text-slate-900"
                  >
                    Account owner
                  </Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(event) =>
                      updateFormField('fullName', event.target.value)
                    }
                    minLength={2}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="font-semibold text-slate-900"
                  >
                    Account phone
                  </Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(event) =>
                      updateFormField('phone', event.target.value)
                    }
                    placeholder="09xxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="operatorName"
                    className="font-semibold text-slate-900"
                  >
                    Operator name
                  </Label>
                  <Input
                    id="operatorName"
                    value={form.operatorName}
                    onChange={(event) =>
                      updateFormField('operatorName', event.target.value)
                    }
                    minLength={2}
                    maxLength={150}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="operatorPhone"
                    className="font-semibold text-slate-900"
                  >
                    Operator phone
                  </Label>
                  <Input
                    id="operatorPhone"
                    value={form.operatorPhone}
                    onChange={(event) =>
                      updateFormField('operatorPhone', event.target.value)
                    }
                    placeholder="09xxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="taxCode"
                    className="font-semibold text-slate-900"
                  >
                    Tax code
                  </Label>
                  <Input
                    id="taxCode"
                    value={form.taxCode}
                    onChange={(event) =>
                      updateFormField('taxCode', event.target.value)
                    }
                    maxLength={50}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="font-semibold text-slate-900"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(event) =>
                    updateFormField('description', event.target.value)
                  }
                  maxLength={2000}
                  className="min-h-28"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="amenities"
                    className="font-semibold text-slate-900"
                  >
                    Amenities
                  </Label>
                  <div
                    id="amenities"
                    className="flex min-h-24 flex-wrap gap-2 rounded-md border border-input bg-transparent p-3 shadow-xs"
                  >
                    {AMENITY_OPTIONS.map((amenity) => {
                      const isSelected = form.amenitiesText
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)
                        .includes(amenity)

                      return (
                        <Button
                          key={amenity}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          className={
                            isSelected
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-white'
                          }
                          onClick={() => toggleAmenity(amenity)}
                        >
                          {amenity}
                        </Button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-slate-500">
                    Select all amenities available on this operator's buses.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-900">
                    Policies
                  </Label>
                  <div className="grid gap-3 rounded-md border border-input bg-transparent p-3 shadow-xs">
                    <div className="space-y-1">
                      <Label
                        htmlFor="cancellationPolicy"
                        className="text-xs font-semibold text-slate-600"
                      >
                        Cancellation policy
                      </Label>
                      <Input
                        id="cancellationPolicy"
                        value={form.cancellationPolicy}
                        onChange={(event) =>
                          updateFormField(
                            'cancellationPolicy',
                            event.target.value,
                          )
                        }
                        placeholder="Free cancellation up to 24 hours before departure"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="refundPolicy"
                        className="text-xs font-semibold text-slate-600"
                      >
                        Refund policy
                      </Label>
                      <Input
                        id="refundPolicy"
                        value={form.refundPolicy}
                        onChange={(event) =>
                          updateFormField('refundPolicy', event.target.value)
                        }
                        placeholder="80% refund for eligible cancellations"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="luggagePolicy"
                        className="text-xs font-semibold text-slate-600"
                      >
                        Luggage policy
                      </Label>
                      <Input
                        id="luggagePolicy"
                        value={form.luggagePolicy}
                        onChange={(event) =>
                          updateFormField('luggagePolicy', event.target.value)
                        }
                        placeholder="One suitcase and one carry-on bag per passenger"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="childrenPolicy"
                        className="text-xs font-semibold text-slate-600"
                      >
                        Children policy
                      </Label>
                      <Input
                        id="childrenPolicy"
                        value={form.childrenPolicy}
                        onChange={(event) =>
                          updateFormField('childrenPolicy', event.target.value)
                        }
                        placeholder="Children under 6 must travel with an adult"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="additionalPolicyNotes"
                        className="text-xs font-semibold text-slate-600"
                      >
                        Additional notes
                      </Label>
                      <Textarea
                        id="additionalPolicyNotes"
                        value={form.additionalPolicyNotes}
                        onChange={(event) =>
                          updateFormField(
                            'additionalPolicyNotes',
                            event.target.value,
                          )
                        }
                        className="min-h-20"
                        placeholder="Other important policies for passengers"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="bankName"
                    className="font-semibold text-slate-900"
                  >
                    Bank name
                  </Label>
                  <Select
                    value={form.bankName}
                    onValueChange={(value) => updateFormField('bankName', value)}
                  >
                    <SelectTrigger id="bankName" className="h-9 w-full">
                      <SelectValue placeholder="Select a Sepay bank" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      className="max-h-56 overflow-y-auto"
                    >
                      {SEPAY_BANKS.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.code} - {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Choose one of the banks supported by Sepay.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="bankAccountName"
                    className="font-semibold text-slate-900"
                  >
                    Bank account name
                  </Label>
                  <Input
                    id="bankAccountName"
                    value={form.bankAccountName}
                    onChange={(event) =>
                      updateFormField('bankAccountName', event.target.value)
                    }
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="bankNumber"
                    className="font-semibold text-slate-900"
                  >
                    Bank number
                  </Label>
                  <Input
                    id="bankNumber"
                    value={form.bankNumber}
                    onChange={(event) =>
                      updateFormField('bankNumber', event.target.value)
                    }
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="bankBranch"
                    className="font-semibold text-slate-900"
                  >
                    Bank branch
                  </Label>
                  <Input
                    id="bankBranch"
                    value={form.bankBranch}
                    onChange={(event) =>
                      updateFormField('bankBranch', event.target.value)
                    }
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="sepayVa"
                    className="font-semibold text-slate-900"
                  >
                    Sepay VA
                  </Label>
                  <Input
                    id="sepayVa"
                    value={form.sepayVa}
                    onChange={(event) =>
                      updateFormField('sepayVa', event.target.value)
                    }
                    placeholder="Enter Sepay virtual account"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEditing}
                  disabled={isSaving}
                >
                  <X />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isSaving}
                >
                  <Save />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {!isEditing ? (
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 size={18} />
              Operator Information
            </CardTitle>
            <CardDescription>
              Public and account information for your operator profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <DetailItem label="Operator name" value={profile.operatorName} />
              <DetailItem
                label="Operator phone"
                value={profile.operatorPhone}
              />
              <DetailItem label="Account owner" value={profile.accountInfo?.fullName} />
              <DetailItem label="Account status" value={profile.accountInfo?.status} />
            </div>

            <Separator />

            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex gap-3">
                <Mail className="mt-1 text-blue-600" size={18} />
                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Email
                  </p>
                  <p className="text-sm font-medium">
                    {profile.accountInfo?.email || 'Not available'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {profile.accountInfo?.isEmailVerified
                      ? 'Email verified'
                      : 'Email not verified'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-1 text-blue-600" size={18} />
                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Phone
                  </p>
                  <p className="text-sm font-medium">
                    {profile.accountInfo?.phone || 'Not available'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {profile.accountInfo?.isPhoneVerified
                      ? 'Phone verified'
                      : 'Phone not verified'}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-5 md:grid-cols-2">
              <DetailItem
                label="Created at"
                value={formatDate(profile.createdAt)}
              />
              <DetailItem
                label="Verified at"
                value={profile.isVerified ? formatDate(profile.verifiedAt) : 'Not verified'}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote size={18} />
                Banking
              </CardTitle>
              <CardDescription>
                Payment and tax details registered for this partner.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <DetailItem label="Bank name" value={profile.bankName} />
              <DetailItem
                label="Account name"
                value={profile.bankAccountName}
              />
              <DetailItem label="Account number" value={profile.bankNumber} />
              <DetailItem label="Branch" value={profile.bankBranch} />
              <DetailItem label="Tax code" value={profile.taxCode} />
              <DetailItem label="Sepay VA" value={profile.sepayVa} />
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={18} />
                Documents
              </CardTitle>
              <CardDescription>
                Verification documents and profile metadata.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <DetailItem
                label="Business license"
                value={profile.businessLicense}
              />
              <div className="flex items-center gap-3 rounded-lg border bg-slate-50 p-3">
                <ShieldCheck className="text-blue-600" size={18} />
                <div>
                  <p className="text-sm font-medium">
                    {profile.isVerified
                      ? 'Partner profile verified'
                      : 'Waiting for verification'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Last updated {formatDate(profile.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      ) : null}

      {!isEditing ? (
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Services And Policies</CardTitle>
          <CardDescription>
            Amenities and operating policies shown on your public profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {profile.amenities?.length ? (
                profile.amenities.map((item) => (
                  <Badge key={item} variant="secondary">
                    {item}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No amenities configured.
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold">Policies</p>
            <div className="space-y-2">
              {Array.isArray(profile.policies) && profile.policies.length ? (
                profile.policies.map((item) => (
                  <p key={item} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                    {item}
                  </p>
                ))
              ) : profile.policies && !Array.isArray(profile.policies) ? (
                Object.entries(profile.policies).map(([key, value]) => (
                  <div key={key} className="rounded-md bg-slate-50 px-3 py-2">
                    <p className="text-xs font-medium uppercase text-slate-400">
                      {key}
                    </p>
                    <p className="text-sm text-slate-700">{value}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No policies configured.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      ) : null}

      <Dialog
        open={Boolean(previewImage)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewImage(null)
          }
        }}
      >
        <DialogContent className="max-w-5xl p-4 sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{previewImage?.title}</DialogTitle>
            <DialogDescription>
              Preview image uploaded for this partner profile.
            </DialogDescription>
          </DialogHeader>
          {previewImage ? (
            <div className="max-h-[75vh] overflow-hidden rounded-lg bg-slate-100">
              <img
                src={previewImage.src}
                alt={previewImage.title}
                className="mx-auto max-h-[75vh] w-full object-contain"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProfilePage
