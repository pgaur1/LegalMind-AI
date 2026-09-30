import { Link } from 'react-router-dom'
import {
  Scale, FileText, Gavel, Calendar, AlertTriangle, Clock, CheckCircle,
  TrendingUp, BookOpen, ChevronRight, MessageSquare, Search,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { Card, StatCard, StatusBadge, PriorityBadge, Avatar, timeAgo, formatDate } from '../components/ui'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts'

const monthlyData = [
  { month: 'Apr', drafts: 8, precedents: 12 },
  { month: 'May', drafts: 12, precedents: 8 },
  { month: 'Jun', drafts: 6, precedents: 15 },
  { month: 'Jul', drafts: 10, precedents: 20 },
  { month: 'Aug', drafts: 14, precedents: 18 },
  { month: 'Sep', drafts: 9, precedents: 22 },
]

export default function Dashboard() {
  const { drafts, orders, precedents, user } = useAppStore()

  const overdueOrders = orders.filter(o => o.status === 'in_progress' && new Date(o.nextDeadline) < new Date('2024-09-30'))
  const dueThisWeek = orders.filter(o => {
    const d = new Date(o.nextDeadline)
    const now = new Date('2024-09-30')
    const diff = (d - now) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7
  })
  const inProgress = orders.filter(o => o.status === 'in_progress')
  const completed = orders.filter(o => o.status === 'completed')

  const recentDrafts = drafts.slice(0, 4)

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user.name.split(' ')[0]}</h1>
        <p className="text-blue-100 mt-1">Here's what's happening with your legal operations today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={AlertTriangle} label="Overdue" value={overdueOrders.length} color="red" />
        <StatCard icon={Clock} label="Due This Week" value={dueThisWeek.length} color="orange" />
        <StatCard icon={TrendingUp} label="In Progress" value={inProgress.length} color="blue" />
        <StatCard icon={CheckCircle} label="Completed (30d)" value={completed.length} color="green" />
        <StatCard icon={FileText} label="Total Drafts" value={drafts.length} color="gray" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Search, label: 'Research Co-Pilot', desc: 'Ask legal questions with AI', path: '/research', color: 'bg-blue-600' },
          { icon: FileText, label: 'New Legal Draft', desc: 'Generate documents with AI', path: '/draft/new', color: 'bg-teal-600' },
          { icon: BookOpen, label: 'Search Precedents', desc: 'Find court orders & judgments', path: '/precedents', color: 'bg-orange-500' },
          { icon: Gavel, label: 'Track Compliance', desc: 'Monitor court order deadlines', path: '/tracker', color: 'bg-purple-600' },
        ].map(action => (
          <Link key={action.path} to={action.path}>
            <Card hover className="p-5">
              <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                <action.icon size={20} className="text-white" />
              </div>
              <h3 className="font-semibold text-slate-900">{action.label}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{action.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Activity Overview</h2>
            <span className="text-xs text-slate-400">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gDrafts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPrec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
              <Area type="monotone" dataKey="drafts" stroke="#2563eb" fill="url(#gDrafts)" name="Drafts" strokeWidth={2} />
              <Area type="monotone" dataKey="precedents" stroke="#f59e0b" fill="url(#gPrec)" name="Precedents" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Upcoming Deadlines</h2>
            <Link to="/tracker" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all</Link>
          </div>
          <div className="space-y-3">
            {orders.filter(o => o.status !== 'completed').slice(0, 4).map(order => (
              <Link key={order.id} to={`/tracker/order/${order.id}`} className="block">
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                    new Date(order.nextDeadline) < new Date('2024-09-30') ? 'bg-red-500' :
                    new Date(order.nextDeadline) <= new Date('2024-10-05') ? 'bg-orange-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{order.caseTitle}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{order.nextAction} - {formatDate(order.nextDeadline)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Drafts */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Recent Drafts</h2>
          <Link to="/drafts" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all</Link>
        </div>
        <div className="space-y-2">
          {recentDrafts.map(draft => (
            <Link key={draft.id} to={`/draft/${draft.id}`}>
              <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{draft.id}</span>
                    <StatusBadge status={draft.status} />
                  </div>
                  <p className="text-sm font-medium text-slate-800 truncate mt-0.5">{draft.title}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <Avatar user={draft.owner} size="sm" />
                  <span className="text-xs text-slate-500">{timeAgo(draft.updatedAt)}</span>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Precedent Category Chart */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Precedents by Category (Last 30 Days)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={[
            { category: 'RERA', count: 12 },
            { category: 'Insurance', count: 8 },
            { category: 'Companies Act', count: 6 },
            { category: 'Data Privacy', count: 5 },
            { category: 'Consumer Rights', count: 9 },
          ]} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="category" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
            <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
            <Bar dataKey="count" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
