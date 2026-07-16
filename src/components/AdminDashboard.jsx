import React, { useState, useEffect } from 'react';
import { calculateRiskScore, getRiskBucket, getRiskFactors } from '../utils/riskScore';
import { 
  Bell, 
  Phone, 
  HelpCircle, 
  FileText, 
  TrendingUp, 
  User, 
  Activity, 
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

export default function AdminDashboard({ 
  students, 
  setStudents,
  invoices, 
  setInvoices,
  ledger, 
  setLedger,
  timeframe, 
  setTimeframe, 
  onWaiveFee, 
  onSendReminder,
  activityLogs,
  triggerConfetti,
  logActivity
}) {
  const [activeRiskInfo, setActiveRiskInfo] = useState(null); // studentId of open risk factor popup
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCardId, setHoveredCardId] = useState(null);

  // Modal form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('Grade 6-B');
  const [newStudentGuardian, setNewStudentGuardian] = useState('');
  const [newStudentDaysOverdue, setNewStudentDaysOverdue] = useState('15');
  const [newStudentMissedPayments, setNewStudentMissedPayments] = useState('1');
  const [newStudentResponsiveness, setNewStudentResponsiveness] = useState('0.7');

  // Dynamic target revenue based on timeframe (Today, Week, Month)
  const targetRevenue = timeframe === 'Today' ? 50000 : timeframe === 'Week' ? 150000 : 500000;
  
  // Reconciled/Settled transactions
  const settledTx = ledger.filter(tx => tx.status === 'Settled');
  
  // Collected by timeframe
  const getCollectedByTimeframe = () => {
    if (timeframe === 'Today') {
      return settledTx
        .filter(tx => tx.date === '2026-07-09')
        .reduce((sum, tx) => sum + tx.amount, 0);
    }
    if (timeframe === 'Week') {
      const weekDates = ['2026-07-03', '2026-07-04', '2026-07-05', '2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09'];
      return settledTx
        .filter(tx => weekDates.includes(tx.date))
        .reduce((sum, tx) => sum + tx.amount, 0);
    }
    // Month (all July)
    return settledTx
      .filter(tx => tx.date.startsWith('2026-07'))
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const collectedAmount = getCollectedByTimeframe();
  const fillPercentage = Math.min((collectedAmount / targetRevenue) * 100, 100);

  // Revenue by Channel (UPI, Cash, Cheque, Bank)
  const channelData = settledTx.reduce((acc, tx) => {
    acc[tx.channel] = (acc[tx.channel] || 0) + tx.amount;
    return acc;
  }, { UPI: 0, Cash: 0, Cheque: 0, Bank: 0 });

  const totalUPI = channelData.UPI || 0;
  const totalCash = channelData.Cash || 0;
  const totalCheque = channelData.Cheque || 0;
  // Calculate Bank/NEFT collections dynamically, checking both 'Bank' and 'Bank Import' channel tags
  const totalBank = (channelData.Bank || 0) + (channelData['Bank Import'] || 0);

  const totalChannels = totalUPI + totalCash + totalCheque + totalBank;

  // Defaulters calculation: Students with outstanding invoices
  const defaulterList = students
    .map(student => {
      // Find outstanding invoices for this student
      const studentInvoices = invoices.filter(inv => inv.studentId === student.id && inv.status === 'Overdue');
      const totalOwed = studentInvoices.reduce((sum, inv) => sum + inv.amountRemaining, 0);
      const riskScore = calculateRiskScore(student);
      const riskBucket = getRiskBucket(riskScore);
      const riskFactors = getRiskFactors(student);

      return {
        ...student,
        totalOwed,
        riskScore,
        riskBucket,
        riskFactors,
        overdueInvoicesCount: studentInvoices.length
      };
    })
    .filter(d => d.totalOwed > 0)
    // Filter by search query
    .filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.guardianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.grade.toLowerCase().includes(searchQuery.toLowerCase())
    )
    // Sort by riskScore descending
    .sort((a, b) => b.riskScore - a.riskScore);

  // SVG circular progress settings
  const radius = 70;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (fillPercentage / 100) * circumference;

  // Handle Add Student form submit
  const handleAddStudentSubmit = (e) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentGuardian.trim()) return;

    const studentId = `s-new-${Date.now()}`;
    const newStudent = {
      id: studentId,
      name: newStudentName,
      guardianName: newStudentGuardian,
      grade: newStudentGrade,
      daysOverdue: parseInt(newStudentDaysOverdue, 10),
      missedPaymentCount: parseInt(newStudentMissedPayments, 10),
      responsivenessScore: parseFloat(newStudentResponsiveness),
      siblingId: null,
      rollNumber: `26${Math.floor(1000 + Math.random() * 9000)}`
    };

    // Auto-create a Tuition Fee invoice for the student to put them in the defaulter list
    const invoiceId = `inv-new-${Date.now()}`;
    const newInvoice = {
      id: invoiceId,
      studentId: studentId,
      studentName: newStudentName,
      guardianName: newStudentGuardian,
      feeHeadId: 'fh-tuition',
      feeHeadName: 'Tuition Fee',
      amountOriginal: 15000,
      discountAmount: 0,
      penaltyAmount: 0,
      amountRemaining: 15000,
      dueDate: new Date(Date.now() - parseInt(newStudentDaysOverdue, 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Overdue'
    };

    setStudents([...students, newStudent]);
    setInvoices([...invoices, newInvoice]);

    const finalRisk = calculateRiskScore(newStudent);
    logActivity(`👤 Registered student ${newStudentName} (Grade: ${newStudentGrade}, Risk Score: ${finalRisk})`, 'success');
    triggerConfetti();

    // Reset Form
    setNewStudentName('');
    setNewStudentGuardian('');
    setNewStudentDaysOverdue('15');
    setNewStudentMissedPayments('1');
    setNewStudentResponsiveness('0.7');
    setIsAddModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 1 }}>
      
      {/* Timeframe selector header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="display-font" style={{ fontSize: '32px', color: 'var(--ink)' }}>Finance Cockpit</h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '14px', marginTop: '4px' }}>Real-time revenue collections and risk scoring</p>
        </div>
        
        <div className="pill-tabs">
          {['Today', 'Week', 'Month'].map(t => (
            <button
              key={t}
              className={`pill-tab ${timeframe === t ? 'active' : ''}`}
              onClick={() => setTimeframe(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout grid: Dashboard top row */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px' }}>
        
        {/* Collection Pulse Card */}
        <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '340px', textAlign: 'center', position: 'relative' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>
            Collection Pulse ({timeframe})
          </h2>

          <div style={{ position: 'relative', width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Soft pulsing aura behind ring */}
            <div className="pulse-animation" style={{
              position: 'absolute',
              width: '130px',
              height: '130px',
              borderRadius: '50%',
              zIndex: 0
            }}></div>

            <svg height="180" width="180" style={{ transform: 'rotate(-90deg)', zIndex: 1 }}>
              <defs>
                <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--iris)" />
                  <stop offset="100%" stopColor="var(--peach)" />
                </linearGradient>
              </defs>
              {/* Background circle */}
              <circle
                stroke="rgba(139, 124, 246, 0.08)"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={90}
                cy={90}
              />
              {/* Foreground animated progress */}
              <circle
                stroke="url(#pulseGradient)"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={90}
                cy={90}
              />
            </svg>

            {/* Centered Amount Text */}
            <div style={{ position: 'absolute', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="display-font mono-font" style={{ fontSize: '32px', color: 'var(--ink)', lineHeight: 1.1 }}>
                ₹{collectedAmount.toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-secondary)', marginTop: '4px' }}>
                of ₹{targetRevenue.toLocaleString('en-IN')}
              </span>
              <span className="badge badge-mint" style={{ marginTop: '8px', fontSize: '11px' }}>
                {fillPercentage.toFixed(1)}% target
              </span>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '340px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '24px' }}>
              Collection Channel Share
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'center' }}>
              {/* Custom SVG Ring Representation */}
              <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto' }}>
                <svg width="150" height="150" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="15.915" fill="transparent" stroke="rgba(139, 124, 246, 0.05)" strokeWidth="6" />
                  
                  {/* UPI Segment (Purple) */}
                  <circle cx="20" cy="20" r="15.915" fill="transparent" 
                    stroke="var(--iris)" strokeWidth="6.2"
                    strokeDasharray={`${totalChannels > 0 ? (totalUPI / totalChannels) * 100 : 0} ${100 - (totalChannels > 0 ? (totalUPI / totalChannels) * 100 : 0)}`}
                    strokeDashoffset="25" />
                  
                  {/* Cash Segment (Peach) */}
                  <circle cx="20" cy="20" r="15.915" fill="transparent" 
                    stroke="var(--peach)" strokeWidth="6.2"
                    strokeDasharray={`${totalChannels > 0 ? (totalCash / totalChannels) * 100 : 0} ${100 - (totalChannels > 0 ? (totalCash / totalChannels) * 100 : 0)}`}
                    strokeDashoffset={25 - (totalChannels > 0 ? (totalUPI / totalChannels) * 100 : 0)} />

                  {/* Cheque Segment (Mint) */}
                  <circle cx="20" cy="20" r="15.915" fill="transparent" 
                    stroke="var(--mint)" strokeWidth="6.2"
                    strokeDasharray={`${totalChannels > 0 ? (totalCheque / totalChannels) * 100 : 0} ${100 - (totalChannels > 0 ? (totalCheque / totalChannels) * 100 : 0)}`}
                    strokeDashoffset={25 - (totalChannels > 0 ? (totalUPI + totalCash) / totalChannels * 100 : 0)} />

                  {/* Bank/NEFT Segment (Clay) */}
                  <circle cx="20" cy="20" r="15.915" fill="transparent" 
                    stroke="var(--clay)" strokeWidth="6.2"
                    strokeDasharray={`${totalChannels > 0 ? (totalBank / totalChannels) * 100 : 0} ${100 - (totalChannels > 0 ? (totalBank / totalChannels) * 100 : 0)}`}
                    strokeDashoffset={25 - (totalChannels > 0 ? (totalUPI + totalCash + totalCheque) / totalChannels * 100 : 0)} />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="display-font mono-font" style={{ fontSize: '20px', color: 'var(--ink)' }}>
                    ₹{(totalChannels / 1000).toFixed(0)}k
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--ink-secondary)' }}>Collected</span>
                </div>
              </div>

              {/* Legend List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifySelf: 'space-between', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--iris)' }}></div>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>UPI Collections</span>
                  </div>
                  <span className="mono-font" style={{ fontSize: '13px', fontWeight: 600 }}>₹{totalUPI.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifySelf: 'space-between', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--peach)' }}></div>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Cash Logged</span>
                  </div>
                  <span className="mono-font" style={{ fontSize: '13px', fontWeight: 600 }}>₹{totalCash.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifySelf: 'space-between', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--mint)' }}></div>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Cheques Cleared</span>
                  </div>
                  <span className="mono-font" style={{ fontSize: '13px', fontWeight: 600 }}>₹{totalCheque.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifySelf: 'space-between', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--clay)' }}></div>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Bank Transfers</span>
                  </div>
                  <span className="mono-font" style={{ fontSize: '13px', fontWeight: 600 }}>₹{totalBank.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prioritized Defaulter List */}
      <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 className="display-font" style={{ fontSize: '20px', color: 'var(--ink)' }}>Prioritized Action List</h2>
            <p style={{ color: 'var(--ink-secondary)', fontSize: '13px', marginTop: '2px' }}>
              Defaulter risk scoring combines outstanding balances, days overdue, and historic response rates.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => setIsAddModalOpen(true)} style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '10px' }}>
              <span>+ Add Student</span>
            </button>
            <div style={{ position: 'relative', width: '250px', maxWidth: '100%' }}>
              <input
                type="text"
                placeholder="Search defaulters..."
                className="glass-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '16px', paddingTop: '8px', paddingBottom: '8px' }}
              />
            </div>
          </div>
        </div>

        {defaulterList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <CheckCircle size={40} color="var(--mint)" />
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>All Caught Up!</p>
            <p style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>No outstanding balances require follow-up at this time.</p>
          </div>
        ) : (
          <div className="defaulter-grid">
            {defaulterList.map(defaulter => {
              const isPopupOpen = activeRiskInfo === defaulter.id;
              
              // Handle risk factors breakdown toggle for touch accessibility & hover/focus
              const toggleBreakdown = (e) => {
                e.stopPropagation();
                if (isPopupOpen) {
                  setActiveRiskInfo(null);
                } else {
                  setActiveRiskInfo(defaulter.id);
                }
              };

              const handleKeyDown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleBreakdown(e);
                }
              };

              return (
                <div 
                  key={defaulter.id} 
                  className="glass-card glass-card-interactive defaulter-card"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.45)', position: 'relative', overflow: 'visible' }}
                  onMouseEnter={() => setHoveredCardId(defaulter.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                >
                  {/* Custom Sliding Hover Background (Aceternity UI style) */}
                  <div 
                    className="card-hover-bg-glow"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'radial-gradient(circle at 50% 50%, rgba(139, 124, 246, 0.07) 0%, transparent 80%)',
                      opacity: hoveredCardId === defaulter.id ? 1 : 0,
                      transition: 'opacity 0.3s ease',
                      pointerEvents: 'none',
                      zIndex: 0
                    }}
                  />
                  
                  {/* Left Column: Student identity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'rgba(139, 124, 246, 0.1)',
                      color: 'var(--iris-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '15px'
                    }}>
                      {defaulter.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--ink)' }}>{defaulter.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--ink-secondary)', marginTop: '2px' }}>
                        {defaulter.grade} • Guardian: {defaulter.guardianName}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Owed Amount and Days Overdue */}
                  <div style={{ display: 'flex', gap: '32px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'right' }}>
                      <span className="mono-font" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
                        ₹{defaulter.totalOwed.toLocaleString('en-IN')}
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--ink-secondary)', marginTop: '2px' }}>
                        {defaulter.overdueInvoicesCount} invoice{defaulter.overdueInvoicesCount > 1 ? 's' : ''} overdue
                      </div>
                    </div>

                    {/* Interactive Risk Badge */}
                    <div 
                      style={{ position: 'relative' }}
                      onMouseEnter={() => setActiveRiskInfo(defaulter.id)}
                      onMouseLeave={() => setActiveRiskInfo(null)}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={toggleBreakdown}
                        onKeyDown={handleKeyDown}
                        className={`badge badge-${defaulter.riskBucket.colorClass}`}
                        style={{ 
                          cursor: 'pointer', 
                          padding: '6px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          userSelect: 'none'
                        }}
                      >
                        <Activity size={12} />
                        <span>Risk: {defaulter.riskBucket.label}</span>
                        <span className="mono-font" style={{ opacity: 0.8, fontSize: '10px' }}>({defaulter.riskScore})</span>
                      </div>

                      {/* Floating Risk Factors Breakdown Popup */}
                      {isPopupOpen && (
                        <div 
                          className="glass-card"
                          style={{
                            position: 'absolute',
                            bottom: '100%',
                            right: '50%',
                            transform: 'translateX(50%) translateY(-8px)',
                            width: '280px',
                            padding: '16px',
                            backgroundColor: 'white',
                            border: '1px solid rgba(139, 124, 246, 0.25)',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                            zIndex: 100,
                            textAlign: 'left',
                            borderRadius: '12px'
                          }}
                          onClick={(e) => e.stopPropagation()} // Prevent close on clicking popup content
                        >
                          <div style={{ fontWeight: 600, fontSize: '13px', borderBottom: '1px solid rgba(139, 124, 246, 0.1)', paddingBottom: '8px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertCircle size={14} color="var(--iris)" />
                            <span>Risk Score Factors Breakdown</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--ink-secondary)' }}>Days Overdue:</span>
                              <span className="mono-font" style={{ fontWeight: 600 }}>{defaulter.riskFactors.factors.daysOverdue} days (x2)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--ink-secondary)' }}>Prior Missed Payments:</span>
                              <span className="mono-font" style={{ fontWeight: 600 }}>{defaulter.riskFactors.factors.missedPaymentCount} (x15)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--ink-secondary)' }}>Guardian Responsiveness:</span>
                              <span className="mono-font" style={{ fontWeight: 600 }}>{(defaulter.riskFactors.factors.responsivenessScore * 100).toFixed(0)}% (-10)</span>
                            </div>
                            <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px dotted rgba(139, 124, 246, 0.1)', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '13px' }}>
                              <span>Total Score:</span>
                              <span className="mono-font" style={{ color: 'var(--iris-dark)' }}>{defaulter.riskScore}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--ink-tertiary)', marginTop: '8px', textAlign: 'center' }}>
                            Click badge again to dismiss
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions (Visible on hover/focus) */}
                  <div style={{ position: 'relative', width: '220px', display: 'flex', justifyContent: 'flex-end', zIndex: 1 }}>
                    
                    {/* Default visible info */}
                    <div className="defaulter-meta-side" style={{ fontSize: '12px', color: 'var(--ink-secondary)' }}>
                      <span>Due: {defaulter.daysOverdue} days ago</span>
                    </div>

                    {/* Quick action buttons (revealed on hover) */}
                    <div className="quick-actions" style={{ position: 'absolute', right: 0 }}>
                      <button 
                        className="btn-primary" 
                        onClick={() => onSendReminder(defaulter)}
                        style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
                        title="Send SMS/WhatsApp notification"
                      >
                        <Bell size={12} />
                        <span>Remind</span>
                      </button>
                      <button 
                        className="btn-secondary" 
                        onClick={() => onWaiveFee(defaulter)}
                        style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
                        title="Apply waiver rule to overdue fee"
                      >
                        <span>Waive</span>
                      </button>
                      <a 
                        href={`tel:${defaulter.id === 's-11' ? '9876543210' : '9988776655'}`}
                        className="btn-secondary"
                        style={{ padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Call Guardian"
                      >
                        <Phone size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Student Glass Modal Overlay */}
      {isAddModalOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="glass-card" style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '450px',
            maxWidth: '90vw',
            padding: '32px',
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(139, 124, 246, 0.25)',
            boxShadow: '0 20px 50px -10px rgba(31,38,135,0.15)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="display-font" style={{ fontSize: '22px', color: 'var(--ink)' }}>Register New Student</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', display: 'block', marginBottom: '6px' }}>
                  Student Full Name
                </label>
                <input 
                  type="text" 
                  className="glass-input" 
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Advait Nair" 
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', display: 'block', marginBottom: '6px' }}>
                    Grade Segment
                  </label>
                  <select 
                    className="glass-input glass-select"
                    value={newStudentGrade}
                    onChange={(e) => setNewStudentGrade(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="Grade 3-A">Grade 3-A</option>
                    <option value="Grade 5-A">Grade 5-A</option>
                    <option value="Grade 6-B">Grade 6-B</option>
                    <option value="Grade 7-B">Grade 7-B</option>
                    <option value="Grade 8-A">Grade 8-A</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', display: 'block', marginBottom: '6px' }}>
                    Guardian Name
                  </label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    value={newStudentGuardian}
                    onChange={(e) => setNewStudentGuardian(e.target.value)}
                    placeholder="e.g. Ramesh Nair" 
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', display: 'block', marginBottom: '6px' }}>
                    Days Overdue
                  </label>
                  <input 
                    type="number" 
                    className="glass-input" 
                    value={newStudentDaysOverdue}
                    onChange={(e) => setNewStudentDaysOverdue(e.target.value)}
                    min="0"
                    max="120"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', display: 'block', marginBottom: '6px' }}>
                    Missed Payments
                  </label>
                  <input 
                    type="number" 
                    className="glass-input" 
                    value={newStudentMissedPayments}
                    onChange={(e) => setNewStudentMissedPayments(e.target.value)}
                    min="0"
                    max="10"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Guardian Responsiveness</span>
                  <span>{(parseFloat(newStudentResponsiveness) * 100).toFixed(0)}%</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={newStudentResponsiveness}
                  onChange={(e) => setNewStudentResponsiveness(e.target.value)}
                  style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--iris)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Register Student & Invoice
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </>
      )}

    </div>
  );
}
