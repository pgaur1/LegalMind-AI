import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Pencil, RefreshCw, Check, Download, MessageSquare, Search,
  BookOpen, Plus, Clock, FileText, Send, X, History, ChevronDown, ChevronRight,
  ThumbsUp, ThumbsDown, RotateCcw, List,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { Button, Card, Badge, StatusBadge, Avatar, Modal, formatDate, timeAgo } from '../components/ui'
import { users } from '../data/mockData'
import toast from 'react-hot-toast'

function DiscussionPanel({ draft, open, onClose }) {
  const { addDiscussionMessage, user } = useAppStore()
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (!message.trim()) return
    addDiscussionMessage(draft.id, { user, message: message.trim(), type: 'user' })
    setMessage('')
    toast.success('Message sent')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-slide-in-right">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Discussion Thread ({draft.discussion.length} messages)</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {draft.discussion.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No messages yet. Start the discussion.</p>
          ) : (
            draft.discussion.map(msg => (
              <div key={msg.id} className="flex gap-3">
                <Avatar user={msg.user} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{msg.user.name}</span>
                    <Badge color={msg.user.role === 'Reviewer' ? 'purple' : 'blue'} size="xs">{msg.user.role}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">{timeAgo(msg.timestamp)}</p>
                  <p className="text-sm text-slate-700 mt-1 bg-slate-50 rounded-lg p-3">{msg.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
        {draft.status === 'review' && (
          <div className="px-4 py-2 border-t border-slate-100 flex gap-2">
            <Button variant="warning" size="sm" onClick={() => toast.success('Changes requested')}><RotateCcw size={14} /> Request Changes</Button>
            <Button variant="success" size="sm" onClick={() => toast.success('Draft approved')}><ThumbsUp size={14} /> Approve</Button>
            <Button variant="danger" size="sm" onClick={() => toast.success('Draft rejected')}><ThumbsDown size={14} /> Reject</Button>
          </div>
        )}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-end gap-2">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Your message..."
              rows={2}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button variant="primary" size="sm" onClick={handleSend} className="h-10"><Send size={16} /></Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SubmitReviewModal({ open, onClose, onSubmit }) {
  const [reviewer, setReviewer] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [note, setNote] = useState('')

  return (
    <Modal open={open} onClose={onClose} title="Assign Reviewer">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Reviewer <span className="text-red-500">*</span></label>
          <select value={reviewer} onChange={e => setReviewer(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select a reviewer</option>
            {users.filter(u => u.role === 'Reviewer' || u.role === 'Legal Counsel').map(u => (
              <option key={u.id} value={u.id}>{u.name} - {u.role}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
          <div className="flex gap-3">
            {['high', 'medium', 'low'].map(p => (
              <label key={p} className="flex items-center gap-1.5">
                <input type="radio" name="priority" checked={priority === p} onChange={() => setPriority(p)} />
                <span className="text-sm capitalize text-slate-700">{p}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Add Note (optional)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Please review urgently - client deadline is next week." rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSubmit({ reviewer, priority, dueDate, note })} disabled={!reviewer}>Submit for Review</Button>
        </div>
      </div>
    </Modal>
  )
}

function ReResearchModal({ open, onClose, draft }) {
  const [feedback, setFeedback] = useState('')
  const [showPlanner, setShowPlanner] = useState(false)

  return (
    <Modal open={open} onClose={onClose} title="Re-research & Redraft" maxWidth="max-w-xl">
      {!showPlanner ? (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500">Current Draft: <span className="font-medium text-slate-700">{draft.title}</span></p>
            <p className="text-xs text-slate-500">Last Research: {draft.sources.length} sources, 30 minutes ago</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">What would you like to add or change?</label>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Example: Add more recent Supreme Court precedents on interest calculation for RERA delayed possession cases" rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-800 mb-2">🧠 AI Planner will analyze if:</p>
            <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
              <li>New research is needed</li>
              <li>Existing sources are sufficient</li>
              <li>Only formatting changes required</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Research Options</p>
            <div className="space-y-1.5">
              {['Search internal database', 'Query legal graph', 'Scrape latest web sources', 'Find court orders (last 6 months)'].map(opt => (
                <label key={opt} className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                  <span className="text-sm text-slate-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="secondary" onClick={() => setShowPlanner(true)}>Let AI Decide</Button>
            <Button variant="primary" onClick={() => { setShowPlanner(true) }}>Start Re-research</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🧠</span>
            </div>
            <h3 className="font-semibold text-slate-900">Planner Agent Decision</h3>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-slate-700"><strong>Query Type:</strong> Follow-up</p>
            <p className="text-sm text-slate-700"><strong>Action:</strong> Focused research needed</p>
            <p className="text-sm text-slate-700"><strong>Reason:</strong> Request for specific new precedents</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800 mb-2">Plan Preview:</p>
            <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
              <li>Research Agent → Find SC orders (2023-2024)</li>
              <li>Draft Agent → Integrate new precedents</li>
              <li>Preserve existing content structure</li>
            </ul>
            <p className="text-xs text-blue-600 mt-2">Estimated time: 20 seconds</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={() => { toast.success('Re-research started'); onClose() }}>Execute Plan</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default function DraftWorkspace() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getDraft, updateDraft, user } = useAppStore()
  const draft = getDraft(id)

  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [showSubmit, setShowSubmit] = useState(false)
  const [showReresearch, setShowReresearch] = useState(false)
  const [showDiscussion, setShowDiscussion] = useState(false)
  const [showSources, setShowSources] = useState(false)
  const [sourceModal, setSourceModal] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (!draft) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">Draft not found.</p>
        <Link to="/drafts" className="text-blue-600 mt-2 inline-block">Back to Drafts</Link>
      </div>
    )
  }

  const handleSubmitReview = ({ reviewer: reviewerId }) => {
    const reviewer = users.find(u => u.id === reviewerId)
    updateDraft(draft.id, { status: 'review', reviewer })
    setShowSubmit(false)
    toast.success(`Draft submitted to ${reviewer?.name}`)
  }

  const handleSaveEdit = () => {
    updateDraft(draft.id, { content: editContent })
    setEditing(false)
    toast.success('Changes saved')
  }

  const handleDownload = (format) => {
    toast.success(`Draft downloaded as ${format}`)
  }

  const isReviewer = draft.reviewer?.id === user.id

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-72 lg:w-80 border-r border-slate-200 bg-white overflow-y-auto flex-shrink-0 hidden lg:block">
          <div className="p-4 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900 text-sm">Draft Info</h3>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X size={16} /></button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">ID:</span><span className="font-mono text-slate-700">{draft.id}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500">Status:</span><StatusBadge status={draft.status} /></div>
                <div className="flex justify-between"><span className="text-slate-500">Version:</span><span className="text-slate-700">v{draft.version}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Created:</span><span className="text-slate-700">{formatDate(draft.createdAt)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Words:</span><span className="text-slate-700">{draft.wordCount}</span></div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 text-sm mb-2">AI Assistance</h3>
              <div className="space-y-1.5">
                <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => toast.success('AI chat opened')}><MessageSquare size={14} /> Ask AI</Button>
                <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/precedents')}><Search size={14} /> Find Similar Cases</Button>
                <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => toast.success('Section added')}><BookOpen size={14} /> Add Section</Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 text-sm mb-2">Research Used</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-slate-700 mb-1">🧠 Planner Decision</p>
                  <p className="text-xs text-slate-500">Fresh query - Full research</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-slate-700 mb-1">🔍 Sources Used ({draft.sources.length})</p>
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p>RERA Act (3)</p>
                    <p>Web sources (2)</p>
                    <p>Database (7)</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-slate-700 mb-1">⚖️ Precedents (7)</p>
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p>SC Orders (2)</p>
                    <p>HC Orders (3)</p>
                    <p>RERA Authority (2)</p>
                  </div>
                </div>
                <button onClick={() => setShowSources(true)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View All Sources</button>
              </div>
            </div>

            {draft.status === 'review' && (
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-2">Discussion</h3>
                <Button variant="secondary" size="sm" className="w-full" onClick={() => setShowDiscussion(true)}>
                  <MessageSquare size={14} /> {draft.discussion.length} messages
                </Button>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-slate-900 text-sm mb-2">Changes Log</h3>
              <div className="space-y-2">
                {draft.changes.map(change => (
                  <div key={change.id} className="flex gap-2 text-xs">
                    <div className="w-2 h-2 bg-slate-300 rounded-full mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-700">{change.action}</p>
                      <p className="text-slate-400">{timeAgo(change.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 lg:px-6 py-3 z-10">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <Link to="/drafts" className="p-1.5 hover:bg-slate-100 rounded-lg"><ArrowLeft size={18} className="text-slate-500" /></Link>
              <div>
                <h1 className="font-semibold text-slate-900">{draft.title}</h1>
                <p className="text-xs text-slate-500">{draft.caseName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {draft.status === 'draft' && (
                <>
                  <Button variant="secondary" size="sm" onClick={() => { setEditContent(draft.content); setEditing(!editing) }}>
                    <Pencil size={14} /> {editing ? 'Cancel Edit' : 'Edit Draft'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setShowReresearch(true)}>
                    <RefreshCw size={14} /> Re-research
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setShowSubmit(true)}>
                    <Check size={14} /> Submit for Review
                  </Button>
                </>
              )}
              {draft.status === 'review' && (
                <Button variant="secondary" size="sm" onClick={() => setShowDiscussion(true)}>
                  <MessageSquare size={14} /> Open Discussion
                </Button>
              )}
              {draft.status === 'approved' && (
                <Button variant="success" size="sm" onClick={() => toast.success('Tracking entry created')}><Check size={14} /> Create Tracking Entry</Button>
              )}
              <div className="relative group">
                <Button variant="secondary" size="sm"><Download size={14} /> Download</Button>
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                  <button onClick={() => handleDownload('PDF')} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-t-lg">Download as PDF</button>
                  <button onClick={() => handleDownload('DOCX')} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">Download as DOCX</button>
                  <button onClick={() => handleDownload('Sources')} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-b-lg">Download with Sources</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-6 max-w-4xl mx-auto">
          {editing ? (
            <div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
                <div className="flex gap-2 mb-3 pb-3 border-b border-slate-100">
                  <Button variant="ghost" size="sm" className="font-bold">B</Button>
                  <Button variant="ghost" size="sm" className="italic">I</Button>
                  <Button variant="ghost" size="sm"><List size={14} /></Button>
                  <span className="ml-auto text-xs text-green-600 flex items-center gap-1"><Check size={12} /> Auto-saved</span>
                </div>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={30}
                  className="w-full p-4 border border-slate-200 rounded-lg text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleSaveEdit}><Check size={16} /> Save Changes</Button>
              </div>
            </div>
          ) : (
            <Card className="p-6 lg:p-10">
              <div className="prose-content whitespace-pre-wrap text-sm text-slate-800 leading-relaxed">
                {draft.content}
              </div>
            </Card>
          )}

          {/* Reviewer actions */}
          {isReviewer && draft.status === 'review' && (
            <div className="mt-4 flex items-center gap-2 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <span className="text-sm font-medium text-purple-800">Reviewer Actions:</span>
              <Button variant="success" size="sm" onClick={() => { updateDraft(draft.id, { status: 'approved' }); toast.success('Draft approved & finalized') }}><ThumbsUp size={14} /> Approve & Finalize</Button>
              <Button variant="warning" size="sm" onClick={() => { updateDraft(draft.id, { status: 'draft' }); toast.success('Changes requested') }}><RotateCcw size={14} /> Request Changes</Button>
              <Button variant="danger" size="sm" onClick={() => { updateDraft(draft.id, { status: 'rejected' }); toast.success('Draft rejected') }}><ThumbsDown size={14} /> Reject Draft</Button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SubmitReviewModal open={showSubmit} onClose={() => setShowSubmit(false)} onSubmit={handleSubmitReview} />
      <ReResearchModal open={showReresearch} onClose={() => setShowReresearch(false)} draft={draft} />
      <DiscussionPanel draft={draft} open={showDiscussion} onClose={() => setShowDiscussion(false)} />

      <Modal open={showSources} onClose={() => setShowSources(false)} title="All Sources" maxWidth="max-w-2xl">
        <div className="space-y-3">
          {draft.sources.map(src => (
            <div key={src.id} className="p-3 border border-slate-200 rounded-lg hover:border-blue-300 cursor-pointer" onClick={() => { setSourceModal(src); setShowSources(false) }}>
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
      </Modal>

      <Modal open={!!sourceModal} onClose={() => setSourceModal(null)} title="Source Detail" maxWidth="max-w-xl">
        {sourceModal && (
          <div className="space-y-4">
            <div>
              <Badge color="blue">{sourceModal.type}</Badge>
              <h3 className="text-lg font-semibold mt-2">{sourceModal.title}</h3>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 leading-relaxed">{sourceModal.excerpt}</p>
            </div>
            <Badge color="green">{sourceModal.match}% match</Badge>
            <div className="flex gap-2 pt-2">
              <Button variant="primary" size="sm"><FileText size={14} /> View Full Document</Button>
              <Button variant="secondary" size="sm">Add to Draft</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
