import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Send, Bot, User as UserIcon, Sparkles, FileText, BookOpen,
  Share2, Bookmark, X, FileBadge, ArrowRight,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { Button, Modal, Badge, timeAgo } from '../components/ui'
import { researchSuggestions, researchTopics } from '../data/mockData'
import toast from 'react-hot-toast'

function SourceModal({ source, open, onClose }) {
  if (!source) return null
  return (
    <Modal open={open} onClose={onClose} title="Source Detail" maxWidth="max-w-xl">
      <div className="space-y-4">
        <div>
          <Badge color="blue">{source.type}</Badge>
          <h3 className="text-lg font-semibold mt-2">{source.title}</h3>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm text-slate-600 leading-relaxed">{source.excerpt}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="green">{source.match}% match</Badge>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="primary" size="sm"><FileText size={14} /> View Full Document</Button>
          <Button variant="secondary" size="sm"><FileBadge size={14} /> Add to Draft</Button>
        </div>
      </div>
    </Modal>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
      <Bot size={18} className="text-blue-600" />
      <span>AI is researching</span>
      <span className="flex gap-1">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 bg-blue-500 rounded-full typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </span>
    </div>
  )
}

function generateResponse(query) {
  const q = query.toLowerCase()
  let response = ''
  let sources = []

  if (q.includes('rera') || q.includes('possession') || q.includes('builder')) {
    response = `Based on my research across multiple sources, here's what I found regarding **RERA penalties for delayed possession**:

Under **Section 18 of the RERA Act 2016**, a builder is liable to pay interest to the allottee for every month of delay in possession. The key provisions are:

1. **Interest Rate**: The interest is calculated at MCLR + 2% per annum on the total amount paid by the allottee.
2. **Force Majeure**: The builder cannot claim force majeure for routine construction delays. Force majeure applies only to unforeseen events like natural disasters.
3. **Compensation**: In addition to interest, the allottee can seek separate compensation for mental agony under the Consumer Protection Act 2019.
4. **Possession Definition**: The Supreme Court has clarified that "possession" means actual physical possession, not merely an offer of possession.

The Supreme Court in **Kumar vs ABC Builders Ltd. (2023)** established that builders must pay interest at MCLR+2% for the entire period of delay, calculated from the original due date, not the date of the legal notice.`
    sources = [
      { id: 'rs1', title: 'RERA Act 2016 - Section 18', type: 'Act', match: 95, excerpt: 'Section 18 provides that in case of delay in possession, the allottee shall be entitled to claim interest for every month of delay until possession is handed over...' },
      { id: 'rs2', title: 'Maharashtra RERA Rules 2017 - Rule 15', type: 'Rule', match: 90, excerpt: 'The rate of interest payable by the promoter shall be the highest MCLR plus 2% per annum...' },
      { id: 'rs3', title: 'Kumar vs ABC Builders (SC 2023)', type: 'Court Order', match: 92, excerpt: 'The Supreme Court held that interest must be paid at MCLR+2% per annum for delayed possession. Force majeure not applicable for routine delays.' },
      { id: 'rs4', title: 'Pioneer Urban Land vs Govindan (SC 2019)', type: 'Court Order', match: 85, excerpt: 'SC clarified that possession means actual physical possession, not mere allotment or offer.' },
    ]
  } else if (q.includes('insurance') || q.includes('irdai') || q.includes('claim')) {
    response = `Here's what I found regarding **insurance claim rejection and IRDAI regulations**:

Under the **IRDAI (Protection of Policyholders' Interests) Regulations 2017**, insurers must:

1. **Process claims within 30 days** of receiving all required documents.
2. **Provide detailed reasoning** for claim rejection - vague references to policy terms are insufficient.
3. **Cannot reject claims** on grounds of non-disclosure if the condition was disclosed at the time of policy purchase.
4. **Waiting periods**: Once the waiting period (typically 2-4 years) is completed, the insurer cannot reject claims for pre-existing conditions.

If your claim has been wrongfully rejected, you can:
- File a complaint with the **Insurance Ombudsman** (for claims up to ₹30 lakhs)
- Approach the **Consumer Forum** under the Consumer Protection Act 2019
- File a writ petition in the High Court for violation of regulatory norms`
    sources = [
      { id: 'rs5', title: 'IRDAI Act 1999 - Section 14', type: 'Act', match: 88, excerpt: 'Powers and functions of the Authority include protection of policyholders interests...' },
      { id: 'rs6', title: 'IRDAI Protection of Policyholders Regulations 2017', type: 'Regulation', match: 91, excerpt: 'The insurer shall process claims within 30 days of receipt of all documents and provide detailed reasoning for rejection.' },
    ]
  } else if (q.includes('data') || q.includes('privacy') || q.includes('dpdp')) {
    response = `Regarding **data privacy under the DPDP Act 2023**, here are the key findings:

The **Digital Personal Data Protection (DPDP) Act 2023** establishes:

1. **Breach Notification**: Companies must report data breaches to the Data Protection Board within **72 hours** of discovery.
2. **Penalties**: Non-compliance can attract penalties up to **₹250 crore** depending on the severity.
3. **Data Principal Rights**: Individuals have the right to access, correct, and erase their personal data.
4. **Consent**: Processing of personal data requires free, specific, and informed consent.
5. **Data Fiduciary Obligations**: Organizations must implement reasonable security safeguards.

The Delhi High Court in **Data Protection Board vs TechCorp Ltd. (2024)** upheld the 72-hour breach notification requirement and confirmed that non-compliance attracts penalties under Section 8 of the Act.`
    sources = [
      { id: 'rs7', title: 'DPDP Act 2023 - Section 8', type: 'Act', match: 93, excerpt: 'Every Data Fiduciary shall report any personal data breach to the Data Protection Board within 72 hours...' },
      { id: 'rs8', title: 'Data Protection Board vs TechCorp Ltd. (Delhi HC 2024)', type: 'Court Order', match: 89, excerpt: 'Delhi HC upheld DPDP Act penalties. 72-hour breach notification is mandatory.' },
    ]
  } else {
    response = `I've researched your query across our internal knowledge base, legal graph database, and live web sources. Here's a summary of my findings:

Based on the relevant legal provisions and precedents in our database, I can provide guidance on this matter. The key considerations include:

1. **Statutory Framework**: The applicable laws and regulations that govern this area.
2. **Judicial Precedents**: Recent court decisions that interpret and apply these provisions.
3. **Compliance Requirements**: The specific obligations and timelines that need to be met.

Would you like me to elaborate on any specific aspect, or shall I help you draft a legal document based on this research?`
    sources = [
      { id: 'rs9', title: 'Companies Act 2013 - Relevant Section', type: 'Act', match: 82, excerpt: 'General provisions relating to compliance and regulatory requirements...' },
      { id: 'rs10', title: 'Recent Regulatory Circular', type: 'Circular', match: 78, excerpt: 'Updated compliance requirements and timelines...' },
    ]
  }

  return { response, sources, searchInfo: `Vector (${Math.floor(sources.length * 0.7)} docs) | Graph (${Math.floor(sources.length * 0.3)} relationships) | Web (1 new)` }
}

export default function Research() {
  const navigate = useNavigate()
  const { chatMessages, isResearching, addChatMessage, setResearching, clearChat, saveResearch, user } = useAppStore()
  const [input, setInput] = useState('')
  const [sourceModal, setSourceModal] = useState(null)
  const [allSourcesModal, setAllSourcesModal] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [chatMessages, isResearching])

  const handleSend = (text) => {
    const query = text || input.trim()
    if (!query || isResearching) return

    addChatMessage({ role: 'user', text: query, timestamp: new Date().toISOString() })
    setInput('')
    setResearching(true)

    setTimeout(() => {
      const result = generateResponse(query)
      addChatMessage({
        role: 'assistant',
        text: result.response,
        timestamp: new Date().toISOString(),
        sources: result.sources,
        searchInfo: result.searchInfo,
        query,
      })
      setResearching(false)
    }, 2500)
  }

  const handleGenerateNotice = (msg) => {
    navigate('/draft/new', { state: { topic: msg.query, autoSelect: 'rera_notice' } })
  }

  const handleSaveResearch = (msg) => {
    saveResearch({ query: msg.query, response: msg.text })
    toast.success('Research saved successfully')
  }

  const handleShare = (msg) => {
    navigator.clipboard?.writeText(msg.text)
    toast.success('Response copied to clipboard')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-blue-600" />
          <h1 className="font-semibold text-slate-900">Research Co-Pilot</h1>
        </div>
        {chatMessages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => { clearChat(); toast.success('Chat cleared') }}>
            Clear Chat
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-6">
        {chatMessages.length === 0 && !isResearching ? (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles size={36} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome to LegalMind AI Research</h2>
            <p className="text-slate-500 mt-2 max-w-lg mx-auto">
              Your AI-powered legal research assistant. Ask about laws, precedents, court orders, and legal compliance across multiple sources.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 mb-8">
              {researchTopics.map(topic => (
                <div key={topic} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600 text-left">
                  <BookOpen size={14} className="text-blue-500 flex-shrink-0" />
                  {topic}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {researchSuggestions.map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-slate-200' : 'bg-blue-600'
                }`}>
                  {msg.role === 'user' ? <UserIcon size={18} className="text-slate-600" /> : <Bot size={18} className="text-white" />}
                </div>
                <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-700">{msg.role === 'user' ? 'You' : 'Assistant'}</span>
                    <span className="text-xs text-slate-400">{timeAgo(msg.timestamp)}</span>
                  </div>
                  {msg.role === 'user' ? (
                    <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4">
                      <div className="prose-content text-sm text-slate-700" dangerouslySetInnerHTML={{
                        __html: msg.text
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br/>')
                      }} />
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-sm font-semibold text-slate-700 mb-2">📎 Sources ({msg.sources.length})</p>
                          <div className="space-y-2">
                            {msg.sources.map(src => (
                              <div
                                key={src.id}
                                onClick={() => setSourceModal(src)}
                                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText size={14} className="text-blue-500 flex-shrink-0" />
                                  <span className="text-sm text-slate-700 truncate">{src.title}</span>
                                </div>
                                <Badge color="green" size="xs">{src.match}% match</Badge>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-slate-400 mt-2">🔍 Search: {msg.searchInfo}</p>
                        </div>
                      )}
                      {msg.role === 'assistant' && msg.sources && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
                          <Button variant="primary" size="sm" onClick={() => handleGenerateNotice(msg)}>
                            <FileText size={14} /> Generate Legal Notice
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => setAllSourcesModal(msg)}>
                            View All Sources
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => handleSaveResearch(msg)}>
                            <Bookmark size={14} /> Save Research
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => handleShare(msg)}>
                            <Share2 size={14} /> Share
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isResearching && (
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot size={18} className="text-white" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4">
                  <TypingIndicator />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-slate-200 bg-white p-4">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
              }}
              placeholder="Ask about laws, precedents, court orders..."
              rows={1}
              disabled={isResearching}
              className="w-full px-4 py-3 pr-10 border border-slate-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <Search size={16} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
          </div>
          <Button
            variant="primary"
            onClick={() => handleSend()}
            disabled={!input.trim() || isResearching}
            className="h-12 w-12 p-0"
          >
            <Send size={18} />
          </Button>
        </div>
        <p className="text-xs text-slate-400 text-center mt-2">Press Enter to send, Shift+Enter for new line</p>
      </div>

      {/* Source Modal */}
      <SourceModal source={sourceModal} open={!!sourceModal} onClose={() => setSourceModal(null)} />

      {/* All Sources Modal */}
      <Modal open={!!allSourcesModal} onClose={() => setAllSourcesModal(null)} title="All Sources" maxWidth="max-w-2xl">
        {allSourcesModal && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Found {allSourcesModal.sources.length} sources for query: "{allSourcesModal.query}"</p>
            {allSourcesModal.sources.map(src => (
              <div key={src.id} className="p-3 border border-slate-200 rounded-lg hover:border-blue-300 cursor-pointer" onClick={() => { setSourceModal(src); setAllSourcesModal(null) }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-500" />
                    <span className="text-sm font-medium text-slate-800">{src.title}</span>
                  </div>
                  <Badge color="green" size="xs">{src.match}% match</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">{src.excerpt}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
