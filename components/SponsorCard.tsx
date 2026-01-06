'use client'

import Image from 'next/image'

export default function SponsorCard() {
  return (
    <div className="sticky top-6">
      <div
        className="
          relative overflow-hidden
          rounded-2xl bg-white p-6 text-center
          shadow-lg ring-1 ring-gray-200
          transition-all duration-300
          hover:shadow-2xl
        "
      >
        {/* Subtle Glow */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent" />

        {/* Label */}
        <p className="mb-2 text-[11px] font-semibold tracking-widest text-gray-500">
          OFFICIAL EDUCATIONAL PARTNER
        </p>

        {/* Sponsor Logo */}
        <div className="my-4 flex justify-center">
          <Image
            src="/logo.png"
            alt="Sponsor Logo"
            width={180}
            height={100}
            className="object-contain"
          />
        </div>

        {/* Headline */}
        <h3 className="mt-4 text-sm font-semibold text-gray-800 text-center">
          Accelerating Access to Affordable and Innovative Medicines
        </h3>

        {/* Description */}
        <p className="mt-2 text-sm text-gray-600 leading-relaxed text-center">
          Our latest launches bring innovative solutions to patients across the world.
        </p>

        {/* CTA Button */}
        <a
          href="https://www.drreddys.com"
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-block w-full rounded-lg
            bg-blue-600 px-4 py-2 text-sm font-medium text-white
            transition hover:bg-blue-700 mt-4
          "
        >
          Explore Our Innovations
        </a>

        {/* Trust Line */}
        <p className="mt-3 text-xs text-gray-400 text-center">
          Committed to global healthcare advancement
        </p>
      </div>
    </div>
  )
}
