'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/stores/authStore'
import { apiRequest } from '@/lib/apiRequest'

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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

/* -------------------------------------------------------------------------- */
/*                               ZOD SCHEMA                                   */
/* -------------------------------------------------------------------------- */
const LoginSchema = z.object({
  identifier: z.string().min(3, 'Please enter Membership No, Email, or Mobile'),
})

type LoginValues = z.infer<typeof LoginSchema>

/* -------------------------------------------------------------------------- */
/*                       IDENTIFIER → API PAYLOAD                              */
/* -------------------------------------------------------------------------- */
const buildLoginPayload = (identifier: string) => {
  if (/^\d{10}$/.test(identifier)) return { mobile: identifier }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) return { email: identifier }
  return { membershipNumber: identifier }
}

type LoginResponse = {
  accessToken: string
  user: {
    id: string
    name: string
    email: string
    mobile?: string
    membershipNumber?: string
    role: 'user'
    status: 'Pending' | 'Approved'
  }
}

export default function LoginForm() {
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser)

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { identifier: '' },
  })

  const onSubmit = async (values: LoginValues) => {
    try {
      const payload = buildLoginPayload(values.identifier)

      const data = await apiRequest<typeof payload, LoginResponse>({
        endpoint: '/api/users/login',
        method: 'POST',
        body: payload,
      })

      setUser(data.user, data.accessToken)
      router.push('/mylearning')
    } catch (error: any) {
      form.setError('identifier', {
        message: error.message || 'Unable to login',
      })
    }
  }

  return (
    <Card className="p-0 w-full max-w-4xl overflow-hidden rounded-2xl shadow-xl grid md:grid-cols-[2fr_2fr]">
      {/* ================= LEFT – FORM (60%) ================= */}
      <div className="flex flex-col justify-between p-6 md:p-10">
        <div>
          <CardHeader className="px-0">
            <CardTitle className="text-2xl text-bold text-orange-700 hover:text-orange-800">Login</CardTitle>
          </CardHeader>

          <CardContent className="px-0">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login using Membership Number / Email / Mobile</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Membership Number / Email / Mobile"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="px-0 pt-4 text-sm text-center">
            Not a USI Member?{' '}
            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="text-orange-600 font-medium hover:underline"
            >
              Signup
            </button>{' '}
            (Subject to USI approval)
          </CardFooter>
        </div>

        {/* ✅ LOGO – NEVER OVERFLOWS 50% */}
        <div className="mt-6 flex flex-col items-center justify-center gap-2 text-center">
          <span className="pt-4 text-sm text-gray-600">
            Educational Grant By
          </span>

          <Image
            src="/logo.png"
            alt="USI Logo"
            width={300}
            height={80}
            className="w-full max-w-[300px] object-contain"
            priority
          />
        </div>

      </div>

      {/* ================= RIGHT – IMAGE (40%) ================= */}
      <div className="relative hidden md:block">
        {/* Image fills full height of card */}
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
