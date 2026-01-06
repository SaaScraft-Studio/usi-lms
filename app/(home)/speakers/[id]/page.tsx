'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { useAuthStore } from '@/stores/authStore'
import { apiRequest } from '@/lib/apiRequest'
import { toast } from 'sonner'
import SpeakerHeader from '@/components/SpeakerHeader'
import { CalendarDays, Clock } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import CountdownTimer from '@/components/CountdownTimer'
import SponsorCard from '@/components/SponsorCard'

// Route Helper
const WEBINAR_ROUTE_MAP: Record<string, string> = {
  'USI Webinar': '/webinar',
  'Smart Learning Program': '/program',
  'Live Operative Workshops': '/workshop',
}


export default function SpeakerDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  const [loading, setLoading] = useState(true)
  const [speaker, setSpeaker] = useState<any>(null)
  const [webinars, setWebinars] = useState<any[]>([])
  const [registeredIds, setRegisteredIds] = useState<string[]>([])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedWebinar, setSelectedWebinar] = useState<any>(null)
  const [identifier, setIdentifier] = useState('')
  const [submitting, setSubmitting] = useState(false)

  /* ---------------- FETCH DATA ---------------- */

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiRequest<null, any>({
          endpoint: '/api/assign-speakers',
          method: 'GET',
        })

        const filtered = res.data.filter((x: any) => x.speakerId._id === id)

        if (!filtered.length) return

        const s = filtered[0].speakerId

        setSpeaker({
          name: `${s.prefix} ${s.speakerName}`,
          photo: s.speakerProfilePicture,
          qualification: s.affiliation,
          designation: s.specialization,
          location: [s.city, s.state, s.country].filter(Boolean).join(', '),
        })

        setWebinars(filtered.map((x: any) => x.webinarId))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  /* ---------------- FETCH REGISTRATIONS ---------------- */

  useEffect(() => {
    if (!user?.id) return

    apiRequest<null, any>({
      endpoint: `/api/webinar/registrations/${user.id}`,
      method: 'GET',
    }).then((res) => {
      setRegisteredIds(res.data.map((r: any) => r.webinar._id))
    })
  }, [user?.id])

  /* ---------------- REGISTER ---------------- */

  const buildPayload = () => {
    if (/^\d{10}$/.test(identifier)) return { mobile: identifier }
    if (identifier.includes('@')) return { email: identifier }
    return { membershipNumber: identifier }
  }

  const handleRegister = async () => {
    if (!user || !selectedWebinar) return

    try {
      setSubmitting(true)

      await apiRequest({
        endpoint: '/api/webinar/register',
        method: 'POST',
        body: {
          webinarId: selectedWebinar._id,
          userId: user.id,
          ...buildPayload(),
        },
      })

      toast.success('You have successfully registered 🎉')
      setRegisteredIds((p) => [...p, selectedWebinar._id])
      setDialogOpen(false)
      setIdentifier('')
    } catch (e: any) {
      toast.error(e.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  // Route Helper 
  const getWebinarDetailsUrl = (webinar: any) => {
    const baseRoute = WEBINAR_ROUTE_MAP[webinar.webinarType]

    // fallback safety (important)
    if (!baseRoute) {
      console.warn('Unknown webinarType:', webinar.webinarType)
      return `/webinar/${webinar._id}`
    }

    return `${baseRoute}/${webinar._id}`
  }


  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )
  }

  if (!speaker) {
    return <div className="p-10 text-center">Speaker not found</div>
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="mb-4 text-sm text-gray-500">
        <Link href="/speakers" className="text-orange-600">
          Speakers
        </Link>
        <span className="mx-2">{'>'}</span>
        <span className="font-semibold">{speaker.name}</span>
      </div>

      {/* TOP SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
        {/* Speaker Header */}
        <div>
          <SpeakerHeader key={speaker.id} speaker={speaker} />
        </div>


       {/* RIGHT: PREMIUM SPONSOR */}
        <SponsorCard/>

      </div>

      {/* WEBINAR LIST */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {webinars.map((w) => (
          <Card
            key={w._id}
            className="p-0 group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition hover:-translate-y-1 flex flex-col"
          >
            {/* IMAGE */}
            <div className="relative h-[250px] w-full overflow-hidden">
              <Image
                src={w.image}
                alt={w.name}
                fill
                className="object-fit transition-transform duration-500 group-hover:scale-110"
              />
            </div>


            {/* CONTENT */}
            <CardContent className="flex flex-col flex-grow">
              <StatusBadge status={w.dynamicStatus} />


              <h3 className="font-semibold text-sm line-clamp-2">
                {w.name}
              </h3>

              {w.dynamicStatus === 'Upcoming' && (
                <CountdownTimer
                  startDate={w.startDate}
                  startTime={w.startTime}
                />
              )}

              <div className="mt-3 text-xs text-gray-600 space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} />
                  {w.startDate} – {w.endDate}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  {w.startTime} – {w.endTime}
                </div>
              </div>
            </CardContent>


            <CardFooter className="p-4 pt-0">
              {registeredIds.includes(w._id) ? (
                <Button
                  onClick={() => router.push(getWebinarDetailsUrl(w))}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-xs"
                >
                  View Details
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setSelectedWebinar(w)
                    setDialogOpen(true)
                  }}
                  className={`w-full ${w.registrationType === 'free'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                >
                  {w.registrationType === 'free'
                    ? 'Register Free'
                    : `₹${w.amount} | Register`}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* REGISTER DIALOG */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          {selectedWebinar?.registrationType === 'paid' ? (
            <div className="space-y-4 text-center">
              <h2 className="text-lg font-semibold">
                Payment integration coming soon
              </h2>
              <AlertDialogCancel disabled={submitting}>Close</AlertDialogCancel>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-center text-lg font-semibold text-blue-600">
                Register for FREE
              </h2>

              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={submitting}
                placeholder="USI No | Email | Mobile"
                className="w-full border rounded px-4 py-2"
              />

              <Button
                onClick={handleRegister}
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>

              <AlertDialogCancel disabled={submitting}>
                Cancel
              </AlertDialogCancel>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
