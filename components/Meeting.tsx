'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { apiRequest } from '@/lib/apiRequest'

/* ================= TYPES ================= */

type MeetingData = {
  _id: string
  meetingName: string
  meetingLink: string
}

/* ================= COMPONENT ================= */

export default function Meeting({ webinarId }: { webinarId: string }) {
  const [meeting, setMeeting] = useState<MeetingData | null>(null)
  const [loading, setLoading] = useState(true)

  /* ================= FETCH MEETING ================= */

  useEffect(() => {
    if (!webinarId) return

    const fetchMeeting = async () => {
      try {
        const res = await apiRequest({
          endpoint: `/api/meetings/${webinarId}`,
          method: 'GET',
        })

        setMeeting(res?.data ?? null)
      } catch {
        setMeeting(null)
      } finally {
        setLoading(false)
      }
    }

    fetchMeeting()
  }, [webinarId])

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-12 w-40 rounded-md" />
      </div>
    )
  }

  /* ================= EMPTY ================= */

  if (!meeting) {
    return (
      <p className="text-muted-foreground">
        Meeting information is not available.
      </p>
    )
  }

  /* ================= UI ================= */

  return (
    <div className="w-full max-w-full">
      <h2 className="text-xl md:text-2xl font-semibold mb-6">Live Meeting</h2>

      <Card className="max-w-xl">
        <CardContent className="p-6 space-y-4">
          {/* MEETING NAME */}
          <h3 className="text-lg font-semibold break-words">
            {meeting.meetingName}
          </h3>

          {/* JOIN BUTTON */}
          <Button
            asChild
            className="bg-[#1F5C9E] hover:bg-[#184a81] text-white w-full sm:w-auto"
          >
            <a
              href={meeting.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join Meeting
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
