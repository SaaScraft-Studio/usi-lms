// components/Sidebar.tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  BookOpen,
  GraduationCap,
  Video,
  Brain,
  Wrench,
  Users,
  UserCircle,
  CreditCard,
  Mic,
} from 'lucide-react'
import clsx from 'clsx'

/* ================= SIDEBAR ITEMS ================= */

const sidebarItems = [
  {
    name: 'My Learning',
    href: '/mylearning',
    icon: <BookOpen size={20} />,
  },
  {
    name: 'eLearning Courses',
    href: '/elearnings',
    icon: <GraduationCap size={20} />,
  },
  {
    name: 'Webinar',
    href: '/webinar',
    icon: <Video size={20} />,
  },
  {
    name: 'Smart Learning Program',
    href: '/program',
    icon: <Brain size={20} />,
  },
  {
    name: 'Live Operative Workshop',
    href: '/workshop',
    icon: <Wrench size={20} />,
  },
  {
    name: 'Live Conference',
    href: '/conference',
    icon: <Users size={20} />,
  },
  {
    name: 'Speakers',
    href: '/speakers',
    icon: <Mic size={20} />,
  },
  {
    name: 'My Profile',
    href: '/myprofile',
    icon: <UserCircle size={20} />,
  },
  {
    name: 'Payment History',
    href: '/mypayments',
    icon: <CreditCard size={20} />,
  },
]

/* ================= COMPONENT ================= */

function SidebarComponent() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)


  const isActive = (href?: string) => href && pathname === href

  const baseItem =
    'flex items-center gap-2 px-2 py-2 rounded cursor-pointer transition-colors'

  const inactive =
    'text-black hover:bg-white hover:text-yellow-800 dark:text-foreground dark:hover:bg-muted dark:hover:text-yellow-800'

  const active =
    'bg-white text-yellow-800 dark:bg-muted dark:text-yellow-800 dark:hover:bg-muted'

  return (
    <motion.div
      animate={{ width: collapsed ? 60 : 250 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="
  p-2
  flex
  flex-col
  relative
  dark:bg-background
  dark:text-foreground
  border-r
  h-full
"
    >
      {/* ================= COLLAPSE BUTTON ================= */}
      <div className="relative mb-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
              absolute top-1/4 -translate-y-1/2 pr-2 mt-2
              transition-all duration-300 ease-in-out
              ${collapsed ? 'left-3' : '-right-5'}
            `}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-6 text-orange-300 transition-transform duration-300 dark:text-foreground" />
          ) : (
            <ChevronLeft className="w-5 h-6 text-orange-300 transition-transform duration-300 dark:text-foreground" />
          )}
        </button>
      </div>

      {/* ================= NAV ================= */}
      <nav className="flex flex-col space-y-1 mt-2 flex-1">
        {sidebarItems.map((item) => (
          <Link
            key={item.name}
            href={item.href!}
            className={clsx(
              baseItem,
              isActive(item.href) ? active : inactive,
              collapsed && 'justify-center'
            )}
            title={collapsed ? item.name : undefined}
          >
            {item.icon}
            {!collapsed && <span className="font-semibold">{item.name}</span>}
          </Link>
        ))}
      </nav>
    </motion.div>
  )
}

export default memo(SidebarComponent)
