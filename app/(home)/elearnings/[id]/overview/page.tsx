'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  PlayCircle,
} from 'lucide-react'
import { apiRequest } from '@/lib/apiRequest'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

/* ================= TYPES ================= */

type Course = {
  courseName: string
  description: string
  streamLink: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  status: string
}

type Module = {
  _id: string
  topicName: string
  contentType: 'video' | 'image' | 'document'
  videoDuration?: string
  additionalResources?: string[]
}

type Week = {
  _id: string
  weekCategoryName: string
  modules: Module[]
}

/* ================= PAGE ================= */

export default function ElearningDetailPage() {
  const { id: courseId } = useParams()
  const router = useRouter()

  const [course, setCourse] = useState<Course | null>(null)
  const [weeks, setWeeks] = useState<Week[]>([])
  const [loading, setLoading] = useState(true)

  /* ================= FETCH ================= */

  useEffect(() => {
    if (!courseId) return

    const fetchData = async () => {
      try {
        const [courseRes, weeksRes] = await Promise.all([
          apiRequest({ endpoint: `/api/courses/${courseId}`, method: 'GET' }),
          apiRequest({
            endpoint: `/api/courses/${courseId}/weeks-with-modules`,
            method: 'GET',
          }),
        ])

        setCourse(courseRes.data)
        setWeeks(weeksRes.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId])

  /* ================= SKELETON ================= */

  if (loading) {
    return (
      <div className="max-w-[1320px] mx-auto px-6 py-6 space-y-6 animate-pulse">
        <div className="aspect-video bg-gray-200 rounded-xl" />

        <div className="bg-white rounded-xl p-4 space-y-3">
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-5 w-2/3 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-200 rounded-full" />
        </div>

        <div className="bg-white rounded-xl p-6 space-y-4">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!course) return <div className="p-10 text-center">Course not found</div>

  /* ================= UI ================= */

  return (
    <div className="max-w-[1320px] mx-auto px-6 py-6 space-y-8">
      {/* BREADCRUMB */}
      <div className="mb-4 text-sm">
        <button
          onClick={() => router.push('/mylearning')}
          className="text-orange-600 hover:underline"
        >
          My Learning
        </button>{' '}
        / <span className="text-gray-600">{course.courseName}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* LEFT */}
        <div className="space-y-6">
          {/* VIDEO */}
          <div className="aspect-video rounded-xl overflow-hidden shadow">
            <iframe
              src={course.streamLink}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>

          {/* META */}
          <div className="bg-white rounded-xl shadow p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CalendarDays size={14} />
                {course.startDate} - {course.endDate}
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="font-medium text-green-600">
                  {course.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={14} />
              {course.startTime} - {course.endTime}
            </div>

            <h1 className="text-lg font-semibold">{course.courseName}</h1>

            <button
              disabled
              className="mt-4 w-full px-4 py-2 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              Registered
            </button>
          </div>

          {/* COURSE CONTENT */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Course Content</h2>

            <Accordion type="multiple" className="space-y-3">
              {weeks.map((week) => (
                <AccordionItem
                  key={week._id}
                  value={week._id}
                  className="border rounded-lg"
                >
                  <AccordionTrigger className="px-4 py-3 font-semibold">
                    {week.weekCategoryName}
                  </AccordionTrigger>

                  <AccordionContent className="px-4">
                    {week.modules.map((module, index) => (
                      <div
                        key={module._id}
                        className="py-3 border-b last:border-b-0"
                      >
                        {/* ROW 1 */}
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 rounded border-2 border-blue-500 accent-blue-600"
                          />

                          <button
                            onClick={() =>
                              router.push(
                                `/elearnings/course/${courseId}/module/${module._id}`
                              )
                            }
                            className="text-sm font-medium hover:text-blue-600"
                          >
                            {index + 1}. {module.topicName}
                          </button>
                        </div>

                        {/* ROW 2 */}
                        <div className="ml-7 mt-1 flex items-center gap-3 flex-wrap text-xs text-gray-500">
                          {module.contentType === 'video' && (
                            <div className="flex items-center gap-1">
                              <PlayCircle size={14} className="text-blue-600" />
                              {module.videoDuration}
                            </div>
                          )}

                          {module.additionalResources?.map((res, i) => (
                            <a
                              key={i}
                              href={res}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="border border-blue-500 text-blue-600 px-2 py-0.5 rounded-md hover:bg-blue-50 transition"
                            >
                              Resources
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* RIGHT */}
        <div className="bg-white rounded-xl shadow p-6 h-fit sticky top-6 text-center">
          <p className="text-xs text-gray-500 mb-4">
            EDUCATIONAL GRANT BY
          </p>
          <Image
                        src="/logo.png"
                        alt="Sun Pharma"
                        width={180}
                        height={100}
                        className="mx-auto"
                      />
        </div>
      </div>
    </div>
  )
}
