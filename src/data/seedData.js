// Seed Data for SmartSchool FinTech Demo App
// Target Academic Year: 2026-2027
// Current Local Time Context: July 2026

export const MOCK_TARGET_REVENUE = 500000;

export const INITIAL_FEE_HEADS = [
  {
    id: 'fh-tuition',
    name: 'Tuition Fee',
    amount: 15000,
    frequency: 'quarterly', // monthly, quarterly, annual, one-time
    applicableClasses: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'],
    rules: [
      {
        id: 'r-sib-tuition',
        type: 'sibling_discount', // sibling_discount, late_payment, cheque_bounce
        calculationType: 'percentage', // percentage, flat
        value: 20,
        capAmount: null,
        appliesToFeeHeadId: 'fh-tuition',
        description: '20% sibling discount on Tuition'
      },
      {
        id: 'r-late-tuition',
        type: 'late_payment',
        calculationType: 'percentage',
        value: 2,
        capAmount: 500,
        appliesToFeeHeadId: 'fh-tuition',
        description: '2% late fee capped at ₹500'
      }
    ]
  },
  {
    id: 'fh-transport',
    name: 'Transport Fee',
    amount: 3500,
    frequency: 'monthly',
    applicableClasses: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
    rules: [
      {
        id: 'r-bounce-transport',
        type: 'cheque_bounce',
        calculationType: 'flat',
        value: 250,
        capAmount: null,
        appliesToFeeHeadId: 'fh-transport',
        description: 'Cheque Bounce Penalty ₹250 flat'
      }
    ]
  },
  {
    id: 'fh-hostel',
    name: 'Hostel Fee',
    amount: 25000,
    frequency: 'quarterly',
    applicableClasses: ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
    rules: []
  },
  {
    id: 'fh-activity',
    name: 'Activity & Labs Fee',
    amount: 1500,
    frequency: 'one-time',
    applicableClasses: ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
    rules: []
  },
  {
    id: 'fh-exam',
    name: 'Exam Fee',
    amount: 1000,
    frequency: 'one-time',
    applicableClasses: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
    rules: []
  }
];

export const INITIAL_STUDENTS = [
  // --- LOW RISK (0-15 days overdue or fully paid, 0 missed payments) ---
  {
    id: 's-1',
    name: 'Aryan Sharma',
    guardianName: 'Amit Sharma',
    grade: 'Grade 6-B',
    daysOverdue: 0,
    missedPaymentCount: 0,
    responsivenessScore: 0.9,
    siblingId: null,
    rollNumber: '260602'
  },
  {
    id: 's-2',
    name: 'Diya Patel',
    guardianName: 'Sanjay Patel',
    grade: 'Grade 3-A',
    daysOverdue: 5,
    missedPaymentCount: 0,
    responsivenessScore: 0.85,
    siblingId: 's-3', // Sibling link
    rollNumber: '260312'
  },
  {
    id: 's-3',
    name: 'Rohan Patel',
    guardianName: 'Sanjay Patel',
    grade: 'Grade 5-B',
    daysOverdue: 0,
    missedPaymentCount: 0,
    responsivenessScore: 0.85,
    siblingId: 's-2',
    rollNumber: '260515'
  },
  {
    id: 's-4',
    name: 'Kabir Sen',
    guardianName: 'Rajat Sen',
    grade: 'Grade 7-C',
    daysOverdue: 12,
    missedPaymentCount: 0,
    responsivenessScore: 0.8,
    siblingId: null,
    rollNumber: '260710'
  },
  {
    id: 's-5',
    name: 'Meera Nair',
    guardianName: 'Karan Nair',
    grade: 'Grade 4-A',
    daysOverdue: 0,
    missedPaymentCount: 0,
    responsivenessScore: 0.95,
    siblingId: null,
    rollNumber: '260408'
  },

  // --- MED RISK (16-40 days overdue, 1 missed payment) ---
  {
    id: 's-6',
    name: 'Ananya Iyer',
    guardianName: 'Subramanian Iyer',
    grade: 'Grade 6-A',
    daysOverdue: 18,
    missedPaymentCount: 1,
    responsivenessScore: 0.7,
    siblingId: null,
    rollNumber: '260614'
  },
  {
    id: 's-7',
    name: 'Arjun Reddy',
    guardianName: 'Praveen Reddy',
    grade: 'Grade 8-B',
    daysOverdue: 22,
    missedPaymentCount: 1,
    responsivenessScore: 0.65,
    siblingId: null,
    rollNumber: '260803'
  },
  {
    id: 's-8',
    name: 'Karan Malhotra',
    guardianName: 'Vikrant Malhotra',
    grade: 'Grade 5-A',
    daysOverdue: 35,
    missedPaymentCount: 1,
    responsivenessScore: 0.6,
    siblingId: null,
    rollNumber: '260502'
  },
  {
    id: 's-9',
    name: 'Riya Gupta',
    guardianName: 'Vijay Gupta',
    grade: 'Grade 3-C',
    daysOverdue: 28,
    missedPaymentCount: 1,
    responsivenessScore: 0.75,
    siblingId: null,
    rollNumber: '260309'
  },
  {
    id: 's-10',
    name: 'Siddharth Joshi',
    guardianName: 'Manish Joshi',
    grade: 'Grade 7-A',
    daysOverdue: 16,
    missedPaymentCount: 1,
    responsivenessScore: 0.8,
    siblingId: null,
    rollNumber: '260722'
  },

  // --- HIGH RISK (41+ days overdue, 2+ missed payments, low responsiveness) ---
  {
    id: 's-11',
    name: 'Dev Verma',
    guardianName: 'Rajesh Verma',
    grade: 'Grade 8-A',
    daysOverdue: 45,
    missedPaymentCount: 2,
    responsivenessScore: 0.3,
    siblingId: null,
    rollNumber: '260811'
  },
  {
    id: 's-12',
    name: 'Ishaan Kapoor',
    guardianName: 'Sanjay Kapoor',
    grade: 'Grade 6-C',
    daysOverdue: 55,
    missedPaymentCount: 3,
    responsivenessScore: 0.25,
    siblingId: null,
    rollNumber: '260633'
  },
  {
    id: 's-13',
    name: 'Nisha Saxena',
    guardianName: 'Alok Saxena',
    grade: 'Grade 7-B',
    daysOverdue: 50,
    missedPaymentCount: 2,
    responsivenessScore: 0.4,
    siblingId: null,
    rollNumber: '260706'
  },
  {
    id: 's-14',
    name: 'Pooja Trivedi',
    guardianName: 'Kamlesh Trivedi',
    grade: 'Grade 5-C',
    daysOverdue: 42,
    missedPaymentCount: 2,
    responsivenessScore: 0.35,
    siblingId: null,
    rollNumber: '260519'
  },
  {
    id: 's-15',
    name: 'Vikram Singh',
    guardianName: 'Surya Pratap Singh',
    grade: 'Grade 8-C',
    daysOverdue: 60,
    missedPaymentCount: 4,
    responsivenessScore: 0.2,
    siblingId: null,
    rollNumber: '260825'
  }
];

export const INITIAL_INVOICES = [
  // Aryan Sharma - Fully Paid Tuition + Transport
  {
    id: 'inv-1',
    studentId: 's-1',
    studentName: 'Aryan Sharma',
    guardianName: 'Amit Sharma',
    feeHeadId: 'fh-tuition',
    feeHeadName: 'Tuition Fee',
    amountOriginal: 15000,
    discountAmount: 0,
    penaltyAmount: 0,
    amountRemaining: 0,
    dueDate: '2026-07-01',
    status: 'Paid'
  },
  {
    id: 'inv-2',
    studentId: 's-1',
    studentName: 'Aryan Sharma',
    guardianName: 'Amit Sharma',
    feeHeadId: 'fh-transport',
    feeHeadName: 'Transport Fee',
    amountOriginal: 3500,
    discountAmount: 0,
    penaltyAmount: 0,
    amountRemaining: 0,
    dueDate: '2026-07-05',
    status: 'Paid'
  },
  // Diya Patel - Has Sibling discount rule, Outstanding (Low risk)
  {
    id: 'inv-3',
    studentId: 's-2',
    studentName: 'Diya Patel',
    guardianName: 'Sanjay Patel',
    feeHeadId: 'fh-tuition',
    feeHeadName: 'Tuition Fee',
    amountOriginal: 15000,
    discountAmount: 3000, // 20% sibling discount
    penaltyAmount: 0,
    amountRemaining: 12000,
    dueDate: '2026-07-04', // 5 days overdue (since current is July 9)
    status: 'Overdue'
  },
  // Rohan Patel - Sibling, Fully Paid
  {
    id: 'inv-4',
    studentId: 's-3',
    studentName: 'Rohan Patel',
    guardianName: 'Sanjay Patel',
    feeHeadId: 'fh-tuition',
    feeHeadName: 'Tuition Fee',
    amountOriginal: 15000,
    discountAmount: 3000,
    penaltyAmount: 0,
    amountRemaining: 0,
    dueDate: '2026-07-01',
    status: 'Paid'
  },
  // Kabir Sen - Low risk outstanding
  {
    id: 'inv-5',
    studentId: 's-4',
    studentName: 'Kabir Sen',
    guardianName: 'Rajat Sen',
    feeHeadId: 'fh-tuition',
    feeHeadName: 'Tuition Fee',
    amountOriginal: 15000,
    discountAmount: 0,
    penaltyAmount: 0,
    amountRemaining: 15000,
    dueDate: '2026-06-27', // 12 days overdue
    status: 'Overdue'
  },
  // Ananya Iyer - Med risk outstanding (Tuition)
  {
    id: 'inv-6',
    studentId: 's-6',
    studentName: 'Ananya Iyer',
    guardianName: 'Subramanian Iyer',
    feeHeadId: 'fh-tuition',
    feeHeadName: 'Tuition Fee',
    amountOriginal: 15000,
    discountAmount: 0,
    penaltyAmount: 300, // 2% of 15000
    amountRemaining: 15300,
    dueDate: '2026-06-21', // 18 days overdue
    status: 'Overdue'
  },
  // Arjun Reddy - Med risk outstanding (Tuition + Transport)
  {
    id: 'inv-7',
    studentId: 's-7',
    studentName: 'Arjun Reddy',
    guardianName: 'Praveen Reddy',
    feeHeadId: 'fh-tuition',
    feeHeadName: 'Tuition Fee',
    amountOriginal: 15000,
    discountAmount: 0,
    penaltyAmount: 300,
    amountRemaining: 15300,
    dueDate: '2026-06-17', // 22 days overdue
    status: 'Overdue'
  },
  {
    id: 'inv-8',
    studentId: 's-7',
    studentName: 'Arjun Reddy',
    guardianName: 'Praveen Reddy',
    feeHeadId: 'fh-transport',
    feeHeadName: 'Transport Fee',
    amountOriginal: 3500,
    discountAmount: 0,
    penaltyAmount: 0,
    amountRemaining: 3500,
    dueDate: '2026-07-05',
    status: 'Overdue'
  },
  // Karan Malhotra - Med risk outstanding
  {
    id: 'inv-9',
    studentId: 's-8',
    studentName: 'Karan Malhotra',
    guardianName: 'Vikrant Malhotra',
    feeHeadId: 'fh-tuition',
    feeHeadName: 'Tuition Fee',
    amountOriginal: 15000,
    discountAmount: 0,
    penaltyAmount: 300,
    amountRemaining: 15300,
    dueDate: '2026-06-04', // 35 days overdue
    status: 'Overdue'
  },
  // Dev Verma - High risk outstanding
  {
    id: 'inv-10',
    studentId: 's-11',
    studentName: 'Dev Verma',
    guardianName: 'Rajesh Verma',
    feeHeadId: 'fh-tuition',
    feeHeadName: 'Tuition Fee',
    amountOriginal: 15000,
    discountAmount: 0,
    penaltyAmount: 300,
    amountRemaining: 15300,
    dueDate: '2026-05-25', // 45 days overdue
    status: 'Overdue'
  },
  {
    id: 'inv-11',
    studentId: 's-11',
    studentName: 'Dev Verma',
    guardianName: 'Rajesh Verma',
    feeHeadId: 'fh-transport',
    feeHeadName: 'Transport Fee',
    amountOriginal: 3500,
    discountAmount: 0,
    penaltyAmount: 0,
    amountRemaining: 3500,
    dueDate: '2026-07-05',
    status: 'Overdue'
  },
  // Ishaan Kapoor - High risk outstanding
  {
    id: 'inv-12',
    studentId: 's-12',
    studentName: 'Ishaan Kapoor',
    guardianName: 'Sanjay Kapoor',
    feeHeadId: 'fh-tuition',
    feeHeadName: 'Tuition Fee',
    amountOriginal: 15000,
    discountAmount: 0,
    penaltyAmount: 300,
    amountRemaining: 15300,
    dueDate: '2026-05-15', // 55 days overdue
    status: 'Overdue'
  },
  // Vikram Singh - High risk outstanding
  {
    id: 'inv-13',
    studentId: 's-15',
    studentName: 'Vikram Singh',
    guardianName: 'Surya Pratap Singh',
    feeHeadId: 'fh-tuition',
    feeHeadName: 'Tuition Fee',
    amountOriginal: 15000,
    discountAmount: 0,
    penaltyAmount: 300,
    amountRemaining: 15300,
    dueDate: '2026-05-10', // 60 days overdue
    status: 'Overdue'
  }
];

export const INITIAL_LEDGER = [
  // --- UPI Transactions (10) ---
  {
    id: 'tx-1',
    invoiceId: 'inv-1',
    studentName: 'Aryan Sharma',
    amount: 15000,
    channel: 'UPI',
    status: 'Settled',
    date: '2026-07-01',
    reference: 'UPI9827402830'
  },
  {
    id: 'tx-2',
    invoiceId: 'inv-4',
    studentName: 'Rohan Patel',
    amount: 12000,
    channel: 'UPI',
    status: 'Settled',
    date: '2026-07-01',
    reference: 'UPI1029482736'
  },
  {
    id: 'tx-3',
    invoiceId: 'inv-5',
    studentName: 'Kabir Sen',
    amount: 15000,
    channel: 'UPI',
    status: 'Pending',
    date: '2026-07-09',
    reference: 'UPI5566778899'
  },
  {
    id: 'tx-4',
    invoiceId: null,
    studentName: 'Diya Patel',
    amount: 12000,
    channel: 'UPI',
    status: 'Pending',
    date: '2026-07-09',
    reference: 'UPI4433221100'
  },
  {
    id: 'tx-5',
    invoiceId: null,
    studentName: 'Meera Nair',
    amount: 15000,
    channel: 'UPI',
    status: 'Settled',
    date: '2026-07-02',
    reference: 'UPI8899001122'
  },
  {
    id: 'tx-6',
    invoiceId: null,
    studentName: 'Ananya Iyer',
    amount: 5000,
    channel: 'UPI',
    status: 'Pending',
    date: '2026-07-08',
    reference: 'UPI1234567890'
  },
  {
    id: 'tx-7',
    invoiceId: null,
    studentName: 'Arjun Reddy',
    amount: 3500,
    channel: 'UPI',
    status: 'Settled',
    date: '2026-07-05',
    reference: 'UPI2468135790'
  },
  {
    id: 'tx-8',
    invoiceId: null,
    studentName: 'Riya Gupta',
    amount: 15000,
    channel: 'UPI',
    status: 'Pending',
    date: '2026-07-09',
    reference: 'UPI1357924680'
  },
  {
    id: 'tx-9',
    invoiceId: null,
    studentName: 'Siddharth Joshi',
    amount: 1000,
    channel: 'UPI',
    status: 'Settled',
    date: '2026-07-06',
    reference: 'UPI9876543210'
  },
  {
    id: 'tx-10',
    invoiceId: null,
    studentName: 'Karan Malhotra',
    amount: 15300,
    channel: 'UPI',
    status: 'Pending',
    date: '2026-07-09',
    reference: 'UPI8888888888'
  },

  // --- Cash Transactions (8) ---
  {
    id: 'tx-11',
    invoiceId: 'inv-2',
    studentName: 'Aryan Sharma',
    amount: 3500,
    channel: 'Cash',
    status: 'Settled', // Reconciled
    date: '2026-07-05',
    reference: 'CASH-REC-001'
  },
  {
    id: 'tx-12',
    invoiceId: null,
    studentName: 'Meera Nair',
    amount: 1500,
    channel: 'Cash',
    status: 'Matched',
    date: '2026-07-08',
    reference: 'CASH-REC-002'
  },
  {
    id: 'tx-13',
    invoiceId: null,
    studentName: 'Rohan Patel',
    amount: 3500,
    channel: 'Cash',
    status: 'Logged',
    date: '2026-07-07',
    reference: 'CASH-REC-003'
  },
  {
    id: 'tx-14',
    invoiceId: null,
    studentName: 'Diya Patel',
    amount: 3500,
    channel: 'Cash',
    status: 'Logged',
    date: '2026-07-07',
    reference: 'CASH-REC-004'
  },
  {
    id: 'tx-15',
    invoiceId: null,
    studentName: 'Ananya Iyer',
    amount: 3500,
    channel: 'Cash',
    status: 'Matched',
    date: '2026-07-08',
    reference: 'CASH-REC-005'
  },
  {
    id: 'tx-16',
    invoiceId: null,
    studentName: 'Kabir Sen',
    amount: 1000,
    channel: 'Cash',
    status: 'Logged',
    date: '2026-07-08',
    reference: 'CASH-REC-006'
  },
  // Cash Transactions that originated from offline outbox sync
  {
    id: 'tx-17',
    invoiceId: null,
    studentName: 'Siddharth Joshi',
    amount: 3500,
    channel: 'Cash',
    status: 'Settled',
    date: '2026-07-09',
    reference: 'OFFLINE-SYNC-17'
  },
  {
    id: 'tx-18',
    invoiceId: null,
    studentName: 'Karan Malhotra',
    amount: 3500,
    channel: 'Cash',
    status: 'Settled',
    date: '2026-07-09',
    reference: 'OFFLINE-SYNC-18'
  },

  // --- Cheque Transactions (4) ---
  {
    id: 'tx-19',
    invoiceId: null,
    studentName: 'Meera Nair',
    amount: 25000,
    channel: 'Cheque',
    status: 'Settled', // Cleared
    date: '2026-06-28',
    reference: 'CHQ-482012'
  },
  {
    id: 'tx-20',
    invoiceId: null,
    studentName: 'Aryan Sharma',
    amount: 25000,
    channel: 'Cheque',
    status: 'Settled', // Cleared
    date: '2026-06-29',
    reference: 'CHQ-990812'
  },
  {
    id: 'tx-21',
    invoiceId: 'inv-8',
    studentName: 'Arjun Reddy',
    amount: 3500,
    channel: 'Cheque',
    status: 'Bounced', // Bounced with penalty applied
    date: '2026-07-05',
    reference: 'CHQ-112233'
  },
  {
    id: 'tx-22',
    invoiceId: null,
    studentName: 'Diya Patel',
    amount: 12000,
    channel: 'Cheque',
    status: 'Logged', // Deposited/pending
    date: '2026-07-08',
    reference: 'CHQ-445566'
  },

  // --- Preloaded Bank statement lines for fuzzy match testing (3) ---
  {
    id: 'bi-1',
    dateStr: '08/07/2026',
    amount: 15300,
    narration: 'NEFT TRANSFER FROM SUBRAMANIAN IYER',
    status: 'Pending',
    confidence: 'high' // Pre-resolved internally as high (exact match for Ananya Iyer Tuition inv-6, due 2026-06-21)
  },
  {
    id: 'bi-2',
    dateStr: '07/07/2026',
    amount: 15300,
    narration: 'V MALHOTRA TUITION FEE DEPOSIT',
    status: 'Pending',
    confidence: 'medium' // Pre-resolved as medium (exact amount, name mismatch Malhotra vs Vikrant Malhotra)
  },
  {
    id: 'bi-3',
    dateStr: '09/07/2026',
    amount: 8888,
    narration: 'UPI TRAN TO SCHOOL / REF 998822',
    status: 'Pending',
    confidence: 'unmatched' // Mismatched amount
  }
];
