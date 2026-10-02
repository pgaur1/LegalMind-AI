import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, RefreshCw, SlidersHorizontal, Star, Share2, FileText, Paperclip,
  ChevronDown, ChevronUp, Download, BookOpen, X, TrendingUp, BarChart3,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { Button, Card, Badge, EmptyState, formatDate } from '../components/ui'
import toast from 'react-hot-toast'

function AdvancedFiltersPanel({ open, onClose, filters, setFilters }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl animate-slide-in-right">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-slate-900">Advanced Filters</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Search Parameters</p>
            <input placeholder="Keywords/Query" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" value={filters.keywords} onChange={e => setFilters({ ...filters, keywords: e.target.value })} />
            <div className="space-y-1.5">
              {['Semantic Search (AI-powered relevance)', 'Exact Phrase Match', 'Boolean Search (AND, OR, NOT)'].map((opt, i) => (
                <label key={opt} className="flex items-center gap-2">
                  <input type="radio" name="searchType" defaultChecked={i === 0} />
                  <span className="text-sm text-slate-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Court Level</p>
            <div className="space-y-1.5">
              {['Supreme Court', 'High Courts', 'District Courts', 'RERA Authorities', 'Consumer Forums (NCDRC, State)'].map(opt => (
                <label key={opt} className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-slate-300" />
                  <span className="text-sm text-slate-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Date Range</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input type="date" className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="date" className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['Last Year', 'Last 2 Years', 'Last 5 Years', 'All Time'].map(opt => (
                <button key={opt} className="px-2.5 py-1 text-xs border border-slate-200 rounded-full hover:bg-slate-50">{opt}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Acts/Laws</p>
            <div className="space-y-1.5">
              {['RERA Act 2016', 'IRDAI Act 1999', 'Companies Act 2013', 'DPDP Act 2023', 'Consumer Protection Act'].map(opt => (
                <label key={opt} className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-slate-300" />
                  <span className="text-sm text-slate-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Citation Count (Importance)</p>
            <div className="space-y-1.5">
              {['Any', 'Cited 5+ times', 'Cited 10+ times', 'Cited 20+ times'].map((opt, i) => (
                <label key={opt} className="flex items-center gap-2">
                  <input type="radio" name="citation" defaultChecked={i === 0} />
                  <span className="text-sm text-slate-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">AI Assist Options</p>
            <div className="space-y-1.5">
              {['Only show precedents applicable to my case', 'Exclude contradictory judgments', 'Prioritize recent judgments', 'Include related precedents automatically'].map(opt => (
                <label key={opt} className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-slate-300" />
                  <span className="text-sm text-slate-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-slate-200 flex justify-between bg-white sticky bottom-0">
          <Button variant="ghost" size="sm">Clear All</Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={() => { onClose(); toast.success('Filters applied') }}>Apply Filters</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Precedents() {
  const navigate = useNavigate()
  const { precedents } = useAppStore()
  const [search, setSearch] = useState('')
  const [court, setCourt] = useState('all')
  const [year, setYear] = useState('all')
  const [act, setAct] = useState('all')
  const [type, setType] = useState('all')
  const [sortBy, setSortBy] = useState('relevance')
  const [showFilters, setShowFilters] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [filters, setFilters] = useState({ keywords: '' })

  let filtered = precedents.filter(p => {
    const matchSearch = !search ||
      p.caseTitle.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchCourt = court === 'all' || p.court.includes(court === 'sc' ? 'Supreme Court' : court === 'hc' ? 'High Court' : court === 'rera' ? 'RERA' : court === 'consumer' ? 'NCDRC' : '')
    const matchYear = year === 'all' || p.date.startsWith(year)
    const matchAct = act === 'all' || p.acts?.some(a => a.includes(act))
    const matchType = type === 'all' || p.type === type
    return matchSearch && matchCourt && matchYear && matchAct && matchType
  })

  if (sortBy === 'relevance') filtered.sort((a, b) => b.matchScore - a.matchScore)
  else if (sortBy === 'date_new') filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
  else if (sortBy === 'date_old') filtered.sort((a, b) => new Date(a.date) - new Date(b.date))
  else if (sortBy === 'citations') filtered.sort((a, b) => b.citedBy - a.citedBy)

  const newCount = precedents.filter(p => p.isNew).length

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Precedent Intelligence Library</h1>
        <p className="text-sm text-slate-500 mt-1">Search court orders, judgments, and legal precedents</p>
      </div>

      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search precedents by case name, topic, citation..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button variant="secondary" onClick={() => toast.success('Fetching latest court orders from web...')}><RefreshCw size={16} /> Fetch Latest from Web</Button>
        <Button variant="secondary" onClick={() => navigate('/precedents/updates')}><BarChart3 size={16} /> Auto-Scraping Status</Button>
        <Button variant="secondary" onClick={() => setShowFilters(true)}><SlidersHorizontal size={16} /> Advanced Filters</Button>
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: 'court', state: court, set: setCourt, options: [['all', 'All Courts'], ['sc', 'Supreme Court'], ['hc', 'High Courts'], ['rera', 'RERA Authorities'], ['consumer', 'Consumer Forums']] },
          { key: 'year', state: year, set: setYear, options: [['all', 'All Years'], ['2024', '2024'], ['2023', '2023'], ['2018', '2018'], ['2019', '2019']] },
          { key: 'act', state: act, set: setAct, options: [['all', 'All Laws'], ['RERA', 'RERA Act'], ['IRDAI', 'IRDAI Act'], ['DPDP', 'DPDP Act'], ['Consumer', 'Consumer Protection']] },
          { key: 'type', state: type, set: setType, options: [['all', 'All Types'], ['Judgment', 'Judgment'], ['Order', 'Order'], ['Writ Petition', 'Writ Petition']] },
        ].map(filter => (
          <select
            key={filter.key}
            value={filter.state}
            onChange={e => filter.set(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {filter.options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
        ))}
        {(search || court !== 'all' || year !== 'all' || act !== 'all' || type !== 'all') && (
          <button onClick={() => { setSearch(''); setCourt('all'); setYear('all'); setAct('all'); setType('all') }} className="text-xs text-blue-600 hover:text-blue-700 self-center">Clear All Filters</button>
        )}
      </div>

      {/* New precedents banner */}
      {newCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <p className="text-sm text-green-800">🆕 {newCount} new court orders added today (auto-scraped)</p>
          <button onClick={() => toast.success('Showing new orders')} className="text-sm text-green-700 font-medium hover:text-green-800">View New Orders →</button>
        </div>
      )}

      {/* Results */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-600">📊 Search Results ({filtered.length} precedents found)</p>
        <div className="flex items-center gap-2">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="relevance">Relevance</option>
            <option value="date_new">Date (Newest First)</option>
            <option value="date_old">Date (Oldest)</option>
            <option value="citations">Citation Count</option>
          </select>
          <Button variant="secondary" size="sm" onClick={() => toast.success('Exporting results...')}><Download size={14} /> Export</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No precedents found matching your criteria"
          description="Try different keywords or filters"
          action={<Button variant="primary" onClick={() => { setSearch(''); setCourt('all'); setYear('all'); setAct('all'); setType('all') }}>Clear Filters</Button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((p, idx) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-400">{idx + 1}.</span>
                    <h3 className="font-semibold text-slate-900 truncate">{p.caseTitle}</h3>
                    <Badge color="green" size="xs">⭐ {p.matchScore}% Match</Badge>
                    {p.isNew && <Badge color="blue" size="xs">🆕 New</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                    <span>{p.court}</span>
                    <span>•</span>
                    <span>{formatDate(p.date)}</span>
                    <span>•</span>
                    <span className="font-mono">{p.citation}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    {expanded === p.id ? p.summary : `${p.summary.slice(0, 150)}...`}
                    <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="text-blue-600 ml-1 hover:text-blue-700">
                      {expanded === p.id ? 'Read less' : 'Read more...'}
                    </button>
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    {p.tags.map(tag => <Badge key={tag} color="gray" size="xs">{tag}</Badge>)}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <span>🔗 Related:</span>
                    {p.related.map(r => <span key={r} className="text-blue-600 hover:underline cursor-pointer">{r}</span>).reduce((prev, curr, i) => i === 0 ? [curr] : [...prev, ' | ', curr], [])}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                <Button variant="primary" size="sm" onClick={() => navigate(`/precedent/${p.id}`)}><FileText size={14} /> View Full Judgment</Button>
                <Button variant="secondary" size="sm" onClick={() => toast.success('Added to current draft')}><Paperclip size={14} /> Add to Draft</Button>
                <Button variant="ghost" size="sm" onClick={() => toast.success('Saved to library')}><Star size={14} /> Save</Button>
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard?.writeText(p.citation); toast.success('Citation copied') }}><Share2 size={14} /> Share</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="secondary" size="sm" disabled>← Prev</Button>
          <span className="text-sm text-slate-600">Page 1 of {Math.ceil(filtered.length / 10)}</span>
          <Button variant="secondary" size="sm" disabled>Next →</Button>
        </div>
      )}

      <AdvancedFiltersPanel open={showFilters} onClose={() => setShowFilters(false)} filters={filters} setFilters={setFilters} />
    </div>
  )
}
