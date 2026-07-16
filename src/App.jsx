import React, { useState } from 'react';
import { usePersistedState } from './hooks/usePersistedState';
import { 
  INITIAL_FEE_HEADS, 
  INITIAL_STUDENTS, 
  INITIAL_INVOICES, 
  INITIAL_LEDGER, 
  MOCK_TARGET_REVENUE 
} from './data/seedData';

// Import components
import AdminDashboard from './components/AdminDashboard';
import FeeEngine from './components/FeeEngine';
import ReconciliationLedger from './components/ReconciliationLedger';
import MobileCompanion from './components/MobileCompanion';
import SimulatorPanel from './components/SimulatorPanel';

// Import icons
import { 
  LayoutDashboard, 
  Sliders, 
  Layers, 
  Smartphone, 
  RotateCcw, 
  User, 
  GraduationCap, 
  BellRing,
  CheckCircle 
} from 'lucide-react';

// Custom Canvas Confetti Component
function CanvasConfetti({ active, onClose }) {
  const canvasRef = React.useRef(null);
  React.useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#8B7CF6', '#FFB4A2', '#9AE6B4', '#F4A896', '#6C5CE7', '#FFA492'];
    const particles = [];

    // Initialize particles
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 100, // start from bottom
        vx: (Math.random() - 0.5) * 15,
        vy: -Math.random() * 20 - 10,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5; // gravity
        p.vx *= 0.98; // drag
        p.rotation += p.rotationSpeed;
        if (p.y > canvas.height + 20) {
          p.opacity = 0;
        } else {
          p.opacity = Math.max(0, p.opacity - 0.015);
        }

        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      if (alive) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        onClose();
      }
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [active, onClose]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 99999
      }}
    />
  );
}

export default function App() {
  // Swapped React useState for usePersistedState for localStorage synchronization
  const [feeHeads, setFeeHeads] = usePersistedState('smartschool-feeheads', INITIAL_FEE_HEADS);
  const [students, setStudents] = usePersistedState('smartschool-students', INITIAL_STUDENTS);
  const [invoices, setInvoices] = usePersistedState('smartschool-invoices', INITIAL_INVOICES);
  const [ledger, setLedger] = usePersistedState('smartschool-ledger', INITIAL_LEDGER);
  const [timeframe, setTimeframe] = usePersistedState('smartschool-timeframe', 'Month');
  const [activeTab, setActiveTab] = usePersistedState('smartschool-active-tab', 'Dashboard');

  // Lifted imported lines state globally
  const [importedLines, setImportedLines] = usePersistedState('smartschool-imported-lines', [
    {
      id: 'bi-1',
      dateStr: '08/07/2026',
      amount: 15300,
      narration: 'NEFT TRANSFER FROM SUBRAMANIAN IYER',
      status: 'Pending',
      confidence: 'high',
      matchedInvoiceId: 'inv-6',
      matchedStudentName: 'Ananya Iyer'
    },
    {
      id: 'bi-2',
      dateStr: '07/07/2026',
      amount: 15300,
      narration: 'V MALHOTRA TUITION FEE DEPOSIT',
      status: 'Pending',
      confidence: 'medium',
      matchedInvoiceId: 'inv-9',
      matchedStudentName: 'Karan Malhotra'
    },
    {
      id: 'bi-3',
      dateStr: '09/07/2026',
      amount: 8888,
      narration: 'UPI TRAN TO SCHOOL / REF 998822',
      status: 'Pending',
      confidence: 'unmatched',
      matchedInvoiceId: null,
      matchedStudentName: null
    }
  ]);

  // Global activity logs for live ticker
  const [activityLogs, setActivityLogs] = usePersistedState('smartschool-activity-logs', [
    { id: 'l1', timestamp: '22:00:10', text: '🔔 Payment reminder sent to Amit Sharma (Guardian of Aryan Sharma)', type: 'info' },
    { id: 'l2', timestamp: '21:15:45', text: '✅ Reconciled NEFT statement line for Ananya Iyer: ₹15,300', type: 'success' },
    { id: 'l3', timestamp: '20:30:12', text: '💵 Cash receipt logged offline and synced for Siddharth Joshi: ₹3,500', type: 'success' }
  ]);

  // Confetti trigger state
  const [confettiActive, setConfettiActive] = useState(false);

  const triggerConfetti = () => {
    setConfettiActive(false);
    setTimeout(() => setConfettiActive(true), 50);
  };

  const logActivity = (text, type = 'info') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setActivityLogs(prev => [
      { id: `log-${Date.now()}`, timestamp: timeStr, text, type },
      ...prev.slice(0, 19)
    ]);
  };

  // App-level notification toast
  const [appToast, setAppToast] = useState(null);

  const showToast = (message) => {
    setAppToast(message);
    setTimeout(() => setAppToast(null), 4000);
  };


  // Defaulter Waiver CTA
  const handleWaiveFee = (student) => {
    const studentInvoices = invoices.filter(inv => inv.studentId === student.id && inv.status === 'Overdue');
    if (studentInvoices.length === 0) return;

    // Apply waiver rule (mark overdue invoices as Paid / waived)
    const waivedInvoices = invoices.map(inv => {
      if (inv.studentId === student.id && inv.status === 'Overdue') {
        return { ...inv, status: 'Paid', amountRemaining: 0, discountAmount: inv.discountAmount + inv.amountRemaining };
      }
      return inv;
    });

    setInvoices(waivedInvoices);

    // Update student daysOverdue/risk factors locally since outstanding amount is cleared
    setStudents(students.map(s => {
      if (s.id === student.id) {
        return { ...s, daysOverdue: 0 };
      }
      return s;
    }));

    logActivity(`💸 Waived overdue fees for ${student.name}`, 'warning');
    triggerConfetti();
    showToast(`Successfully waived all overdue fees for ${student.name}.`);
  };

  // Defaulter Send Reminder CTA
  const handleSendReminder = (student) => {
    logActivity(`🔔 Sent manual payment reminder to ${student.guardianName} (Guardian of ${student.name})`, 'info');
    showToast(`Payment reminder notification sent to ${student.guardianName} (Guardian of ${student.name}).`);
  };

  return (
    <div className="app-container">
      {/* Canvas Confetti Component */}
      <CanvasConfetti active={confettiActive} onClose={() => setConfettiActive(false)} />

      {/* Aceternity Background Grid Pattern */}
      <div className="background-grid-overlay"></div>

      {/* Background Pastel Mesh Blobs */}
      <div className="ambient-blob-1"></div>
      <div className="ambient-blob-2"></div>
      <div className="ambient-blob-3"></div>

      {/* App Header (Quiet Chrome) */}
      <header className="nav-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--sig-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px 0 rgba(139, 124, 246, 0.3)'
          }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="display-font" style={{ fontSize: '20px', letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              ReconK12 <span style={{ fontWeight: 400, color: 'var(--ink-secondary)' }}>FinTech</span>
            </h1>
            <span style={{ fontSize: '11px', color: 'var(--ink-secondary)', fontWeight: 500 }}>
              Academic Term: 2026 - 2027
            </span>
          </div>
        </div>

        {/* Action Panel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            padding: '6px 12px', 
            background: 'rgba(255,255,255,0.7)', 
            border: '1px solid var(--glass-border)',
            borderRadius: '12px' 
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--iris)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '13px'
            }}>
              P
            </div>
            <div style={{ textAlign: 'left', display: 'none', md: 'block' }}>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>Priya</div>
              <div style={{ fontSize: '9px', color: 'var(--ink-tertiary)' }}>Finance Admin</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <nav className="nav-links" style={{ marginBottom: '32px', alignSelf: 'flex-start' }}>
        <button 
          className={`nav-link ${activeTab === 'Dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('Dashboard')}
        >
          <LayoutDashboard size={16} />
          <span>Finance Dashboard</span>
        </button>
        <button 
          className={`nav-link ${activeTab === 'Fee Engine' ? 'active' : ''}`}
          onClick={() => setActiveTab('Fee Engine')}
        >
          <Sliders size={16} />
          <span>Fee Structures</span>
        </button>
        <button 
          className={`nav-link ${activeTab === 'Ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('Ledger')}
        >
          <Layers size={16} />
          <span>Ledger & Reconciliation</span>
        </button>
        <button 
          className={`nav-link ${activeTab === 'Mobile Companion' ? 'active' : ''}`}
          onClick={() => setActiveTab('Mobile Companion')}
        >
          <Smartphone size={16} />
          <span>Mobile Desk</span>
        </button>
      </nav>

      {/* Active screen renderer */}
      <main style={{ minHeight: '500px' }}>
        {activeTab === 'Dashboard' && (
          <AdminDashboard 
            students={students}
            setStudents={setStudents}
            invoices={invoices}
            setInvoices={setInvoices}
            ledger={ledger}
            setLedger={setLedger}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
            onWaiveFee={handleWaiveFee}
            onSendReminder={handleSendReminder}
            activityLogs={activityLogs}
            triggerConfetti={triggerConfetti}
            logActivity={logActivity}
          />
        )}
        {activeTab === 'Fee Engine' && (
          <FeeEngine 
            feeHeads={feeHeads}
            setFeeHeads={setFeeHeads}
            students={students}
            invoices={invoices}
            setInvoices={setInvoices}
            logActivity={logActivity}
            triggerConfetti={triggerConfetti}
          />
        )}
        {activeTab === 'Ledger' && (
          <ReconciliationLedger 
            ledger={ledger}
            setLedger={setLedger}
            invoices={invoices}
            setInvoices={setInvoices}
            feeHeads={feeHeads}
            importedLines={importedLines}
            setImportedLines={setImportedLines}
            triggerConfetti={triggerConfetti}
            logActivity={logActivity}
          />
        )}
        {activeTab === 'Mobile Companion' && (
          <MobileCompanion 
            students={students}
            invoices={invoices}
            setInvoices={setInvoices}
            ledger={ledger}
            setLedger={setLedger}
            logActivity={logActivity}
            triggerConfetti={triggerConfetti}
          />
        )}
      </main>

      {/* Hackathon Autopilot & Simulator Panel */}
      <SimulatorPanel
        students={students}
        setStudents={setStudents}
        invoices={invoices}
        setInvoices={setInvoices}
        ledger={ledger}
        setLedger={setLedger}
        importedLines={importedLines}
        setImportedLines={setImportedLines}
        feeHeads={feeHeads}
        activityLogs={activityLogs}
        logActivity={logActivity}
        triggerConfetti={triggerConfetti}
        showToast={showToast}
      />

      {/* Global Application Toast Notifications */}
      {appToast && (
        <div style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          backgroundColor: '#2B2A3A',
          color: '#F4F5FC',
          padding: '16px 24px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 20px 40px -5px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.08)',
          zIndex: 1000,
          animation: 'fade-in 0.25s forwards ease-out',
          maxWidth: '400px'
        }}>
          <CheckCircle size={18} color="var(--mint)" />
          <span style={{ fontSize: '13px', fontWeight: 500 }}>{appToast}</span>
        </div>
      )}
    </div>
  );
}
