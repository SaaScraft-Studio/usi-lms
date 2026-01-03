'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { apiRequest } from '@/lib/apiRequest'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'
import { countries } from '@/data/countries'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

type SignupPayload = {
  prefix?: string
  name: string
  email: string
  mobile: string
  qualification?: string
  affiliation?: string
  country: string
}

export default function SignupForm() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<SignupPayload>({
    prefix: '',
    name: '',
    email: '',
    mobile: '',
    qualification: '',
    affiliation: '',
    country: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.name || !form.email || !form.mobile || !form.country) {
      setError('Please fill all required fields.')
      return
    }

    if (!/^\d{10}$/.test(form.mobile)) {
      setError('Mobile number must be 10 digits.')
      return
    }

    if (!agree) {
      setError('Please accept Terms & Conditions.')
      return
    }

    try {
      setLoading(true)

      await apiRequest<SignupPayload, any>({
        endpoint: '/api/users/register',
        method: 'POST',
        body: form,
        showToast: true,
      })

      toast.success('Signup Successful 🎉 Wait for Admin Approval', {
        description: `Submitted on ${getIndianFormattedDate()}`,
      })

      setTimeout(() => router.push('/login'), 1000)
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-0 w-full max-w-4xl overflow-hidden rounded-2xl shadow-xl grid md:grid-cols-[2fr_2fr]">
      {/* ================= LEFT – FORM (60%) ================= */}
      <div className="flex flex-col justify-between p-6 md:p-10">
        <div>
          <CardHeader className="px-0">
            <CardTitle className="text-2xl text-orange-700">
              Sign Up
            </CardTitle>
          </CardHeader>

          <CardContent className="px-0">
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                id="prefix"
                placeholder="Prefix (Dr, Prof, Mr, Ms)"
                value={form.prefix}
                onChange={handleInputChange}
              />

              <Input
                id="name"
                placeholder="Full Name *"
                value={form.name}
                onChange={handleInputChange}
              />

              <Input
                id="email"
                type="email"
                placeholder="Email *"
                value={form.email}
                onChange={handleInputChange}
              />

              <Input
                id="mobile"
                placeholder="Mobile *"
                value={form.mobile}
                onChange={handleInputChange}
              />

              <Input
                id="qualification"
                placeholder="Qualification"
                value={form.qualification}
                onChange={handleInputChange}
              />

              <Input
                id="affiliation"
                placeholder="Affiliation"
                value={form.affiliation}
                onChange={handleInputChange}
              />

              <Select
                value={form.country}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, country: value }))
                }
              >
                <SelectTrigger className='w-full p-3'>
                  <SelectValue placeholder="Select Country *" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-start gap-2 text-sm pt-2">
                <Checkbox
                  id="terms"
                  checked={agree}
                  onCheckedChange={(v) => setAgree(!!v)}
                />
                <label htmlFor="terms">
                  I agree to{' '}
                  <span className="text-orange-600">
                    Terms & Conditions
                  </span>
                </label>
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {loading ? 'Signing up...' : 'Sign Up'}
              </Button>

              <p className="text-xs text-center pt-2">
                Already have an account?{' '}
                <span
                  onClick={() => router.push('/login')}
                  className="text-orange-600 cursor-pointer"
                >
                  Login
                </span>
              </p>
            </form>
          </CardContent>
        </div>

        {/* ✅ LOGO – SAME AS LOGIN */}
        <div className="mt-6 flex flex-col items-center text-center gap-2">
          <span className="text-sm text-gray-600">
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
        <Image
          src="/login.png"
          alt="Signup Illustration"
          fill
          priority
          className="object-fit"
        />
      </div>
    </Card>
  )
}
