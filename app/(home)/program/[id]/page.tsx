'use client'

import { JSX, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import DOMPurify from 'dompurify'
import { CalendarDays, Clock, CheckCircle, Lock, MessageSquarePlus } from 'lucide-react'
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
import AskQuestion from '@/components/AskQuestion'
import SponsorCard from '@/components/SponsorCard'

/* ================= TYPES ================= */

type TabType = 'overview' | 'faculty' | 'faq' | 'feedback' | 'quiz' | 'meeting' | 'question'

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

export default function WebinarDetailPage() {
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

  const [settings, setSettings] = useState<{
    faculty: boolean
    faq: boolean
    feedback: boolean
    quiz: boolean
    meeting: boolean
    question: boolean
  } | null>(null)

  /* ================= FETCH WEBINAR + ACCESS ================= */

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

        const registeredIds = regRes.data.map((r: any) => r.webinar._id)

        if (!registeredIds.includes(webinarId)) {
          setHasAccess(false)
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

  /* ================= FETCH SETTINGS ================= */

  useEffect(() => {
    if (!webinarId || !hasAccess) return

    const fetchSettings = async () => {
      try {
        const res = await apiRequest({
          endpoint: `/api/webinars/${webinarId}/settings`,
          method: 'GET',
        })

        if (res?.data) {
          setSettings({
            faculty: !!res.data.faculty,
            faq: !!res.data.faq,
            feedback: !!res.data.feedback,
            quiz: !!res.data.quiz,
            meeting: !!res.data.meeting,
            question: !!res.data.question,
          })
        } else {
          setSettings(null)
        }
      } catch {
        setSettings(null)
      }
    }

    fetchSettings()
  }, [webinarId, hasAccess])

  /* ================= COMMENTS ================= */

  useEffect(() => {
    if (!webinarId || !hasAccess) return

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

    fetchComments()
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
    } catch (err: any) {
      toast.error(err.message || 'Failed to add comment')
    } finally {
      setPosting(false)
    }
  }

  /* ================= AVAILABLE TABS (MEMOIZED) ================= */

  const availableTabs = useMemo<TabType[]>(() => {
    return [
      'overview',
      ...(settings?.faculty ? (['faculty'] as TabType[]) : []),
      ...(settings?.faq ? (['faq'] as TabType[]) : []),
      ...(settings?.feedback ? (['feedback'] as TabType[]) : []),
      ...(settings?.quiz ? (['quiz'] as TabType[]) : []),
      ...(settings?.meeting ? (['meeting'] as TabType[]) : []),
      ...(settings?.question ? (['question'] as TabType[]) : []),
    ]
  }, [settings])

  /* ================= TAB SAFETY ================= */

  useEffect(() => {
    if (!availableTabs.includes(tab)) {
      setTab('overview')
    }
  }, [availableTabs, tab])

  /* ================= TAB PANELS (MEMOIZED) ================= */

  const tabPanels = useMemo(() => {
    if (!webinar) return null

    return {
      overview: (
        <Overview
          description={DOMPurify.sanitize(webinar.description)}
          comments={comments}
          commentText={commentText}
          setCommentText={setCommentText}
          onAddComment={handleAddComment}
          posting={posting}
        />
      ),
      faculty: <Faculty webinarId={webinarId} />,
      faq: <FAQ webinarId={webinarId} />,
      feedback: <Feedback webinarId={webinarId} />,
      quiz: <QuizTab webinarId={webinarId} webinarTitle={webinar.name} />,
      meeting: <Meeting webinarId={webinarId} />,
      question: <AskQuestion webinarId={webinarId} />,
    } as Record<TabType, JSX.Element>
  }, [webinar, comments, commentText, posting, webinarId])

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
    return <div className="p-8 text-center">Program not found</div>
  }

  /* ================= UI ================= */

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
      {/* Breadcrumb */}
      <div className="mb-4 text-sm">
        <button
          onClick={() => router.push('/mylearning')}
          className="text-orange-600 hover:underline"
        >
          My Learning
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
              <div className="flex gap-3 border-b pb-3 font-bold overflow-x-auto whitespace-nowrap no-scrollbar">
                {availableTabs.map((t) => {
                  const isActive = tab === t

                  // 🔹 Special UI for Question tab
                  if (t === 'question') {
                    return (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium transition
          ${isActive
                            ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-100'
                            : 'bg-white text-orange-600 border-orange-600 hover:bg-orange-50'
                          }
        `}
                      >
                        <MessageSquarePlus size={16} />
                        Ask Question
                      </button>
                    )
                  }

                  // 🔹 Normal tabs
                  return (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`shrink-0 capitalize px-3 py-1.5 rounded-md ${isActive
                          ? 'bg-[#E8F3FF] text-orange-600 font-bold'
                          : 'text-gray-600 hover:bg-gray-50 font-medium'
                        }`}
                    >
                      {t}
                    </button>
                  )
                })}

              </div>

              <div className="mt-6">{tabPanels?.[tab]}</div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <SponsorCard/>
      </div>
    </div>
  )
}
