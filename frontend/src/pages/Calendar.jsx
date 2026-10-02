import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Download, Calendar as CalIcon, Printer, Plus,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { Button, Card, Badge, PriorityBadge } from '../components/ui'
import { formatDate } from '../components/ui'
import toast from 'react-hot-toast'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getColorForEvent(event) {
  const now = new Date('2026-10-03')  // Current date: October 3, 2026
  const d = new Date(event.date)
  if (d < now && event.status !== 'completed') return { border: 'border-l-red-500', dot: 'bg-red-500' }
  const diff = (d - now) / (1000 * 60 * 60 * 24)
  if (diff === 0) return { border: 'border-l-orange-500', dot: 'bg-orange-500' }
  if (diff <= 7) return { border: 'border-l-yellow-400', dot: 'bg-yellow-400' }
  if (event.type === 'hearing') return { border: 'border-l-blue-500', dot: 'bg-blue-500' }
  return { border: 'border-l-green-500', dot: 'bg-green-500' }
}

function getEventsForDate(orders, dateStr) {
  const events = []
  orders.forEach(order => {
    if (order.nextDeadline === dateStr) {
      events.push({ id: order.id, title: order.nextAction, caseTitle: order.caseTitle, court: order.court, owner: order.owner, date: order.nextDeadline, type: 'deadline', status: order.status, order })
    }
    order.actions.forEach(a => {
      if (a.deadline === dateStr) {
        events.push({ id: `${order.id}-${a.id}`, title: a.action, caseTitle: order.caseTitle, court: order.court, owner: a.assignedTo, date: a.deadline, type: 'action', status: a.status, order })
      }
    })
    order.timeline.forEach(t => {
      if (t.date === dateStr && t.status === 'upcoming') {
        events.push({ id: `${order.id}-${t.id}`, title: t.title, caseTitle: order.caseTitle, court: order.court, owner: t.by, date: t.date, type: 'hearing', status: 'upcoming', order })
      }
    })
  })
  return events
}

export default function Calendar() {
  const navigate = useNavigate()
  const { orders } = useAppStore()
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)) // Oct 2026 (month is 0-indexed, so 9 = October)
  const [selectedDate, setSelectedDate] = useState(null)
  const [view, setView] = useState('month')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({ day: d, dateStr, events: getEventsForDate(orders, dateStr) })
    }
    return days
  }, [year, month, orders])

  const selectedEvents = selectedDate ? getEventsForDate(orders, selectedDate.dateStr) : []

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const today = () => { setCurrentDate(new Date(2026, 9, 1)); setSelectedDate({ dateStr: '2026-10-03' }) } // Oct 3, 2026

  const upcomingEvents = useMemo(() => {
    const all = []
    orders.forEach(o => {
      if (o.status !== 'completed') {
        all.push({ date: o.nextDeadline, title: o.nextAction, caseTitle: o.caseTitle, court: o.court, id: o.id })
      }
    })
    return all.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 10)
  }, [orders])

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance Calendar</h1>
          <p className="text-sm text-slate-500 mt-1">Visual calendar of all deadlines and hearings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => toast.success('Exporting iCal...')}><Download size={14} /> Export (iCal)</Button>
          <Button variant="secondary" size="sm" onClick={() => toast.success('Syncing with Google Calendar...')}><CalIcon size={14} /> Sync Google</Button>
          <Button variant="ghost" size="sm" onClick={() => window.print()}><Printer size={14} /> Print</Button>
        </div>
      </div>

      {/* View switcher + navigation */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
          {['Day', 'Week', 'Month', 'List'].map(v => (
            <button
              key={v}
              onClick={() => setView(v.toLowerCase())}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === v.toLowerCase() ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={prevMonth}><ChevronLeft size={16} /></Button>
          <Button variant="ghost" size="sm" onClick={today}>Today</Button>
          <Button variant="secondary" size="sm" onClick={nextMonth}><ChevronRight size={16} /></Button>
          <span className="text-lg font-semibold text-slate-900 ml-2">{MONTHS[month]} {year}</span>
        </div>
      </div>

      {view === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar grid */}
          <Card className="lg:col-span-2 p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(day => <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dayData, i) => {
                if (!dayData) return <div key={i} className="min-h-[80px] sm:min-h-[100px]" />
                const isToday = dayData.dateStr === '2026-10-03' // Current date: Oct 3, 2026
                const isSelected = selectedDate?.dateStr === dayData.dateStr
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDate(dayData)}
                    className={`min-h-[80px] sm:min-h-[100px] p-1.5 border rounded-lg cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' : isToday ? 'border-orange-300 bg-orange-50' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`text-xs font-medium ${isToday ? 'text-orange-600' : 'text-slate-600'}`}>{dayData.day}</div>
                    <div className="space-y-0.5 mt-1">
                      {dayData.events.slice(0, 3).map(event => {
                        const colors = getColorForEvent(event)
                        return (
                          <div key={event.id} className={`text-[10px] px-1 py-0.5 rounded border-l-2 ${colors.border} bg-slate-50 truncate`}>
                            {event.title}
                          </div>
                        )
                      })}
                      {dayData.events.length > 3 && <p className="text-[10px] text-blue-600">+{dayData.events.length - 3} more</p>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 flex-wrap">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-500 rounded" /><span className="text-xs text-slate-600">Overdue</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-orange-500 rounded" /><span className="text-xs text-slate-600">Due Today</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-yellow-400 rounded" /><span className="text-xs text-slate-600">Due This Week</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-500 rounded" /><span className="text-xs text-slate-600">Upcoming</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500 rounded" /><span className="text-xs text-slate-600">Hearings</span></div>
            </div>
          </Card>

          {/* Selected date panel */}
          <Card className="p-4">
            {selectedDate ? (
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  Selected: {new Date(selectedDate.dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' })}
                </h3>
                <p className="text-sm text-slate-500 mb-3">📅 Events on This Day ({selectedEvents.length})</p>
                {selectedEvents.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">No events on this day</p>
                ) : (
                  <div className="space-y-3">
                    {selectedEvents.map(event => {
                      const colors = getColorForEvent(event)
                      return (
                        <div key={event.id} className={`p-3 bg-slate-50 rounded-lg border-l-4 ${colors.border}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge color={event.type === 'hearing' ? 'blue' : 'gray'} size="xs">{event.type}</Badge>
                          </div>
                          <p className="text-sm font-medium text-slate-800">{event.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{event.caseTitle}</p>
                          <p className="text-xs text-slate-400">{event.court}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/tracker/order/${event.order.id}`)}>View Details</Button>
                            <Button variant="ghost" size="sm" onClick={() => toast.success('Marked complete')}>Mark Complete</Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <CalIcon size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Click a date to see events</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {view === 'list' && (
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Upcoming Events (Chronological)</h3>
          <div className="space-y-3">
            {upcomingEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer" onClick={() => navigate(`/tracker/order/${event.id}`)}>
                <div className="text-center w-16 flex-shrink-0">
                  <p className="text-xs text-slate-400">{new Date(event.date).toLocaleDateString('en-IN', { month: 'short' })}</p>
                  <p className="text-xl font-bold text-slate-800">{new Date(event.date).getDate()}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{event.title}</p>
                  <p className="text-xs text-slate-500">{event.caseTitle} • {event.court}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {(view === 'week' || view === 'day') && (
        <Card className="p-8 text-center">
          <CalIcon size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{view === 'week' ? 'Week' : 'Day'} view - Switch to Month or List view for full calendar.</p>
          <Button variant="primary" className="mt-3" onClick={() => setView('month')}>Switch to Month View</Button>
        </Card>
      )}
    </div>
  )
}
