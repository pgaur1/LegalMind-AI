import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Star, Share2, Download, Mail, Printer, Paperclip,
  CheckCircle, AlertTriangle, Gavel, Link2, TrendingUp,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { Button, Card, Badge, Breadcrumb } from '../components/ui'
import toast from 'react-hot-toast'

export default function PrecedentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getPrecedent } = useAppStore()
  const precedent = getPrecedent(id)
  const [activeTab, setActiveTab] = useState('summary')

  if (!precedent) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">Precedent not found.</p>
        <Link to="/precedents" className="text-blue-600 mt-2 inline-block">Back to Precedents</Link>
      </div>
    )
  }

  const tabs = ['Summary', 'Full Judgment', 'Citations', 'Related Cases', 'Analysis']

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Precedents', path: '/precedents' }, { label: precedent.caseTitle }]} />
      <Link to="/precedents" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-4">
        <ArrowLeft size={16} /> Back to Search
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{precedent.caseTitle}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge color="blue">{precedent.court}</Badge>
              {precedent.status === 'good_law' ? (
                <Badge color="green"><CheckCircle size={12} className="mr-1" /> Good Law</Badge>
              ) : (
                <Badge color="red"><AlertTriangle size={12} className="mr-1" /> Overruled</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Citation', value: precedent.citation },
          { label: 'Case Number', value: precedent.caseNumber },
          { label: 'Judgment Date', value: new Date(precedent.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
          { label: 'Bench', value: precedent.judges },
          { label: 'Petitioner', value: precedent.petitioner },
          { label: 'Respondent', value: precedent.respondent },
          { label: 'Type', value: precedent.type },
          { label: 'Cited By', value: `${precedent.citedBy} cases` },
        ].map(item => (
          <Card key={item.label} className="p-3">
            <p className="text-xs text-slate-400">{item.label}</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5 truncate">{item.value}</p>
          </Card>
        ))}
      </div>

      {/* Acts involved */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="text-sm text-slate-500">Acts Involved:</span>
        {precedent.acts.map(act => <Badge key={act} color="teal">{act}</Badge>)}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Button variant="primary" size="sm" onClick={() => toast.success('Added to current draft')}><Paperclip size={14} /> Add to Current Draft</Button>
        <Button variant="secondary" size="sm" onClick={() => toast.success('Saved to library')}><Star size={14} /> Save to Library</Button>
        <Button variant="secondary" size="sm" onClick={() => toast.success('Downloading PDF...')}><Download size={14} /> Download PDF</Button>
        <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard?.writeText(precedent.citation); toast.success('Citation copied') }}><Link2 size={14} /> Copy Citation</Button>
        <Button variant="ghost" size="sm" onClick={() => toast.success('Email opened')}><Mail size={14} /> Email</Button>
        <Button variant="ghost" size="sm" onClick={() => window.print()}><Printer size={14} /> Print</Button>
      </div>

      {/* AI Analysis Box */}
      <Card className="p-5 mb-6 bg-gradient-to-br from-blue-50 to-teal-50 border-blue-200">
        <h3 className="font-semibold text-slate-900 mb-3">🎯 AI Analysis</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-white/60 rounded-lg p-3">
            <p className="text-xs text-slate-500">Relevance</p>
            <p className="text-sm font-semibold text-blue-700">{precedent.matchScore}% match to your query</p>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <p className="text-xs text-slate-500">Importance</p>
            <p className="text-sm font-semibold text-teal-700">High (cited in {precedent.citedBy} cases)</p>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <p className="text-xs text-slate-500">Status</p>
            <p className="text-sm font-semibold text-green-700">Still good law (not overruled)</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Key Takeaways:</p>
          <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
            {precedent.keyTakeaways.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-4">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase().replace(/ /g, '_'))}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.toLowerCase().replace(/ /g, '_')
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="mb-6">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="font-semibold text-slate-900 mb-2">Facts</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{precedent.facts}</p>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-slate-900 mb-2">Issues</h3>
              <ol className="text-sm text-slate-600 space-y-1.5 ml-5 list-decimal">
                {precedent.issues.map((issue, i) => <li key={i}>{issue}</li>)}
              </ol>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-slate-900 mb-2">Held</h3>
              <ol className="text-sm text-slate-600 space-y-1.5 ml-5 list-decimal">
                {precedent.held.map((h, i) => <li key={i}>{h}</li>)}
              </ol>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-slate-900 mb-2">Key Excerpts</h3>
              <div className="space-y-3">
                {precedent.excerpts.map((excerpt, i) => (
                  <div key={i} className="border-l-4 border-blue-300 pl-4 py-1">
                    <p className="text-sm text-slate-600 italic">"{excerpt.text}"</p>
                    <p className="text-xs text-slate-400 mt-1">[{excerpt.para}]</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'full_judgment' && (
          <Card className="p-6">
            <div className="prose-content text-sm text-slate-700 leading-relaxed space-y-4">
              <p><strong>JUDGMENT</strong></p>
              <p>[1] {precedent.facts}</p>
              {precedent.excerpts.map((excerpt, i) => (
                <p key={i}>[{i + 2}] {excerpt.text} <span className="text-slate-400">({excerpt.para})</span></p>
              ))}
              {precedent.held.map((h, i) => (
                <p key={i}>[{i + precedent.excerpts.length + 2}] {h}</p>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'citations' && (
          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Cases Cited</h3>
              {precedent.casesCited.length > 0 ? (
                <div className="space-y-2">
                  {precedent.casesCited.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.court} • {c.date}</p>
                      </div>
                      <Badge color={c.relationship === 'Followed' ? 'green' : c.relationship === 'Overruled' ? 'red' : 'orange'} size="xs">{c.relationship}</Badge>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-400">No cases cited.</p>}
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Cited By ({precedent.citedByCases.length} cases)</h3>
              {precedent.citedByCases.length > 0 ? (
                <div className="space-y-2">
                  {precedent.citedByCases.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.court} • {c.date}</p>
                      </div>
                      <Badge color="blue" size="xs">{c.relationship}</Badge>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-400">Not cited by other cases.</p>}
            </Card>
          </div>
        )}

        {activeTab === 'related_cases' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {precedent.casesCited.concat(precedent.citedByCases).map((c, i) => (
              <Card key={i} hover className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge color="blue" size="xs">{c.court}</Badge>
                  <Badge color="gray" size="xs">{c.date}</Badge>
                </div>
                <h4 className="font-medium text-slate-900 text-sm">{c.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{c.relationship}</p>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-blue-600" />
                <h3 className="font-semibold text-slate-900">AI-Generated Analysis</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Significance</p>
                  <p className="text-sm text-slate-600 mt-1">{precedent.analysis.significance}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Impact on Legal Landscape</p>
                  <p className="text-sm text-slate-600 mt-1">{precedent.analysis.impact}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Practical Implications</p>
                  <p className="text-sm text-slate-600 mt-1">{precedent.analysis.implications}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">How to Use in Legal Arguments</p>
                  <p className="text-sm text-slate-600 mt-1">{precedent.analysis.usage}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Citation Graph</h3>
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-lg">
                    <Gavel size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">{precedent.caseTitle}</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {precedent.casesCited.slice(0, 3).map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-4 h-px bg-slate-300" />
                        <div className="px-3 py-1.5 bg-slate-100 rounded text-xs text-slate-700">{c.name}</div>
                      </div>
                    ))}
                    {precedent.citedByCases.slice(0, 3).map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-4 h-px bg-slate-300" />
                        <div className="px-3 py-1.5 bg-slate-100 rounded text-xs text-slate-700">{c.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
