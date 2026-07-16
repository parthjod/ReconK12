/**
 * Calculates the risk score for a student's overdue fee status.
 *
 * Formula:
 * riskScore = (daysOverdue * 2) + (missedPaymentCount * 15) - (responsivenessScore * 10)
 *
 * Buckets:
 * - 0 to 30: Low (mint)
 * - 31 to 70: Medium (peach)
 * - 71+: High (clay)
 *
 * @param {object} student Student record with payment details
 * @param {number} student.daysOverdue Days elapsed since the invoice due date
 * @param {number} student.missedPaymentCount Prior overdue counts
 * @param {number} student.responsivenessScore 0 to 1 scaling factor
 */
export function calculateRiskScore(student) {
  const days = Math.min(student.daysOverdue || 0, 60);
  const missed = student.missedPaymentCount || 0;
  const resp = student.responsivenessScore || 0;

  const score = (days * 2) + (missed * 15) - (resp * 10);
  return Math.max(0, Math.round(score));
}

/**
 * Returns the textual bucket name and styling indicator.
 * @param {number} score Calculated risk score
 */
export function getRiskBucket(score) {
  if (score <= 30) return { label: 'Low', colorClass: 'risk-low', badgeColor: '#9AE6B4' };
  if (score <= 70) return { label: 'Med', colorClass: 'risk-med', badgeColor: '#FFB4A2' };
  return { label: 'High', colorClass: 'risk-high', badgeColor: '#F4A896' };
}

/**
 * Returns breakdown components of the risk score.
 * Triggered on hover (desktop) and tap/click (touch/mobile viewports).
 *
 * @param {object} student Student record
 */
export function getRiskFactors(student) {
  const score = calculateRiskScore(student);
  const bucket = getRiskBucket(score);
  return {
    score,
    bucket: bucket.label,
    colorClass: bucket.colorClass,
    badgeColor: bucket.badgeColor,
    factors: {
      daysOverdue: student.daysOverdue || 0,
      cappedDays: Math.min(student.daysOverdue || 0, 60),
      missedPaymentCount: student.missedPaymentCount || 0,
      responsivenessScore: student.responsivenessScore || 0,
    },
    breakdownText: `${student.daysOverdue} days overdue, ${student.missedPaymentCount} missed payments, ${(student.responsivenessScore * 100).toFixed(0)}% responsiveness`
  };
}
