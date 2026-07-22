import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  Loader2,
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

// Fleet photography for the left panel, cycled as a slow ambient crossfade
// rather than a single static frame.
const HERO_IMAGES = [
  '/hero-bus.jpg',
  '/hero-bus-2.jpg',
  '/hero-bus-3.jpg',
  '/hero-bus-4.jpg',
  '/hero-bus-5.jpg',
  '/hero-bus-6.jpg',
  '/hero-bus-7.jpg',
]

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
  const [searchParams] = useSearchParams()
  const redirectPath = searchParams.get('redirect')
  const safeRedirectPath =
    redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('//')
      ? redirectPath
      : '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    if (localStorage.getItem('partnerToken')) {
      navigate(safeRedirectPath)
    }
  }, [navigate, safeRedirectPath])

  // Slow ambient crossfade through the fleet photos — paused entirely for
  // users who have asked the OS for reduced motion, since an unstoppable
  // auto-advancing carousel is exactly the kind of motion that preference
  // exists to suppress.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const interval = setInterval(() => {
      setActiveImage((i) => (i + 1) % HERO_IMAGES.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

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
      navigate(safeRedirectPath)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[55%_45%]">
        <section className="relative hidden flex-col overflow-hidden bg-blue-950 p-12 text-white lg:flex">
          {/* Real fleet photography instead of a flat field — grounds the brand
              in actual coach buses rather than an abstract gradient. All frames
              are stacked and crossfaded via opacity so there is never a blank
              frame between transitions. */}
          {HERO_IMAGES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[2000ms] ease-in-out ${
                i === activeImage ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          {/* Light brand-blue scrim — just enough for text contrast at the top
              and bottom, leaving the photo itself clearly visible instead of
              drowning it in a flat overlay. */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/35 to-blue-950/60" />

          <Link
            to="/login"
            className="motion-safe:animate-in fade-in relative z-10 flex w-fit items-center gap-3 duration-700 ease-out"
          >
            <span className="flex size-10 items-center justify-center rounded-md bg-blue-600 shadow-lg shadow-blue-950/40">
              <Building2 size={22} />
            </span>
            <span className="text-xl font-bold drop-shadow-[0_2px_6px_rgba(6,20,55,0.7)]">
              BusNet Partner
            </span>
          </Link>

          <div className="relative z-10 flex flex-1 flex-col justify-center">
            <div className="max-w-lg space-y-5">
              <p className="motion-safe:animate-in fade-in slide-in-from-bottom-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-200 drop-shadow-[0_2px_6px_rgba(6,20,55,0.8)] duration-700 delay-0 ease-out fill-mode-both">
                Partner Portal
              </p>
              <h1 className="text-5xl font-bold leading-[1.15] text-white drop-shadow-[0_4px_16px_rgba(6,20,55,0.85)]">
                <span className="motion-safe:animate-in fade-in slide-in-from-bottom-2 block duration-700 delay-150 ease-out fill-mode-both">
                  Manage your fleet.
                </span>
                <span className="motion-safe:animate-in fade-in slide-in-from-bottom-2 block duration-700 delay-300 ease-out fill-mode-both">
                  Plan every route.
                </span>
                <span className="motion-safe:animate-in fade-in slide-in-from-bottom-2 block duration-700 delay-500 ease-out fill-mode-both">
                  Grow your revenue.
                </span>
              </h1>
              <p className="motion-safe:animate-in fade-in slide-in-from-bottom-1 max-w-md text-base leading-7 text-blue-50/90 drop-shadow-[0_2px_6px_rgba(6,20,55,0.8)] duration-700 delay-700 ease-out fill-mode-both">
                Sign in to continue operating your transport business on
                BusNet.
              </p>
            </div>
          </div>

          <p className="motion-safe:animate-in fade-in relative z-10 text-sm text-blue-100/80 drop-shadow-[0_2px_6px_rgba(6,20,55,0.8)] duration-1000 delay-1000 ease-out fill-mode-both">
            Secure access for verified transport partners.
          </p>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-md motion-safe:animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
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

            <Card className="rounded-2xl border-none shadow-xl shadow-slate-200/70 ring-1 ring-slate-200/60">
              <CardHeader className="items-center gap-2 text-center">
                <div className="mb-1 flex size-12 items-center justify-center rounded-full bg-blue-600 shadow-md shadow-blue-200">
                  <ShieldCheck className="size-5 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">
                  Partner login
                </CardTitle>
                <CardDescription>
                  Enter your partner credentials to access the management panel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="motion-safe:animate-in fade-in slide-in-from-bottom-2 space-y-2 duration-500 delay-100 fill-mode-both">
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
                        className="h-11 rounded-lg pl-9 transition-shadow focus-visible:ring-4 focus-visible:ring-blue-500/10"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="motion-safe:animate-in fade-in slide-in-from-bottom-2 space-y-2 duration-500 delay-200 fill-mode-both">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        to="/forgot-password"
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
                        className="h-11 rounded-lg px-9 transition-shadow focus-visible:ring-4 focus-visible:ring-blue-500/10"
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
                        <span className="transition-transform duration-200">
                          {showPassword ? <EyeOff /> : <Eye />}
                        </span>
                      </Button>
                    </div>
                  </div>

                  <div className="motion-safe:animate-in fade-in slide-in-from-bottom-2 flex items-center justify-between gap-3 duration-500 delay-300 fill-mode-both">
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
                    <div className="motion-safe:animate-in fade-in slide-in-from-top-1 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 duration-300">
                      {errorMessage}
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    size="lg"
                    className="motion-safe:animate-in fade-in slide-in-from-bottom-2 h-11 w-full gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 shadow-md shadow-blue-200 duration-500 delay-500 fill-mode-both transition-all hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-600 hover:shadow-lg hover:shadow-blue-200/80 active:translate-y-0"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight />
                      </>
                    )}
                  </Button>
                </form>

                <div className="motion-safe:animate-in fade-in mt-5 flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 duration-500 delay-700 fill-mode-both">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    This portal is restricted to verified BusNet transport
                    partners. All sign-in activity is monitored for security.
                  </p>
                </div>
              </CardContent>
            </Card>

            <p className="motion-safe:animate-in fade-in text-center text-sm text-slate-500 duration-500 delay-1000 fill-mode-both">
              Need a partner account? Contact BusNet operations.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default LoginPage
