import React, { useState, useEffect } from 'react';
import { usePersistedState } from '../hooks/usePersistedState';
import { Wifi, WifiOff, RefreshCw, Send, CheckCircle2, User, Landmark } from 'lucide-react';

export default function MobileCompanion({ 
  students, 
  invoices, 
  setInvoices, 
  ledger, 
  setLedger,
  logActivity,
  triggerConfetti
}) {
  const [isOnline, setIsOnline] = usePersistedState('network-status', true);
  const [offlineQueue, setOfflineQueue] = usePersistedState('offline-queue', []);
  
  // Local form state
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cashNote, setCashNote] = useState('');
  
  // UI states
  const [toastMessage, setToastMessage] = useState(null);

  // Auto-sync when toggled back online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      syncOfflineQueue();
    }
  }, [isOnline]);

  const syncOfflineQueue = () => {
    // 1. Process each queued transaction
    const newLedgerEntries = [];
    let updatedInvoices = [...invoices];

    offlineQueue.forEach((queuedTx, index) => {
      // Find outstanding invoice for student
      const inv = updatedInvoices.find(i => i.studentId === queuedTx.studentId && i.status === 'Overdue');
      
      const newTx = {
        id: `tx-cash-off-${Date.now()}-${index}`,
        invoiceId: inv ? inv.id : null,
        studentName: queuedTx.studentName,
        amount: queuedTx.amount,
        channel: 'Cash',
        status: 'Settled',
        date: '2026-07-09',
        reference: `CASH-OFF-${queuedTx.timestamp}`
      };
      
      newLedgerEntries.push(newTx);

      if (inv) {
        updatedInvoices = updatedInvoices.map(i => {
          if (i.id === inv.id) {
            return { ...i, status: 'Paid', amountRemaining: 0 };
          }
          return i;
        });
      }
    });

    // 2. Commit states
    setLedger([...ledger, ...newLedgerEntries]);
    setInvoices(updatedInvoices);

    // 3. Clear queue & notify
    const syncCount = offlineQueue.length;
    setOfflineQueue([]);
    
    logActivity(`🔄 Synced ${syncCount} offline cash receipt(s) from outbox`, 'success');
    triggerConfetti();
    showToast(`${syncCount} receipt${syncCount > 1 ? 's' : ''} synced silently.`);
  };

  const handleCollectCash = (e) => {
    e.preventDefault();
    if (!selectedStudentId || !cashAmount || parseFloat(cashAmount) <= 0) return;

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    const amountNum = parseFloat(cashAmount);
    const timestamp = Date.now();

    const transactionData = {
      studentId: selectedStudentId,
      studentName: student.name,
      amount: amountNum,
      note: cashNote,
      timestamp
    };

    if (isOnline) {
      // Sync immediately
      const inv = invoices.find(i => i.studentId === selectedStudentId && i.status === 'Overdue');
      
      const newTx = {
        id: `tx-cash-on-${Date.now()}`,
        invoiceId: inv ? inv.id : null,
        studentName: student.name,
        amount: amountNum,
        channel: 'Cash',
        status: 'Settled',
        date: '2026-07-09',
        reference: `CASH-ON-${timestamp}`
      };

      setLedger([...ledger, newTx]);
      
      if (inv) {
        setInvoices(invoices.map(i => {
          if (i.id === inv.id) {
            return { ...i, status: 'Paid', amountRemaining: 0 };
          }
          return i;
        }));
      }

      logActivity(`💵 Ramesh collected Cash of ₹${amountNum.toLocaleString('en-IN')} for ${student.name} [ONLINE]`, 'success');
      triggerConfetti();
      showToast(`Receipt logged for ${student.name}.`);
    } else {
      // Save offline queue
      setOfflineQueue([...offlineQueue, transactionData]);
      logActivity(`📥 Ramesh logged Cash of ₹${amountNum.toLocaleString('en-IN')} for ${student.name} [OFFLINE Outbox]`, 'info');
      showToast(`Receipt queued offline for ${student.name}.`);
    }

    // Reset fields
    setCashAmount('');
    setCashNote('');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
      
      {/* Handheld Device Container */}
      <div 
        className="glass-card" 
        style={{
          width: '360px',
          height: '680px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1E1D2D', // Dark iOS mock style
          color: '#F4F5FC',
          borderRadius: '40px',
          border: '12px solid #2B2A3A',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Device Header Bar */}
        <div style={{
          padding: '16px 24px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#A0AEC0' }}>ReconK12 Handheld</span>
          
          <button 
            onClick={() => setIsOnline(!isOnline)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              borderRadius: '8px',
              backgroundColor: isOnline ? 'rgba(72,187,120,0.15)' : 'rgba(245,101,101,0.15)',
              color: isOnline ? '#48BB78' : '#F56565',
              transition: 'all 0.25s'
            }}
            title={isOnline ? 'Switch to offline mode' : 'Switch to online mode'}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span style={{ fontSize: '11px', fontWeight: 700 }}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </button>
        </div>

        {/* Device Screen Body */}
        <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          
          {/* Main Title */}
          <div>
            <h2 className="display-font" style={{ fontSize: '22px', fontWeight: 700 }}>Cash Collection Desk</h2>
            <p style={{ fontSize: '12px', color: '#A0AEC0', marginTop: '4px' }}>Log front-desk or transport route fees instantly.</p>
          </div>

          {/* Cash Logging Form */}
          <form onSubmit={handleCollectCash} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Student selector */}
            <div>
              <label style={{ fontSize: '11px', color: '#A0AEC0', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Select Student / Guard
              </label>
              <select
                className="glass-input"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
              >
                <option value="" style={{ color: 'black' }}>-- Select Student --</option>
                {students.map(s => {
                  const overdueInv = invoices.filter(inv => inv.studentId === s.id && inv.status === 'Overdue');
                  const sumOwed = overdueInv.reduce((sum, i) => sum + i.amountRemaining, 0);
                  
                  return (
                    <option key={s.id} value={s.id} style={{ color: 'black' }}>
                      {s.name} ({s.grade}) {sumOwed > 0 ? `[Owes ₹${sumOwed}]` : '[Paid]'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label style={{ fontSize: '11px', color: '#A0AEC0', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Amount Collected (₹)
              </label>
              <input
                type="number"
                className="glass-input"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}
                placeholder="3500"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                required
              />
            </div>

            {/* Note */}
            <div>
              <label style={{ fontSize: '11px', color: '#A0AEC0', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Transaction Notes
              </label>
              <input
                type="text"
                className="glass-input"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}
                placeholder="e.g. Bus Route 4 cash receipt"
                value={cashNote}
                onChange={(e) => setCashNote(e.target.value)}
              />
            </div>

            {/* Submit */}
            <button 
              type="submit"
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                justifyContent: 'center',
                fontSize: '14px',
                background: isOnline ? 'var(--sig-gradient)' : 'linear-gradient(135deg, #718096, #A0AEC0)',
                boxShadow: isOnline ? '0 4px 15px 0 rgba(139,124,246,0.3)' : 'none'
              }}
            >
              <Send size={14} style={{ marginRight: '6px' }} />
              <span>{isOnline ? 'Confirm Instant Cash' : 'Store Queue Offline'}</span>
            </button>

          </form>

          {/* Local Offline Queue Status */}
          <div style={{ marginTop: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#A0AEC0', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <span>Outbox Sync Queue</span>
              <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}>
                {offlineQueue.length} unsynced
              </span>
            </h3>

            {offlineQueue.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#718096', fontStyle: 'italic', padding: '16px 0', textAlign: 'center' }}>
                Outbox is clean. No offline receipts queued.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {offlineQueue.map((item, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600 }}>{item.studentName}</div>
                      <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>{item.note || 'No notes'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono-font" style={{ fontSize: '12px', fontWeight: 700 }}>₹{item.amount}</div>
                      <div style={{ fontSize: '9px', color: '#F56565', fontWeight: 600 }}>QUEUED</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Handheld Device Screen Toast Notifications */}
        {toastMessage && (
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '24px',
            right: '24px',
            backgroundColor: '#2F855A',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
            animation: 'fade-in 0.2s forwards',
            zIndex: 10
          }}>
            <CheckCircle2 size={14} />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Demo helper panel */}
      <div 
        className="glass-card" 
        style={{
          width: '320px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          alignSelf: 'center'
        }}
      >
        <h3 className="display-font" style={{ fontSize: '18px', color: 'var(--ink)' }}>Offline Sync Sandbox</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', lineHeight: 1.6 }}>
          School collectors often receive cash in areas with poor internet connection. ReconK12 resolves that issue by storing cash receipts locally on the device when disconnected. The transactions stay safe even if the device restarts or the browser tab is refreshed.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', lineHeight: 1.6 }}>
          To test this, switch the toggle to offline and log a few cash receipts. Refresh the browser to see the queue persist. Switching back to online uploads the transactions to the ledger and updates all charts automatically.
        </p>
      </div>

    </div>
  );
}
