import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Check, Plus, X, Upload, FileText } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { Button, Card } from '../components/ui'
import { courtOptions, orderTypeOptions, users } from '../data/mockData'
import toast from 'react-hot-toast'

const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
      {children}
    </div>
  )
}

function Step1({ data, update, onNext, onCancel }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Order Information</h2>
        <p className="text-sm text-slate-500 mt-1">Enter the basic details of the court order</p>
      </div>

      <Card className="p-5">
        <h3 className="font-medium text-slate-800 mb-3">Order Entry Method</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: 'manual', label: 'Manual Entry', desc: 'Type details yourself' },
            { value: 'import', label: 'Import from Document', desc: 'Upload PDF/Image' },
            { value: 'link_draft', label: 'Link to Approved Draft', desc: 'From existing drafts' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => update({ entryMethod: opt.value })}
              className={`p-3 text-left border-2 rounded-xl transition-all ${data.entryMethod === opt.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <p className="font-medium text-sm text-slate-900">{opt.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
        {data.entryMethod === 'import' && (
          <div className="mt-3 p-6 border-2 border-dashed border-slate-300 rounded-xl text-center">
            <Upload size={24} className="text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Drag & drop or <button className="text-blue-600">browse files</button> to import order</p>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="font-medium text-slate-800 mb-3">Basic Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Case Title" required><input className={inputClass} value={data.caseTitle || ''} onChange={e => update({ caseTitle: e.target.value })} /></Field>
          <Field label="Case Number"><input className={inputClass} value={data.caseNumber || ''} onChange={e => update({ caseNumber: e.target.value })} /></Field>
          <Field label="Court/Authority" required>
            <select className={inputClass} value={data.court || ''} onChange={e => update({ court: e.target.value })}>
              <option value="">Select court</option>
              {courtOptions.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Order Date" required><input type="date" className={inputClass} value={data.orderDate || ''} onChange={e => update({ orderDate: e.target.value })} /></Field>
          <Field label="Order Type" required>
            <select className={inputClass} value={data.orderType || ''} onChange={e => update({ orderType: e.target.value })}>
              <option value="">Select type</option>
              {orderTypeOptions.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Priority" required>
            <div className="flex gap-3 pt-1">
              {[
                { val: 'high', label: 'High', color: 'text-red-600' },
                { val: 'medium', label: 'Medium', color: 'text-orange-600' },
                { val: 'low', label: 'Low', color: 'text-slate-600' },
              ].map(p => (
                <label key={p.val} className="flex items-center gap-1.5">
                  <input type="radio" name="priority" checked={data.priority === p.val} onChange={() => update({ priority: p.val })} />
                  <span className={`text-sm ${p.color}`}>{p.label}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-medium text-slate-800 mb-3">Order Summary</h3>
        <div className="space-y-4">
          <Field label="Brief Summary" required>
            <textarea className={inputClass} rows={3} minLength={50} value={data.summary || ''} onChange={e => update({ summary: e.target.value })} placeholder="Describe the order and its key points..." />
          </Field>
          <Field label="Key Directions/Outcomes">
            <textarea className={inputClass} rows={3} value={data.keyDirections || ''} onChange={e => update({ keyDirections: e.target.value })} placeholder="List the main directions or outcomes (one per line)" />
          </Field>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={onNext} disabled={!data.caseTitle || !data.court || !data.orderDate}>Next: Actions & Dates <ArrowRight size={16} /></Button>
      </div>
    </div>
  )
}

function Step2({ data, update, onBack, onNext }) {
  const [actions, setActions] = useState(data.actions || [{ action: '', deadline: '', assignedTo: '', status: 'pending', progress: 0 }])

  const updateAction = (idx, field, value) => {
    const updated = [...actions]
    updated[idx] = { ...updated[idx], [field]: value }
    setActions(updated)
    update({ actions: updated })
  }

  const addAction = () => { setActions([...actions, { action: '', deadline: '', assignedTo: '', status: 'pending', progress: 0 }]) }
  const removeAction = (idx) => { if (actions.length > 1) setActions(actions.filter((_, i) => i !== idx)) }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Actions & Deadlines</h2>
        <p className="text-sm text-slate-500 mt-1">Define action items and important dates</p>
      </div>

      <div className="space-y-4">
        {actions.map((action, idx) => (
          <Card key={idx} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-slate-800">Action {idx + 1}</h3>
              {actions.length > 1 && <button onClick={() => removeAction(idx)} className="text-red-500 text-sm hover:text-red-600">🗑️ Remove</button>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Action Required" required><input className={inputClass} value={action.action} onChange={e => updateAction(idx, 'action', e.target.value)} /></Field>
              <Field label="Deadline" required><input type="date" className={inputClass} value={action.deadline} onChange={e => updateAction(idx, 'deadline', e.target.value)} /></Field>
              <Field label="Assigned To" required>
                <select className={inputClass} value={action.assignedTo} onChange={e => updateAction(idx, 'assignedTo', e.target.value)}>
                  <option value="">Select person</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} - {u.role}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className={inputClass} value={action.status} onChange={e => updateAction(idx, 'status', e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </Field>
            </div>
          </Card>
        ))}
        <Button variant="secondary" onClick={addAction}><Plus size={16} /> Add Another Action</Button>
      </div>

      <Card className="p-5">
        <h3 className="font-medium text-slate-800 mb-3">Important Dates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Next Hearing Date"><input type="date" className={inputClass} value={data.nextHearing || ''} onChange={e => update({ nextHearing: e.target.value })} /></Field>
          <Field label="Hearing Venue"><input className={inputClass} value={data.hearingVenue || ''} onChange={e => update({ hearingVenue: e.target.value })} /></Field>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onBack}><ArrowLeft size={16} /> Back</Button>
        <Button variant="primary" onClick={onNext}>Next: Attachments & Review <ArrowRight size={16} /></Button>
      </div>
    </div>
  )
}

function Step3({ data, onBack, onCreate }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Attachments & Review</h2>
        <p className="text-sm text-slate-500 mt-1">Attach documents and review before creating</p>
      </div>

      <Card className="p-5">
        <h3 className="font-medium text-slate-800 mb-3">Attach Documents</h3>
        <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl text-center">
          <Upload size={24} className="text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Drag & drop or <button className="text-blue-600">browse files</button></p>
          <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, JPG, PNG (Max 10 MB each)</p>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-medium text-slate-800 mb-3">Review Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Case Title:</span><span className="text-slate-800 font-medium">{data.caseTitle}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Court:</span><span className="text-slate-800">{data.court}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Order Date:</span><span className="text-slate-800">{data.orderDate}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Priority:</span><span className="text-slate-800 capitalize">{data.priority}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Total Actions:</span><span className="text-slate-800">{data.actions?.length || 0}</span></div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onBack}><ArrowLeft size={16} /> Back</Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => toast.success('Saved as draft')}>Save as Draft</Button>
          <Button variant="primary" onClick={onCreate}>Create Order & Track <ArrowRight size={16} /></Button>
        </div>
      </div>
    </div>
  )
}

export default function OrderNew() {
  const navigate = useNavigate()
  const { addOrder } = useAppStore()
  const [step, setStep] = useState(1)
  const [data, setData] = useState({ entryMethod: 'manual', priority: 'medium', actions: [{ action: '', deadline: '', assignedTo: '', status: 'pending', progress: 0 }] })

  const update = (updates) => setData({ ...data, ...updates })

  const handleCreate = () => {
    const newOrder = addOrder({
      caseTitle: data.caseTitle,
      caseNumber: data.caseNumber || '',
      court: data.court,
      orderDate: data.orderDate,
      orderType: data.orderType || 'Compliance Order',
      priority: data.priority,
      summary: data.summary || '',
      keyDirections: data.keyDirections || '',
      nextAction: data.actions[0]?.action || 'Review order',
      nextDeadline: data.actions[0]?.deadline || data.orderDate,
      actions: data.actions.filter(a => a.action).map((a, i) => ({
        id: `act-new-${i}`,
        action: a.action,
        deadline: a.deadline,
        assignedTo: users.find(u => u.id === a.assignedTo) || users[0],
        status: a.status,
        progress: a.progress,
      })),
      attachments: [],
    })
    toast.success(`Order ${newOrder.id} created successfully`)
    navigate(`/tracker/order/${newOrder.id}`)
  }

  return (
    <div className="p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center gap-4">
          {['Order Info', 'Actions & Dates', 'Review'].map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                {step > i + 1 ? <Check size={16} /> : i + 1}
              </div>
              <span className={`text-sm ${step >= i + 1 ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>{label}</span>
              {i < 2 && <div className={`flex-1 h-0.5 ${step > i + 1 ? 'bg-green-500' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
      </div>
      {step === 1 && <Step1 data={data} update={update} onNext={() => setStep(2)} onCancel={() => navigate('/tracker')} />}
      {step === 2 && <Step2 data={data} update={update} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
      {step === 3 && <Step3 data={data} onBack={() => setStep(2)} onCreate={handleCreate} />}
    </div>
  )
}
