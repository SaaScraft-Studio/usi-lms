'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'


/* ================= TYPES ================= */

type Module = {
  _id: string
  courseModuleName: string
  contentType: 'video' | 'document' | 'photos'
  contentLink: string
  duration?: string
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
  const params = useParams<{
    courseId: string
    moduleId: string
  }>()

  const { user, isHydrated } = useAuthStore()
  const router = useRouter()

  const courseId = params.courseId
  const moduleId = params.moduleId

  const [module, setModule] = useState<Module | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)

  /* ================= FETCH MODULE ================= */

  useEffect(() => {
    if (!moduleId) return

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

        if (!res.ok) {
          throw new Error(`Module fetch failed: ${res.status}`)
        }

        const json = await res.json()
        setModule(json.data)
      } catch (err) {
        console.error('❌ Module fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchModule()
  }, [moduleId])

  /* ================= FETCH COMMENTS ================= */

  const fetchComments = async () => {
    if (!courseId || !moduleId) return

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/modules/${moduleId}/comments`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      if (!res.ok) {
        throw new Error('Failed to fetch comments')
      }

      const json = await res.json()
      setComments(json.data || [])
    } catch (err) {
      console.error('❌ Comments fetch error:', err)
    }
  }

  useEffect(() => {
    if (module) fetchComments()
  }, [module])

  /* ================= POST COMMENT ================= */

  if (!isHydrated) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }


  const handlePostComment = async () => {
    if (!commentText.trim() || !module || !user) return

    setPosting(true)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/modules/${moduleId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            comment: commentText,
            userId: user.id, // ✅ FIX
            courseModuleId: module._id, // ✅ FIX
            weekCategoryId: module.weekCategoryId._id,
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        console.error('Backend error:', data)
        throw new Error(data?.message || 'Comment post failed')
      }

      setCommentText('')
      await fetchComments()
    } catch (err) {
      console.error('❌ Comment post error:', err)
    } finally {
      setPosting(false)
    }
  }


  /* ================= SKELETON ================= */

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!module) return null

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* BREADCRUMB */}
      <div className="px-6 py-4 text-sm flex gap-2">
        <button
          onClick={() => router.back()}
          className="text-orange-600 hover:underline"
        >
          E-learning Courses
        </button>
        <span className="text-gray-400">{'>'}</span>
        <span className="text-orange-600 font-medium">
          {module.courseId.courseName}
        </span>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* HEADER */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-1">
          <p className="text-sm text-gray-500">
            {module.weekCategoryId.weekCategoryName}
          </p>
          <h1 className="text-2xl font-semibold">{module.courseModuleName}</h1>
        </div>

        {/* VIDEO */}
        {module.contentType === 'video' && (
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-center mb-4">
              Video Content {module.duration && `(${module.duration})`}
            </h2>

            <div className="aspect-video rounded-xl overflow-hidden">
              <iframe
                src={module.contentLink}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* DOCUMENT / PHOTOS */}
        {module.contentType !== 'video' && (
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-center">
              View Content
            </h2>

            <div className="border rounded-xl p-4 flex justify-between items-center">
              <span className="text-sm font-medium">
                {module.courseModuleName}
              </span>

              <a
                href={module.contentLink}
                target="_blank"
                className="px-4 py-2 text-xs rounded-md bg-[#1F5C9E] text-white"
              >
                Open
              </a>
            </div>
          </div>
        )}

        {/* COMMENTS */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold">
            Comments ({comments.length})
          </h2>

          {comments.map((c) => (
            <div key={c._id} className="border rounded-xl p-4 space-y-1">
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
                <p className="text-sm font-medium">{c.userId.name}</p>
              </div>

              <p className="text-xs text-gray-500">
                {new Date(c.createdAt).toLocaleString()}
              </p>

              <p className="text-sm text-gray-700">{c.comment}</p>
            </div>
          ))}
        </div>

        {/* REPLY */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold">Leave a Reply</h2>

          <textarea
            rows={5}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write your comment..."
            className="w-full border rounded-lg p-3 text-sm"
          />

          <button
            onClick={handlePostComment}
            disabled={posting}
            className="px-5 py-2 text-sm rounded-lg bg-[#1F5C9E] text-white disabled:opacity-50"
          >
            {posting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>
    </div>
  )
}
