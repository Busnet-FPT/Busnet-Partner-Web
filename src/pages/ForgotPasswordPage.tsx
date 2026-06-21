import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  RotateCcw,
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

type ResetStep = 'email' | 'code' | 'password' | 'done'

type ApiMessageResponse = {
  success: boolean
  message: string
  data?: unknown
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

  return 'Something went wrong. Please try again.'
}

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<ResetStep>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const resetFeedback = () => {
    setMessage('')
    setErrorMessage('')
  }

  const handleSendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetFeedback()
    setIsSubmitting(true)

    try {
      const response = await api.post<ApiMessageResponse>(
        '/partner/forgot-password/send-code',
        { email: email.trim() },
      )

      setMessage(response.data.message)
      setStep('code')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetFeedback()
    setIsSubmitting(true)

    try {
      const response = await api.post<ApiMessageResponse>(
        '/partner/forgot-password/verify-code',
        {
          email: email.trim(),
          code,
        },
      )

      setMessage(response.data.message)
      setStep('password')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetFeedback()

    if (newPassword !== confirmPassword) {
      setErrorMessage('Confirm password does not match.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await api.post<ApiMessageResponse>(
        '/partner/forgot-password/reset',
        {
          email: email.trim(),
          code,
          newPassword,
        },
      )

      setMessage(response.data.message)
      setStep('done')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendCode = async () => {
    resetFeedback()
    setIsSubmitting(true)

    try {
      const response = await api.post<ApiMessageResponse>(
        '/partner/forgot-password/resend-code',
        { email: email.trim() },
      )

      setMessage(response.data.message)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[1fr_480px]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex">
          <div className="pointer-events-none absolute right-10 top-10 flex h-24 w-32 items-center justify-center overflow-hidden rounded-lg bg-white p-2 shadow-xl shadow-sky-950/30 ring-1 ring-white/20">
            <img
              src="/logo.jpg"
              alt="BusNet logo"
              className="h-full w-full object-cover"
            />
          </div>

          <Link to="/login" className="flex w-fit items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-blue-600">
              <KeyRound size={22} />
            </span>
            <span className="text-xl font-bold">BusNet Partner</span>
          </Link>

          <div className="max-w-2xl space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm text-slate-200">
                <ShieldCheck size={16} />
                Account Recovery
              </div>
              <h1 className="max-w-xl text-4xl font-bold leading-tight">
                Verify your email before creating a new partner password.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-300">
                We will send a 6-digit verification code to your registered
                partner email before password reset is allowed.
              </p>
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-3">
              {['Email', 'Code', 'Password'].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-sm font-medium text-slate-200">{item}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {item === 'Email'
                      ? 'Receive code'
                      : item === 'Code'
                        ? 'Verify request'
                        : 'Reset securely'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-slate-400">
            Password recovery is available for active partner accounts.
          </p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-md space-y-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft size={16} />
              Back to login
            </Link>

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  {step === 'done' ? 'Password updated' : 'Forgot password'}
                </CardTitle>
                <CardDescription>
                  {step === 'email'
                    ? 'Enter your partner email to receive a verification code.'
                    : step === 'code'
                      ? `Enter the 6-digit code sent to ${email}.`
                      : step === 'password'
                        ? 'Create a new password for your partner account.'
                        : 'You can now sign in with your new password.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {step === 'email' ? (
                  <form className="space-y-5" onSubmit={handleSendCode}>
                    <div className="space-y-2">
                      <Label htmlFor="email">Partner email</Label>
                      <div className="relative">
                        <Mail
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          size={16}
                        />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          required
                          placeholder="partner@busnet.com"
                          className="h-11 pl-9"
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="h-11 w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Sending code...' : 'Send code'}
                      <ArrowRight />
                    </Button>
                  </form>
                ) : null}

                {step === 'code' ? (
                  <form className="space-y-5" onSubmit={handleVerifyCode}>
                    <div className="space-y-2">
                      <Label htmlFor="code">Verification code</Label>
                      <Input
                        id="code"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={code}
                        onChange={(event) =>
                          setCode(event.target.value.replace(/\D/g, ''))
                        }
                        required
                        placeholder="123456"
                        className="h-12 text-center text-lg font-semibold tracking-[0.35em]"
                        autoComplete="one-time-code"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="h-11 flex-1"
                        disabled={isSubmitting}
                        onClick={handleResendCode}
                      >
                        <RotateCcw />
                        Resend
                      </Button>
                      <Button
                        type="submit"
                        size="lg"
                        className="h-11 flex-1 bg-blue-600 hover:bg-blue-700"
                        disabled={isSubmitting || code.length !== 6}
                      >
                        Verify
                        <ArrowRight />
                      </Button>
                    </div>
                  </form>
                ) : null}

                {step === 'password' ? (
                  <form className="space-y-5" onSubmit={handleResetPassword}>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New password</Label>
                      <div className="relative">
                        <LockKeyhole
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          size={16}
                        />
                        <Input
                          id="newPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(event) =>
                            setNewPassword(event.target.value)
                          }
                          required
                          minLength={7}
                          placeholder="New password"
                          className="h-11 px-9"
                          autoComplete="new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="absolute right-1.5 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword((value) => !value)}
                          aria-label={
                            showPassword ? 'Hide password' : 'Show password'
                          }
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm new password
                      </Label>
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
                          placeholder="Confirm new password"
                          className="h-11 px-9"
                          autoComplete="new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="absolute right-1.5 top-1/2 -translate-y-1/2"
                          onClick={() =>
                            setShowConfirmPassword((value) => !value)
                          }
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

                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                      Password must start with a capital letter and include a
                      number, a special character, and at least 7 characters.
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="h-11 w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Resetting...' : 'Reset password'}
                      <ArrowRight />
                    </Button>
                  </form>
                ) : null}

                {step === 'done' ? (
                  <div className="space-y-5">
                    <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-800">
                      <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
                      <span>
                        Your password has been reset successfully. Please sign
                        in again with the new password.
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="lg"
                      className="h-11 w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => navigate('/login')}
                    >
                      Back to login
                      <ArrowRight />
                    </Button>
                  </div>
                ) : null}

                {message && step !== 'done' ? (
                  <div className="mt-5 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                    {message}
                  </div>
                ) : null}

                {errorMessage ? (
                  <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errorMessage}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}

export default ForgotPasswordPage
