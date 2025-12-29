'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  PlayCircle,
  FileText,
  ImageIcon,
} from 'lucide-react'
import { apiRequest } from '@/lib/apiRequest'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

/* ================= TYPES ================= */

interface CourseApi {
  _id: string
  courseName: string
  courseImage: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  streamLink: string
  description: string
  status: string
}

interface CourseModule {
  _id: string
  courseModuleName: string
  contentType: 'video' | 'document' | 'photos'
  contentLink: string
  duration?: string
}

interface CourseWeek {
  _id: string
  weekCategoryName: string
  modules: CourseModule[]
}

/* ================= PAGE ================= */

export default function ElearningDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const courseId = params.id

  const [course, setCourse] = useState<CourseApi | null>(null)
  const [weeks, setWeeks] = useState<CourseWeek[]>([])
  const [loading, setLoading] = useState(true)

  /* ================= FETCH COURSE ================= */
  useEffect(() => {
    if (!courseId) return

    const fetchData = async () => {
      try {
        const [courseRes, weeksRes] = await Promise.all([
          apiRequest<null, any>({
            endpoint: `/api/courses/${courseId}`,
            method: 'GET',
          }),
          apiRequest<null, any>({
            endpoint: `/api/courses/${courseId}/weeks-with-modules`,
            method: 'GET',
          }),
        ])

        setCourse(courseRes.data)
        setWeeks(weeksRes.data || [])
      } catch (err) {
        console.error('Failed to fetch course detail', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId])

  /* Skeleton Loading */

  if (loading) {
    return (
      <div className="max-w-[1320px] mx-auto px-6 py-6 space-y-8 animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-64 bg-gray-200 rounded" />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
          {/* LEFT */}
          <div className="space-y-6">
            {/* Video skeleton */}
            <div className="aspect-video bg-gray-200 rounded-2xl" />

            {/* Meta card skeleton */}
            <div className="bg-white rounded-2xl shadow p-4 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-40 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-5 w-3/4 bg-gray-200 rounded" />
              <div className="h-10 w-full bg-gray-200 rounded-full mt-4" />
            </div>

            {/* Description skeleton */}
            <div className="bg-white rounded-2xl shadow p-6 space-y-3">
              <div className="h-5 w-40 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-5/6 bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
            </div>

            {/* Course content skeleton */}
            <div className="bg-white rounded-2xl shadow p-6 space-y-4">
              <div className="h-5 w-40 bg-gray-200 rounded" />

              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-xl px-4 py-3 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-full bg-gray-100 rounded" />
                  <div className="h-3 w-5/6 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="bg-white rounded-2xl shadow p-6 h-fit">
            <div className="h-3 w-32 bg-gray-200 rounded mx-auto mb-4" />
            <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto" />
          </div>
        </div>
      </div>
    )
  }


  if (!course) {
    return <div className="p-8 text-center">Course not found</div>
  }

  /* ================= HELPERS ================= */

  const getIcon = (type: CourseModule['contentType']) => {
    switch (type) {
      case 'video':
        return <PlayCircle size={18} className="text-blue-600" />
      case 'document':
        return <FileText size={18} className="text-green-600" />
      case 'photos':
        return <ImageIcon size={18} className="text-purple-600" />
      default:
        return null
    }
  }

  return (
    <div className="max-w-[1320px] mx-auto px-6 py-6 space-y-8">
      {/* ================= BREADCRUMB ================= */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => router.push('/elearnings')}
          className="text-gray-500 hover:text-[#1F5C9E]"
        >
          E-learning Courses
        </button>
        <span className="text-gray-400">{'>'}</span>
        <span className="text-[#1F5C9E] font-medium">{course.courseName}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* ================= LEFT ================= */}
        <div className="space-y-6">
          {/* VIDEO */}
          <div className="rounded-2xl overflow-hidden aspect-video shadow">
            <iframe
              src={course.streamLink}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>

          {/* META */}
          <div className="bg-white rounded-2xl shadow p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <CalendarDays size={14} />
                {course.startDate} - {course.endDate}
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-black" />
                <span className="text-green-600 font-medium">
                  {course.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock size={14} />
              {course.startTime} - {course.endTime}
            </div>

            <h1 className="text-lg font-semibold text-[#252641]">
              {course.courseName}
            </h1>

            <button
              disabled
              className="mt-6 w-full px-4 py-2 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <CheckCircle2 size={16} />
              Registered
            </button>
          </div>

          {/* DESCRIPTION */}
          <section className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-3">About this course</h2>
            <div
              className="text-sm text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: course.description }}
            />
          </section>

          {/* ================= COURSE CONTENT ================= */}
          <section className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Course Content</h2>

            <Accordion type="multiple" className="space-y-3">
              {weeks.map((week) => (
                <AccordionItem
                  key={week._id}
                  value={week._id}
                  className="border rounded-xl px-4"
                >
                  <AccordionTrigger className="font-medium text-left">
                    {week.weekCategoryName}
                  </AccordionTrigger>

                  <AccordionContent className="space-y-2 pt-2">
                    {week.modules.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No modules available for this week
                      </p>
                    ) : (
                      week.modules.map((module) => (
                        <div
                          key={module._id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition"
                        >
                          {/* LEFT */}
                          <button
                            onClick={() =>
                              router.push(
                                `/elearnings/course/${courseId}/module/${module._id}`
                              )
                            }
                            className="flex items-center gap-3 text-sm font-medium text-gray-800 hover:text-[#1F5C9E]"
                          >
                            {getIcon(module.contentType)}
                            {module.courseModuleName}
                          </button>

                          {/* RIGHT */}
                          <span className="text-xs text-gray-500">
                            {module.duration || ''}
                          </span>
                        </div>
                      ))
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="bg-white rounded-2xl shadow p-6 h-fit sticky top-6 text-center">
          <p className="text-xs text-gray-500 mb-4">EDUCATIONAL GRANT BY</p>
          <Image
            src="/Sun_Pharma.png"
            alt="Sun Pharma"
            width={60}
            height={60}
            className="mx-auto object-contain"
          />
        </div>
      </div>
    </div>
  )
}
