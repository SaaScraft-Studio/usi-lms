'use client'

import Image from 'next/image'
import { GraduationCap, Briefcase, MapPin } from 'lucide-react'

export type Speaker = {
  id: string
  name: string
  qualification: string
  designation: string
  experience: string
  institute: string
  location: string
  photo: string
  videos: number
}

export default function SpeakerHeader({ speaker }: { speaker: Speaker }) {
  return (
    <div className="flex gap-6 items-start">
      {/* LEFT: SPEAKER DETAILS */}
      <div className="flex-1 bg-white rounded-xl shadow p-6">
        {/* NAME ABOVE IMAGE */}
        <h1 className="text-xl font-semibold text-[#1F5C9E] mb-4">
          {speaker.name}
        </h1>

        <div className="flex gap-6 items-center">
          {/* Avatar */}
          <div className="relative">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-blue-200">
              <img
                src={speaker.photo}
                alt={speaker.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-[#1F5C9E]" />
              <span>{speaker.qualification}</span>
            </div>

            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-[#1F5C9E]" />
              <span>{speaker.designation}</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-[#1F5C9E]" />
              <span>{speaker.location}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
