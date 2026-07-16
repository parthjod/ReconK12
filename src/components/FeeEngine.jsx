import React, { useState } from 'react';
import { Plus, X, Tag, Settings, Trash, AlertTriangle, Percent, ChevronRight } from 'lucide-react';

export default function FeeEngine({ 
  feeHeads, 
  setFeeHeads,
  students,
  invoices,
  setInvoices,
  logActivity,
  triggerConfetti
}) {
  const [selectedFeeHead, setSelectedFeeHead] = useState(null); // fee head object being edited in drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState(null);

  // Form states inside drawer
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState(0);
  const [formFrequency, setFormFrequency] = useState('monthly');
  const [formRules, setFormRules] = useState([]);

  // Exception rule adding sub-state
  const [ruleType, setRuleType] = useState('late_payment'); // late_payment | sibling_discount | cheque_bounce
  const [ruleCalcType, setRuleCalcType] = useState('flat'); // flat | percentage
  const [ruleValue, setRuleValue] = useState('');
  const [ruleCap, setRuleCap] = useState('');

  const openDrawer = (feeHead = null) => {
    if (feeHead) {
      setSelectedFeeHead(feeHead);
      setFormName(feeHead.name);
      setFormAmount(feeHead.amount);
      setFormFrequency(feeHead.frequency);
      setFormRules(feeHead.rules ? [...feeHead.rules] : []);
    } else {
      setSelectedFeeHead(null);
      setFormName('');
      setFormAmount(1000);
      setFormFrequency('monthly');
      setFormRules([]);
    }
    // Set default rule inputs
    setRuleType('late_payment');
    setRuleCalcType('percentage');
    setRuleValue('2');
    setRuleCap('500');

    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedFeeHead(null);
  };

  // Handles adding exception rule object to current list of rules in drawer
  const handleAddRule = () => {
    if (!ruleValue) return;

    const newRule = {
      id: `r-${Date.now()}`,
      type: ruleType,
      calculationType: ruleCalcType,
      value: parseFloat(ruleValue),
      capAmount: ruleCalcType === 'percentage' && ruleCap ? parseFloat(ruleCap) : null,
      appliesToFeeHeadId: selectedFeeHead ? selectedFeeHead.id : 'fh-custom',
      description: `${ruleType === 'sibling_discount' ? 'Sibling Discount' : ruleType === 'late_payment' ? 'Late Payment' : 'Cheque Bounce'} - ${ruleCalcType === 'percentage' ? ruleValue + '%' : '₹' + ruleValue}`
    };

    if (ruleCalcType === 'percentage' && ruleCap) {
      newRule.description += ` (Capped at ₹${ruleCap})`;
    }

    setFormRules([...formRules, newRule]);
    
    // Reset inputs
    setRuleValue('');
    setRuleCap('');
  };

  const handleRemoveRule = (ruleId) => {
    setFormRules(formRules.filter(r => r.id !== ruleId));
  };

  const handleSaveFeeHead = () => {
    if (!formName.trim() || formAmount <= 0) return;

    if (selectedFeeHead) {
      // Edit existing
      setFeeHeads(feeHeads.map(fh => {
        if (fh.id === selectedFeeHead.id) {
          return {
            ...fh,
            name: formName,
            amount: parseFloat(formAmount),
            frequency: formFrequency,
            rules: formRules.map(r => ({ ...r, appliesToFeeHeadId: fh.id }))
          };
        }
        return fh;
      }));
      logActivity(`⚙️ Updated fee structure: "${formName}"`, 'info');
    } else {
      // Create new
      const newId = `fh-${Date.now()}`;
      const newFH = {
        id: newId,
        name: formName,
        amount: parseFloat(formAmount),
        frequency: formFrequency,
        applicableClasses: ['Grade 3', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'],
        rules: formRules.map(r => ({ ...r, appliesToFeeHeadId: newId }))
      };
      setFeeHeads([...feeHeads, newFH]);
      logActivity(`🆕 Created new fee structure: "${formName}"`, 'success');
      triggerConfetti();
    }

    closeDrawer();
  };

  const handleDeleteFeeHead = (id) => {
    if (confirm('Are you sure you want to delete this fee head structure?')) {
      const fh = feeHeads.find(f => f.id === id);
      setFeeHeads(feeHeads.filter(fh => fh.id !== id));
      logActivity(`🗑️ Retired fee structure: "${fh?.name}"`, 'warning');
      closeDrawer();
    }
  };

  // Adjust rule default parameters on type change
  const handleRuleTypeChange = (type) => {
    setRuleType(type);
    if (type === 'cheque_bounce') {
      setRuleCalcType('flat');
      setRuleValue('250');
      setRuleCap('');
    } else if (type === 'late_payment') {
      setRuleCalcType('percentage');
      setRuleValue('2');
      setRuleCap('500');
    } else {
      // Sibling discount
      setRuleCalcType('percentage');
      setRuleValue('20');
      setRuleCap('');
    }
  };

  // Generate Invoices for all matching students in Grade segments
  const handleGenerateInvoicesForFeeHead = (fh) => {
    const matchingStudents = students.filter(student => {
      return fh.applicableClasses.some(className => student.grade.startsWith(className));
    });

    let generatedCount = 0;
    const newInvoicesList = [...invoices];

    matchingStudents.forEach(student => {
      const exists = invoices.some(inv => inv.studentId === student.id && inv.feeHeadId === fh.id);
      if (exists) return;

      // Calculate sibling discount if student has a registered sibling
      let discountAmount = 0;
      if (student.siblingId) {
        const siblingDiscountRule = fh.rules?.find(r => r.type === 'sibling_discount');
        if (siblingDiscountRule) {
          discountAmount = siblingDiscountRule.calculationType === 'percentage' 
            ? fh.amount * (siblingDiscountRule.value / 100) 
            : siblingDiscountRule.value;
          
          if (siblingDiscountRule.capAmount && discountAmount > siblingDiscountRule.capAmount) {
            discountAmount = siblingDiscountRule.capAmount;
          }
        }
      }

      const invoiceId = `inv-gen-${fh.id}-${student.id}-${Date.now()}`;
      const newInvoice = {
        id: invoiceId,
        studentId: student.id,
        studentName: student.name,
        guardianName: student.guardianName,
        feeHeadId: fh.id,
        feeHeadName: fh.name,
        amountOriginal: fh.amount,
        discountAmount,
        penaltyAmount: 0,
        amountRemaining: fh.amount - discountAmount,
        dueDate: new Date().toISOString().split('T')[0],
        status: 'Overdue'
      };

      newInvoicesList.push(newInvoice);
      generatedCount++;
    });

    if (generatedCount > 0) {
      setInvoices(newInvoicesList);
      logActivity(`📋 Generated ${generatedCount} invoices for "${fh.name}"`, 'success');
      triggerConfetti();
      alert(`Successfully generated ${generatedCount} outstanding invoices for matching students.`);
    } else {
      alert(`All matching students already have invoices for "${fh.name}". No duplicates created.`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 1 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="display-font" style={{ fontSize: '32px', color: 'var(--ink)' }}>Fee Structure Engine</h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '14px', marginTop: '4px' }}>Configure fee heads, schedules, and exception rules</p>
        </div>
        <button className="btn-primary" onClick={() => openDrawer()}>
          <Plus size={16} />
          <span>New Fee Head</span>
        </button>
      </div>

      {/* Grid of Fee Heads */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {feeHeads.map(fh => (
          <div 
            key={fh.id} 
            className="glass-card glass-card-interactive" 
            style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px', position: 'relative', overflow: 'hidden' }}
            onMouseEnter={() => setHoveredCardId(fh.id)}
            onMouseLeave={() => setHoveredCardId(null)}
          >
            {/* Custom Sliding Hover Background (Aceternity UI style) */}
            <div 
              className="card-hover-bg-glow"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 50% 50%, rgba(139, 124, 246, 0.08) 0%, transparent 80%)',
                opacity: hoveredCardId === fh.id ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',
                zIndex: 0
              }}
            />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="badge badge-mint" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                  {fh.frequency}
                </span>
                <button 
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-tertiary)' }}
                  onClick={() => openDrawer(fh)}
                  title="Configure Fee Head"
                >
                  <Settings size={16} />
                </button>
              </div>

              <h3 className="display-font" style={{ fontSize: '20px', color: 'var(--ink)', marginTop: '12px' }}>
                {fh.name}
              </h3>
              
              <div className="display-font mono-font" style={{ fontSize: '24px', color: 'var(--iris-dark)', marginTop: '8px' }}>
                ₹{fh.amount.toLocaleString('en-IN')}
              </div>

              {/* Exception Rule Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '16px' }}>
                {fh.rules && fh.rules.length > 0 ? (
                  fh.rules.map(rule => (
                    <span 
                      key={rule.id} 
                      className={`badge ${rule.type === 'sibling_discount' ? 'badge-mint' : rule.type === 'cheque_bounce' ? 'badge-clay' : 'badge-peach'}`}
                      style={{ fontSize: '10px', padding: '3px 8px' }}
                      title={rule.description}
                    >
                      <Tag size={10} />
                      {rule.type === 'sibling_discount' && 'Sibling Waiver'}
                      {rule.type === 'late_payment' && 'Late Penalty'}
                      {rule.type === 'cheque_bounce' && 'Cheque Bounce'}
                      {` (${rule.calculationType === 'percentage' ? rule.value + '%' : '₹' + rule.value})`}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--ink-tertiary)', fontStyle: 'italic' }}>
                    No exception rules configured
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px', paddingTop: '12px', borderTop: '1px solid rgba(139, 124, 246, 0.08)', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--ink-secondary)' }}>
                  Applies to {fh.applicableClasses.length} segments
                </span>
                <button 
                  className="btn-text" 
                  onClick={() => openDrawer(fh)}
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                >
                  <span>Rules</span>
                  <ChevronRight size={12} />
                </button>
              </div>
              <button
                className="btn-secondary"
                onClick={() => handleGenerateInvoicesForFeeHead(fh)}
                style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '8px', width: '100%', justifyContent: 'center' }}
                title="Create overdue/outstanding invoices for all matching students in Grade segments"
              >
                <span>Generate Invoices</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Slide-out Drawer Configurator */}
      {isDrawerOpen && (
        <>
          <div className="drawer-backdrop" onClick={closeDrawer}></div>
          <div className="drawer-content">
            
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="display-font" style={{ fontSize: '24px', color: 'var(--ink)' }}>
                {selectedFeeHead ? 'Edit Fee Head' : 'Create Fee Head'}
              </h2>
              <button 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-secondary)' }}
                onClick={closeDrawer}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', display: 'block', marginBottom: '6px' }}>
                  Fee Head Name
                </label>
                <input 
                  type="text" 
                  className="glass-input" 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Tuition Fee"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', display: 'block', marginBottom: '6px' }}>
                    Amount (₹)
                  </label>
                  <input 
                    type="number" 
                    className="glass-input" 
                    value={formAmount} 
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="15000"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', display: 'block', marginBottom: '6px' }}>
                    Frequency
                  </label>
                  <select 
                    className="glass-input glass-select" 
                    value={formFrequency} 
                    onChange={(e) => setFormFrequency(e.target.value)}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Exception Rules Sub-form */}
            <div style={{ borderTop: '1px solid rgba(139, 124, 246, 0.1)', paddingTop: '20px' }}>
              <h3 className="display-font" style={{ fontSize: '16px', color: 'var(--ink)', marginBottom: '12px' }}>
                Rule Engine Configuration
              </h3>

              {/* Dynamic Rules Preview Box */}
              <div style={{
                background: 'rgba(139, 124, 246, 0.04)',
                border: '1px solid rgba(139, 124, 246, 0.15)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '16px',
                fontSize: '12px'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--iris-dark)', marginBottom: '6px' }}>
                  Live Exception Rules Preview
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--ink-secondary)' }}>
                  <div>Base Amount: <span className="mono-font" style={{ fontWeight: 600 }}>₹{parseFloat(formAmount || 0).toLocaleString()}</span></div>
                  
                  {formRules.some(r => r.type === 'sibling_discount') && (
                    <div style={{ color: 'var(--mint-dark)' }}>
                      • Sibling Discount: -₹{formRules.filter(r => r.type === 'sibling_discount').reduce((sum, r) => {
                        const amt = r.calculationType === 'percentage' ? formAmount * (r.value / 100) : r.value;
                        return sum + (r.capAmount && amt > r.capAmount ? r.capAmount : amt);
                      }, 0).toLocaleString()}
                    </div>
                  )}

                  {formRules.some(r => r.type === 'late_payment') && (
                    <div style={{ color: '#D3745F' }}>
                      • Late Payment Penalty: +₹{formRules.filter(r => r.type === 'late_payment').reduce((sum, r) => {
                        const amt = r.calculationType === 'percentage' ? formAmount * (r.value / 100) : r.value;
                        return sum + (r.capAmount && amt > r.capAmount ? r.capAmount : amt);
                      }, 0).toLocaleString()}
                    </div>
                  )}

                  {formRules.some(r => r.type === 'cheque_bounce') && (
                    <div style={{ color: 'var(--clay-dark)' }}>
                      • Cheque Bounce Penalty: +₹{formRules.filter(r => r.type === 'cheque_bounce').reduce((sum, r) => {
                        const amt = r.calculationType === 'percentage' ? formAmount * (r.value / 100) : r.value;
                        return sum + (r.capAmount && amt > r.capAmount ? r.capAmount : amt);
                      }, 0).toLocaleString()}
                    </div>
                  )}

                  <div style={{ borderTop: '1px dotted rgba(139, 124, 246, 0.15)', paddingTop: '6px', marginTop: '4px', fontWeight: 700, color: 'var(--ink)' }}>
                    Net Outstanding (with sibling waiver): 
                    <span className="mono-font" style={{ color: 'var(--iris-dark)' }}>
                      {" "}₹{(formAmount - formRules.filter(r => r.type === 'sibling_discount').reduce((sum, r) => {
                        const amt = r.calculationType === 'percentage' ? formAmount * (r.value / 100) : r.value;
                        return sum + (r.capAmount && amt > r.capAmount ? r.capAmount : amt);
                      }, 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Existing Rules List */}
              {formRules.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {formRules.map(rule => (
                    <div 
                      key={rule.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '10px 14px', 
                        background: 'rgba(139, 124, 246, 0.05)', 
                        border: '1px solid rgba(139, 124, 246, 0.1)', 
                        borderRadius: '10px' 
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Tag size={12} color="var(--iris)" />
                          {rule.type === 'sibling_discount' && 'Sibling Discount'}
                          {rule.type === 'late_payment' && 'Late Payment Penalty'}
                          {rule.type === 'cheque_bounce' && 'Cheque Bounce Penalty'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--ink-secondary)', marginTop: '2px' }}>
                          {rule.calculationType === 'percentage' ? `${rule.value}%` : `₹${rule.value}`}
                          {rule.capAmount ? ` (Capped at ₹${rule.capAmount})` : ''}
                        </div>
                      </div>
                      <button 
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--clay-dark)' }}
                        onClick={() => handleRemoveRule(rule.id)}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Rule Form */}
              <div style={{ background: 'rgba(255,255,255,0.4)', border: '1px dashed rgba(139, 124, 246, 0.25)', borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '10px' }}>
                  Add Exception Rule
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Rule type selector */}
                  <div>
                    <select 
                      className="glass-input glass-select" 
                      value={ruleType}
                      onChange={(e) => handleRuleTypeChange(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="late_payment">Late Payment Penalty</option>
                      <option value="sibling_discount">Sibling Discount Waiver</option>
                      <option value="cheque_bounce">Cheque Bounce Penalty</option>
                    </select>
                  </div>

                  {/* Calculation and inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                    {/* Toggle calculation type */}
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--ink-secondary)', display: 'block', marginBottom: '4px' }}>Calculation Type</span>
                      <div style={{ display: 'flex', background: 'rgba(139, 124, 246, 0.08)', padding: '2px', borderRadius: '8px' }}>
                        <button 
                          className="pill-tab" 
                          style={{ flex: 1, padding: '4px 8px', fontSize: '11px', background: ruleCalcType === 'flat' ? 'white' : 'transparent', color: ruleCalcType === 'flat' ? 'var(--iris-dark)' : 'var(--ink-secondary)', borderRadius: '6px' }}
                          onClick={() => setRuleCalcType('flat')}
                        >
                          Flat ₹
                        </button>
                        <button 
                          className="pill-tab" 
                          style={{ flex: 1, padding: '4px 8px', fontSize: '11px', background: ruleCalcType === 'percentage' ? 'white' : 'transparent', color: ruleCalcType === 'percentage' ? 'var(--iris-dark)' : 'var(--ink-secondary)', borderRadius: '6px' }}
                          onClick={() => setRuleCalcType('percentage')}
                        >
                          Percent %
                        </button>
                      </div>
                    </div>

                    {/* Value Field */}
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--ink-secondary)', display: 'block', marginBottom: '4px' }}>
                        Value ({ruleCalcType === 'flat' ? '₹' : '%'})
                      </span>
                      <input 
                        type="number" 
                        className="glass-input" 
                        value={ruleValue} 
                        onChange={(e) => setRuleValue(e.target.value)}
                        placeholder={ruleCalcType === 'flat' ? '250' : '2'}
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  {/* Capped Amount Field (only for percentage rules) */}
                  {ruleCalcType === 'percentage' && (
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--ink-secondary)', display: 'block', marginBottom: '4px' }}>
                        Maximum Cap Amount (₹)
                      </label>
                      <input 
                        type="number" 
                        className="glass-input" 
                        value={ruleCap} 
                        onChange={(e) => setRuleCap(e.target.value)}
                        placeholder="e.g. 500 (Optional)"
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                      />
                    </div>
                  )}

                  <button 
                    className="btn-secondary" 
                    onClick={handleAddRule}
                    style={{ justifySelf: 'flex-start', padding: '6px 12px', fontSize: '12px' }}
                  >
                    <Plus size={12} />
                    <span>Attach Rule</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Save / Delete actions */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-primary" onClick={handleSaveFeeHead} style={{ flex: 1, justifyContent: 'center' }}>
                  Save Configuration
                </button>
                <button className="btn-secondary" onClick={closeDrawer} style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
              </div>

              {selectedFeeHead && (
                <button 
                  className="btn-text" 
                  onClick={() => handleDeleteFeeHead(selectedFeeHead.id)}
                  style={{ color: 'var(--clay-dark)', justifyContent: 'center', border: '1px solid rgba(244,168,150,0.3)' }}
                >
                  <Trash size={14} style={{ marginRight: '6px' }} />
                  <span>Delete Fee Head</span>
                </button>
              )}
            </div>

          </div>
        </>
      )}

    </div>
  );
}
