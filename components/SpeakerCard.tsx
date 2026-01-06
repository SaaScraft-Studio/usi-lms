'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Building, MapPin, Video } from 'lucide-react'
import { Card } from '@/components/ui/card'

export type SpeakerCardItem = {
  id: string
  name: string
  photo: string
  institute: string
  location: string
  videos: number
}

export default function SpeakerCard({ speaker }: { speaker: SpeakerCardItem }) {
  return (
    <Link href={`/speakers/${speaker.id}`}>
      <Card
        className="
          group
          rounded-2xl
          bg-white
          shadow-md
          hover:shadow-lg
          transition-all
          duration-300
          hover:-translate-y-1
          p-4
        "
      >
        {/* PROFILE IMAGE */}
        <div className="flex justify-center">
          <div
            className="
              relative
              w-24
              h-24
              rounded-full
              overflow-hidden
              border-2
              border-blue-200
            "
          >
            <Image
              src={speaker.photo || '/speakers.png'}
              alt={speaker.name}
              fill
              className="object-cover object-center"
            />
          </div>
        </div>

        {/* NAME */}
        <h3 className="mt-2 text-center text-[#1F5C9E] font-semibold text-sm leading-tight">
          {speaker.name}
        </h3>

        {/* DETAILS */}
        <div className="mt-2 space-y-1 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Building size={14} />
            <span className="line-clamp-1">{speaker.institute || '—'}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin size={14} />
            <span className="line-clamp-1">{speaker.location || '—'}</span>
          </div>

          <div className="flex items-center gap-2 font-medium text-gray-700">
            <Video size={14} />
            {speaker.videos} videos
          </div>
        </div>
      </Card>
    </Link>
  )
}
