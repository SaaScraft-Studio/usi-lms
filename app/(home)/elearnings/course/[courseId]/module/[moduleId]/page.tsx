'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import { Download, ExternalLink } from 'lucide-react'

/* ================= TYPES ================= */

type Module = {
  _id: string
  topicName: string
  aboutTopic: string
  contentType: 'video' | 'document' | 'image'
  contentUrl: string
  videoDuration?: string
  additionalQuestions?: string[]
  additionalResources?: string[]
  weekCategoryId: {
    _id: string
    weekCategoryName: string
  }
  courseId: {
    _id: string
    courseName: string
  }
}

type Comment = {
  _id: string
  comment: string
  createdAt: string
  userId: {
    name: string
    profilePicture?: string
  }
}

/* ================= PAGE ================= */

export default function ModuleLecturePage() {
  const { courseId, moduleId } = useParams<{
    courseId: string
    moduleId: string
  }>()

  const router = useRouter()
  const { user, isHydrated } = useAuthStore()

  const [module, setModule] = useState<Module | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)

  /* ================= FETCH MODULE ================= */

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/modules/${moduleId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        )
        const json = await res.json()
        setModule(json.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    fetchModule()
  }, [moduleId])

  /* ================= FETCH COMMENTS ================= */

  const fetchComments = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/modules/${moduleId}/comments`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    )
    const json = await res.json()
    setComments(json.data || [])
  }

  useEffect(() => {
    if (module) fetchComments()
  }, [module])

  /* ================= POST COMMENT ================= */

  const handlePostComment = async () => {
    if (!commentText.trim() || !user || !module) return

    setPosting(true)

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/modules/${moduleId}/comments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          comment: commentText,
          userId: user.id,
          courseModuleId: module._id,
          weekCategoryId: module.weekCategoryId._id,
        }),
      }
    )

    setCommentText('')
    await fetchComments()
    setPosting(false)
  }

  /* ================= SKELETON ================= */

  if (!isHydrated || loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4 animate-pulse">
        <div className="h-4 w-1/4 bg-gray-200 rounded" />
        <div className="h-8 w-2/3 bg-gray-200 rounded" />
        <div className="h-32 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    )
  }

  if (!module) return null

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="px-6 py-4 text-sm flex gap-2">
        <button onClick={() => router.back()} className="text-orange-600">
          Courses
        </button>
        <span className="text-gray-400">›</span>
        <span className="font-medium text-gray-700">
          {module.courseId.courseName}
        </span>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* ================= HEADER ================= */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-2">
          <p className="text-sm text-gray-500">
            {module.weekCategoryId.weekCategoryName}
          </p>
          <h1 className="text-2xl font-semibold">{module.topicName}</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            {module.aboutTopic}
          </p>
        </div>

        {/* ================= VIDEO ================= */}
        {module.contentType === 'video' && (
          <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
            <div className="aspect-video rounded-xl overflow-hidden">
              <iframe
                src={module.contentUrl}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>

            {/* Resources */}
            {module.additionalResources?.length ? (
              <div className="flex flex-wrap gap-3">
                {module.additionalResources.map((link, i) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    className="px-4 py-2 text-sm rounded-lg border bg-gray-50 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <ExternalLink size={14} /> Resource {i + 1}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* ================= VIEW / DOWNLOAD ================= */}
        {module.contentType !== 'video' && (
          <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-lg">View Content</h2>

            <div className="flex flex-wrap gap-4">
              <a
                href={module.contentUrl}
                download
                className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm flex items-center gap-2"
              >
                <Download size={16} /> Download Content
              </a>

              <a
                href={module.contentUrl}
                target="_blank"
                className="px-5 py-2 rounded-lg border text-sm flex items-center gap-2"
              >
                <ExternalLink size={16} /> View Content
              </a>
            </div>
          </div>
        )}

        {/* ================= QUESTIONS ================= */}
        {module.additionalQuestions?.length ? (
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h2 className="font-semibold mb-3">Questions</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              {module.additionalQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
          </div>
        ) : null}

        {/* ================= COMMENT BOX ================= */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
          <textarea
            rows={4}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write your comment..."
            className="w-full border rounded-lg p-3 text-sm"
          />

          <button
            onClick={handlePostComment}
            disabled={posting}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50"
          >
            {posting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>

        {/* ================= COMMENTS LIST ================= */}
        <div className="space-y-4">
          {comments.map((c) => (
            <div
              key={c._id}
              className="bg-white rounded-xl border p-4 space-y-1"
            >
              <div className="flex items-center gap-3">
                {c.userId.profilePicture && (
                  <Image
                    src={c.userId.profilePicture}
                    alt={c.userId.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <p className="font-medium text-sm">{c.userId.name}</p>
              </div>
              <p className="text-xs text-gray-500">
                {new Date(c.createdAt).toLocaleString()}
              </p>
              <p className="text-sm text-gray-700">{c.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
    
  )
}
