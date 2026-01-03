'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SpeakerCard from '@/components/SpeakerCard'
import SpeakerSkeleton from '@/components/SpeakerSkeleton'
import { apiRequest } from '@/lib/apiRequest'

type Speaker = {
  id: string
  name: string
  photo: string
  institute: string
  specialization: string
  location: string
  videos: number
}


const PAGE_SIZE = 9

export default function SpeakersPage() {
  const [search, setSearch] = useState('')
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [page, setPage] = useState(1)
  const [isFetching, setIsFetching] = useState(true)

  /* ================= FETCH ================= */

  useEffect(() => {
  const fetchSpeakers = async () => {
    try {
      setIsFetching(true)

      const res = await apiRequest<null, any>({
        endpoint: '/api/assign-speakers',
        method: 'GET',
      })

      /**
       * Map speakerId -> speaker data + unique webinarIds
       */
      const map = new Map<
        string,
        Speaker & { webinarSet: Set<string> }
      >()

      res.data.forEach((item: any) => {
        const s = item.speakerId
        const webinarId = item.webinarId?._id

        if (!map.has(s._id)) {
          map.set(s._id, {
            id: s._id,
            name: `${s.prefix} ${s.speakerName}`,
            photo: s.speakerProfilePicture || '/avatar.png',
            institute: s.affiliation || '—',
            specialization: s.specialization || '—',
            location: [s.city, s.state, s.country]
              .filter(Boolean)
              .join(', '),
            videos: 0,
            webinarSet: new Set<string>(),
          })
        }

        // ✅ Count unique webinars per speaker
        if (webinarId) {
          map.get(s._id)!.webinarSet.add(webinarId)
        }
      })

      // Final transform: calculate videos count
      const finalSpeakers: Speaker[] = Array.from(map.values()).map(
        ({ webinarSet, ...rest }) => ({
          ...rest,
          videos: webinarSet.size,
        })
      )

      setSpeakers(finalSpeakers)
    } finally {
      setIsFetching(false)
    }
  }

  fetchSpeakers()
}, [])


  /* ================= SEARCH ================= */

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return speakers.filter((s) => s.name.toLowerCase().includes(q))
  }, [search, speakers])

  /* ================= PAGINATION ================= */

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const paginatedSpeakers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  useEffect(() => {
    setPage(1)
  }, [search])

  /* ================= SKELETON ================= */

  if (isFetching) {
    return <SpeakerSkeleton />
  }

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Speakers</h1>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search speakers"
          className="pl-9 w-full border rounded-md py-2 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {paginatedSpeakers.map((speaker) => (
          <SpeakerCard key={speaker.id} speaker={speaker} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-6">
          <Button
            variant="outline"
            size="icon"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            <ChevronLeft size={18} />
          </Button>

          <span className="text-sm font-medium">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-gray-500 mt-10">No speakers found.</p>
      )}
    </div>
  )
}
