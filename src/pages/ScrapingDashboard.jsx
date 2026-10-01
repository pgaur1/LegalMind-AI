import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, RefreshCw, Settings, Play, BarChart3, CheckCircle,
  AlertTriangle, Clock, FileText, Star, X,
} from 'lucide-react'
import { Button, Card, Badge, Modal } from '../components/ui'
import { samplePrecedents } from '../data/mockData'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const scrapeSources = [
  { name: 'Supreme Court', lastScraped: '2 hours ago', newOrders: 3, status: 'active' },
  { name: 'High Courts', lastScraped: '2 hours ago', newOrders: 7, status: 'active' },
  { name: 'RERA Authorities', lastScraped: '2 hours ago', newOrders: 2, status: 'active' },
  { name: 'Indian Kanoon', lastScraped: '2 hours ago', newOrders: 5, status: 'active' },
]

const topCourts = [
  { name: 'Supreme Court', count: 12 },
  { name: 'Delhi HC', count: 18 },
  { name: 'Maharashtra HC', count: 15 },
  { name: 'Karnataka HC', count: 9 },
  { name: 'NCDRC', count: 7 },
]

const categoryData = [
  { category: 'RERA Cases', count: 14 },
  { category: 'Insurance', count: 8 },
  { category: 'Companies Act', count: 6 },
  { category: 'Data Privacy', count: 5 },
  { category: 'Consumer Rights', count: 11 },
]

export default function ScrapingDashboard() {
  const [activeTab, setActiveTab] = useState('today')
  const [showConfig, setShowConfig] = useState(false)

  const newPrecedents = samplePrecedents.filter(p => p.isNew)

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <Link to="/precedents" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-4">
        <ArrowLeft size={16} /> Back to Precedents
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Latest Court Orders - Auto Update Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor automatic web scraping of new court orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => toast.success('Manual scrape started...')}><RefreshCw size={16} /> Run Manual Scrape Now</Button>
          <Button variant="secondary" onClick={() => setShowConfig(true)}><Settings size={16} /> Configure Sources</Button>
        </div>
      </div>

      {/* Status Card */}
      <Card className="p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center"><Clock size={20} className="text-slate-500" /></div>
            <div><p className="text-xs text-slate-400">Last Update</p><p className="text-sm font-medium text-slate-800">2 hours ago</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center"><RefreshCw size={20} className="text-slate-500" /></div>
            <div><p className="text-xs text-slate-400">Next Scheduled</p><p className="text-sm font-medium text-slate-800">In 4 hours</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><CheckCircle size={20} className="text-green-600" /></div>
            <div><p className="text-xs text-slate-400">Status</p><p className="text-sm font-medium text-green-700">Active</p></div>
          </div>
        </div>
      </Card>

      {/* Sources Monitored */}
      <Card className="p-5 mb-6">
        <h2 className="font-semibold text-slate-900 mb-3">Sources Monitored</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Source</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Last Scraped</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">New Orders</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Status</th>
                <th className="px-4 py-2.5 text-right font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scrapeSources.map(src => (
                <tr key={src.name} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{src.name}</td>
                  <td className="px-4 py-3 text-slate-600">{src.lastScraped}</td>
                  <td className="px-4 py-3"><Badge color="blue" size="xs">{src.newOrders} new</Badge></td>
                  <td className="px-4 py-3"><CheckCircle size={16} className="text-green-500" /></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => toast.success(`Running ${src.name}...`)}><Play size={12} /></Button><Button variant="ghost" size="sm" onClick={() => toast.success('Viewing logs')}><BarChart3 size={12} /></Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Chart */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Precedents by Category (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
              <Bar dataKey="count" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Courts */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Top Courts Contributing</h2>
          <div className="space-y-3">
            {topCourts.map(court => (
              <div key={court.name} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{court.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(court.count / 18) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-slate-800 w-8 text-right">{court.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* New Precedents */}
      <Card className="p-5 mt-6">
        <div className="flex items-center gap-2 mb-4">
          {['today', 'week', 'month'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {tab === 'today' ? 'Today' : tab === 'week' ? 'This Week' : 'This Month'} ({tab === 'today' ? newPrecedents.length : tab === 'week' ? 23 : 89})
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {newPrecedents.map(p => (
            <div key={p.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0"><FileText size={18} className="text-blue-600" /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge color="blue" size="xs">NEW</Badge>
                  <span className="text-sm font-medium text-slate-800">{p.caseTitle}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{p.court} • {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p className="text-xs text-slate-600 mt-1">{p.summary.slice(0, 100)}...</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge color="green" size="xs">Indexed in RAG</Badge>
                  <Badge color="green" size="xs">Added to Graph</Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => toast.success('Marked important')}><Star size={14} /></Button>
                <Button variant="ghost" size="sm" onClick={() => toast.success('Dismissed')}><X size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Config Modal */}
      <Modal open={showConfig} onClose={() => setShowConfig(false)} title="Configure Sources">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Update Frequency</label>
            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Every 6 hours</option><option>Every 12 hours</option><option>Daily</option>
            </select>
          </div>
          {[
            { label: 'Auto-index to RAG', defaultOn: true },
            { label: 'Auto-add to Graph', defaultOn: true },
            { label: 'Notification on new', defaultOn: true },
            { label: 'Email notifications', defaultOn: false },
            { label: 'In-app notifications', defaultOn: true },
          ].map(opt => (
            <div key={opt.label} className="flex items-center justify-between">
              <span className="text-sm text-slate-700">{opt.label}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={opt.defaultOn} className="sr-only peer" />
                <div className="w-10 h-5 bg-slate-200 rounded-full peer-checked:bg-blue-600 transition-colors relative">
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Relevance Threshold</label>
            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowConfig(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => { setShowConfig(false); toast.success('Settings saved') }}>Save Settings</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
