import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, FileText, Mail, Calendar, Link2, Plus, Download,
  AlertTriangle, Bell, Clock, CheckCircle, Pencil, Send,
  Paperclip, ChevronRight,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { Button, Card, Badge, StatusBadge, PriorityBadge, Avatar, formatDate, timeAgo } from '../components/ui'
import toast from 'react-hot-toast'

const activityIcons = {
  system: Bell,
  user: Pencil,
  comment: FileText,
}

function TabDetails({ order }) {
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-2">Order Summary</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{order.summary}</p>
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-3">Key Directions/Outcomes</h3>
        <div className="space-y-1.5">
          {order.keyDirections.split('\n').map((dir, i) => (
            <p key={i} className="text-sm text-slate-600 flex items-start gap-2">
              <ChevronRight size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
              {dir}
            </p>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900">Actions Required</h3>
          <Button variant="ghost" size="sm" onClick={() => toast.success('Add action form opened')}><Plus size={14} /> Add Action</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-600">#</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Action</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600 hidden md:table-cell">Deadline</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600 hidden lg:table-cell">Assigned To</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
                <th className="px-3 py-2 text-right font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {order.actions.map((action, i) => (
                <tr key={action.id} className="border-b border-slate-100">
                  <td className="px-3 py-2.5 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2.5 text-slate-800 font-medium">{action.action}</td>
                  <td className="px-3 py-2.5 text-slate-600 hidden md:table-cell">{formatDate(action.deadline)}</td>
                  <td className="px-3 py-2.5 hidden lg:table-cell"><Avatar user={action.assignedTo} size="sm" /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={action.status} type="order" /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1 hover:bg-slate-100 rounded" onClick={() => toast.success('Edit action')}><Pencil size={12} className="text-slate-500" /></button>
                      <button className="p-1 hover:bg-slate-100 rounded" onClick={() => toast.success('Marked complete')}><CheckCircle size={12} className="text-green-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function TabTimeline({ order }) {
  const statusIcons = {
    completed: <CheckCircle size={16} className="text-green-500" />,
    overdue: <AlertTriangle size={16} className="text-red-500" />,
    upcoming: <Clock size={16} className="text-blue-500" />,
  }

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-slate-900 mb-4">Timeline</h3>
      <div className="relative">
        <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200" />
        <div className="space-y-5">
          {order.timeline.map(event => (
            <div key={event.id} className="relative flex gap-4">
              <div className="w-8 h-8 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                {statusIcons[event.status] || <Clock size={16} className="text-slate-400" />}
              </div>
              <div className="flex-1 pb-1">
                <p className="text-sm font-medium text-slate-800">{event.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatDate(event.date)}</p>
                <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                {event.by && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Avatar user={event.by} size="sm" />
                    <span className="text-xs text-slate-500">{event.by.name}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function TabActivityLog({ order }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Activity Log</h3>
        <Button variant="ghost" size="sm" onClick={() => toast.success('Exporting...')}><Download size={14} /> Export</Button>
      </div>
      <div className="space-y-3">
        {order.activityLog.map(entry => {
          const Icon = activityIcons[entry.type] || FileText
          return (
            <div key={entry.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-200">
                <Icon size={14} className="text-slate-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-700">{entry.description}</p>
                <p className="text-xs text-slate-400 mt-0.5">{timeAgo(entry.timestamp)}</p>
              </div>
              {entry.user && <Avatar user={entry.user} size="sm" />}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function TabUpdates({ order, onPost }) {
  const [updateType, setUpdateType] = useState('status_update')
  const [content, setContent] = useState('')
  const [newStatus, setNewStatus] = useState('in_progress')
  const [progress, setProgress] = useState(order.progress)
  const [notify, setNotify] = useState(true)

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-slate-900 mb-4">Post Update</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Update Type</label>
          <select value={updateType} onChange={e => setUpdateType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="status_update">Status Update</option>
            <option value="progress_update">Progress Update</option>
            <option value="general_note">General Note</option>
            <option value="issue_blocker">Issue/Blocker</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Update Content</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="Describe the update..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {updateType === 'status_update' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Status</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        )}
        {updateType === 'progress_update' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Progress: {progress}%</label>
            <input type="range" min="0" max="100" value={progress} onChange={e => setProgress(Number(e.target.value))} className="w-full" />
          </div>
        )}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} className="rounded border-slate-300" />
          <span className="text-sm text-slate-700">Notify team members</span>
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => { setContent('') }}>Cancel</Button>
          <Button variant="primary" onClick={() => onPost({ updateType, content, newStatus, progress })}><Send size={14} /> Post Update</Button>
        </div>
      </div>
    </Card>
  )
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getOrder, updateOrder } = useAppStore()
  const order = getOrder(id)
  const [activeTab, setActiveTab] = useState('details')

  if (!order) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">Order not found.</p>
        <Link to="/tracker" className="text-blue-600 mt-2 inline-block">Back to Tracker</Link>
      </div>
    )
  }

  const tabs = [
    { key: 'details', label: 'Details' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'activity', label: 'Activity Log' },
    { key: 'updates', label: 'Updates' },
  ]

  const now = new Date('2024-09-30')
  const isOverdue = order.status !== 'completed' && new Date(order.nextDeadline) < now
  const daysOverdue = Math.floor((now - new Date(order.nextDeadline)) / (1000 * 60 * 60 * 24))

  const handlePostUpdate = ({ content, newStatus, progress }) => {
    if (!content.trim()) { toast.error('Please enter update content'); return }
    updateOrder(order.id, { status: newStatus, progress })
    toast.success('Update posted successfully')
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-72 lg:w-80 border-r border-slate-200 bg-white overflow-y-auto flex-shrink-0 hidden lg:block">
        <div className="p-4 space-y-5">
          <div>
            <Link to="/tracker" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-3">
              <ArrowLeft size={16} /> Back to Tracker
            </Link>
            <h3 className="font-semibold text-slate-900 text-sm mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-slate-500">Case:</span> <span className="text-slate-800 font-medium">{order.caseTitle}</span></div>
              <div><span className="text-slate-500">Number:</span> <span className="text-slate-700">{order.caseNumber}</span></div>
              <div><span className="text-slate-500">Court:</span> <span className="text-slate-700">{order.court}</span></div>
              <div><span className="text-slate-500">Order Date:</span> <span className="text-slate-700">{formatDate(order.orderDate)}</span></div>
              <div className="flex items-center gap-2"><span className="text-slate-500">Type:</span> <Badge color="blue" size="xs">{order.orderType}</Badge></div>
              <div className="flex items-center gap-2"><span className="text-slate-500">Priority:</span> <PriorityBadge priority={order.priority} /></div>
              {order.relatedDraftId && (
                <div><span className="text-slate-500">Related Draft:</span> <Link to={`/draft/${order.relatedDraftId}`} className="text-blue-600 hover:underline">{order.relatedDraftId}</Link></div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-2">Quick Actions</h3>
            <div className="space-y-1.5">
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => toast.success('Note form opened')}><Pencil size={14} /> Add Note</Button>
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => toast.success('Upload opened')}><Paperclip size={14} /> Attach Document</Button>
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => toast.success('Email drafted')}><Mail size={14} /> Email Team</Button>
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/calendar')}><Calendar size={14} /> Add Event</Button>
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => toast.success('Link form opened')}><Link2 size={14} /> Link Related Order</Button>
            </div>
          </div>

          {order.attachments.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 text-sm mb-2">Attachments ({order.attachments.length})</h3>
              <div className="space-y-2">
                {order.attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <FileText size={14} className="text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{att.name}</p>
                      <p className="text-xs text-slate-400">{att.size} • {formatDate(att.uploadedAt)}</p>
                    </div>
                    <button onClick={() => toast.success('Downloading...')} className="p-1 hover:bg-slate-200 rounded"><Download size={12} className="text-slate-500" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-2">Team Members</h3>
            <div className="flex items-center gap-2 mb-2">
              <Avatar user={order.owner} size="sm" />
              <div>
                <p className="text-xs font-medium text-slate-700">{order.owner.name}</p>
                <p className="text-xs text-slate-400">Owner</p>
              </div>
            </div>
            {order.watchers.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Watchers:</p>
                <div className="flex items-center gap-1">
                  {order.watchers.map(w => <Avatar key={w.id} user={w} size="sm" />)}
                  <button onClick={() => toast.success('Add watcher')} className="w-7 h-7 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center hover:border-blue-400"><Plus size={12} className="text-slate-400" /></button>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-2">Progress</h3>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${order.progress}%` }} />
            </div>
            <p className="text-xs text-slate-500">{order.progress}% complete</p>
            <p className="text-xs text-slate-400 mt-1">Completed: {order.actions.filter(a => a.status === 'completed').length}/{order.actions.length} actions</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 lg:px-6 py-3 z-10">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <Link to="/tracker" className="p-1.5 hover:bg-slate-100 rounded-lg lg:hidden"><ArrowLeft size={18} className="text-slate-500" /></Link>
              <div>
                <h1 className="font-semibold text-slate-900">{order.caseTitle}</h1>
                <p className="text-xs text-slate-500">{order.id} • Updated {timeAgo(order.activityLog[0]?.timestamp || order.orderDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={order.status} type="order" />
              <PriorityBadge priority={order.priority} />
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-6 max-w-4xl mx-auto">
          {/* Alert if overdue */}
          {isOverdue && (
            <Card className="p-4 mb-4 bg-red-50 border-red-200">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-semibold text-red-800 flex items-center gap-2"><AlertTriangle size={18} /> OVERDUE ACTION</p>
                  <p className="text-sm text-red-700 mt-1">Next Action: <strong>{order.nextAction}</strong></p>
                  <p className="text-sm text-red-700">Original Due: {formatDate(order.nextDeadline)} • <strong>{daysOverdue} days overdue</strong></p>
                  <p className="text-sm text-red-700">Assigned To: {order.owner.name}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="danger" size="sm" onClick={() => toast.success('Reminder sent')}><Bell size={14} /> Send Reminder</Button>
                  <Button variant="secondary" size="sm" onClick={() => toast.success('Extend deadline form opened')}><Calendar size={14} /> Extend Deadline</Button>
                  <Button variant="secondary" size="sm" onClick={() => toast.success('Reassign form opened')}>Reassign</Button>
                  <Button variant="success" size="sm" onClick={() => { updateOrder(order.id, { status: 'completed', progress: 100 }); toast.success('Marked complete') }}><CheckCircle size={14} /> Mark Complete</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Tabs */}
          <div className="border-b border-slate-200 mb-4">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'details' && <TabDetails order={order} />}
          {activeTab === 'timeline' && <TabTimeline order={order} />}
          {activeTab === 'activity' && <TabActivityLog order={order} />}
          {activeTab === 'updates' && <TabUpdates order={order} onPost={handlePostUpdate} />}
        </div>
      </div>
    </div>
  )
}
