export const users = [
  { id: 'u1', name: 'John Doe', role: 'Legal Team', email: 'john.doe@legalmind.ai', avatar: 'JD', color: '#2563eb' },
  { id: 'u2', name: 'Sarah Smith', role: 'Legal Counsel', email: 'sarah.smith@legalmind.ai', avatar: 'SS', color: '#0d9488' },
  { id: 'u3', name: 'Mike Roberts', role: 'Manager', email: 'mike.roberts@legalmind.ai', avatar: 'MR', color: '#b45309' },
  { id: 'u4', name: 'Legal Head', role: 'Reviewer', email: 'legal.head@legalmind.ai', avatar: 'LH', color: '#7c3aed' },
  { id: 'u5', name: 'Operations Team', role: 'Operations', email: 'ops@legalmind.ai', avatar: 'OT', color: '#dc2626' },
  { id: 'u6', name: 'Finance Team', role: 'Finance', email: 'finance@legalmind.ai', avatar: 'FT', color: '#059669' },
]

export const currentUser = users[0]

export const draftStatuses = {
  draft: { label: 'Draft', color: 'gray' },
  review: { label: 'Under Review', color: 'blue' },
  approved: { label: 'Approved', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
}

export const sampleDrafts = [
  {
    id: 'D-2024-001',
    title: 'Legal Notice - RERA Delayed Possession',
    type: 'rera_notice',
    typeName: 'Legal Notice - RERA Delayed Possession',
    caseName: 'Kumar vs ABC Builders',
    status: 'draft',
    createdAt: '2024-09-28T10:00:00Z',
    updatedAt: '2024-09-29T14:30:00Z',
    owner: users[0],
    reviewer: null,
    version: 1,
    wordCount: 1250,
    background: 'I purchased a flat from ABC Builders in 2021. The agreement promised possession by December 2023, but it is now September 2024 and the project is only 60% complete. Builder is not responding. I need to send a legal notice demanding possession with interest as per RERA provisions.',
    content: `LEGAL NOTICE

Date: September 28, 2024

TO:
ABC Builders Ltd.
123 Construction Avenue
Mumbai, Maharashtra 400001

FROM:
Kumar Sharma
45 Residentia Park
Mumbai, Maharashtra 400050

SUBJECT: Legal Notice for Delayed Possession under RERA Act 2016

Sir/Madam,

Under instructions from my client, Mr. Kumar Sharma, I hereby issue this legal notice under the provisions of the Real Estate (Regulation and Development) Act, 2016 [1]:

1. That my client entered into an Agreement for Sale dated March 15, 2021, for the purchase of Flat No. B-1202 in your project "Skyline Residences" for a total consideration of ₹54,20,000.

2. That as per Clause 8 of the Agreement, you were obligated to hand over possession of the said flat by December 2023, with a grace period of six months ending June 2024.

3. That despite the expiry of the grace period, the project is merely 60% complete as of September 2024, representing an unreasonable delay of approximately 9 months beyond the extended deadline.

4. That Section 18 of the RERA Act 2016 [1] provides that in case of delay in possession, the allottee shall be entitled to claim interest for every month of delay until possession is handed over, calculated at the rate prescribed by the RERA Authority.

5. That the Hon'ble Supreme Court in Kumar vs ABC Builders Ltd. [3] has held that the builder is liable to pay interest at MCLR+2% per annum for the period of delay, and force majeure claims for routine construction delays are not maintainable.

6. That my client has made numerous attempts to contact your office regarding the status of the project, but you have failed to provide any satisfactory response.

RELIEF SOUGHT:

I hereby demand that you:

(a) Hand over possession of Flat No. B-1202 within 60 days of receipt of this notice;
(b) Pay interest at the rate of MCLR+2% per annum on the total amount paid (₹54,20,000) for the entire period of delay;
(c) Pay compensation of ₹2,00,000 for mental agony and harassment caused;
(d) Bear all costs of this legal proceeding.

Please note that failure to comply with this notice within 30 days of receipt shall compel my client to initiate appropriate legal proceedings before the RERA Authority, including but not limited to claims for possession, interest, compensation, and costs, without further notice.

A copy of this notice is retained in our office for record and further action.

Advocate
For: Kumar Sharma

---
CITATIONS:
[1] RERA Act 2016, Section 18 - Delayed Possession
[2] Maharashtra RERA Rules 2017, Rule 15
[3] Supreme Court Order - Kumar vs Builder (2023)`,
    sources: [
      { id: 's1', title: 'RERA Act 2016 - Section 18', type: 'Act', match: 95, excerpt: 'Section 18 provides that in case of delay in possession, the allottee shall be entitled to claim interest for every month of delay...' },
      { id: 's2', title: 'Maharashtra RERA Rules 2017, Rule 15', type: 'Rule', match: 90, excerpt: 'The rate of interest payable by the promoter shall be MCLR plus 2% per annum...' },
      { id: 's3', title: 'Kumar vs Builder (SC 2023)', type: 'Court Order', match: 92, excerpt: 'The Supreme Court held that interest must be paid at MCLR+2% per annum for delayed possession...' },
    ],
    changes: [
      { id: 'c1', action: 'Draft created', user: users[0], timestamp: '2024-09-28T10:00:00Z' },
      { id: 'c2', action: 'Content generated by AI', user: users[0], timestamp: '2024-09-28T10:02:00Z' },
      { id: 'c3', action: 'Draft edited manually', user: users[0], timestamp: '2024-09-29T14:30:00Z' },
    ],
    discussion: [],
  },
  {
    id: 'D-2024-002',
    title: 'Complaint - Insurance Claim Rejection (IRDAI)',
    type: 'insurance_complaint',
    typeName: 'Complaint - Insurance Claim Rejection (IRDAI)',
    caseName: 'Insurance Claim Appeal - XYZ Insurance',
    status: 'review',
    createdAt: '2024-09-25T09:00:00Z',
    updatedAt: '2024-09-29T11:00:00Z',
    owner: users[1],
    reviewer: users[3],
    version: 2,
    wordCount: 980,
    background: 'My health insurance claim of ₹3,50,000 was rejected by XYZ Insurance citing pre-existing condition. I had disclosed all conditions at the time of policy purchase.',
    content: `COMPLAINT UNDER IRDAI REGULATIONS

Date: September 25, 2024

TO:
XYZ Insurance Company Ltd.
Claims Department
Mumbai, Maharashtra

FROM:
[Policyholder Name]
[Address]

SUBJECT: Complaint against wrongful rejection of Health Insurance Claim

Reference: Policy No. XYZ-2023-4567, Claim Ref: CL-2024-0892

Sir/Madam,

This complaint is filed against the wrongful rejection of my health insurance claim under the provisions of the IRDAI Act, 1999 and the Insurance Regulatory and Development Authority of India (Protection of Policyholders' Interests) Regulations, 2017.

1. That I am a policyholder of your "Comprehensive Health Shield" policy (Policy No. XYZ-2023-4567) since January 2023, having paid all premiums on time.

2. That on August 10, 2024, I was hospitalized for acute appendicitis and filed a claim of ₹3,50,000 which was rejected on September 5, 2024, citing "pre-existing condition not disclosed at the time of policy issuance."

3. That this rejection is wrongful because:
   (a) I had disclosed all pre-existing conditions in the proposal form dated January 5, 2023;
   (b) The condition cited (appendicitis) is not a pre-existing condition but an acute medical emergency;
   (c) The policy has completed the waiting period of 24 months for specified conditions.

4. That as per IRDAI Guidelines on Claim Settlement, the insurer is obligated to process claims within 30 days of receipt of all documents, and rejection must be based on valid grounds with detailed reasoning.

RELIEF SOUGHT:

(a) Immediate processing and settlement of claim amount ₹3,50,000;
(b) Interest at 12% per annum on the claim amount from the date of rejection;
(c) Compensation of ₹50,000 for harassment and mental agony.

Please settle this claim within 15 days, failing which I shall approach the Insurance Ombudsman.

[Policyholder Name]
[Date]`,
    sources: [
      { id: 's4', title: 'IRDAI Act 1999 - Section 14', type: 'Act', match: 88, excerpt: 'Powers and functions of the Authority include protection of policyholders interests...' },
      { id: 's5', title: 'IRDAI Protection of Policyholders Regulations 2017', type: 'Regulation', match: 91, excerpt: 'The insurer shall process claims within 30 days of receipt of all documents...' },
    ],
    changes: [
      { id: 'c4', action: 'Draft created', user: users[1], timestamp: '2024-09-25T09:00:00Z' },
      { id: 'c5', action: 'Submitted for review', user: users[1], timestamp: '2024-09-26T10:00:00Z' },
      { id: 'c6', action: 'Reviewer comment: Please add policy timeline', user: users[3], timestamp: '2024-09-27T15:00:00Z' },
      { id: 'c7', action: 'Draft updated with revisions', user: users[1], timestamp: '2024-09-29T11:00:00Z' },
    ],
    discussion: [
      { id: 'd1', user: users[1], message: 'Please review the updated draft. I have added the policy timeline as requested.', timestamp: '2024-09-29T11:05:00Z', type: 'user' },
      { id: 'd2', user: users[3], message: 'The timeline section looks good now. Please also ensure the claim amount is consistent throughout the document.', timestamp: '2024-09-29T14:00:00Z', type: 'user' },
    ],
  },
  {
    id: 'D-2024-003',
    title: 'Consumer Complaint - Appliance Defect',
    type: 'consumer_complaint',
    typeName: 'Consumer Complaint',
    caseName: 'Consumer Complaint - Appliance Defect',
    status: 'approved',
    createdAt: '2024-09-20T08:00:00Z',
    updatedAt: '2024-09-27T16:00:00Z',
    owner: users[0],
    reviewer: users[3],
    version: 3,
    wordCount: 1100,
    background: 'Purchased a washing machine that stopped working within warranty period. Manufacturer refusing to repair or replace.',
    content: `CONSUMER COMPLAINT

Before the District Consumer Disputes Redressal Forum

Date: September 20, 2024

COMPLAINANT: [Name]
RESPONDENT: [Manufacturer Name]

SUBJECT: Complaint for defective product and deficiency in service

...`,
    sources: [
      { id: 's6', title: 'Consumer Protection Act 2019 - Section 2(42)', type: 'Act', match: 87, excerpt: 'Defect means any fault, imperfection or shortcoming in the quality, quantity...' },
    ],
    changes: [
      { id: 'c8', action: 'Draft created', user: users[0], timestamp: '2024-09-20T08:00:00Z' },
      { id: 'c9', action: 'Submitted for review', user: users[0], timestamp: '2024-09-22T10:00:00Z' },
      { id: 'c10', action: 'Approved by Legal Head', user: users[3], timestamp: '2024-09-27T16:00:00Z' },
    ],
    discussion: [],
  },
  {
    id: 'D-2024-004',
    title: 'Response to Legal Notice - Property Dispute',
    type: 'response_notice',
    typeName: 'Response to Legal Notice',
    caseName: 'Property Dispute - Delhi High Court',
    status: 'rejected',
    createdAt: '2024-09-15T11:00:00Z',
    updatedAt: '2024-09-24T13:00:00Z',
    owner: users[1],
    reviewer: users[3],
    version: 1,
    wordCount: 750,
    background: 'Received a legal notice regarding a property boundary dispute. Need to draft a response.',
    content: `RESPONSE TO LEGAL NOTICE

Date: September 15, 2024

...`,
    sources: [],
    changes: [
      { id: 'c11', action: 'Draft created', user: users[1], timestamp: '2024-09-15T11:00:00Z' },
      { id: 'c12', action: 'Submitted for review', user: users[1], timestamp: '2024-09-18T09:00:00Z' },
      { id: 'c13', action: 'Rejected: Insufficient legal basis', user: users[3], timestamp: '2024-09-24T13:00:00Z' },
    ],
    discussion: [
      { id: 'd3', user: users[3], message: 'The response does not adequately address the claims made in the notice. Please consult property law precedents before resubmitting.', timestamp: '2024-09-24T13:05:00Z', type: 'user' },
    ],
  },
]

export const samplePrecedents = [
  {
    id: 'p1',
    caseTitle: 'Kumar vs ABC Builders Ltd. & Ors.',
    court: 'Supreme Court of India',
    date: '2023-02-15',
    citation: 'Civil Appeal No. 1234/2023',
    caseNumber: 'Civil Appeal No. 1234/2023',
    type: 'Judgment',
    status: 'good_law',
    matchScore: 95,
    isNew: false,
    summary: 'The Supreme Court held that builders must pay interest at MCLR+2% per annum for delayed possession under RERA Act. Force majeure claims for routine construction delays are not maintainable.',
    tags: ['RERA', 'Delayed Possession', 'Interest Calculation', 'Section 18'],
    related: ['RERA Act 2016', 'Maharashtra RERA Rules'],
    acts: ['RERA Act 2016'],
    judges: 'Hon\'ble Justice A.K. Goel, Hon\'ble Justice R.F. Nariman',
    petitioner: 'Kumar Sharma',
    respondent: 'ABC Builders Ltd.',
    citedBy: 23,
    keyTakeaways: [
      'Interest must be paid at MCLR+2% per annum for delayed possession',
      'Force majeure not applicable for routine construction delays',
      'Interest calculation from due date, not notice date',
    ],
    facts: 'The appellant purchased a flat from the respondent builder in 2019. The agreement promised possession by December 2021. The builder delayed possession by 18 months. The appellant approached the RERA Authority seeking interest and possession.',
    issues: [
      'Whether the builder is liable to pay interest for delayed possession under RERA Act?',
      'Whether force majeure clause can be invoked for routine construction delays?',
      'What is the applicable rate of interest for delayed possession?',
    ],
    held: [
      'The builder is liable to pay interest under Section 18 of RERA Act for the entire period of delay.',
      'Force majeure cannot be claimed for routine construction delays; it applies only to unforeseen events like natural disasters.',
      'Interest shall be calculated at MCLR+2% per annum from the date of default.',
    ],
    excerpts: [
      { para: 'Para 24', text: 'The builder cannot take shelter under the force majeure clause for delays caused by its own inability to complete construction within the stipulated time.' },
      { para: 'Para 31', text: 'We hold that the rate of interest payable to the allottee shall be the highest rate applicable to the amount by which the builder is in default, calculated at MCLR plus 2%.' },
    ],
    casesCited: [
      { name: 'Fortune Infrastructure vs Trevor D\'Lima', court: 'SC', date: '2018', relationship: 'Followed' },
      { name: 'Pioneer Urban Land vs Govindan', court: 'SC', date: '2019', relationship: 'Followed' },
    ],
    citedByCases: [
      { name: 'Residential Buyers vs Promoter XYZ', court: 'Bombay HC', date: '2024', relationship: 'Followed' },
      { name: 'Singh vs Real Estate Developers', court: 'NCDRC', date: '2024', relationship: 'Followed' },
    ],
    analysis: {
      significance: 'This case established a clear precedent for interest calculation in RERA delayed possession cases, benefiting homebuyers across India.',
      impact: 'The judgment has been cited in 23 subsequent cases and has become the benchmark for RERA interest claims.',
      implications: 'Builders must factor in MCLR+2% interest liability in their project planning, benefiting consumers significantly.',
      usage: 'Cite this case when seeking interest for delayed possession. Pair with Section 18 of RERA Act for maximum impact.',
    },
  },
  {
    id: 'p2',
    caseTitle: 'Residential Buyers vs Promoter XYZ',
    court: 'Bombay High Court',
    date: '2024-03-20',
    citation: 'Writ Petition No. 5678/2024',
    caseNumber: 'Writ Petition No. 5678/2024',
    type: 'Writ Petition',
    status: 'good_law',
    matchScore: 88,
    isNew: true,
    summary: 'Bombay HC directed RERA authority to expedite hearing of delayed possession complaints. Held that delay in adjudication itself is a violation of homebuyer rights.',
    tags: ['RERA', 'Delayed Possession', 'Expedited Hearing'],
    related: ['RERA Act 2016'],
    acts: ['RERA Act 2016'],
    judges: 'Hon\'ble Justice S.J. Kathawalla',
    petitioner: 'Association of Residential Buyers',
    respondent: 'Promoter XYZ Developers',
    citedBy: 5,
    keyTakeaways: [
      'RERA authorities must expedite delayed possession cases',
      'Delay in adjudication violates consumer rights',
      'Homebuyer associations can file writ petitions collectively',
    ],
    facts: 'A group of 50 homebuyers filed a writ petition seeking directions to the Maharashtra RERA Authority to expedite their delayed possession complaints pending for over 2 years.',
    issues: ['Whether RERA authority can be directed to expedite pending cases?'],
    held: ['RERA authority must dispose of delayed possession cases within 60 days as mandated by RERA Act.'],
    excerpts: [{ para: 'Para 15', text: 'The very purpose of RERA is to provide speedy resolution. If the Authority itself takes years, it defeats the legislative intent.' }],
    casesCited: [{ name: 'Kumar vs ABC Builders', court: 'SC', date: '2023', relationship: 'Followed' }],
    citedByCases: [{ name: 'Sharma vs RERA Authority', court: 'Bombay HC', date: '2024', relationship: 'Followed' }],
    analysis: {
      significance: 'Reinforced the need for timely RERA adjudication.',
      impact: 'Led to faster processing of RERA complaints in Maharashtra.',
      implications: 'Homebuyers can seek mandamus for expedited hearings.',
      usage: 'Use when RERA authority is delaying hearing of your complaint.',
    },
  },
  {
    id: 'p3',
    caseTitle: 'Singh vs Real Estate Developers',
    court: 'NCDRC',
    date: '2024-04-10',
    citation: 'Consumer Case No. 9012/2024',
    caseNumber: 'Consumer Case No. 9012/2024',
    type: 'Order',
    status: 'good_law',
    matchScore: 85,
    isNew: true,
    summary: 'NCDRC awarded compensation of ₹5,00,000 for mental agony caused by delayed possession, in addition to interest under RERA.',
    tags: ['RERA', 'Consumer Protection', 'Mental Agony', 'Compensation'],
    related: ['Consumer Protection Act 2019', 'RERA Act 2016'],
    acts: ['RERA Act 2016', 'Consumer Protection Act 2019'],
    judges: 'Hon\'ble Justice R.K. Agrawal',
    petitioner: 'Harjeet Singh',
    respondent: 'Real Estate Developers Pvt. Ltd.',
    citedBy: 8,
    keyTakeaways: [
      'Mental agony compensation can be claimed alongside RERA interest',
      'NCDRC has jurisdiction over RERA-related consumer disputes',
    ],
    facts: 'The complainant filed a consumer complaint seeking compensation for mental harassment due to 24-month delay in possession.',
    issues: ['Whether separate compensation for mental agony can be awarded in addition to RERA interest?'],
    held: ['Yes, NCDRC can award separate compensation for mental agony under Consumer Protection Act in addition to RERA interest.'],
    excerpts: [{ para: 'Para 22', text: 'Mental agony and harassment caused by delayed possession is a separate cause of action independent of the statutory interest under RERA.' }],
    casesCited: [{ name: 'Kumar vs ABC Builders', court: 'SC', date: '2023', relationship: 'Followed' }],
    citedByCases: [],
    analysis: {
      significance: 'Expanded the scope of compensation for homebuyers.',
      impact: 'Increased awareness of dual remedies under RERA and Consumer Protection Act.',
      implications: 'Homebuyers can seek both statutory interest and additional compensation.',
      usage: 'Cite when seeking additional compensation beyond RERA interest.',
    },
  },
  {
    id: 'p4',
    caseTitle: 'Fortune Infrastructure vs Trevor D\'Lima',
    court: 'Supreme Court of India',
    date: '2018-06-25',
    citation: 'Civil Appeal No. 3456/2018',
    caseNumber: 'Civil Appeal No. 3456/2018',
    type: 'Judgment',
    status: 'good_law',
    matchScore: 80,
    isNew: false,
    summary: 'SC held that homebuyers are "consumers" under Consumer Protection Act even after RERA enactment. Dual remedies available.',
    tags: ['Consumer Protection', 'Homebuyer Rights', 'RERA'],
    related: ['Consumer Protection Act 2019', 'RERA Act 2016'],
    acts: ['Consumer Protection Act 2019', 'RERA Act 2016'],
    judges: 'Hon\'ble Justice A.M. Khanwilkar',
    petitioner: 'Fortune Infrastructure',
    respondent: 'Trevor D\'Lima',
    citedBy: 45,
    keyTakeaways: [
      'Homebuyers can approach both RERA and Consumer Forums',
      'RERA does not oust Consumer Protection Act jurisdiction',
    ],
    facts: 'Developer argued that after RERA enactment, homebuyers cannot approach consumer forums. SC examined the legislative intent.',
    issues: ['Whether RERA Act ousts the jurisdiction of Consumer Forums?'],
    held: ['No, RERA and Consumer Protection Act operate in different spheres. Homebuyers can seek remedies under both.'],
    excerpts: [{ para: 'Para 33', text: 'The enactment of RERA does not in any manner take away the right available to a consumer under the Consumer Protection Act.' }],
    casesCited: [],
    citedByCases: [{ name: 'Kumar vs ABC Builders', court: 'SC', date: '2023', relationship: 'Followed' }],
    analysis: {
      significance: 'Landmark case confirming dual remedy availability for homebuyers.',
      impact: 'Cited in 45+ subsequent cases. Foundation for homebuyer protection.',
      implications: 'Homebuyers have access to multiple forums for redressal.',
      usage: 'Use when establishing jurisdiction of consumer forums in real estate disputes.',
    },
  },
  {
    id: 'p5',
    caseTitle: 'Pioneer Urban Land vs Govindan',
    court: 'Supreme Court of India',
    date: '2019-08-14',
    citation: 'Civil Appeal No. 5678/2019',
    caseNumber: 'Civil Appeal No. 5678/2019',
    type: 'Judgment',
    status: 'good_law',
    matchScore: 78,
    isNew: false,
    summary: 'SC clarified that "possession" under RERA means actual physical possession, not mere allotment or offer of possession.',
    tags: ['RERA', 'Possession', 'Section 18'],
    related: ['RERA Act 2016'],
    acts: ['RERA Act 2016'],
    judges: 'Hon\'ble Justice D.Y. Chandrachud',
    petitioner: 'Pioneer Urban Land',
    respondent: 'Govindan Raghavan',
    citedBy: 31,
    keyTakeaways: [
      'Possession means actual physical possession',
      'Offer of possession is not the same as possession',
    ],
    facts: 'Developer sent an offer of possession letter but the flat was not ready for occupation. Buyer claimed interest under RERA.',
    issues: ['Whether an offer of possession constitutes "possession" under RERA?'],
    held: ['No, possession means actual physical possession where the buyer can occupy the premises.'],
    excerpts: [{ para: 'Para 18', text: 'An offer of possession is not possession. The allottee must be in a position to take actual physical possession.' }],
    casesCited: [{ name: 'Fortune Infrastructure vs Trevor D\'Lima', court: 'SC', date: '2018', relationship: 'Followed' }],
    citedByCases: [{ name: 'Kumar vs ABC Builders', court: 'SC', date: '2023', relationship: 'Followed' }],
    analysis: {
      significance: 'Clarified the meaning of "possession" under RERA.',
      impact: 'Prevented developers from using offer letters to avoid interest liability.',
      implications: 'Buyers can claim interest until actual physical possession is given.',
      usage: 'Cite when builder claims to have offered possession but flat is not ready.',
    },
  },
  {
    id: 'p6',
    caseTitle: 'Data Protection Board vs TechCorp Ltd.',
    court: 'Delhi High Court',
    date: '2024-07-05',
    citation: 'Writ Petition No. 3456/2024',
    caseNumber: 'Writ Petition No. 3456/2024',
    type: 'Order',
    status: 'good_law',
    matchScore: 72,
    isNew: true,
    summary: 'Delhi HC upheld DPDP Act penalties for data breach. Companies must report breaches within 72 hours under Section 8.',
    tags: ['DPDP Act', 'Data Privacy', 'Data Breach', 'Penalties'],
    related: ['DPDP Act 2023'],
    acts: ['DPDP Act 2023'],
    judges: 'Hon\'ble Justice Prateek Jalan',
    petitioner: 'Data Protection Board',
    respondent: 'TechCorp Ltd.',
    citedBy: 3,
    keyTakeaways: [
      '72-hour breach notification is mandatory under DPDP Act',
      'Non-compliance attracts penalties up to ₹250 crore',
    ],
    facts: 'TechCorp suffered a data breach affecting 50,000 users but failed to notify the Data Protection Board within 72 hours.',
    issues: ['Whether failure to report breach within 72 hours attracts penalty?'],
    held: ['Yes, Section 8 of DPDP Act mandates 72-hour reporting. Non-compliance attracts penalty.'],
    excerpts: [{ para: 'Para 12', text: 'The 72-hour window is not directory but mandatory. Timely reporting enables the Board to take corrective measures.' }],
    casesCited: [],
    citedByCases: [],
    analysis: {
      significance: 'First major DPDP Act enforcement case.',
      impact: 'Set the tone for strict enforcement of data breach notification requirements.',
      implications: 'Companies must have breach response protocols in place.',
      usage: 'Cite when dealing with data breach notification compliance.',
    },
  },
]

export const orderStatuses = {
  overdue: { label: 'Overdue', color: 'red' },
  pending: { label: 'Pending', color: 'yellow' },
  in_progress: { label: 'In Progress', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
}

export const orderPriorities = {
  high: { label: 'High', color: 'red' },
  medium: { label: 'Medium', color: 'orange' },
  low: { label: 'Low', color: 'gray' },
}

export const sampleOrders = [
  {
    id: 'ORDER-2024-001',
    caseTitle: 'Kumar vs ABC Builders (RERA)',
    caseNumber: 'RERA/2024/00123',
    court: 'Maharashtra RERA Authority',
    orderDate: '2024-08-15',
    orderType: 'Compliance Order',
    priority: 'high',
    status: 'in_progress',
    summary: 'MahaRERA directed ABC Builders to pay interest at MCLR+2% for delayed possession and submit compliance report within 40 days.',
    keyDirections: '1. Pay interest at MCLR+2% per annum on total amount\n2. Complete remaining construction within 6 months\n3. Submit monthly progress reports\n4. Pay compensation of ₹1,00,000 for delay',
    owner: users[0],
    watchers: [users[1], users[3]],
    relatedDraftId: 'D-2024-001',
    relatedPrecedents: ['p1', 'p5'],
    progress: 80,
    nextAction: 'Submit compliance report',
    nextDeadline: '2024-09-25',
    attachments: [
      { id: 'a1', name: 'RERA_Order.pdf', size: '2.3 MB', uploadedAt: '2024-08-15' },
      { id: 'a2', name: 'Interest_Calculation.xlsx', size: '120 KB', uploadedAt: '2024-08-20' },
      { id: 'a3', name: 'Construction_Status_Report.pdf', size: '1.5 MB', uploadedAt: '2024-09-10' },
    ],
    actions: [
      { id: 'act1', action: 'Send legal notice to builder', deadline: '2024-08-20', assignedTo: users[0], status: 'completed', progress: 100 },
      { id: 'act2', action: 'File RERA complaint', deadline: '2024-08-25', assignedTo: users[0], status: 'completed', progress: 100 },
      { id: 'act3', action: 'Attend RERA hearing', deadline: '2024-08-15', assignedTo: users[1], status: 'completed', progress: 100 },
      { id: 'act4', action: 'Submit compliance report', deadline: '2024-09-25', assignedTo: users[0], status: 'in_progress', progress: 60 },
      { id: 'act5', action: 'Follow-up hearing', deadline: '2024-10-15', assignedTo: users[1], status: 'pending', progress: 0 },
    ],
    timeline: [
      { id: 't1', date: '2024-08-15', title: 'Order received', description: 'RERA order received from Maharashtra RERA Authority', by: users[1], status: 'completed' },
      { id: 't2', date: '2024-08-18', title: 'Order reviewed', description: 'Legal team reviewed the order and identified action items', by: users[0], status: 'completed' },
      { id: 't3', date: '2024-08-25', title: 'Legal notice sent', description: 'Legal notice sent to ABC Builders', by: users[0], status: 'completed' },
      { id: 't4', date: '2024-09-10', title: 'Construction status assessed', description: 'Site visit conducted, project at 60% completion', by: users[1], status: 'completed' },
      { id: 't5', date: '2024-09-25', title: 'Submit compliance report', description: 'Compliance report due to RERA Authority', by: users[0], status: 'overdue' },
      { id: 't6', date: '2024-10-15', title: 'Next hearing', description: 'Follow-up hearing at RERA Authority', by: users[1], status: 'upcoming' },
    ],
    activityLog: [
      { id: 'al1', timestamp: '2024-09-28T10:00:00Z', type: 'system', user: null, description: 'Reminder sent to owner' },
      { id: 'al2', timestamp: '2024-09-20T14:00:00Z', type: 'user', user: users[0], description: 'Status updated to In Progress' },
      { id: 'al3', timestamp: '2024-09-10T09:00:00Z', type: 'user', user: users[1], description: 'Construction status report uploaded' },
      { id: 'al4', timestamp: '2024-08-25T11:00:00Z', type: 'user', user: users[0], description: 'Legal notice dispatched' },
      { id: 'al5', timestamp: '2024-08-18T15:00:00Z', type: 'comment', user: users[3], description: 'Reviewed order. Priority set to High.' },
    ],
  },
  {
    id: 'ORDER-2024-015',
    caseTitle: 'Insurance Claim Appeal',
    caseNumber: 'IRDA/2024/00456',
    court: 'Insurance Ombudsman',
    orderDate: '2024-08-20',
    orderType: 'Compliance Order',
    priority: 'high',
    status: 'in_progress',
    summary: 'Insurance Ombudsman directed XYZ Insurance to re-examine the claim and provide detailed reasoning for rejection within 30 days.',
    keyDirections: '1. Re-examine claim within 30 days\n2. Provide detailed rejection reasoning if maintained\n3. Consider all submitted documents',
    owner: users[1],
    watchers: [users[3]],
    relatedDraftId: 'D-2024-002',
    relatedPrecedents: [],
    progress: 50,
    nextAction: 'Submit re-examination report',
    nextDeadline: '2024-09-19',
    attachments: [
      { id: 'a4', name: 'Ombudsman_Order.pdf', size: '1.8 MB', uploadedAt: '2024-08-20' },
    ],
    actions: [
      { id: 'act6', action: 'File appeal with Ombudsman', deadline: '2024-08-22', assignedTo: users[1], status: 'completed', progress: 100 },
      { id: 'act7', action: 'Submit re-examination report', deadline: '2024-09-19', assignedTo: users[1], status: 'in_progress', progress: 50 },
    ],
    timeline: [
      { id: 't7', date: '2024-08-20', title: 'Order received', description: 'Ombudsman order received', by: users[1], status: 'completed' },
      { id: 't8', date: '2024-09-19', title: 'Submit report', description: 'Re-examination report due', by: users[1], status: 'overdue' },
    ],
    activityLog: [
      { id: 'al6', timestamp: '2024-09-19T10:00:00Z', type: 'system', user: null, description: 'Deadline reminder sent' },
      { id: 'al7', timestamp: '2024-08-22T09:00:00Z', type: 'user', user: users[1], description: 'Appeal filed with Ombudsman' },
    ],
  },
  {
    id: 'ORDER-2024-023',
    caseTitle: 'Property Dispute Hearing',
    caseNumber: 'DH/2024/00789',
    court: 'Delhi High Court',
    orderDate: '2024-09-10',
    orderType: 'Hearing Notice',
    priority: 'medium',
    status: 'pending',
    summary: 'Delhi HC scheduled hearing for property boundary dispute. Both parties directed to file written submissions.',
    keyDirections: '1. File written submissions by hearing date\n2. Bring original sale deed\n3. Notify adjacent property owners',
    owner: users[1],
    watchers: [users[0]],
    relatedDraftId: 'D-2024-004',
    relatedPrecedents: [],
    progress: 20,
    nextAction: 'File written submissions',
    nextDeadline: '2024-10-05',
    attachments: [
      { id: 'a5', name: 'Hearing_Notice.pdf', size: '500 KB', uploadedAt: '2024-09-10' },
    ],
    actions: [
      { id: 'act8', action: 'File written submissions', deadline: '2024-10-05', assignedTo: users[1], status: 'pending', progress: 0 },
      { id: 'act9', action: 'Gather property documents', deadline: '2024-09-30', assignedTo: users[1], status: 'in_progress', progress: 40 },
    ],
    timeline: [
      { id: 't9', date: '2024-09-10', title: 'Hearing notice received', description: 'Delhi HC hearing scheduled', by: users[1], status: 'completed' },
      { id: 't10', date: '2024-10-05', title: 'File submissions', description: 'Written submissions due', by: users[1], status: 'upcoming' },
    ],
    activityLog: [
      { id: 'al8', timestamp: '2024-09-10T12:00:00Z', type: 'user', user: users[1], description: 'Hearing notice received and reviewed' },
    ],
  },
  {
    id: 'ORDER-2024-019',
    caseTitle: 'RERA Penalty Payment',
    caseNumber: 'RERA/2024/00345',
    court: 'Karnataka RERA Authority',
    orderDate: '2024-09-05',
    orderType: 'Compliance Order',
    priority: 'medium',
    status: 'in_progress',
    summary: 'Karnataka RERA imposed penalty of ₹5,00,000 for violation of registration norms. Payment due within 30 days.',
    keyDirections: '1. Pay penalty of ₹5,00,000\n2. Complete RERA registration\n3. Submit compliance certificate',
    owner: users[0],
    watchers: [],
    relatedDraftId: null,
    relatedPrecedents: [],
    progress: 40,
    nextAction: 'Process penalty payment',
    nextDeadline: '2024-10-05',
    attachments: [
      { id: 'a6', name: 'Penalty_Order.pdf', size: '1.2 MB', uploadedAt: '2024-09-05' },
    ],
    actions: [
      { id: 'act10', action: 'Process penalty payment', deadline: '2024-10-05', assignedTo: users[0], status: 'in_progress', progress: 40 },
      { id: 'act11', action: 'Complete RERA registration', deadline: '2024-10-15', assignedTo: users[0], status: 'pending', progress: 0 },
    ],
    timeline: [
      { id: 't11', date: '2024-09-05', title: 'Order received', description: 'Penalty order received', by: users[0], status: 'completed' },
      { id: 't12', date: '2024-10-05', title: 'Payment due', description: 'Penalty payment deadline', by: users[0], status: 'upcoming' },
    ],
    activityLog: [
      { id: 'al9', timestamp: '2024-09-05T14:00:00Z', type: 'user', user: users[0], description: 'Order reviewed, payment processing initiated' },
    ],
  },
  {
    id: 'ORDER-2024-024',
    caseTitle: 'Builder Case Compliance',
    caseNumber: 'RERA/2024/00567',
    court: 'Gujarat RERA Authority',
    orderDate: '2024-09-15',
    orderType: 'Interim Order',
    priority: 'low',
    status: 'in_progress',
    summary: 'Gujarat RERA issued interim order staying further construction until environmental clearance is obtained.',
    keyDirections: '1. Obtain environmental clearance\n2. Halt construction activities\n3. Submit clearance documents',
    owner: users[0],
    watchers: [users[1]],
    relatedDraftId: null,
    relatedPrecedents: [],
    progress: 30,
    nextAction: 'Apply for environmental clearance',
    nextDeadline: '2024-11-01',
    attachments: [],
    actions: [
      { id: 'act12', action: 'Apply for environmental clearance', deadline: '2024-11-01', assignedTo: users[0], status: 'in_progress', progress: 30 },
      { id: 'act13', action: 'Submit clearance documents to RERA', deadline: '2024-12-01', assignedTo: users[0], status: 'pending', progress: 0 },
    ],
    timeline: [
      { id: 't13', date: '2024-09-15', title: 'Interim order received', description: 'Construction halted pending clearance', by: users[0], status: 'completed' },
      { id: 't14', date: '2024-11-01', title: 'Environmental clearance', description: 'Application deadline', by: users[0], status: 'upcoming' },
    ],
    activityLog: [
      { id: 'al10', timestamp: '2024-09-15T10:00:00Z', type: 'user', user: users[0], description: 'Interim order received and team notified' },
    ],
  },
  {
    id: 'ORDER-2024-020',
    caseTitle: 'Data Breach Investigation',
    caseNumber: 'DPDP/2024/00012',
    court: 'Data Protection Board',
    orderDate: '2024-08-28',
    orderType: 'Compliance Order',
    priority: 'high',
    status: 'completed',
    summary: 'Data Protection Board directed TechCorp to pay ₹5 crore penalty for delayed breach notification and implement data protection measures.',
    keyDirections: '1. Pay penalty of ₹5 crore\n2. Implement data protection framework\n3. Conduct third-party audit',
    owner: users[1],
    watchers: [users[3]],
    relatedDraftId: null,
    relatedPrecedents: ['p6'],
    progress: 100,
    nextAction: 'Completed',
    nextDeadline: '2024-09-20',
    attachments: [
      { id: 'a7', name: 'DPBP_Order.pdf', size: '3.1 MB', uploadedAt: '2024-08-28' },
      { id: 'a8', name: 'Audit_Report.pdf', size: '5.2 MB', uploadedAt: '2024-09-18' },
    ],
    actions: [
      { id: 'act14', action: 'Pay penalty', deadline: '2024-09-10', assignedTo: users[1], status: 'completed', progress: 100 },
      { id: 'act15', action: 'Implement protection framework', deadline: '2024-09-15', assignedTo: users[1], status: 'completed', progress: 100 },
      { id: 'act16', action: 'Third-party audit', deadline: '2024-09-20', assignedTo: users[1], status: 'completed', progress: 100 },
    ],
    timeline: [
      { id: 't15', date: '2024-08-28', title: 'Order received', description: 'DPBP order received', by: users[1], status: 'completed' },
      { id: 't16', date: '2024-09-10', title: 'Penalty paid', description: '₹5 crore penalty paid', by: users[1], status: 'completed' },
      { id: 't17', date: '2024-09-20', title: 'Audit completed', description: 'Third-party audit completed successfully', by: users[1], status: 'completed' },
    ],
    activityLog: [
      { id: 'al11', timestamp: '2024-09-20T16:00:00Z', type: 'user', user: users[1], description: 'All actions completed. Order marked as completed.' },
      { id: 'al12', timestamp: '2024-09-15T14:00:00Z', type: 'user', user: users[1], description: 'Data protection framework implemented' },
    ],
  },
]

export const sampleNotifications = [
  { id: 'n1', type: 'reminder', text: 'Reminder: Court order ORDER-2024-001 due tomorrow', time: '2024-09-29T10:00:00Z', read: false },
  { id: 'n2', type: 'new_precedent', text: 'New precedent added: Kumar vs Builder (SC 2023)', time: '2024-09-29T08:00:00Z', read: false },
  { id: 'n3', type: 'draft_approved', text: 'Draft D-2024-003 approved by Legal Head', time: '2024-09-27T16:00:00Z', read: false },
  { id: 'n4', type: 'reminder', text: 'Insurance claim re-examination report due in 2 days', time: '2024-09-28T15:00:00Z', read: true },
  { id: 'n5', type: 'status_update', text: 'ORDER-2024-001 status changed to In Progress', time: '2024-09-20T14:00:00Z', read: true },
]

export const draftTypes = [
  { value: 'rera_notice', label: 'Legal Notice - RERA Delayed Possession', description: 'Send a legal notice to a builder for delayed possession under RERA Act 2016' },
  { value: 'insurance_complaint', label: 'Complaint - Insurance Claim Rejection (IRDAI)', description: 'File a complaint against insurance claim rejection under IRDAI regulations' },
  { value: 'consumer_complaint', label: 'Consumer Complaint', description: 'File a consumer complaint for defective products or deficiency in service' },
  { value: 'response_notice', label: 'Response to Legal Notice', description: 'Draft a response to a legal notice received from another party' },
]

export const courtOptions = [
  'Supreme Court', 'Delhi High Court', 'Bombay High Court', 'Calcutta High Court',
  'Madras High Court', 'Karnataka High Court', 'Maharashtra RERA Authority',
  'Karnataka RERA Authority', 'Gujarat RERA Authority', 'NCDRC', 'State Consumer Forum',
  'Insurance Ombudsman', 'Data Protection Board', 'Other',
]

export const orderTypeOptions = [
  'Compliance Order', 'Hearing Notice', 'Judgment', 'Interim Order', 'Stay Order', 'Summons', 'Notice',
]

export const researchSuggestions = [
  'What are RERA penalties for delayed possession?',
  'Find insurance claim rejection precedents',
  'Latest Supreme Court data privacy judgments',
]

export const researchTopics = [
  'RERA Act provisions and penalties',
  'IRDAI insurance regulations',
  'Companies Act compliance',
  'Data privacy under DPDP Act',
  'Latest court orders and judgments',
]
