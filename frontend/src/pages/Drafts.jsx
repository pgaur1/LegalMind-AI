import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, Search, FileText, Eye, Pencil, Trash2, MoreVertical, FileX,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { Button, Card, StatusBadge, Avatar, EmptyState, formatDate, timeAgo } from '../components/ui'
import toast from 'react-hot-toast'

export default function Drafts() {
  const navigate = useNavigate()
  const { drafts, deleteDraft } = useAppStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')

  let filtered = drafts.filter(d => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.caseName?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    return matchSearch && matchStatus
  })

  if (sortBy === 'recent') filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  else if (sortBy === 'oldest') filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this draft?')) {
      deleteDraft(id)
      toast.success('Draft deleted')
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Legal Drafts</h1>
          <p className="text-sm text-slate-500 mt-1">{drafts.length} drafts total</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/draft/new')}>
          <Plus size={18} /> Create New Draft
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search drafts by title or case..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="recent">Recent First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileX}
          title="No drafts found"
          description={search || statusFilter !== 'all' ? "Try different filters or search terms." : "No drafts yet. Create your first legal draft."}
          action={<Button variant="primary" onClick={() => navigate('/draft/new')}><Plus size={16} /> Create New Draft</Button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(draft => (
            <Card key={draft.id} hover className="p-4" onClick={() => navigate(`/draft/${draft.id}`)}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={22} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-slate-400">{draft.id}</span>
                    <StatusBadge status={draft.status} />
                    <span className="text-xs text-slate-400">v{draft.version}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mt-1 truncate">{draft.title}</h3>
                  <p className="text-sm text-slate-500 truncate">{draft.caseName}</p>
                </div>
                <div className="hidden md:flex items-center gap-4 text-sm text-slate-500">
                  <div className="text-right">
                    <p>Created {formatDate(draft.createdAt)}</p>
                    <p className="text-xs text-slate-400">Updated {timeAgo(draft.updatedAt)}</p>
                  </div>
                  <Avatar user={draft.owner} size="sm" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/draft/${draft.id}`) }}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                    title="View"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/draft/${draft.id}`) }}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(draft.id) }}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
