'use client'

import Image from 'next/image'
import LoginForm from '@/components/form/LoginForm'

import Autoplay from 'embla-carousel-autoplay'

import { Card, CardContent } from '@/components/ui/card'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'

const carouselItems = [
  { img: '/usiw.png', title: 'USI Webinars' },
  { img: '/slc.png', title: 'Smart Learning Courses' },
  { img: '/low.png', title: 'Live Operative Workshops' },
  { img: '/elp.png', title: 'e-Learning Program' },
  { img: '/login-speaker.png', title: 'Live Conferences' },
]

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#d0ebff] to-[#a9d6fb]">
      {/* ================= HEADER ================= */}
      <header className="pt-6 sm:pt-8 flex flex-col items-center gap-6">
        {/* Logos */}
        <div className="flex items-center gap-4">
          <Image
            src="/urological.png"
            alt="Urological Society of India"
            width={80}
            height={80}
            className="h-9 sm:h-9 w-auto"
            priority
          />

          {/* Text beside logo */}
          <p className="text-medium sm:text-xl font-semibold text-[#07288C] leading-tight">
            Urological Society <br /> of India
          </p>
          <Image
            src="/ISU_Logo.png"
            alt="Indian School of Urology"
            width={80}
            height={60}
            className="h-9 sm:h-9 w-auto"
            priority
          />
          {/* Text beside logo */}
          <p className="text-medium sm:text-xl font-semibold text-[#07288C] leading-tight">
            Indian School <br /> of Urology
          </p>
        </div>

        {/* ================= CAROUSEL ================= */}
        <div className="w-full max-w-6xl px-4">
          <Carousel
            plugins={[
              Autoplay({
                delay: 3000,
                stopOnInteraction: false,
                stopOnMouseEnter: true,
              }),
            ]}
            opts={{ align: 'start', loop: true }}
            className="w-full"
          >
            <CarouselContent>
              {carouselItems.map((item, index) => (
                <CarouselItem
                  key={index}
                  className="basis-full md:basis-1/2 lg:basis-1/3"
                >
                  <Card
                    className="
                    bg-white/30
                    backdrop-blur-xl
                    border border-white/30
                    shadow-lg
                    rounded-2xl
                  "
                  >
                    <CardContent className="flex flex-col items-center justify-center h-52 p-6">
                      <Image
                        src={item.img}
                        alt={item.title}
                        width={250}
                        height={150}
                        className="mb-4"
                      />
                      <p className="text-center font-semibold text-[#1F5C9E]">
                        {item.title}
                      </p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </header>

      {/* ================= LOGIN FORM ================= */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <LoginForm />
      </main>

      {/* ================= FOOTER ================= */}
      <Card className="rounded-none border-t bg-white/20 backdrop-blur-xl">
        <CardContent className="py-4">
          <div className="flex items-center justify-center text-center px-4 text-xs sm:text-sm text-gray-600">
            Developed by SaaScraft Studio (India) Pvt. Ltd. All Rights Reserved. © 2026
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
