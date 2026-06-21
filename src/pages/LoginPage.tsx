import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
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

type PartnerAccount = {
  _id: string
  username: string
  email: string
  phone?: string
  fullName?: string
  role: 'PARTNER'
  status: string
  profilePicture?: string
}

type PartnerLoginResponse = {
  success: boolean
  message: string
  data: {
    token: string
    account: PartnerAccount
  }
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

  return 'Unable to sign in. Please check your account and try again.'
}

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (localStorage.getItem('partnerToken')) {
      navigate('/')
    }
  }, [navigate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const response = await api.post<PartnerLoginResponse>(
        '/partner/auth/login',
        {
          identifier: email.trim(),
          password,
        },
      )
      const { token, account } = response.data.data

      localStorage.setItem('partnerToken', token)
      localStorage.setItem('partnerAccount', JSON.stringify(account))
      localStorage.setItem('partnerRememberMe', String(rememberMe))
      navigate('/')
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
              <Building2 size={22} />
            </span>
            <span className="text-xl font-bold">BusNet Partner</span>
          </Link>

          <div className="max-w-2xl space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm text-slate-200">
                <ShieldCheck size={16} />
                Partner Portal
              </div>
              <h1 className="max-w-xl text-4xl font-bold leading-tight">
                Manage your routes, buses, schedules and revenue in one place.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-300">
                Sign in with your partner account to continue operating your
                transport business on BusNet.
              </p>
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-3">
              {['Buses', 'Routes', 'Bookings'].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-sm font-medium text-slate-200">{item}</p>
                  <p className="mt-2 text-2xl font-bold">0</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-slate-400">
            Secure access for verified transport partners.
          </p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-3 lg:hidden">
              <Link to="/login" className="flex w-fit items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-md bg-blue-600 text-white">
                  <Building2 size={22} />
                </span>
                <span className="text-xl font-bold text-blue-700">
                  BusNet Partner
                </span>
              </Link>
            </div>

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  Partner login
                </CardTitle>
                <CardDescription>
                  Enter your partner credentials to access the management panel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="identifier">Email or phone number</Label>
                    <div className="relative">
                      <Mail
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                      />
                      <Input
                        id="identifier"
                        type="text"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        placeholder="partner@busnet.com"
                        className="h-11 pl-9"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        to="/login"
                        className="text-sm font-medium text-blue-700 hover:text-blue-800"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <LockKeyhole
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                      />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        minLength={6}
                        placeholder="Enter your password"
                        className="h-11 px-9"
                        autoComplete="current-password"
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

                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(event) =>
                          setRememberMe(event.target.checked)
                        }
                        className="size-4 rounded border-slate-300 text-blue-600 accent-blue-600"
                      />
                      Remember me
                    </label>
                  </div>

                  {errorMessage ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {errorMessage}
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    size="lg"
                    className="h-11 w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign in'}
                    <ArrowRight />
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-slate-500">
              Need a partner account? Contact BusNet operations.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default LoginPage
