import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BadgeCheck,
  Banknote,
  Building2,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  Star,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import api from '@/services/api'

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

  if (errorMessage || !profile) {
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
      <div>
        <h2 className="text-2xl font-bold">Profile</h2>
        <p className="text-slate-500">View your partner account details.</p>
      </div>

      <Card className="rounded-lg">
        <div className="h-40 bg-slate-900">
          {profile.coverImage ? (
            <img
              src={profile.coverImage}
              alt={`${displayName} cover`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-end px-8">
              <img
                src="/logo.jpg"
                alt="BusNet logo"
                className="h-24 w-32 rounded-lg bg-white object-cover p-2 opacity-95"
              />
            </div>
          )}
        </div>

        <CardContent className="-mt-10 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar className="size-24 bg-white ring-4 ring-white">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="text-xl font-bold text-blue-700">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
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
    </div>
  )
}

export default ProfilePage
