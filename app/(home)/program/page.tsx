'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, Clock, Clock3 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { apiRequest } from '@/lib/apiRequest'
import { toast } from 'sonner'
import SkeletonLoading from '@/components/SkeletonLoading'
import CountdownTimer from '@/components/CountdownTimer'
import StatusBadge from '@/components/StatusBadge'

/* ---------------- CONSTANTS ---------------- */

const PAGE_SIZE = 9

/* ---------------- TYPES ---------------- */

const TABS = ['Live', 'Upcoming', 'Past', 'All'] as const
type Tab = (typeof TABS)[number]
type SortOrder = 'newest' | 'oldest'

interface Webinar {
  _id: string
  name: string
  webinarType: string
  image: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  registrationType: 'free' | 'paid'
  amount: number
  dynamicStatus: 'Live' | 'Upcoming' | 'Past'
}

/* ---------------- COMPONENT ---------------- */

export default function ProgramPage() {
  const user = useAuthStore((state) => state.user)

  const [tab, setTab] = useState<Tab>('All')
  const [q, setQ] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [page, setPage] = useState(1)

  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [isFetching, setIsFetching] = useState(true)

  /* dialog */
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null)
  const [identifier, setIdentifier] = useState('')
  const [submitting, setSubmitting] = useState(false)

  /* registered */
  const [registeredIds, setRegisteredIds] = useState<string[]>([])

  /* ---------------- FETCH WEBINARS ---------------- */

  useEffect(() => {
    const fetchWebinars = async () => {
      try {
        setIsFetching(true)
        const res = await apiRequest<null, any>({
          endpoint: '/api/webinars/smart-learning/active',
          method: 'GET',
        })
        setWebinars(res.data || [])
      } catch {
        setWebinars([])
      } finally {
        setIsFetching(false)
      }
    }

    fetchWebinars()
  }, [])

  /* ---------------- FETCH REGISTRATIONS ---------------- */

  useEffect(() => {
    if (!user?.id) return

    const fetchRegistrations = async () => {
      try {
        const res = await apiRequest<null, any>({
          endpoint: `/api/webinar/registrations/${user.id}`,
          method: 'GET',
        })
        setRegisteredIds(res.data.map((r: any) => r.webinar._id))
      } catch {
        /* silent */
      }
    }

    fetchRegistrations()
  }, [user?.id])

  /* ---------------- FILTER (NO SORT) ---------------- */

  const filtered = useMemo(() => {
    const byTab =
      tab === 'All'
        ? webinars
        : webinars.filter((w) => w.dynamicStatus === tab)

    if (!q.trim()) return byTab

    return byTab.filter((w) =>
      w.name.toLowerCase().includes(q.toLowerCase())
    )
  }, [webinars, tab, q])

  /* ---------------- RESET PAGE (TAB / SEARCH ONLY) ---------------- */

  useEffect(() => {
    setPage(1)
  }, [tab, q])

  /* ---------------- PAGINATION FIRST ---------------- */

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const pageSlice = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  /* ---------------- SORT ONLY CURRENT PAGE ---------------- */

  const paginatedWebinars = useMemo(() => {
    return [...pageSlice].sort((a, b) => {
      const dateA = new Date(a.startDate).getTime()
      const dateB = new Date(b.startDate).getTime()

      return sortOrder === 'newest'
        ? dateB - dateA
        : dateA - dateB
    })
  }, [pageSlice, sortOrder])

  /* ---------------- REGISTER ---------------- */

  const buildRegisterPayload = () => {
    if (/^\d{10}$/.test(identifier)) return { mobile: identifier }
    if (identifier.includes('@')) return { email: identifier }
    return { membershipNumber: identifier }
  }

  const handleRegister = async () => {
    if (!selectedWebinar || !identifier || !user?.id) return

    try {
      setSubmitting(true)

      await apiRequest({
        endpoint: '/api/webinar/register',
        method: 'POST',
        body: {
          webinarId: selectedWebinar._id,
          userId: user.id,
          ...buildRegisterPayload(),
        },
      })

      toast.success('You have successfully registered 🎉')
      setRegisteredIds((prev) => [...prev, selectedWebinar._id])
      setDialogOpen(false)
      setIdentifier('')
    } catch (err: any) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------------- SKELETON ---------------- */

  if (isFetching) {
    return <SkeletonLoading />
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-[#252641] mb-4">
        Smart Learning Program
      </h1>

      {/* TABS */}
      <div className="flex gap-6 border-b pb-3 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-1 text-sm font-medium ${
              tab === t
                ? 'text-[#1F5C9E] border-b-2 border-[#1F5C9E]'
                : 'text-gray-500 hover:text-[#1F5C9E]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* SEARCH + SORT */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search webinars..."
          className="w-full sm:w-80 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#1F5C9E]"
        />

        <Select
          value={sortOrder}
          onValueChange={(v) => setSortOrder(v as SortOrder)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {paginatedWebinars.map((w) => (
          <Card
            key={w._id}
            className="p-0 group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition hover:-translate-y-1 flex flex-col"
          >
            <div className="relative h-[250px] w-full overflow-hidden">
              <Image
                src={w.image}
                alt={w.name}
                fill
                className="object-fit transition-transform duration-500 group-hover:scale-110"
              />
            </div>

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
    <Link href={`/program/${w._id}`} className="w-full">
      <Button className="w-full bg-blue-600 hover:bg-blue-700">
        View Details
      </Button>
    </Link>
  ) : (
    <Button
      onClick={() => {
        setSelectedWebinar(w)
        setDialogOpen(true)
      }}
      className={`w-full ${
        w.registrationType === 'free'
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

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>

          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1
            return (
              <Button
                key={p}
                size="sm"
                variant={page === p ? 'default' : 'outline'}
                className={page === p ? 'bg-blue-600 text-white' : ''}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            )
          })}

          <Button
            size="sm"
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

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
