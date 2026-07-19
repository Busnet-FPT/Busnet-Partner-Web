import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Save,
  ShieldCheck,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/services/api'

type ApiMessageResponse = {
  success: boolean
  message: string
}

type ApiErrorResponse = {
  message?: string
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

  return 'Unable to change password. Please check your password and try again.'
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

function ChangePasswordPage() {
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const passwordRules = [
    {
      label: '7 to 50 characters',
      isValid: newPassword.length >= 7 && newPassword.length <= 50,
    },
    {
      label: 'At least one uppercase letter',
      isValid: /[A-Z]/.test(newPassword),
    },
    {
      label: 'At least one number',
      isValid: /\d/.test(newPassword),
    },
    {
      label: 'At least one special character',
      isValid: /[!@#$%^&*(),.?":{}|<>_+\-=[\]\\';]/.test(newPassword),
    },
  ]

  const isPasswordValid = passwordRules.every((rule) => rule.isValid)
  const canSubmit =
    currentPassword.length > 0 &&
    isPasswordValid &&
    newPassword === confirmPassword &&
    !isSubmitting

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')

    if (newPassword !== confirmPassword) {
      setErrorMessage('Confirm password does not match.')
      return
    }

    if (!isPasswordValid) {
      setErrorMessage('New password does not meet the requirements.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await api.patch<ApiMessageResponse>(
        '/partner/profile/change-password',
        {
          currentPassword,
          newPassword,
        },
      )

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccessMessage(response.data.message)
    } catch (error) {
      if (getApiStatus(error) === 401) {
        localStorage.removeItem('partnerToken')
        localStorage.removeItem('partnerAccount')
        navigate('/login?redirect=/change-password', { replace: true })
        return
      }

      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Change Password</h2>
        <p className="text-slate-500">
          Update the password used to sign in to your partner account.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,640px)_1fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound size={18} />
              Password Security
            </CardTitle>
            <CardDescription>
              Enter your current password before creating a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <div className="relative">
                  <LockKeyhole
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(event) =>
                      setCurrentPassword(event.target.value)
                    }
                    required
                    className="h-11 px-9"
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2"
                    onClick={() => setShowCurrentPassword((value) => !value)}
                    aria-label={
                      showCurrentPassword
                        ? 'Hide current password'
                        : 'Show current password'
                    }
                  >
                    {showCurrentPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <LockKeyhole
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    minLength={7}
                    maxLength={50}
                    className="h-11 px-9"
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2"
                    onClick={() => setShowNewPassword((value) => !value)}
                    aria-label={
                      showNewPassword ? 'Hide new password' : 'Show new password'
                    }
                  >
                    {showNewPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <div className="relative">
                  <LockKeyhole
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    required
                    minLength={7}
                    maxLength={50}
                    className="h-11 px-9"
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirm password'
                        : 'Show confirm password'
                    }
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
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

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto"
                  disabled={!canSubmit}
                >
                  <Save />
                  {isSubmitting ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck size={18} />
              Requirements
            </CardTitle>
            <CardDescription>
              Your new password must satisfy every rule below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {passwordRules.map((rule) => (
              <div
                key={rule.label}
                className="flex items-center gap-3 rounded-md border bg-slate-50 px-3 py-2"
              >
                <CheckCircle2
                  size={17}
                  className={
                    rule.isValid ? 'text-green-600' : 'text-slate-300'
                  }
                />
                <span
                  className={
                    rule.isValid
                      ? 'text-sm font-medium text-slate-900'
                      : 'text-sm text-slate-500'
                  }
                >
                  {rule.label}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ChangePasswordPage
