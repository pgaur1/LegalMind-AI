import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowRight, ArrowLeft, Check, Search, Sparkles, FileText,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { Button, Card } from '../components/ui'
import { draftTypes } from '../data/mockData'
import { draftsAPI } from '../services/api'
import MarkdownContent from '../components/MarkdownContent'
import toast from 'react-hot-toast'

const generationStages = [
  { label: 'Planner Agent: Analyzing legal requirements...', duration: 1500 },
  { label: '📚 RAG Service: Initializing search across 4,986 documents...', duration: 1200 },
  { label: '📚 RAG Service: Searching legal database...', duration: 1800 },
  { label: '📚 RAG Service: Found 2 relevant sources (RERA Act, Maharashtra Rules)', duration: 1000 },
  { label: '🔗 Graph Service: Connecting to Knowledge Graph...', duration: 1000 },
  { label: '🔗 Graph Service: Querying 143 legal entities...', duration: 1500 },
  { label: '🔗 Graph Service: Found 2 Acts/Sections', duration: 900 },
  { label: '🌐 Web Service: Searching Indian Kanoon for precedents...', duration: 1200 },
  { label: '🌐 Web Service: Found Kumar vs Builder (SC 2023)', duration: 800 },
  { label: '🤖 AWS Bedrock: Initializing Claude Sonnet 4.5...', duration: 1500 },
  { label: '🤖 AWS Bedrock: Generating professional draft...', duration: 3500 },
  { label: '✨ Adding citations and formatting...', duration: 1500 },
  { label: '✨ Finalizing document...', duration: 1200 },
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
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-slate-800">Describe your legal situation <span className="text-red-500">*</span></h3>
          {data.background && data.background.length > 100 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Demo data loaded - editable</span>
          )}
        </div>
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
          <p className="text-xs text-slate-500 mt-3">
            Sources: 📚 RAG (4,986 docs) + 🔗 Knowledge Graph (143 entities) + 🌐 Web (Recent case law)
          </p>
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
  const hasDemoData = data.fullName || data.phName || data.oppositeParty;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Case Details Form</h2>
            <p className="text-sm text-slate-500 mt-1">Fill in the details for your {data.typeName}</p>
          </div>
          {hasDemoData && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <p className="text-xs font-medium text-green-800">✓ Demo data pre-filled</p>
              <p className="text-xs text-green-600">All fields are editable</p>
            </div>
          )}
        </div>
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

// COPIED FROM RESEARCH - Same progress animation that works perfectly!
function Step3({ data, onComplete, onBack, streamedText }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(true)

  // Progress steps matching actual generation time
  const steps = [
    { label: 'Analyzing draft requirements...', duration: 1500, icon: '🔍' },
    { label: 'Searching 4,986 legal documents (RAG)...', duration: 2000, icon: '📚' },
    { label: 'Retrieving from Knowledge Graph (143 entities)...', duration: 2000, icon: '🔗' },
    { label: 'Fetching relevant case law...', duration: 1500, icon: '🌐' },
    { label: 'Generating with the configured AI model...', duration: 3500, icon: '🤖' },
    { label: 'Generating professional draft...', duration: 3000, icon: '✨' },
    { label: 'Completing all sections...', duration: 2500, icon: '📎' },
  ]

  useEffect(() => {
    let isMounted = true
    onComplete().catch((generationError) => {
      if (isMounted) {
        setError(generationError.message)
        setIsGenerating(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (error) return undefined
    let isMounted = true
    // Same step progression as Research
    let stepIndex = 0
    let progressValue = 0

    const stepInterval = setInterval(() => {
      if (isMounted && stepIndex < steps.length) {
        setCurrentStep(stepIndex)
        stepIndex++
      }
    }, steps[stepIndex]?.duration || 2000)

    const progressInterval = setInterval(() => {
      if (isMounted) {
        progressValue += 2
        if (progressValue <= 95) {
          setProgress(progressValue)
        }
      }
    }, 250)

    return () => {
      isMounted = false
      clearInterval(stepInterval)
      clearInterval(progressInterval)
    }
  }, [error])

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
          <Sparkles size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Generating Your Legal Document...</h2>
        <p className="text-slate-500 mt-2">AI is researching and drafting your document</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        {/* Current Step Indicator - SAME AS RESEARCH */}
        <div className="flex items-center gap-3 text-slate-700">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
            <Sparkles size={20} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800">AI Draft Generation in Progress</p>
            <p className="text-xs text-slate-500">Processing across legal databases</p>
          </div>
        </div>

        {/* Progress Steps - SAME AS RESEARCH */}
        <div className="bg-blue-50/30 backdrop-blur-sm border border-blue-100 rounded-xl p-4 space-y-2.5">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 transition-all duration-300 ${
                idx === currentStep
                  ? 'text-blue-700 scale-105'
                  : idx < currentStep
                  ? 'text-slate-400'
                  : 'text-slate-300'
              }`}
            >
              <div className={`text-xl transition-all duration-300 ${
                idx === currentStep ? 'animate-bounce' : ''
              }`}>
                {step.icon}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm font-medium">{step.label}</span>
              </div>
              <div>
                {idx < currentStep ? (
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : idx === currentStep ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-5 h-5 border-2 border-slate-200 rounded-full" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar - SAME AS RESEARCH */}
        <div className="space-y-1.5">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 text-center">
            {isGenerating ? 'This can take a few minutes while the draft is generated.' : 'Generation stopped.'}
          </p>
        </div>

        {streamedText && (
          <div aria-live="polite" className="max-h-[55vh] overflow-y-auto rounded-lg border border-slate-200 bg-white p-4">
            <MarkdownContent content={streamedText} className="text-slate-800" />
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">Draft generation failed</p>
            <p className="mt-1">{error}</p>
            <div className="mt-4 flex gap-3">
              <Button variant="primary" onClick={() => {
                setError('')
                setIsGenerating(true)
                setProgress(0)
                setCurrentStep(0)
                onComplete().catch((generationError) => {
                  setError(generationError.message)
                  setIsGenerating(false)
                })
              }}>Try again</Button>
              <Button variant="secondary" onClick={onBack}>Back to details</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Demo default values for quick testing (all editable)
const getDemoDefaults = (draftType) => {
  const today = new Date().toISOString().split('T')[0];
  const twoYearsAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString().split('T')[0];
  const oneYearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];
  const threeMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0];

  const defaults = {
    rera_notice: {
      // Step 1
      background: "I purchased a flat from ABC Builders in March 2022. The builder agreement promised possession by September 2023. It is now October 2026 and I still have not received possession. The project is only 70% complete. Builder is not responding to calls or emails. I paid Rs. 75 lakhs so far (80% of total amount). I want to send legal notice under RERA Section 18 demanding possession with interest.",
      // Step 2 - Your Details
      fullName: "Rajesh Kumar",
      email: "rajesh.kumar@example.com",
      phone: "9876543210",
      address: "Flat 501, Tower A, Green Valley Apartments, Andheri West, Mumbai - 400058",
      // Builder Details
      builderName: "ABC Builders Private Limited",
      projectName: "Paradise Heights",
      reraReg: "P51700012345",
      builderAddress: "Corporate Office, 12th Floor, Business Tower, BKC, Mumbai - 400051",
      // Property Details
      unitNo: "A-501",
      agreementDate: twoYearsAgo,
      possessionDate: oneYearAgo,
      amountPaid: "7500000",
      paymentSchedule: "Total amount: Rs. 93,75,000. Paid: Rs. 75,00,000 (80%). Balance: Rs. 18,75,000",
      // Relief
      relief: ["Interest on delayed possession", "Immediate possession", "Compensation for mental agony"]
    },
    insurance_complaint: {
      // Step 1
      background: "I have a health insurance policy with XYZ Insurance Company since 2020. In July 2026, I was hospitalized for heart surgery. The hospital bill was Rs. 8.5 lakhs. I submitted all required documents but the insurance company rejected my claim citing pre-existing condition, which is false as I disclosed all medical history during policy purchase and completed the 3-year waiting period.",
      // Policyholder Details
      phName: "Priya Sharma",
      policyNo: "XYZ/HEALTH/2020/12345",
      phPhone: "9988776655",
      phEmail: "priya.sharma@example.com",
      phAddress: "B-303, Lakeview Apartments, Bandra East, Mumbai - 400051",
      // Insurance Company
      insCompany: "XYZ Insurance Company Ltd",
      insAddress: "Insurance House, Nariman Point, Mumbai - 400021",
      policyType: "Health",
      premiumPaid: "45000",
      // Claim Details
      claimAmount: "850000",
      claimDate: threeMonthsAgo,
      rejectionDate: threeMonthsAgo,
      claimRef: "CLM/2026/789456",
      rejectionReason: "Claim rejected citing pre-existing condition (heart disease). This is wrongful as I disclosed complete medical history during policy purchase in 2020 and completed the mandatory 3-year waiting period."
    },
    consumer_complaint: {
      // Step 1
      background: "I purchased a Samsung refrigerator (Model: RT28M3022S8) worth Rs. 28,500 from XYZ Electronics on June 15, 2026. The refrigerator stopped working completely after just 45 days. Despite multiple complaints and service requests, the company is refusing to honor the warranty. The service engineer visited twice but couldn't fix it. Now they are saying it's customer mishandling, which is false.",
      // Case Details
      fullName: "Amit Patel",
      oppositeParty: "XYZ Electronics Private Limited",
      email: "amit.patel@example.com",
      phone: "9123456789",
      address: "Shop No. 45, Commercial Complex, Andheri West, Mumbai - 400058",
      caseDetails: "Purchased Samsung refrigerator on 15-Jun-2026 for Rs. 28,500. Stopped working after 45 days. Service engineer visited twice (Aug 5, Aug 12) but couldn't repair. Company refusing warranty claim citing mishandling. Product has manufacturing defect. Seeking replacement or full refund with compensation."
    },
    response_notice: {
      // Step 1
      background: "I received a legal notice from ABC Limited dated Sept 15, 2026, claiming that I owe them Rs. 5 lakhs for breach of contract. This claim is false and baseless. I have fulfilled all my obligations under the contract dated January 2025. I have all documents, emails, and payment receipts proving complete compliance. I need to send a strong response denying all allegations.",
      // Case Details
      fullName: "Vikram Singh",
      oppositeParty: "ABC Limited",
      email: "vikram.singh@example.com",
      phone: "9876012345",
      address: "Office 701, Trade Center, Lower Parel, Mumbai - 400013",
      caseDetails: "Received legal notice dated 15-Sept-2026 alleging breach of contract and demanding Rs. 5 lakhs. All allegations are false. Contract dated Jan-2025 has been fully complied with. Have proof: delivery receipts, email communications, payment confirmations. Notice is an attempt to harass and extract money wrongfully."
    }
  };

  return defaults[draftType] || {};
};

export default function DraftNew() {
  const navigate = useNavigate()
  const location = useLocation()
  const { addDraft } = useAppStore()
  const [step, setStep] = useState(1)
  const [streamedDraft, setStreamedDraft] = useState('')

  // Get demo defaults based on selected type
  const initialType = location.state?.autoSelect || '';
  const demoDefaults = getDemoDefaults(initialType);

  const [data, setData] = useState({
    type: initialType,
    typeName: draftTypes.find(t => t.value === initialType)?.label || '',
    background: location.state?.topic || demoDefaults.background || '',
    ...demoDefaults, // Merge demo defaults (all editable)
  })

  const update = (updates) => {
    // When draft type changes, load new demo defaults but keep manually edited fields
    if (updates.type && updates.type !== data.type) {
      const newDefaults = getDemoDefaults(updates.type);
      setData({ ...data, ...updates, ...newDefaults });
    } else {
      setData({ ...data, ...updates });
    }
  }

  const handleGenerate = () => {
    setStep(3)
  }

  const handleComplete = async () => {
    try {
      console.log('[Draft] Starting API call...');
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      try {
        setStreamedDraft('')
        const result = await draftsAPI.generateStream({
          draft_type: data.type || 'legal_notice',
          client_name: data.fullName || 'Client',
          opponent_name: data.builderName || data.oppositeParty || 'Opponent',
          case_description: data.background || 'Legal matter',
          legal_context: null,
        }, {
          signal: controller.signal,
          onToken: (chunk) => setStreamedDraft(current => current + chunk),
        });

        if (!result.success) {
          if (controller.signal.aborted) {
            const timeoutError = new Error('Request timed out after 3 minutes. Please try again.');
            timeoutError.name = 'AbortError';
            throw timeoutError;
          }
          throw new Error(result.error);
        }

        const endTime = Date.now();

        console.log(`[Draft] API completed in ${(endTime - startTime) / 1000}s`);
        console.log(`[Draft] Content length: ${result.data.content?.length || 0} chars`);
        console.log(`[Draft] Word count: ${result.data.word_count || 0} words`);
        console.log(`[Draft] Sources: ${result.data.sources?.length || 0}`);

        const newDraft = addDraft({
          title: data.typeName,
          type: data.type,
          typeName: data.typeName,
          caseName: data.caseName || `${data.fullName || 'New Case'} vs ${data.builderName || data.oppositeParty || 'Party'}`,
          background: data.background,
          content: result.data.content,
          sources: result.data.sources || [],
        });

        toast.success('Draft generated successfully!');
        navigate(`/draft/${newDraft.id}`);
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error('Draft generation error:', error);
      toast.error(error.message || 'Draft generation failed. Please try again.');
      throw error;
    }
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
      {step === 3 && <Step3 data={data} onComplete={handleComplete} onBack={() => setStep(2)} streamedText={streamedDraft} />}
    </div>
  )
}
