/**
 * Calculates the penalty amount based on a rule and base invoice amount.
 *
 * @param {object} rule PenaltyRule structure
 * @param {string} rule.calculationType 'flat' | 'percentage'
 * @param {number} rule.value Penalty rate (e.g. 2 for 2%) or flat rupee amount
 * @param {number|null} rule.capAmount Maximum rupee cap for percentage calculation, null if no cap
 * @param {number} baseAmount The invoice amount the penalty applies to
 * @returns {number} The calculated penalty in ₹
 */
export function calculatePenalty(rule, baseAmount) {
  if (!rule) return 0;

  if (rule.calculationType === 'flat') {
    return Number(rule.value) || 0;
  }

  if (rule.calculationType === 'percentage') {
    const rate = Number(rule.value) || 0;
    let penalty = baseAmount * (rate / 100);

    if (rule.capAmount !== null && rule.capAmount !== undefined) {
      penalty = Math.min(penalty, Number(rule.capAmount));
    }

    return Math.round(penalty);
  }

  return 0;
}
