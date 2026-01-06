'use client'

import { MapPin, BadgeCheck, University} from 'lucide-react'

export type Speaker = {
  id: string
  name: string
  qualification: string
  institute: string
  location: string
  photo: string
  videos: number
}

export default function SpeakerHeader({ speaker }: { speaker: Speaker }) {
  return (
    <div className="flex items-center justify-center">
      <div
        className="
          w-full max-w-sm
          rounded-2xl bg-white p-6
          shadow-md ring-1 ring-gray-200
          transition-all duration-300
          hover:shadow-xl
        "
      >
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-sm">
              <img
                src={speaker.photo}
                alt={speaker.name}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Name + Verified */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <h1 className="text-lg font-semibold text-[#1F5C9E]">
            {speaker.name}
          </h1>
          <BadgeCheck className="h-4 w-4 text-blue-600" />
        </div>

        {/* Qualification */}
        <div className="mt-4 space-y-3 text-sm text-gray-700">
        <div className="flex items-center justify-center gap-2">
          <University className="h-4 w-4 text-[#1F5C9E]" />
          <span>{speaker.qualification}</span>
          </div>
          </div>
        

        {/* Details */}
        <div className="mt-4 space-y-3 text-sm text-gray-700">
          <div className="flex items-center justify-center gap-2">
            <MapPin className="h-4 w-4 text-[#1F5C9E]" />
            <span>{speaker.location}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
