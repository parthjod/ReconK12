import React, { useState } from 'react';
import { parseBankLine, matchTransaction } from '../utils/fuzzyMatch';
import { calculatePenalty } from '../utils/penalty';
import { Check, X, AlertTriangle, FileSpreadsheet, ArrowRight, CornerDownRight, Tag } from 'lucide-react';

export default function ReconciliationLedger({ 
  ledger, 
  setLedger, 
  invoices, 
  setInvoices, 
  feeHeads,
  importedLines,
  setImportedLines,
  triggerConfetti,
  logActivity
}) {
  const [activeChannel, setActiveChannel] = useState('UPI'); // UPI, Cash, Cheque, Bank Import
  
  // Bank statement pasting state
  const [bankPasteText, setBankPasteText] = useState('');
  
  // Warning state if cheque bounce penalty rule is missing
  const [bounceWarning, setBounceWarning] = useState(null); // transaction ID

  // Filter ledger transactions for active tab
  const filteredTransactions = ledger.filter(tx => tx.channel === activeChannel);

  // Clear or reconcile cheque transaction
  const handleClearCheque = (txId) => {
    const tx = ledger.find(t => t.id === txId);
    if (!tx) return;

    setLedger(ledger.map(t => {
      if (t.id === txId) {
        return { ...t, status: 'Settled' };
      }
      return t;
    }));

    // Update the invoice status as paid
    if (tx.invoiceId) {
      setInvoices(invoices.map(inv => {
        if (inv.id === tx.invoiceId) {
          return { ...inv, status: 'Paid', amountRemaining: 0 };
        }
        return inv;
      }));
    }

    logActivity(`✅ Cheque cleared for ${tx.studentName}: ₹${tx.amount.toLocaleString('en-IN')}`, 'success');
    triggerConfetti();
  };

  const handleBounceCheque = (txId) => {
    // 1. Find transaction and target invoice
    const tx = ledger.find(t => t.id === txId);
    if (!tx || !tx.invoiceId) return;

    const invoice = invoices.find(inv => inv.id === tx.invoiceId);
    if (!invoice) return;

    // 2. Look up the cheque bounce penalty rule for this invoice's fee head
    const feeHead = feeHeads.find(fh => fh.id === invoice.feeHeadId);
    const bounceRule = feeHead?.rules?.find(r => r.type === 'cheque_bounce');

    if (!bounceRule) {
      // Show warning state: No bounce penalty configured for this fee head
      setBounceWarning(txId);
      setTimeout(() => setBounceWarning(null), 5000); // clear after 5s
      return;
    }

    // 3. Compute penalty amount
    const penaltyAmount = calculatePenalty(bounceRule, invoice.amountOriginal);

    // 4. Update invoice with penalty amount
    setInvoices(invoices.map(inv => {
      if (inv.id === invoice.id) {
        return { 
          ...inv, 
          status: 'Overdue', 
          penaltyAmount: (inv.penaltyAmount || 0) + penaltyAmount,
          amountRemaining: inv.amountRemaining + penaltyAmount
        };
      }
      return inv;
    }));

    // 5. Mark the cheque transaction status as Bounced in ledger
    setLedger(ledger.map(t => {
      if (t.id === txId) {
        return { ...t, status: 'Bounced' };
      }
      return t;
    }));

    logActivity(`⚠️ Cheque bounced for ${tx.studentName}! Applied bounce rule penalty of ₹${penaltyAmount}`, 'error');
  };

  // Process text-pasted bank imports
  const handleProcessBankPaste = () => {
    if (!bankPasteText.trim()) return;

    const lines = bankPasteText.split('\n');
    const newImports = [];

    lines.forEach((line, index) => {
      const parsed = parseBankLine(line);
      if (!parsed) return;

      // Run matchTransaction heuristic
      const matchResult = matchTransaction(parsed, invoices);
      
      newImports.push({
        id: `bi-user-${Date.now()}-${index}`,
        dateStr: parsed.date.toLocaleDateString('en-GB'),
        amount: parsed.amount,
        narration: parsed.narration,
        status: 'Pending',
        confidence: matchResult.matchConfidence,
        matchedInvoiceId: matchResult.matchedInvoice?.id || null,
        matchedStudentName: matchResult.matchedInvoice?.studentName || null
      });
    });

    setImportedLines([...importedLines, ...newImports]);
    setBankPasteText('');
    logActivity(`🏦 Pasted and parsed ${newImports.length} bank statement line(s)`, 'info');
  };

  // Reconcile/Approve an imported bank transaction
  const handleApproveImport = (importId) => {
    const item = importedLines.find(line => line.id === importId);
    if (!item || !item.matchedInvoiceId) return;

    // 1. Mark imported line as settled
    setImportedLines(importedLines.map(line => {
      if (line.id === importId) {
        return { ...line, status: 'Reconciled' };
      }
      return line;
    }));

    // 2. Update invoice status to Paid
    setInvoices(invoices.map(inv => {
      if (inv.id === item.matchedInvoiceId) {
        return { ...inv, status: 'Paid', amountRemaining: 0 };
      }
      return inv;
    }));

    // 3. Add to ledger list
    const newTx = {
      id: `tx-bank-${Date.now()}`,
      invoiceId: item.matchedInvoiceId,
      studentName: item.matchedStudentName,
      amount: item.amount,
      channel: 'Bank Import',
      status: 'Settled',
      date: '2026-07-09',
      reference: `NEFT-REC-${item.narration.substring(0,8)}`
    };
    setLedger([...ledger, newTx]);

    logActivity(`🏦 Reconciled bank transfer of ₹${item.amount.toLocaleString('en-IN')} for ${item.matchedStudentName}`, 'success');
    triggerConfetti();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 1 }}>
      
      {/* Header */}
      <div>
        <h1 className="display-font" style={{ fontSize: '32px', color: 'var(--ink)' }}>Reconciliation Ledger</h1>
        <p style={{ color: 'var(--ink-secondary)', fontSize: '14px', marginTop: '4px' }}>Match payments and track clearing states</p>
      </div>

      {/* Tabs */}
      <div className="nav-links" style={{ alignSelf: 'flex-start' }}>
        {['UPI', 'Cash', 'Cheque', 'Bank Import'].map(ch => (
          <button
            key={ch}
            className={`nav-link ${activeChannel === ch ? 'active' : ''}`}
            onClick={() => setActiveChannel(ch)}
          >
            {ch}
          </button>
        ))}
      </div>

      {/* Bounce warning overlay */}
      {bounceWarning && (
        <div style={{
          backgroundColor: 'var(--clay-bg)',
          border: '1px solid var(--clay)',
          color: 'var(--clay-dark)',
          padding: '16px 20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          fontWeight: 600
        }}>
          <AlertTriangle size={18} />
          <span>No Cheque Bounce Penalty exception rule configured for this fee head in the Fee Engine! No fee was applied.</span>
        </div>
      )}

      {/* Main Container */}
      <div className="glass-card" style={{ padding: '32px' }}>
        {activeChannel !== 'Bank Import' ? (
          /* Transaction tables for UPI, Cash, Cheque */
          <div className="glass-table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date</th>
                  <th>Student Name</th>
                  <th>Amount</th>
                  <th>Reference</th>
                  <th>Reconciliation State</th>
                  {activeChannel === 'Cheque' && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={activeChannel === 'Cheque' ? 7 : 6} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--ink-secondary)' }}>
                      No ledger transactions logged for this payment channel.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(tx => (
                    <tr key={tx.id}>
                      <td className="mono-font" style={{ fontWeight: 600 }}>{tx.id}</td>
                      <td>{tx.date}</td>
                      <td>{tx.studentName}</td>
                      <td className="mono-font" style={{ fontWeight: 700 }}>₹{tx.amount.toLocaleString('en-IN')}</td>
                      <td className="mono-font" style={{ opacity: 0.8, fontSize: '13px' }}>{tx.reference}</td>
                      <td>
                        {/* Reconciliation progress pill */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge ${
                            tx.status === 'Settled' ? 'badge-mint' : 
                            tx.status === 'Matched' ? 'badge-mint' : 
                            tx.status === 'Bounced' ? 'badge-clay' : 
                            'badge-peach'
                          }`}>
                            {tx.status}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--ink-tertiary)' }}>
                            {tx.status === 'Logged' && 'Logged → Matched'}
                            {tx.status === 'Matched' && 'Matched → Reconciled'}
                            {tx.status === 'Settled' && 'Fully Reconciled & Settled'}
                            {tx.status === 'Bounced' && 'Cheque Bounced'}
                          </span>
                        </div>
                      </td>
                      {activeChannel === 'Cheque' && (
                        <td style={{ textAlign: 'right' }}>
                          {tx.status === 'Logged' && (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn-primary" 
                                onClick={() => handleClearCheque(tx.id)}
                                style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '8px' }}
                              >
                                <Check size={12} />
                                <span>Clear</span>
                              </button>
                              <button 
                                className="btn-secondary" 
                                onClick={() => handleBounceCheque(tx.id)}
                                style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '8px', color: 'var(--clay-dark)' }}
                              >
                                <X size={12} />
                                <span>Bounce</span>
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Bank Statement Import Panel */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '32px' }}>
              
              {/* Paste Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 className="display-font" style={{ fontSize: '18px', color: 'var(--ink)' }}>Paste Bank Statement Lines</h3>
                <p style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>
                  Format: <code>DD/MM/YYYY | AMOUNT | NARRATION</code>
                </p>
                <textarea
                  className="glass-input"
                  style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.5, resize: 'vertical' }}
                  placeholder="e.g.&#10;06/07/2026 | 12000 | DIYA PATEL SCHOOL FEE&#10;09/07/2026 | 3500 | MR PRAVEEN REDDY TRANSPORT"
                  value={bankPasteText}
                  onChange={(e) => setBankPasteText(e.target.value)}
                ></textarea>
                <button className="btn-primary" onClick={handleProcessBankPaste} style={{ alignSelf: 'flex-start' }}>
                  <FileSpreadsheet size={16} />
                  <span>Process Import</span>
                </button>
              </div>

              {/* Instructions Panel */}
              <div style={{ 
                background: 'rgba(139, 124, 246, 0.04)', 
                border: '1px dashed rgba(139, 124, 246, 0.2)', 
                padding: '24px', 
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <h4 style={{ fontWeight: 600, fontSize: '14px', color: 'var(--iris-dark)' }}>Fuzzy Matching Heuristics</h4>
                <ul style={{ fontSize: '13px', color: 'var(--ink-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '16px' }}>
                  <li>
                    <strong>High Confidence</strong>: Matches exact invoice amount due within a ±3-day window of the due date.
                  </li>
                  <li>
                    <strong>Medium Confidence</strong>: Multi-amount collision resolved using Levenshtein name similarity (threshold ≥ 0.7) against narration.
                  </li>
                  <li>
                    <strong>Unmatched</strong>: Flagged for manual selection if no timing or amount overlap matches.
                  </li>
                </ul>
              </div>
            </div>

            {/* Imported Statement Queue */}
            <div>
              <h3 className="display-font" style={{ fontSize: '18px', color: 'var(--ink)', marginBottom: '16px' }}>
                Reconciliation Queue
              </h3>

              <div className="glass-table-container">
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>Statement Date</th>
                      <th>Amount</th>
                      <th>Narration</th>
                      <th>Match Confidence</th>
                      <th>Matched Student / Invoice</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importedLines.map(line => (
                      <tr key={line.id}>
                        <td>{line.dateStr}</td>
                        <td className="mono-font" style={{ fontWeight: 700 }}>₹{line.amount.toLocaleString('en-IN')}</td>
                        <td className="mono-font" style={{ fontSize: '13px', opacity: 0.8 }}>{line.narration}</td>
                        <td>
                          <span className={`badge ${
                            line.confidence === 'high' ? 'badge-mint' :
                            line.confidence === 'medium' ? 'badge-peach' :
                            'badge-clay'
                          }`}>
                            {line.confidence.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {line.matchedInvoiceId ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontWeight: 600 }}>{line.matchedStudentName}</span>
                              <span className="mono-font" style={{ fontSize: '11px', color: 'var(--ink-tertiary)' }}>Invoice ID: {line.matchedInvoiceId}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--ink-tertiary)', fontStyle: 'italic' }}>
                              Manual selection needed
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {line.status === 'Pending' ? (
                            line.confidence !== 'unmatched' ? (
                              <button 
                                className="btn-primary" 
                                onClick={() => handleApproveImport(line.id)}
                                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
                              >
                                <span>Reconcile</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--clay-dark)', fontWeight: 600 }}>
                                Resolve manually
                              </span>
                            )
                          ) : (
                            <span className="badge badge-mint" style={{ display: 'inline-flex', gap: '4px' }}>
                              <Check size={12} />
                              <span>Reconciled</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
