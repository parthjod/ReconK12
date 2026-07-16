import React, { useState, useEffect } from 'react';
import { Play, Square, Zap, Smartphone, AlertOctagon, Landmark, Activity, ChevronUp, ChevronDown, CheckCircle, Bell } from 'lucide-react';
import { calculateRiskScore } from '../utils/riskScore';

export default function SimulatorPanel({
  students,
  setStudents,
  invoices,
  setInvoices,
  ledger,
  setLedger,
  importedLines,
  setImportedLines,
  feeHeads,
  activityLogs,
  logActivity,
  triggerConfetti,
  showToast
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [autopilot, setAutopilot] = useState(false);
  const [isSyncingCash, setIsSyncingCash] = useState(false);

  // Autopilot interval timer
  useEffect(() => {
    if (!autopilot) return;

    const interval = setInterval(() => {
      // Pick a random action to simulate: 60% UPI Payment, 20% Offline Cash Sync, 20% Cheque Bounce
      const rand = Math.random();
      if (rand < 0.6) {
        simulateUPIPayment();
      } else if (rand < 0.8) {
        simulateOfflineCash();
      } else {
        simulateChequeBounce();
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [autopilot, students, invoices, ledger, feeHeads]);

  // UPI Simulation Helper
  const simulateUPIPayment = () => {
    // Find students with overdue invoices
    const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');
    if (overdueInvoices.length === 0) {
      logActivity('ℹ️ Autopilot: No overdue invoices left to collect.', 'info');
      return;
    }

    // Pick a random overdue invoice
    const randomInv = overdueInvoices[Math.floor(Math.random() * overdueInvoices.length)];
    const student = students.find(s => s.id === randomInv.studentId);
    if (!student) return;

    const amountPaid = randomInv.amountRemaining;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const txnId = 'UPI' + Math.floor(1000000000 + Math.random() * 9000000000);

    // 1. Update Invoice status
    setInvoices(prevInvoices => prevInvoices.map(inv => {
      if (inv.id === randomInv.id) {
        return { ...inv, status: 'Paid', amountRemaining: 0 };
      }
      return inv;
    }));

    // 2. Update Student Overdue details
    setStudents(prevStudents => prevStudents.map(s => {
      if (s.id === student.id) {
        // If they had multiple overdue invoices, reduce their count or set daysOverdue to 0 if all paid
        const studentRemaining = invoices.filter(i => i.studentId === student.id && i.id !== randomInv.id && i.status === 'Overdue');
        return {
          ...s,
          daysOverdue: studentRemaining.length > 0 ? s.daysOverdue : 0,
          missedPaymentCount: Math.max(0, s.missedPaymentCount - 1)
        };
      }
      return s;
    }));

    // 3. Add transaction to Ledger
    const newTx = {
      id: `tx-sim-upi-${Date.now()}`,
      invoiceId: randomInv.id,
      studentName: student.name,
      amount: amountPaid,
      channel: 'UPI',
      status: 'Settled',
      date: dateStr,
      reference: txnId
    };
    setLedger(prevLedger => [...prevLedger, newTx]);

    logActivity(`⚡ UPI Payment of ₹${amountPaid.toLocaleString('en-IN')} auto-reconciled for ${student.name}`, 'success');
    triggerConfetti();
    showToast(`Payment of ₹${amountPaid} settled for ${student.name}.`);
  };

  // Offline Cash Sync Helper
  const simulateOfflineCash = () => {
    // Pick an overdue student
    const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');
    if (overdueInvoices.length === 0) return;
    const randomInv = overdueInvoices[Math.floor(Math.random() * overdueInvoices.length)];
    const student = students.find(s => s.id === randomInv.studentId);
    if (!student) return;

    const cashAmount = randomInv.amountRemaining;
    logActivity(`💵 Ramesh logged Cash of ₹${cashAmount.toLocaleString('en-IN')} for ${student.name} [OFFLINE]`, 'info');
    setIsSyncingCash(true);

    // Simulate connection delay and synchronization
    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];

      // 1. Update Invoice status
      setInvoices(prevInvoices => prevInvoices.map(inv => {
        if (inv.id === randomInv.id) {
          return { ...inv, status: 'Paid', amountRemaining: 0 };
        }
        return inv;
      }));

      // 2. Update Student Overdue details
      setStudents(prevStudents => prevStudents.map(s => {
        if (s.id === student.id) {
          return { ...s, daysOverdue: 0, missedPaymentCount: Math.max(0, s.missedPaymentCount - 1) };
        }
        return s;
      }));

      // 3. Add to Ledger
      const newTx = {
        id: `tx-sim-cash-${Date.now()}`,
        invoiceId: randomInv.id,
        studentName: student.name,
        amount: cashAmount,
        channel: 'Cash',
        status: 'Settled',
        date: dateStr,
        reference: `CASH-SYNC-${Date.now().toString().slice(-6)}`
      };
      setLedger(prevLedger => [...prevLedger, newTx]);

      logActivity(`🔄 Synced offline receipt: Reconciled Cash of ₹${cashAmount.toLocaleString('en-IN')} for ${student.name}`, 'success');
      setIsSyncingCash(false);
      triggerConfetti();
      showToast(`Synced cash receipt for ${student.name}.`);
    }, 3000);
  };

  // Cheque Bounce Helper
  const simulateChequeBounce = () => {
    // Find pending/logged cheques in the ledger
    const pendingCheques = ledger.filter(tx => tx.channel === 'Cheque' && tx.status === 'Logged');
    let targetTx = null;

    if (pendingCheques.length > 0) {
      targetTx = pendingCheques[Math.floor(Math.random() * pendingCheques.length)];
    } else {
      // If no pending cheques, create one first for Diya Patel or Aryan Sharma
      const targetStudent = students.find(s => s.id === 's-2') || students[0];
      const targetInvoice = invoices.find(inv => inv.studentId === targetStudent.id) || invoices[0];
      
      const dummyTx = {
        id: `tx-sim-chq-dummy-${Date.now()}`,
        invoiceId: targetInvoice.id,
        studentName: targetStudent.name,
        amount: targetInvoice.amountOriginal,
        channel: 'Cheque',
        status: 'Logged',
        date: '2026-07-09',
        reference: `CHQ-SIM-${Math.floor(100000 + Math.random() * 900000)}`
      };
      setLedger(prev => [...prev, dummyTx]);
      targetTx = dummyTx;
      logActivity(`✍️ Logged Cheque ${dummyTx.reference} for ${dummyTx.studentName} (Pending clearance)`, 'info');
      return;
    }

    // Now bounce the target transaction
    const targetInvoice = invoices.find(inv => inv.id === targetTx.invoiceId);
    if (!targetInvoice) return;

    // Check penalty rules
    const feeHead = feeHeads.find(fh => fh.id === targetInvoice.feeHeadId);
    const bounceRule = feeHead?.rules?.find(r => r.type === 'cheque_bounce');
    const penaltyAmount = bounceRule ? (bounceRule.calculationType === 'flat' ? bounceRule.value : targetInvoice.amountOriginal * (bounceRule.value / 100)) : 250; // default 250 if rule configuration was modified

    // 1. Mark transaction as Bounced
    setLedger(prevLedger => prevLedger.map(t => {
      if (t.id === targetTx.id) {
        return { ...t, status: 'Bounced' };
      }
      return t;
    }));

    // 2. Add penalty to Invoice and revert to Overdue
    setInvoices(prevInvoices => prevInvoices.map(inv => {
      if (inv.id === targetInvoice.id) {
        return {
          ...inv,
          status: 'Overdue',
          penaltyAmount: (inv.penaltyAmount || 0) + penaltyAmount,
          amountRemaining: inv.amountRemaining + penaltyAmount
        };
      }
      return inv;
    }));

    // 3. Update student details
    setStudents(prevStudents => prevStudents.map(s => {
      if (s.name === targetTx.studentName) {
        return {
          ...s,
          daysOverdue: Math.max(s.daysOverdue, 15),
          missedPaymentCount: s.missedPaymentCount + 1
        };
      }
      return s;
    }));

    logActivity(`⚠️ Cheque ${targetTx.reference} Bounced for ${targetTx.studentName}! Applied ₹${penaltyAmount} penalty rule.`, 'error');
    showToast(`Cheque bounced for ${targetTx.studentName}. Penalty of ₹${penaltyAmount} applied.`);
  };

  // Inject Bank statement line
  const simulateBankStatementImport = () => {
    const names = [
      { name: 'Dev Verma', amt: 15300, narr: 'RTGS FROM RAJESH VERMA FEES DEPOSIT' },
      { name: 'Ishaan Kapoor', amt: 15300, narr: 'NEFT TRANSFER SANJAY KAPOOR' },
      { name: 'Vikram Singh', amt: 15300, narr: 'IMPS-6629910-SURYA PRATAP SINGH' }
    ];
    const picked = names[Math.floor(Math.random() * names.length)];
    const id = `bi-sim-${Date.now()}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB');

    // Run matching to guess confidence
    const matchingInvoice = invoices.find(inv => inv.studentName === picked.name && inv.status === 'Overdue');

    const newLine = {
      id,
      dateStr,
      amount: picked.amt,
      narration: picked.narr,
      status: 'Pending',
      confidence: matchingInvoice ? 'high' : 'unmatched',
      matchedInvoiceId: matchingInvoice ? matchingInvoice.id : null,
      matchedStudentName: matchingInvoice ? matchingInvoice.studentName : null
    };

    setImportedLines(prev => [...prev, newLine]);
    logActivity(`🏦 Injected Bank transaction: "${picked.narr}" for ₹${picked.amt}`, 'info');
    showToast(`New bank statement line imported for fuzzy matching.`);
  };

  return (
    <div className={`simulator-dock ${isOpen ? 'open' : ''}`}>
      {/* Floating Toggle Button */}
      <button className="simulator-toggle" onClick={() => setIsOpen(!isOpen)}>
        <Zap size={16} />
        <span>Cockpit Control Center</span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {/* Dock Content */}
      {isOpen && (
        <div className="simulator-content-box">
          <div className="simulator-header">
            <div className="autopilot-control" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: autopilot ? 'var(--mint-dark)' : 'var(--ink-secondary)' }}>
                {autopilot ? 'AUTOPILOT RUNNING' : 'AUTOPILOT OFF'}
              </span>
              <button 
                className={`autopilot-btn ${autopilot ? 'active' : ''}`}
                onClick={() => setAutopilot(!autopilot)}
                title={autopilot ? 'Stop automatic simulation' : 'Start automatic simulation loop (6s interval)'}
              >
                {autopilot ? <Square size={12} fill="white" /> : <Play size={12} fill="white" />}
              </button>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="simulator-actions-grid">
            <button className="sim-btn" onClick={simulateUPIPayment} title="Simulate immediate parent paying fee online via UPI">
              <Zap size={13} color="var(--iris-dark)" />
              <span>UPI Pay</span>
            </button>
            <button className="sim-btn" onClick={simulateOfflineCash} disabled={isSyncingCash} title="Simulate logging payment offline and syncing later">
              <Smartphone size={13} color={isSyncingCash ? 'var(--ink-tertiary)' : 'var(--peach)'} />
              <span>{isSyncingCash ? 'Syncing...' : 'Cash Sync'}</span>
            </button>
            <button className="sim-btn" onClick={simulateChequeBounce} title="Simulate a cheque bouncing and applying bounce penalty">
              <AlertOctagon size={13} color="var(--clay-dark)" />
              <span>Bounce Chq</span>
            </button>
            <button className="sim-btn" onClick={simulateBankStatementImport} title="Simulate a bank transfer statement entry requiring fuzzy match">
              <Landmark size={13} color="var(--mint-dark)" />
              <span>Bank Statement</span>
            </button>
          </div>

          {/* Live Activity Ticker */}
          <div className="simulator-logs-box">
            <div className="logs-header">
              <Activity size={12} />
              <span>Live System Event Stream</span>
            </div>
            <div className="logs-list">
              {activityLogs.map(log => (
                <div key={log.id} className={`log-item log-${log.type}`}>
                  <span className="log-time">{log.timestamp}</span>
                  <span className="log-text">{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
