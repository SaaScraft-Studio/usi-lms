'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import { apiRequest } from '@/lib/apiRequest'
import { toast } from 'sonner'

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/* ================= TYPES ================= */

type Question = {
  id: string
  author: string
  profile?: string
  text: string
  date?: string
}

interface AskQuestionProps {
  webinarId: string
}

/* ================= AVATAR ================= */

function Avatar({
  name,
  profile,
  size = 40,
}: {
  name: string
  profile?: string
  size?: number
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return profile ? (
    <div
      style={{ width: size, height: size }}
      className="relative rounded-full overflow-hidden"
    >
      <Image src={profile} alt={name} fill className="object-cover" />
    </div>
  ) : (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-muted flex items-center justify-center text-primary font-semibold"
    >
      {initials}
    </div>
  )
}

/* ================= TIME FORMAT ================= */

function timeAgo(iso?: string) {
  if (!iso) return 'just now'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

/* ================= COMPONENT ================= */

export default function AskQuestion({ webinarId }: AskQuestionProps) {
  const { user } = useAuthStore()

  const userName = user?.name || 'You'
  const userProfile = user?.profilePicture

  const [questions, setQuestions] = useState<Question[]>([])
  const [questionText, setQuestionText] = useState('')
  const [posting, setPosting] = useState(false)

  /* ================= FETCH QUESTIONS ================= */

  const fetchQuestions = async () => {
    try {
      const res = await apiRequest({
        endpoint: `/api/webinars/${webinarId}/questions`,
        method: 'GET',
      })

      const mapped: Question[] = res.data.map((q: any) => ({
        id: q._id,
        author: q.userId?.name || 'Anonymous',
        profile: q.userId?.profilePicture,
        text: q.questionName, // ✅ FIXED
        date: q.createdAt,
      }))

      setQuestions(mapped)
    } catch {
      setQuestions([])
    }
  }

  useEffect(() => {
    if (webinarId) fetchQuestions()
  }, [webinarId])

  /* ================= ADD QUESTION ================= */

  const handleAddQuestion = async () => {
    if (!questionText.trim()) return

    try {
      setPosting(true)

      await apiRequest({
        endpoint: `/api/webinars/${webinarId}/questions`,
        method: 'POST',
        body: {
          userId: user?.id,
          questionName: questionText, // ✅ FIXED
        },
      })

      toast.success('Question asked successfully')
      setQuestionText('')
      fetchQuestions()
    } catch (err: any) {
      toast.error(err.message || 'Failed to ask question')
    } finally {
      setPosting(false)
    }
  }

  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      {/* ASK QUESTION */}
      <Card>
        <CardHeader>
          <CardTitle>Ask a Question</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex gap-4">
            <Avatar name={userName} profile={userProfile} size={44} />

            <div className="flex-1">
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={4}
                placeholder="Type your question here..."
                className="w-full resize-none border rounded-lg p-3 text-sm"
                disabled={posting}
              />

              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  onClick={handleAddQuestion}
                  disabled={posting}
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
                >
                  {posting ? 'Submitting...' : 'Ask Question'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QUESTIONS LIST */}
      <Card>
        <CardHeader>
          <CardTitle>Questions ({questions.length})</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {questions.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No questions yet.
            </p>
          )}

          {questions.map((q) => (
            <div key={q.id} className="border-t pt-4">
              <div className="flex gap-4">
                <Avatar name={q.author} profile={q.profile} size={40} />

                <div className="flex-1">
                  <p className="font-medium text-sm">{q.author}</p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(q.date)}
                  </p>

                  <p className="mt-3 text-sm leading-relaxed">
                    {q.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
