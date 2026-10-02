import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Calendar, BarChart3, AlertTriangle, Clock, TrendingUp,
  CheckCircle, List, ChevronRight, Eye, Pencil, Bell,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { Button, Card, StatCard, StatusBadge, PriorityBadge, Avatar, formatDate, timeAgo } from '../components/ui'
import toast from 'react-hot-toast'

export default function Tracker() {
  const navigate = useNavigate()
  const { orders } = useAppStore()
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState({ completed: true })

  const now = new Date('2026-10-02')

  const isOverdue = (o) => o.status !== 'completed' && new Date(o.nextDeadline) < now
  const isDueThisWeek = (o) => {
    if (o.status === 'completed') return false
    const d = new Date(o.nextDeadline)
    const diff = (d - now) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7
  }

  let filtered = orders.filter(o => {
    const matchSearch = !search || o.caseTitle.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || (statusFilter === 'overdue' ? isOverdue(o) : o.status === statusFilter)
    const matchPriority = priorityFilter === 'all' || o.priority === priorityFilter
    return matchSearch && matchStatus && matchPriority
  })

  const overdueOrders = filtered.filter(isOverdue)
  const dueThisWeek = filtered.filter(isDueThisWeek)
  const inProgress = filtered.filter(o => o.status === 'in_progress' && !isOverdue(o))
  const completed = filtered.filter(o => o.status === 'completed')

  const daysOverdue = (deadline) => Math.floor((now - new Date(deadline)) / (1000 * 60 * 60 * 24))
  const daysUntil = (deadline) => Math.ceil((new Date(deadline) - now) / (1000 * 60 * 60 * 24))

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance Command Center</h1>
          <p className="text-sm text-slate-500 mt-1">Track court orders, deadlines, and compliance actions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => navigate('/tracker/order/new')}><Plus size={16} /> New Order</Button>
          <Button variant="secondary" onClick={() => navigate('/calendar')}><Calendar size={16} /> Calendar View</Button>
          <Button variant="secondary" onClick={() => toast.success('Generating report...')}><BarChart3 size={16} /> Reports</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard icon={AlertTriangle} label="Overdue" value={overdueOrders.length} color="red" />
        <StatCard icon={Clock} label="Due This Week" value={dueThisWeek.length} color="orange" />
        <StatCard icon={TrendingUp} label="In Progress" value={inProgress.length} color="blue" />
        <StatCard icon={CheckCircle} label="Completed (30d)" value={completed.length} color="green" />
        <StatCard icon={List} label="Total Active" value={orders.filter(o => o.status !== 'completed').length} color="gray" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search orders by case name..." className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Status</option>
          <option value="overdue">Overdue</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); setPriorityFilter('all') }}>Clear</Button>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {/* Overdue */}
        {overdueOrders.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-red-700">⚠️ OVERDUE ACTIONS ({overdueOrders.length})</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700">View All →</button>
            </div>
            <div className="space-y-3">
              {overdueOrders.slice(0, 3).map(order => (
                <Card key={order.id} className="p-4 border-l-4 border-l-red-500">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <PriorityBadge priority={order.priority} />
                        <span className="text-xs font-mono text-slate-400">{order.id}</span>
                        <StatusBadge status={order.status} type="order" />
                      </div>
                      <h3 className="font-semibold text-slate-900">{order.caseTitle}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{order.court} • {formatDate(order.orderDate)}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <span className="text-slate-600">Next Action: <strong>{order.nextAction}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm">
                        <span className="text-slate-600">Deadline: {formatDate(order.nextDeadline)}</span>
                        <span className="text-red-600 font-medium">⚠️ {daysOverdue(order.nextDeadline)} days overdue</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar user={order.owner} size="sm" />
                        <span className="text-xs text-slate-500">{order.owner.name}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-400 mb-1">Recent Activity:</p>
                        {order.activityLog.slice(0, 2).map(a => (
                          <p key={a.id} className="text-xs text-slate-500">{formatDate(a.timestamp)}: {a.description}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/tracker/order/${order.id}`)}><Eye size={14} /> View Details</Button>
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/tracker/order/${order.id}`)}><Pencil size={14} /> Update Status</Button>
                    <Button variant="success" size="sm" onClick={() => toast.success('Marked as complete')}><CheckCircle size={14} /> Mark Complete</Button>
                    <Button variant="ghost" size="sm" onClick={() => toast.success('Note added')}><Plus size={14} /> Add Note</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Due This Week */}
        {dueThisWeek.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-orange-700">🟡 DUE THIS WEEK ({dueThisWeek.length})</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700">View All →</button>
            </div>
            <div className="space-y-3">
              {dueThisWeek.slice(0, 3).map(order => (
                <Card key={order.id} className="p-4 border-l-4 border-l-orange-400">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-400">{order.id}</span>
                        <span className="font-medium text-slate-800">{order.caseTitle}</span>
                      </div>
                      <p className="text-sm text-slate-600">{order.nextAction} - {formatDate(order.nextDeadline)} <span className="text-orange-600 font-medium">({daysUntil(order.nextDeadline)} days)</span></p>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar user={order.owner} size="sm" />
                        <span className="text-xs text-slate-500">{order.owner.name}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/tracker/order/${order.id}`)}>View</Button>
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/tracker/order/${order.id}`)}>Update</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* In Progress */}
        {inProgress.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-blue-700">⏳ IN PROGRESS ({inProgress.length})</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700">View All →</button>
            </div>
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-slate-600">Order ID</th>
                    <th className="px-4 py-2.5 text-left font-medium text-slate-600">Case Name</th>
                    <th className="px-4 py-2.5 text-left font-medium text-slate-600 hidden md:table-cell">Next Action</th>
                    <th className="px-4 py-2.5 text-left font-medium text-slate-600 hidden lg:table-cell">Deadline</th>
                    <th className="px-4 py-2.5 text-left font-medium text-slate-600 hidden lg:table-cell">Owner</th>
                    <th className="px-4 py-2.5 text-right font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inProgress.map(order => (
                    <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/tracker/order/${order.id}`)}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{order.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{order.caseTitle}</td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{order.nextAction}</td>
                      <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{formatDate(order.nextDeadline)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell"><Avatar user={order.owner} size="sm" /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/tracker/order/${order.id}`) }} className="p-1.5 hover:bg-slate-100 rounded"><Eye size={14} className="text-slate-500" /></button>
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/tracker/order/${order.id}`) }} className="p-1.5 hover:bg-slate-100 rounded"><Pencil size={14} className="text-slate-500" /></button>
                          <button onClick={(e) => { e.stopPropagation(); toast.success('Marked complete') }} className="p-1.5 hover:bg-slate-100 rounded"><CheckCircle size={14} className="text-green-500" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div>
            <button onClick={() => setCollapsed({ ...collapsed, completed: !collapsed.completed })} className="flex items-center gap-2 mb-3">
              <ChevronRight size={20} className={collapsed.completed ? '' : 'rotate-90 transition-transform'} />
              <h2 className="font-semibold text-green-700">✅ COMPLETED (Last 30 Days) - {completed.length}</h2>
            </button>
            {!collapsed.completed && (
              <div className="space-y-2">
                {completed.map(order => (
                  <Card key={order.id} className="p-3 opacity-75">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle size={16} className="text-green-500" />
                        <div>
                          <span className="text-xs font-mono text-slate-400">{order.id}</span>
                          <span className="text-sm font-medium text-slate-800 ml-2">{order.caseTitle}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/tracker/order/${order.id}`)}>View</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
