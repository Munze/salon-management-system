import { Outlet, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CalendarIcon,
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  ClockIcon as ScheduleIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from '../hooks/useTranslation'

const navigation = [
  { name: 'navigation.dashboard', href: '/', icon: HomeIcon },
  { name: 'navigation.appointments', href: '/appointments', icon: CalendarIcon },
  { name: 'navigation.clients', href: '/clients', icon: UsersIcon },
  { name: 'navigation.therapists', href: '/therapists', icon: UserGroupIcon },
  { name: 'navigation.scheduleSettings', href: '/schedule-settings', icon: ScheduleIcon },
]

export default function Layout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-full">
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white pt-5">
          <div className="flex flex-shrink-0 items-center px-4">
            <img
              className="h-8 w-auto"
              src="/logo.svg"
              alt="Salon Management"
            />
          </div>
          <div className="mt-8 flex flex-grow flex-col">
            <nav className="flex-1 space-y-1 px-2">
              {navigation.map((item) => (
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
                      {t(item.name)}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col md:pl-64">
        <main className="flex-1">
          <div className="py-6">
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
