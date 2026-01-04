'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from './ui/button'

/* ================= TYPES ================= */
type Comment = {
  id: string
  author: string
  profile?: string
  text: string
  date?: string
}

type Props = {
  description?: string
  comments: Comment[]
  commentText: string
  setCommentText: (v: string) => void
  onAddComment: () => void
  posting?: boolean
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
export default function Overview({
  description,
  comments,
  commentText,
  setCommentText,
  onAddComment,
  posting,
}: Props) {
  const { user } = useAuthStore()

  const userName = user?.name || 'You'
  const userProfile = user?.profilePicture

  /* ---------- Infinite Scroll ---------- */
  const PAGE_SIZE = 10
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const loaderRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!loaderRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, comments.length))
        }
      },
      { rootMargin: '100px' }
    )

    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [comments.length])

  const visibleComments = comments.slice(0, visibleCount)

  return (
    <div className="space-y-6">
      {/* ABOUT WEBINAR */}
      <Card>
        <CardHeader>
          <CardTitle>About Webinar</CardTitle>
        </CardHeader>

        <CardContent>
          <div
            className="
    prose 
    max-w-full
    text-muted-foreground
    overflow-x-hidden
    break-words
    [&_img]:max-w-full
    [&_img]:h-auto
    [&_table]:block
    [&_table]:max-w-full
    [&_table]:overflow-x-auto
    [&_iframe]:max-w-full
  "
            dangerouslySetInnerHTML={{ __html: description || '' }}
          />
        </CardContent>
      </Card>

      {/* ADD COMMENT */}
      <Card>
        <CardHeader>
          <CardTitle>Add Your Comment</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex gap-4">
            <Avatar name={userName} profile={userProfile} size={44} />

            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
                placeholder="Write your comment..."
                className="w-full resize-none border rounded-lg p-3 text-sm"
                disabled={posting}
              />

              <div className="mt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCommentText('')}
                  className="px-3 py-1.5 border rounded-xl text-sm hover:bg-gray-50"
                  disabled={posting}
                >
                  Clear
                </button>

                <Button
                  type="button"
                  onClick={onAddComment}
                  disabled={posting}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm"
                >
                  {posting ? 'Posting...' : 'Comment'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* COMMENTS LIST */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Comments ({comments.length})</CardTitle>
          <span className="text-sm text-muted-foreground">
            Most recent first
          </span>
        </CardHeader>

        <CardContent className="space-y-4">
          {visibleComments.length === 0 && (
            <p className="text-muted-foreground">No comments yet.</p>
          )}

          {visibleComments.map((c) => (
            <div key={c.id} className="border-t pt-4">
              <div className="flex gap-4">
                <Avatar name={c.author} profile={c.profile} size={40} />

                <div className="flex-1">
                  <p className="font-medium text-sm">{c.author}</p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(c.date)}
                  </p>

                  <p className="mt-3 text-sm leading-relaxed">{c.text}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Infinite scroll sentinel */}
          {visibleCount < comments.length && (
            <div
              ref={loaderRef}
              className="py-4 text-center text-sm text-muted-foreground"
            >
              Loading more comments...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
