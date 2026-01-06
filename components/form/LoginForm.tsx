'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { apiRequest } from '@/lib/apiRequest'
import { useAuthStore } from '@/stores/authStore'

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

/* -------------------------------------------------------------------------- */
/*                                   CONFIG                                   */
/* -------------------------------------------------------------------------- */
const OTP_EXPIRY = 120 // 2 min
const RESEND_LIMIT = 3
const LOCK_DURATION = 3600 // 60 min
const MAX_WRONG_ATTEMPTS = 3
const WRONG_OTP_LOCK = 300 // 5 min

const STORAGE_KEY = 'login-otp-state'

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */
const LoginSchema = z.object({
  identifier: z.string().min(3, 'Please enter Membership No / Email / Mobile'),
})

const OtpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
})

type LoginValues = z.infer<typeof LoginSchema>
type OtpValues = z.infer<typeof OtpSchema>

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */
const buildLoginPayload = (
  identifier: string,
  channel: 'email' | 'sms'
) => {
  if (/^\d{10}$/.test(identifier))
    return { mobile: identifier, channel }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier))
    return { email: identifier, channel }

  return { membershipNumber: identifier, channel }
}

const formatTime = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */
export default function LoginForm() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  const [step, setStep] = useState<'LOGIN' | 'OTP'>('LOGIN')
  const [userId, setUserId] = useState<string | null>(null)

  const [otpTimer, setOtpTimer] = useState(OTP_EXPIRY)
  const [resendCount, setResendCount] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimer, setLockTimer] = useState(LOCK_DURATION)
  const [channel, setChannel] = useState<'email' | 'sms'>('email')

  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [wrongLockTimer, setWrongLockTimer] = useState(0)

  /* ----------------------------- FORMS ----------------------------- */
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { identifier: '' },
  })

  const otpForm = useForm<OtpValues>({
    resolver: zodResolver(OtpSchema),
    defaultValues: { otp: '' },
  })

  /* -------------------------------------------------------------------------- */
  /*                         LOCAL STORAGE RESTORE                              */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const s = JSON.parse(raw)
    setStep(s.step ?? 'LOGIN')
    setUserId(s.userId ?? null)
    setOtpTimer(s.otpTimer ?? OTP_EXPIRY)
    setResendCount(s.resendCount ?? 0)
    setIsLocked(s.isLocked ?? false)
    setLockTimer(s.lockTimer ?? LOCK_DURATION)
    setWrongAttempts(s.wrongAttempts ?? 0)
    setWrongLockTimer(s.wrongLockTimer ?? 0)
  }, [])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        step,
        userId,
        otpTimer,
        resendCount,
        isLocked,
        lockTimer,
        wrongAttempts,
        wrongLockTimer,
      })
    )
  }, [
    step,
    userId,
    otpTimer,
    resendCount,
    isLocked,
    lockTimer,
    wrongAttempts,
    wrongLockTimer,
  ])

  /* -------------------------------------------------------------------------- */
  /*                                  TIMERS                                   */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (step !== 'OTP' || otpTimer <= 0) return
    const i = setInterval(() => setOtpTimer((t) => t - 1), 1000)
    return () => clearInterval(i)
  }, [step, otpTimer])

  useEffect(() => {
    if (!isLocked || lockTimer <= 0) return
    const i = setInterval(() => setLockTimer((t) => t - 1), 1000)
    return () => clearInterval(i)
  }, [isLocked, lockTimer])

  useEffect(() => {
    if (wrongLockTimer <= 0) return
    const i = setInterval(() => setWrongLockTimer((t) => t - 1), 1000)
    return () => clearInterval(i)
  }, [wrongLockTimer])

  /* -------------------------------------------------------------------------- */
  /*                        AUTO-PASTE OTP (WEB OTP API)                        */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (step !== 'OTP') return
    if (!('OTPCredential' in window)) return

    const ac = new AbortController()

    ;(navigator as any).credentials
      .get({
        otp: { transport: ['sms'] },
        signal: ac.signal,
      })
      .then((otp: any) => {
        if (otp?.code) {
          otpForm.setValue('otp', otp.code, { shouldValidate: true })
          handleVerifyOtp({ otp: otp.code })
        }
      })
      .catch(() => {})

    return () => ac.abort()
  }, [step])

  /* -------------------------------------------------------------------------- */
  /*                              SEND OTP                                     */
  /* -------------------------------------------------------------------------- */
  const sendOtp = async (isResend = false) => {
    const identifier = loginForm.getValues('identifier')
    const payload = buildLoginPayload(identifier, channel)

    try {
      const res = await apiRequest<
        typeof payload,
        { userId: string }
      >({
        endpoint: '/api/users/login',
        method: 'POST',
        body: payload,
      })

      setUserId(res.userId)
      setStep('OTP')
      setOtpTimer(OTP_EXPIRY)
      setWrongAttempts(0)
      setWrongLockTimer(0)

      if (!isResend) {
        setResendCount(0)
        setIsLocked(false)
        setLockTimer(LOCK_DURATION)
      } else {
        setResendCount((c) => c + 1)
      }

      toast.success(`OTP sent via ${channel.toUpperCase()}`)
    } catch (e: any) {
      toast.error(e.message || 'Failed to send OTP')
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                              RESEND OTP                                   */
  /* -------------------------------------------------------------------------- */
  const handleResendOtp = async () => {
    if (otpTimer > 0 || isLocked) return

    if (resendCount >= RESEND_LIMIT) {
      setIsLocked(true)
      setLockTimer(LOCK_DURATION)
      toast.error('Too many OTP requests. Try again after 60 minutes.')
      return
    }

    await sendOtp(true)
  }

  /* -------------------------------------------------------------------------- */
  /*                              VERIFY OTP                                   */
  /* -------------------------------------------------------------------------- */
  const handleVerifyOtp = async (values: OtpValues) => {
    if (!userId) return
    if (wrongLockTimer > 0) return

    try {
      const res = await apiRequest<
        { userId: string; otp: string },
        { accessToken: string; user: any }
      >({
        endpoint: '/api/users/verify-otp',
        method: 'POST',
        body: { userId, otp: values.otp },
      })

      setUser(res.user, res.accessToken)
      localStorage.removeItem(STORAGE_KEY)
      toast.success('Login successful')
      router.push('/mylearning')
    } catch (e: any) {
      const attempts = wrongAttempts + 1
      setWrongAttempts(attempts)

      if (attempts >= MAX_WRONG_ATTEMPTS) {
        setWrongLockTimer(WRONG_OTP_LOCK)
        toast.error('Too many wrong OTP attempts. Try again after 15 minutes.')
      } else {
        otpForm.setError('otp', {
          message: `Invalid OTP. ${MAX_WRONG_ATTEMPTS - attempts} attempts left.`,
        })
      }
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                       */
  /* -------------------------------------------------------------------------- */
  return (
    <Card className="p-0 w-full max-w-4xl overflow-hidden rounded-2xl shadow-xl grid md:grid-cols-[2fr_2fr]">
      {/* LEFT */}
      <div className="flex flex-col justify-between p-6 md:p-10">
        <div>
          <CardHeader className="px-0">
            <CardTitle className="text-2xl text-orange-700">
              Login
            </CardTitle>
          </CardHeader>

          <CardContent className="px-0 space-y-4">
            {step === 'LOGIN' && (
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(() => sendOtp())}
                  className="space-y-4"
                >
                  <FormField
                    control={loginForm.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Login using Membership Number / Email / Mobile
                        </FormLabel>
                        <FormControl>
                          <Input {...field}
                          placeholder='Membership Number / Email / Mobile' />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <ToggleGroup
                    type="single"
                    value={channel}
                    onValueChange={(v) =>
                      v && setChannel(v as 'email' | 'sms')
                    }
                  >
                    <ToggleGroupItem value="email">Email</ToggleGroupItem>
                    <ToggleGroupItem value="sms">SMS</ToggleGroupItem>
                  </ToggleGroup>

                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    Send OTP
                  </Button>
                </form>
              </Form>
            )}

            {step === 'OTP' && (
              <>
                {wrongLockTimer > 0 && (
                  <p className="text-xs text-center text-red-600">
                    Too many wrong attempts. Try again in{' '}
                    {formatTime(wrongLockTimer)}
                  </p>
                )}
                <Form {...otpForm}>
                  <form className="space-y-4">
                    <FormField
                      control={otpForm.control}
                      name="otp"
                      render={() => (
                        <InputOTP
                          maxLength={6}
                          onChange={(v) => {
                            const value = v.replace(/\D/g, '')
                            otpForm.setValue('otp', value, {
                              shouldValidate: true,
                            })

                            if (value.length === 6) {
                              otpForm.trigger('otp').then((ok) => {
                                if (ok) handleVerifyOtp({ otp: value })
                              })
                            }
                          }}
                        >
                          <InputOTPGroup>
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                              <InputOTPSlot key={i} index={i} />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      )}
                    />

                    <FormMessage />
                  </form>
                </Form>

                {!isLocked && (
                  <p className="text-xs text-center text-gray-500">
                    {otpTimer > 0
                      ? `Resend OTP in ${formatTime(otpTimer)}`
                      : 'Didn’t receive OTP?'}
                  </p>
                )}

                {isLocked && (
                  <p className="text-xs text-center text-red-600">
                    Too many OTP requests. Try again in{' '}
                    {formatTime(lockTimer)}
                  </p>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={otpTimer > 0 || isLocked}
                  onClick={handleResendOtp}
                >
                  Resend OTP
                </Button>
              </>
            )}
          </CardContent>

          <CardFooter className="px-0 pt-4 text-sm text-center">
            Not a USI Member?{' '}
            <button
              onClick={() => router.push('/signup')}
              className="text-orange-600 font-medium hover:underline"
            >
              Signup
            </button>
          </CardFooter>
        </div>

        <div className="mt-6 text-center">
          <span className="text-sm text-gray-600 block mb-2">
            Educational Grant By
          </span>
          <Image
            src="/logo.png"
            alt="USI Logo"
            width={300}
            height={80}
            className="mx-auto"
          />
        </div>
      </div>

      {/* RIGHT IMAGE – UNCHANGED */}
      <div className="relative hidden md:block">
        <Image
          src="/login.png"
          alt="Login Illustration"
          fill
          priority
          className="object-cover"
        />
      </div>
    </Card>
  )
}
