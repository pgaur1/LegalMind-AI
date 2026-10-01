import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowRight, ArrowLeft, Check, Search, Sparkles, FileText,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { Button, Card } from '../components/ui'
import { draftTypes } from '../data/mockData'
import toast from 'react-hot-toast'

const generationStages = [
  { label: 'Planner Agent: Analyzed your request', duration: 600 },
  { label: 'Decision: Fresh query - Full research needed', duration: 400 },
  { label: 'Plan: Research → Draft generation', duration: 400 },
  { label: 'Research Agent: Searching internal knowledge base → Found: RERA Act (3 sections)', duration: 800 },
  { label: 'Querying legal graph database → Found: Related precedents (5)', duration: 700 },
  { label: 'Scraping latest web sources → Found: 2 recent orders (2024)', duration: 800 },
  { label: 'Fetching court precedents → Found: Kumar vs Builder (SC 2023)', duration: 600 },
  { label: 'Draft Agent: Generating draft with citations...', duration: 1000 },
]

function Step1({ data, update, onNext, onCancel }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Draft Type & Background</h2>
        <p className="text-sm text-slate-500 mt-1">Select a draft type and describe your legal situation</p>
      </div>

      <Card className="p-5">
        <h3 className="font-medium text-slate-800 mb-3">Draft Type</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {draftTypes.map(type => (
            <button
              key={type.value}
              onClick={() => update({ type: type.value, typeName: type.label })}
              className={`p-4 text-left border-2 rounded-xl transition-all ${
                data.type === type.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <FileText size={18} className={data.type === type.value ? 'text-blue-600' : 'text-slate-400'} />
                {data.type === type.value && <Check size={16} className="text-blue-600" />}
              </div>
              <p className="font-medium text-sm text-slate-900 mt-2">{type.label}</p>
              <p className="text-xs text-slate-500 mt-1">{type.description}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-medium text-slate-800 mb-2">Describe your legal situation <span className="text-red-500">*</span></h3>
        <p className="text-xs text-slate-500 mb-3">This helps our AI research the most relevant laws and precedents for your case.</p>
        <textarea
          value={data.background}
          onChange={e => update({ background: e.target.value })}
          placeholder="Example: I purchased a flat from ABC Builders in 2021. The agreement promised possession by December 2023, but it's now September 2024 and the project is only 60% complete. Builder is not responding. I need to send a legal notice demanding possession with interest as per RERA provisions."
          rows={5}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex items-center justify-between mt-2">
          <p className={`text-xs ${data.background.length < 50 ? 'text-orange-500' : 'text-slate-400'}`}>
            {data.background.length} characters (minimum 50, recommended 100-300)
          </p>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs font-medium text-blue-800 mb-1.5">Tips for better results:</p>
          <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
            <li>Mention specific laws (RERA, IRDAI, etc.)</li>
            <li>Include timeframes and amounts</li>
            <li>Describe relief you're seeking</li>
          </ul>
        </div>
      </Card>

      {data.background.length >= 20 && (
        <Card className="p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <Search size={16} className="text-blue-600" />
            <h3 className="font-medium text-slate-800">What will be researched?</h3>
          </div>
          <ul className="text-sm text-slate-600 space-y-1.5 ml-4 list-disc">
            <li>RERA Act 2016 - Delayed possession provisions</li>
            <li>Interest calculation rules</li>
            <li>Recent Supreme Court & High Court orders</li>
            <li>RERA authority precedents</li>
          </ul>
          <p className="text-xs text-slate-500 mt-3">Sources: Internal Database + Legal Graph + Live Web</p>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!data.type || data.background.length < 50}
        >
          Next: Fill Details <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}

function Field({ label, required, children, helper }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {helper && <p className="text-xs text-slate-400 mt-1">{helper}</p>}
    </div>
  )
}

const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

function Step2RERA({ data, update }) {
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h3 className="font-medium text-slate-800 mb-3">Your Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" required><input className={inputClass} value={data.fullName || ''} onChange={e => update({ fullName: e.target.value })} /></Field>
          <Field label="Email" required><input type="email" className={inputClass} value={data.email || ''} onChange={e => update({ email: e.target.value })} /></Field>
          <Field label="Phone Number" required><input type="tel" className={inputClass} value={data.phone || ''} onChange={e => update({ phone: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Address" required><textarea className={inputClass} rows={2} value={data.address || ''} onChange={e => update({ address: e.target.value })} /></Field></div>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-medium text-slate-800 mb-3">Builder Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Builder/Developer Name" required><input className={inputClass} value={data.builderName || ''} onChange={e => update({ builderName: e.target.value })} /></Field>
          <Field label="Project Name" required><input className={inputClass} value={data.projectName || ''} onChange={e => update({ projectName: e.target.value })} /></Field>
          <Field label="RERA Registration Number"><input className={inputClass} value={data.reraReg || ''} onChange={e => update({ reraReg: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Builder Address" required><textarea className={inputClass} rows={2} value={data.builderAddress || ''} onChange={e => update({ builderAddress: e.target.value })} /></Field></div>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-medium text-slate-800 mb-3">Property & Agreement Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Unit/Flat Number" required><input className={inputClass} value={data.unitNo || ''} onChange={e => update({ unitNo: e.target.value })} /></Field>
          <Field label="Agreement Date" required><input type="date" className={inputClass} value={data.agreementDate || ''} onChange={e => update({ agreementDate: e.target.value })} /></Field>
          <Field label="Promised Possession Date" required><input type="date" className={inputClass} value={data.possessionDate || ''} onChange={e => update({ possessionDate: e.target.value })} /></Field>
          <Field label="Total Amount Paid (₹)" required><input type="number" className={inputClass} value={data.amountPaid || ''} onChange={e => update({ amountPaid: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Payment Schedule/Details"><textarea className={inputClass} rows={2} value={data.paymentSchedule || ''} onChange={e => update({ paymentSchedule: e.target.value })} /></Field></div>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-medium text-slate-800 mb-3">Relief Sought</h3>
        <div className="space-y-2">
          {['Interest on delayed possession', 'Immediate possession', 'Compensation for mental agony', 'Return of amount with interest'].map(item => (
            <label key={item} className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-slate-300" checked={data.relief?.includes(item) || false}
                onChange={e => {
                  const relief = data.relief || []
                  update({ relief: e.target.checked ? [...relief, item] : relief.filter(r => r !== item) })
                }} />
              <span className="text-sm text-slate-700">{item}</span>
            </label>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Step2Insurance({ data, update }) {
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h3 className="font-medium text-slate-800 mb-3">Policyholder Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Policyholder Name" required><input className={inputClass} value={data.phName || ''} onChange={e => update({ phName: e.target.value })} /></Field>
          <Field label="Policy Number" required><input className={inputClass} value={data.policyNo || ''} onChange={e => update({ policyNo: e.target.value })} /></Field>
          <Field label="Phone" required><input type="tel" className={inputClass} value={data.phPhone || ''} onChange={e => update({ phPhone: e.target.value })} /></Field>
          <Field label="Email" required><input type="email" className={inputClass} value={data.phEmail || ''} onChange={e => update({ phEmail: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Address" required><textarea className={inputClass} rows={2} value={data.phAddress || ''} onChange={e => update({ phAddress: e.target.value })} /></Field></div>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-medium text-slate-800 mb-3">Insurance Company Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company Name" required><input className={inputClass} value={data.insCompany || ''} onChange={e => update({ insCompany: e.target.value })} /></Field>
          <Field label="Company Address" required><input className={inputClass} value={data.insAddress || ''} onChange={e => update({ insAddress: e.target.value })} /></Field>
          <Field label="Policy Type" required>
            <select className={inputClass} value={data.policyType || ''} onChange={e => update({ policyType: e.target.value })}>
              <option value="">Select type</option>
              <option>Health</option><option>Life</option><option>Motor</option><option>Property</option>
            </select>
          </Field>
          <Field label="Premium Paid (₹)"><input type="number" className={inputClass} value={data.premiumPaid || ''} onChange={e => update({ premiumPaid: e.target.value })} /></Field>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-medium text-slate-800 mb-3">Claim & Rejection Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Claim Amount (₹)" required><input type="number" className={inputClass} value={data.claimAmount || ''} onChange={e => update({ claimAmount: e.target.value })} /></Field>
          <Field label="Claim Filing Date" required><input type="date" className={inputClass} value={data.claimDate || ''} onChange={e => update({ claimDate: e.target.value })} /></Field>
          <Field label="Rejection Date" required><input type="date" className={inputClass} value={data.rejectionDate || ''} onChange={e => update({ rejectionDate: e.target.value })} /></Field>
          <Field label="Claim Reference Number"><input className={inputClass} value={data.claimRef || ''} onChange={e => update({ claimRef: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Reason Given for Rejection" required><textarea className={inputClass} rows={2} value={data.rejectionReason || ''} onChange={e => update({ rejectionReason: e.target.value })} /></Field></div>
        </div>
      </Card>
    </div>
  )
}

function Step2Generic({ data, update }) {
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h3 className="font-medium text-slate-800 mb-3">Case Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Your Name" required><input className={inputClass} value={data.fullName || ''} onChange={e => update({ fullName: e.target.value })} /></Field>
          <Field label="Opposite Party Name" required><input className={inputClass} value={data.oppositeParty || ''} onChange={e => update({ oppositeParty: e.target.value })} /></Field>
          <Field label="Email" required><input type="email" className={inputClass} value={data.email || ''} onChange={e => update({ email: e.target.value })} /></Field>
          <Field label="Phone" required><input type="tel" className={inputClass} value={data.phone || ''} onChange={e => update({ phone: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Address" required><textarea className={inputClass} rows={2} value={data.address || ''} onChange={e => update({ address: e.target.value })} /></Field></div>
          <div className="sm:col-span-2"><Field label="Case Details" required><textarea className={inputClass} rows={4} value={data.caseDetails || ''} onChange={e => update({ caseDetails: e.target.value })} /></Field></div>
        </div>
      </Card>
    </div>
  )
}

function Step2({ data, update, onBack, onGenerate }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Case Details Form</h2>
        <p className="text-sm text-slate-500 mt-1">Fill in the details for your {data.typeName}</p>
      </div>
      {data.type === 'rera_notice' && <Step2RERA data={data} update={update} />}
      {data.type === 'insurance_complaint' && <Step2Insurance data={data} update={update} />}
      {(data.type === 'consumer_complaint' || data.type === 'response_notice') && <Step2Generic data={data} update={update} />}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onBack}><ArrowLeft size={16} /> Back</Button>
        <Button variant="primary" onClick={onGenerate}>Generate Draft <ArrowRight size={16} /></Button>
      </div>
    </div>
  )
}

function Step3({ data, onComplete }) {
  const [stage, setStage] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let current = 0
    generationStages.forEach((s, i) => {
      setTimeout(() => setStage(i), current)
      current += s.duration
    })
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100 }
        return p + 2
      })
    }, 200)
    setTimeout(() => onComplete(), current + 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
          <Sparkles size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Generating Your Legal Document...</h2>
        <p className="text-slate-500 mt-2">AI agents are researching and drafting your document</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="space-y-3">
          {generationStages.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 text-sm transition-opacity ${i <= stage ? 'opacity-100' : 'opacity-30'}`}>
              {i < stage ? (
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-green-600" />
                </div>
              ) : i === stage ? (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 border-2 border-slate-200 rounded-full flex-shrink-0" />
              )}
              <span className={i <= stage ? 'text-slate-800' : 'text-slate-400'}>{s.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Overall Progress</span>
            <span className="text-xs font-medium text-slate-700">{Math.min(progress, 100)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-200" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">Estimated time: {Math.max(0, Math.ceil((100 - progress) / 2))} seconds remaining</p>
        </div>
      </div>
    </div>
  )
}

export default function DraftNew() {
  const navigate = useNavigate()
  const location = useLocation()
  const { addDraft } = useAppStore()
  const [step, setStep] = useState(1)
  const [data, setData] = useState({
    type: location.state?.autoSelect || '',
    typeName: draftTypes.find(t => t.value === location.state?.autoSelect)?.label || '',
    background: location.state?.topic || '',
  })

  const update = (updates) => setData({ ...data, ...updates })

  const handleGenerate = () => {
    setStep(3)
  }

  const handleComplete = () => {
    const draftContent = `LEGAL NOTICE

Date: ${new Date().toLocaleDateString('en-IN')}

TO:
${data.builderName || data.oppositeParty || '[Party Name]'}
${data.builderAddress || ''}

FROM:
${data.fullName || '[Your Name]'}
${data.address || ''}

SUBJECT: ${data.typeName}

Sir/Madam,

Under instructions from my client, I hereby issue this legal notice:

${data.background}

RELIEF SOUGHT:
${(data.relief || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}

Please comply with this notice within 30 days of receipt, failing which appropriate legal proceedings shall be initiated.

Advocate

---
[1] RERA Act 2016, Section 18
[2] Maharashtra RERA Rules 2017, Rule 15
[3] Supreme Court Order - Kumar vs Builder (2023)`

    const newDraft = addDraft({
      title: data.typeName,
      type: data.type,
      typeName: data.typeName,
      caseName: data.caseName || `${data.fullName || 'New Case'} vs ${data.builderName || data.oppositeParty || 'Party'}`,
      background: data.background,
      content: draftContent,
      sources: [
        { id: 's1', title: 'RERA Act 2016 - Section 18', type: 'Act', match: 95, excerpt: 'Section 18 provides interest for delayed possession...' },
        { id: 's2', title: 'Maharashtra RERA Rules 2017, Rule 15', type: 'Rule', match: 90, excerpt: 'Interest at MCLR plus 2% per annum...' },
        { id: 's3', title: 'Kumar vs Builder (SC 2023)', type: 'Court Order', match: 92, excerpt: 'Interest at MCLR+2% for delayed possession...' },
      ],
    })
    toast.success('Draft generated successfully!')
    navigate(`/draft/${newDraft.id}`)
  }

  return (
    <div className="p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
      {/* Progress steps indicator */}
      {step < 3 && (
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center gap-4">
            {['Type & Background', 'Case Details', 'Generation'].map((label, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  {step > i + 1 ? <Check size={16} /> : i + 1}
                </div>
                <span className={`text-sm ${step >= i + 1 ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>{label}</span>
                {i < 2 && <div className={`flex-1 h-0.5 ${step > i + 1 ? 'bg-green-500' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 1 && <Step1 data={data} update={update} onNext={() => setStep(2)} onCancel={() => navigate('/drafts')} />}
      {step === 2 && <Step2 data={data} update={update} onBack={() => setStep(1)} onGenerate={handleGenerate} />}
      {step === 3 && <Step3 data={data} onComplete={handleComplete} />}
    </div>
  )
}
