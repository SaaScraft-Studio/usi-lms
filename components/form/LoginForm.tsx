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
  // Mobile (10 digits)
  if (/^\d{10}$/.test(identifier)) {
    return { mobile: identifier }
  }

  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
    return { email: identifier }
  }

  // Membership Number
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
    defaultValues: {
      identifier: '',
    },
  })

  /* -------------------------------------------------------------------------- */
  /*                                 SUBMIT                                     */
  /* -------------------------------------------------------------------------- */
  const onSubmit = async (values: LoginValues) => {
    try {
      const payload = buildLoginPayload(values.identifier)

      const data = await apiRequest<typeof payload, LoginResponse>({
        endpoint: '/api/users/login',
        method: 'POST',
        body: payload,
      })

      // ✅ Store token + user (approved users only reach here)
      setUser(data.user, data.accessToken)

      router.push('/mylearning')
    } catch (error: any) {
      form.setError('identifier', {
        message: error.message || 'Unable to login',
      })
    }
  }

  return (
    <div>
      <Card className="w-full max-w-4xl grid md:grid-cols-2 overflow-hidden rounded-2xl shadow-xl">
        {/* LEFT – FORM */}
        <div className="p-6 md:p-10">
          <CardHeader className="px-0">
            <CardTitle className="text-2xl text-orange-700">Login</CardTitle>
            <CardDescription>
              Login using Membership No, Email, or Mobile Number
            </CardDescription>
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
                      <FormLabel>Membership / Email / Mobile</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Membership No, Email or Mobile"
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

        {/* RIGHT – IMAGE */}
        <div className="hidden md:flex items-center justify-center bg-white p-6">
          <Image
            src="/login.png"
            alt="Login Illustration"
            width={320}
            height={320}
            priority
          />
        </div>
      </Card>
    </div>
  )
}
