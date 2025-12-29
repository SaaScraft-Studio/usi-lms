'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import DOMPurify from 'dompurify'
import { CalendarDays, Clock, CheckCircle, Lock } from 'lucide-react'
import { toast } from 'sonner'

import Overview from '@/components/Overview'
import Faculty from '@/components/Faculty'
import FAQ from '@/components/FAQ'
import Feedback from '@/components/Feedback'
import QuizTab from '@/components/QuizTab'
import Meeting from '@/components/Meeting'
import { apiRequest } from '@/lib/apiRequest'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import WebinarSkeleton from '@/components/WebinarSkeleton'

/* ================= TYPES ================= */

type TabType = 'overview' | 'faculty' | 'faq' | 'feedback' | 'quiz' | 'meeting'

interface WebinarApi {
  _id: string
  name: string
  streamLink: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  dynamicStatus: string
  description: string
}

type Comment = {
  id: string
  author: string
  profile?: string
  text: string
  date?: string
}

/* ================= PAGE ================= */

export default function ProgramDetailPage() {
  const router = useRouter()
  const { id: webinarId } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)

  const [tab, setTab] = useState<TabType>('overview')
  const [webinar, setWebinar] = useState<WebinarApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)

  /* ================= FETCH + GUARD ================= */

  useEffect(() => {
    if (!webinarId || !user?.id) return

    const fetchData = async () => {
      try {
        const [webinarRes, regRes] = await Promise.all([
          apiRequest({
            endpoint: `/api/webinars/active/${webinarId}`,
            method: 'GET',
          }),
          apiRequest({
            endpoint: `/api/webinar/registrations/${user.id}`,
            method: 'GET',
          }),
        ])

        const registeredWebinarIds = regRes.data.map((r: any) =>
          String(r.webinar._id)
        )
        console.log(typeof webinarId)
        console.log(typeof regRes.data[0].webinar._id)

        if (!registeredWebinarIds.includes(webinarId)) {
          setHasAccess(false)
          setLoading(false)
          return
        }

        setHasAccess(true)
        setWebinar(webinarRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [webinarId, user?.id])

  /* ================= COMMENTS ================= */

  const fetchComments = async () => {
    try {
      const res = await apiRequest({
        endpoint: `/api/webinars/${webinarId}/comments`,
        method: 'GET',
      })

      const mapped: Comment[] = res.data.map((c: any) => ({
        id: c._id,
        author: c.userId?.name || 'Anonymous',
        profile: c.userId?.profilePicture,
        text: c.comment,
        date: c.createdAt,
      }))

      setComments(mapped)
    } catch {
      setComments([])
    }
  }

  useEffect(() => {
    if (webinarId && hasAccess) fetchComments()
  }, [webinarId, hasAccess])

  /* ================= ADD COMMENT ================= */

  const handleAddComment = async () => {
    if (!commentText.trim()) return

    try {
      setPosting(true)

      await apiRequest({
        endpoint: `/api/webinars/${webinarId}/comments`,
        method: 'POST',
        body: {
          userId: user?.id,
          comment: commentText,
        },
      })

      toast.success('Comment added')
      setCommentText('')
      fetchComments()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add comment')
    } finally {
      setPosting(false)
    }
  }

  /* ================= STATES ================= */

  if (loading) return <WebinarSkeleton />

  if (!hasAccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <Lock size={48} className="text-red-500" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-sm text-gray-600">
          You are not registered for this program.
        </p>
        <Button
          onClick={() => router.push('/program')}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Go Back
        </Button>
      </div>
    )
  }

  if (!webinar) {
    return <div className="p-8 text-center">program not found</div>
  }

  /* ================= UI ================= */

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
      {/* Breadcrumb */}
      <div className="mb-4 text-sm">
        <button
          onClick={() => router.push('/program')}
          className="text-orange-600 hover:underline"
        >
          Program
        </button>{' '}
        / <span className="text-gray-600">{webinar.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* LEFT */}
        <div className="space-y-6 min-w-0">
          {/* VIDEO */}
          <Card className="p-0">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                <iframe
                  src={webinar.streamLink}
                  title={webinar.name}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                />
              </div>
            </CardContent>
          </Card>

          {/* META */}
          <Card>
            <CardHeader>
              <h1 className="text-xl font-semibold">{webinar.name}</h1>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <CalendarDays size={14} />
                {webinar.startDate} – {webinar.endDate}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  {webinar.startTime} – {webinar.endTime}
                </div>

                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  {webinar.dynamicStatus}
                </div>
              </div>

              <Button disabled className="w-full">
                <CheckCircle size={16} />
                Registered
              </Button>
            </CardContent>
          </Card>

          {/* TABS */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-3 border-b pb-3 overflow-x-auto whitespace-nowrap no-scrollbar">
                {(
                  [
                    'overview',
                    'faculty',
                    'faq',
                    'feedback',
                    'quiz',
                    'meeting',
                  ] as TabType[]
                ).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`shrink-0 capitalize px-3 py-1.5 rounded-md text-sm ${
                      tab === t
                        ? 'bg-[#E8F3FF] text-[#1F5C9E] font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                {tab === 'overview' && (
                  <Overview
                    description={DOMPurify.sanitize(webinar.description)}
                    comments={comments}
                    commentText={commentText}
                    setCommentText={setCommentText}
                    onAddComment={handleAddComment}
                    posting={posting}
                  />
                )}

                {tab === 'faculty' && <Faculty webinarId={webinarId} />}
                {tab === 'faq' && <FAQ webinarId={webinarId} />}
                {tab === 'feedback' && <Feedback webinarId={webinarId} />}
                {tab === 'quiz' && (
                  <QuizTab webinarId={webinarId} webinarTitle={webinar.name} />
                )}
                {tab === 'meeting' && <Meeting webinarId={webinarId} />}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* ================= RIGHT ================= */}
        <Card className="h-fit sticky top-6 text-center">
          <CardContent className="p-6">
            <p className="text-xs text-gray-500 mb-4">EDUCATIONAL GRANT BY</p>
            <Image
              src="/Sun_Pharma.png"
              alt="Sun Pharma"
              width={80}
              height={80}
              className="mx-auto"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
