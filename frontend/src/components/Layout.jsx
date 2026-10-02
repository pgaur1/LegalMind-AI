import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Scale, Bell, ChevronDown, Settings, User, HelpCircle, LogOut, Menu, X } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { Avatar, timeAgo } from './ui'

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/research', label: 'Research' },
  { path: '/drafts', label: 'Drafts' },
  { path: '/precedents', label: 'Precedents' },
  { path: '/tracker', label: 'Tracker' },
  { path: '/calendar', label: 'Calendar' },
]

function NotificationDropdown() {
  const { notifications, unreadCount, markAllRead, markRead } = useAppStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const count = unreadCount()

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-slate-600" />
        {count > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 animate-slide-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="font-semibold text-sm text-slate-900">Notifications</span>
            <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Mark all as read</button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.slice(0, 5).map(n => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 ${!n.read ? 'bg-blue-50/40' : ''}`}
              >
                <p className="text-sm text-slate-700">{n.text}</p>
                <p className="text-xs text-slate-400 mt-1">{timeAgo(n.time)}</p>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 text-center border-t border-slate-100">
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all notifications</button>
          </div>
        </div>
      )}
    </div>
  )
}

function UserDropdown() {
  const { user } = useAppStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors">
        <Avatar user={user} size="sm" />
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-slate-700">{user.name}</p>
          <p className="text-xs text-slate-400">{user.role}</p>
        </div>
        <ChevronDown size={16} className="text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 animate-slide-up">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-sm text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
          <div className="py-1">
            {[
              { icon: User, label: 'Profile Settings' },
              { icon: Settings, label: 'App Settings' },
              { icon: HelpCircle, label: 'Help & Documentation' },
            ].map(item => (
              <button key={item.label} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <item.icon size={16} className="text-slate-400" />
                {item.label}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 py-1">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 h-16">
        <div className="h-full px-4 lg:px-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <Scale size={20} className="text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900 hidden sm:block">LegalMind AI</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => {
                const active = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path))
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <NotificationDropdown />
            <UserDropdown />
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="md:hidden border-t border-slate-200 bg-white px-4 py-2 space-y-1">
            {navItems.map(item => {
              const active = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path))
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 text-sm font-medium rounded-lg ${
                    active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}
      </header>
      <main className="pt-16">{children}</main>
    </div>
  )
}
