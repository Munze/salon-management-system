import { Outlet, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CalendarIcon,
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  ClockIcon as ScheduleIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Cog8ToothIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const navigation = [
  { name: 'Početna', href: '/', icon: HomeIcon },
  { name: 'Termini', href: '/appointments', icon: CalendarIcon },
  { name: 'Klijenti', href: '/clients', icon: UsersIcon },
  { name: 'Terapeuti', href: '/therapists', icon: UserGroupIcon, adminOnly: true },
  { name: 'Usluge', href: '/services', icon: WrenchScrewdriverIcon, adminOnly: true },
  {
    name: 'Analitika',
    icon: ChartBarIcon,
    children: [
      { name: 'Dashboard', href: '/analytics' },
      { name: 'Po usluzi', href: '/analytics/services', adminOnly: true },
      { name: 'Po terapeutu', href: '/analytics/by-therapist', adminOnly: true },
    ],
  },
  { name: 'Podešavanja Rasporeda', href: '/schedule-settings', icon: ScheduleIcon, adminOnly: true },
  { name: 'Upravljanje Korisnicima', href: '/user-management', icon: Cog8ToothIcon, adminOnly: true },
  { name: 'Moj Nalog', href: '/account', icon: UserCircleIcon },
]

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const { user } = useAuth()

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    )
  }

  const renderNavItem = (item: any) => {
    // Skip rendering if item is admin-only and user is not admin
    if (item.adminOnly && user?.role !== 'ADMIN') {
      return null
    }

    if (item.children) {
      const isExpanded = expandedMenus.includes(item.name)
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleMenu(item.name)}
            className="group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <item.icon
              className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
              aria-hidden={true}
            />
            {item.name}
            {isExpanded ? (
              <ChevronUpIcon className="ml-auto h-5 w-5" />
            ) : (
              <ChevronDownIcon className="ml-auto h-5 w-5" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-8 space-y-1">
              {item.children.map((child: any) => (
                <NavLink
                  key={child.name}
                  to={child.href}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {child.name}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <NavLink
        key={item.name}
        to={item.href}
        className={({ isActive }) =>
          `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
            isActive
              ? 'bg-primary-50 text-primary-600'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <item.icon
              className={`mr-3 h-6 w-6 flex-shrink-0 ${
                isActive
                  ? 'text-primary-600'
                  : 'text-gray-400 group-hover:text-gray-500'
              }`}
              aria-hidden={true}
            />
            {item.name}
          </>
        )}
      </NavLink>
    )
  }

  return (
    <div className="min-h-full">
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-white px-4 py-3 shadow-sm md:hidden">
        <div className="flex w-full justify-center">
          <img
            className="h-20 w-auto"
            src="/public/logo.png"
            alt="Hope Centar"
          />
        </div>
        <button
          type="button"
          className="text-gray-500 hover:text-gray-600"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-gray-600 bg-opacity-75 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white transition duration-200 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto pt-16">
          <nav className="flex-1 space-y-1 px-2">
            {navigation.map((item) => renderNavItem(item))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white pt-5">
          <div className="flex flex-shrink-0 items-center justify-center px-4 w-full">
            <img
              className="h-28 w-auto"
              src="/public/logo.png"
              alt="Hope Centar"
            />
          </div>
          <div className="mt-8 flex flex-grow flex-col">
            <nav className="flex-1 space-y-1 px-2">
              {navigation.map((item) => renderNavItem(item))}
            </nav>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col md:pl-64">
        <main className="flex-1">
          <div className="py-6 pt-20 md:pt-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Outlet />
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
