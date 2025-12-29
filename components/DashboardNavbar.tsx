'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MoreVertical, LogOut } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/* ---------------- SAFE IMAGE URL ---------------- */

const getImageUrl = (path?: string | null): string => {
  if (!path) return '/avatar.png'
  if (path.startsWith('blob:')) return path
  if (path.startsWith('http://') || path.startsWith('https://')) return path

  const base = process.env.NEXT_PUBLIC_API_URL
  if (!base) return '/avatar.png'

  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

/* ---------------- COMPONENT ---------------- */

export default function DashboardNavbar() {
  const router = useRouter()
  const { user, logout, updateUser } = useAuthStore()
  const [imgError, setImgError] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)

  const profileSrc = imgError
    ? '/avatar.png'
    : getImageUrl(user?.profilePicture)

  /* ---------------- FETCH PROFILE ---------------- */

 useEffect(() => {
   const fetchProfile = async () => {
     // prevent duplicate calls
     if (user?.profilePicture || user?.name) return

     const token = localStorage.getItem('token')
     if (!token) return

     try {
       setLoadingProfile(true)

       const res = await fetch(
         `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`,
         {
           headers: {
             Authorization: `Bearer ${token}`,
           },
         }
       )

       if (!res.ok) throw new Error('Failed to fetch profile')

       const data = await res.json()

       console.log('PROFILE API RESPONSE:', data) // 👈 DEBUG

       updateUser({
         name: data.name,
         profilePicture: data.profilePicture || undefined,
       })
     } catch (error) {
       console.error('Profile fetch error:', error)
     } finally {
       setLoadingProfile(false)
     }
   }

   fetchProfile()
 }, [updateUser, user?.name, user?.profilePicture])


  /* ---------------- LOGOUT ---------------- */

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <header
      className="
        sticky top-0 z-50
        bg-gradient-to-r from-[#B5D9FF] to-[#D6E7FF]
        dark:from-[#1a1a1a] dark:via-[#222] dark:to-[#444]
        shadow-md
      "
    >
      <div className="flex items-center justify-between h-16 px-4 md:px-[30px]">
        {/* ================= LEFT LOGOS ================= */}
        <Link href="/mylearning">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push('/mylearning')}
          >
            <img
              src="/urological.png"
              alt="Urological Society of India"
              className="h-12"
            />
            <p className="text-xs font-bold text-[#1F5C9E] leading-tight">
              Urological Society <br /> of India
            </p>

            <div className="h-10 w-[1px] bg-[#1F5C9E] mx-3" />

            <div className="flex items-center gap-2">
              <img
                src="/ISU_Logo.png"
                alt="Indian School of Urology"
                className="h-12"
              />
              <p className="text-xs font-bold text-[#1F5C9E] leading-tight">
                Indian School <br /> of Urology
              </p>
            </div>
          </div>
        </Link>

        {/* ================= RIGHT ================= */}
        <div className="flex items-center gap-4">
          {/* ================= MOBILE MENU ================= */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64 p-2">
                {/* Profile */}
                <DropdownMenuLabel className="flex items-center gap-3 p-2">
                  {loadingProfile ? (
                    <Skeleton className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full overflow-hidden border">
                      <img
                        src={profileSrc}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                      />
                    </div>
                  )}

                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                      {user?.name || 'User'}
                    </span>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {/* Logout */}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ================= DESKTOP PROFILE ================= */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => router.push('/myprofile')}>
              {loadingProfile ? (
                <Skeleton className="w-[45px] h-[45px] rounded-full" />
              ) : (
                <div className="w-[45px] h-[45px] rounded-full overflow-hidden border-2 border-white shadow-sm">
                  <img
                    src={profileSrc}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                </div>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="bg-orange-500 text-white font-semibold px-6 py-2 rounded-full hover:bg-orange-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
