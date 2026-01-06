'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Phone,
  MapPin,
  Building2,
  GraduationCap,
  Pencil,
  Camera,
  Loader2,
  BadgeCheck,
} from 'lucide-react'

import { useAuthStore } from '@/stores/authStore'
import type { ProfileData } from '@/types/profile'
import { apiRequest } from '@/lib/apiRequest'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'

/* ================= CONSTANTS ================= */

const READ_ONLY_FIELDS: (keyof ProfileData)[] = [
  'prefix',
  'fullName',
  'email',
  'mobile',
]

/* ================= API → FORM ================= */

const mapApiToForm = (user: any): ProfileData => ({
  prefix: user.prefix || '',
  fullName: user.name || '',
  qualification: user.qualification || '',
  affiliationHospital: user.affiliation || '',
  mobile: user.mobile || '',
  email: user.email || '',
  country: user.country || '',
  state: user.state || '',
  city: user.city || '',
  pincode: user.pincode || '',
  profilePicture: user.profilePicture || '/avatar.png',
})

/* ================= COMPONENT ================= */

export default function MyProfilePage() {
  const { updateUser } = useAuthStore()

  const [form, setForm] = useState<ProfileData | null>(null)
  const [previewPhoto, setPreviewPhoto] = useState('/avatar.png')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  /* ================= LOAD PROFILE ================= */

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await apiRequest<null, any>({
          endpoint: '/api/users/profile',
          method: 'GET',
        })

        const mapped = mapApiToForm(profile)
        setForm(mapped)
        setPreviewPhoto(mapped.profilePicture || '/avatar.png')
        setLastUpdated(profile.updatedAt)

        updateUser({
          profilePicture: profile.profilePicture,
          name: profile.name,
          email: profile.email,
          mobile: profile.mobile,
        })
      } catch (err: any) {
        toast.error(err.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [updateUser])

  /* ================= HANDLERS ================= */

  const handleChange = (key: keyof ProfileData, value: string) => {
    setForm((prev) => ({ ...prev!, [key]: value }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPreviewPhoto(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return

    try {
      setIsUpdating(true)

      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k !== 'profilePicture') fd.append(k, v as string)
      })

      if (photoFile) fd.append('profilePicture', photoFile)

      await apiRequest({
        endpoint: '/api/users/profile',
        method: 'PUT',
        body: fd,
      })

      toast.success('Profile updated successfully', {
        description: getIndianFormattedDate(),
      })

      setLastUpdated(new Date().toISOString())
      setIsEditMode(false)
      setPhotoFile(null)
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setIsUpdating(false)
    }
  }

  /* ================= LOADING ================= */

  if (loading || !form) {
    return <Skeleton className="h-96 rounded-2xl" />
  }

  /* ================= UI ================= */

  return (
    <div className="max-w-3xl mx-auto p-4">
      <AnimatePresence mode="wait">
        {!isEditMode ? (
          /* ================= CARD VIEW ================= */
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="rounded-2xl shadow-md hover:shadow-xl transition-all">
              <CardContent className="p-6">
                {/* HEADER */}
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-28 h-28 rounded-full overflow-hidden border"
                  >
                    <img
                      src={previewPhoto}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>

                  <h2 className="mt-4 text-xl font-semibold text-gray-900 hover:text-orange-600 transition">
                    {form.prefix} {form.fullName}
                  </h2>

                  {/* QUALIFICATION */}
                  <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <GraduationCap size={14} />
                    {form.qualification || '—'}
                  </p>

                  <Badge className="mt-2 flex h-7 items-center gap-2 bg-green-600 px-2 text-white hover:bg-green-700">
                    <BadgeCheck className="h-4 w-4 scale-150 text-white" />
                    Verified User
                  </Badge>


                  {lastUpdated && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Last updated on{' '}
                      {getIndianFormattedDate(new Date(lastUpdated))}
                    </p>
                  )}
                </div>

                {/* INFO GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm">
                  <Info icon={<Mail size={14} />} label="Email" value={form.email} />
                  <Info icon={<Phone size={14} />} label="Mobile" value={form.mobile} />
                  <Info icon={<Building2 size={14} />} label="Affiliation" value={form.affiliationHospital} />
                  <Info icon={<MapPin size={14} />} label="Location" value={`${form.city || ''} ${form.state || ''}, ${form.country}`} />
                </div>

                <div className="flex justify-center mt-6">
                  <Button variant="outline" onClick={() => setIsEditMode(true)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* ================= EDIT MODE ================= */
          <motion.form
            key="edit"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* PHOTO CHANGE */}
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full overflow-hidden border">
                <img src={previewPhoto} className="w-full h-full object-cover" />
              </div>

              <Label htmlFor="photo" className="mt-2 cursor-pointer text-orange-600 flex items-center gap-1">
                <Camera size={14} /> Change Photo
              </Label>
              <p className="mt-2 text-sm text-gray-500">
                Profile image must be less than <span className="font-medium text-gray-700">5&nbsp;MB</span>.
              </p>

              <Input
                id="photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {/* FORM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(
                [
                  ['prefix', 'Prefix'],
                  ['fullName', 'Full Name'],
                  ['mobile', 'Mobile'],
                  ['email', 'Email'],
                  ['qualification', 'Qualification'],
                  ['affiliationHospital', 'Affiliation'],
                  ['country', 'Country'],
                  ['state', 'State'],
                  ['city', 'City'],
                  ['pincode', 'Pincode'],
                ] as [keyof ProfileData, string][]
              ).map(([key, label]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input
                    value={form[key] || ''}
                    disabled={READ_ONLY_FIELDS.includes(key)}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className={READ_ONLY_FIELDS.includes(key) ? 'bg-gray-100' : ''}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setIsEditMode(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating} className="bg-orange-600 hover:bg-orange-700">
                {isUpdating ? <Loader2 className="animate-spin" /> : 'Update Profile'}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ================= INFO ROW ================= */

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value?: string
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-1 text-orange-600">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value || '—'}</p>
      </div>
    </div>
  )
}
