/**
 * Calculates Levenshtein Distance between two strings.
 */
function levenshteinDistance(a, b) {
  const tmp = [];
  let i, j, alen = a.length, blen = b.length;
  if (alen === 0) return blen;
  if (blen === 0) return alen;
  for (i = 0; i <= alen; i++) tmp[i] = [i];
  for (j = 0; j <= blen; j++) tmp[0][j] = j;
  for (i = 1; i <= alen; i++) {
    for (j = 1; j <= blen; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[alen][blen];
}

/**
 * Calculates Levenshtein similarity between 0 and 1.
 */
function getStringSimilarity(s1, s2) {
  const str1 = (s1 || '').toLowerCase().trim();
  const str2 = (s2 || '').toLowerCase().trim();
  if (str1 === str2) return 1.0;
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Parses bank line format: "DD/MM/YYYY | AMOUNT | NARRATION"
 * Returns parsed object or null if invalid.
 */
export function parseBankLine(line) {
  if (!line || !line.trim()) return null;
  const parts = line.split('|').map(p => p.trim());
  if (parts.length < 3) return null;

  const dateStr = parts[0];
  const amountStr = parts[1];
  const narration = parts[2];

  // Parse DD/MM/YYYY
  const dateParts = dateStr.split('/');
  if (dateParts.length !== 3) return null;
  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
  const year = parseInt(dateParts[2], 10);
  const date = new Date(year, month, day);

  const amount = parseFloat(amountStr.replace(/[^0-9.-]/g, ''));

  if (isNaN(amount) || isNaN(date.getTime())) return null;

  return { date, amount, narration };
}

/**
 * Deterministic matching algorithm for imported bank lines.
 *
 * Heuristics:
 * 1. Exact amount match within ±3 days of invoice due date.
 * 2. If single match → Confidence "High"
 * 3. If multiple invoices match on amount in window:
 *    - Check Levenshtein distance between narration and student/guardian name.
 *    - Best match with similarity >= 0.7 → Confidence "Medium"
 * 4. Otherwise → Confidence "Unmatched"
 *
 * @param {object} bankLine { date, amount, narration }
 * @param {Array<object>} invoices List of active outstanding invoices
 * @returns {object} { matchConfidence: 'high' | 'medium' | 'unmatched', matchedInvoice: Invoice | null }
 */
export function matchTransaction(bankLine, invoices) {
  if (!bankLine) return { matchConfidence: 'unmatched', matchedInvoice: null };

  const { date, amount, narration } = bankLine;
  const targetTime = date.getTime();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  // Filter outstanding/unpaid invoices that match on amount and are within due date window (±3 days)
  const candidateInvoices = invoices.filter(inv => {
    // Only match against outstanding or partially paid invoices (amountRemaining > 0)
    if (inv.status === 'Paid' || inv.status === 'Settled' || inv.status === 'Reconciled') return false;

    const amountDiff = Math.abs(inv.amountRemaining - amount);
    if (amountDiff > 0.01) return false; // Exact amount match required (or float tolerance)

    const dueDate = new Date(inv.dueDate);
    const dateDiff = Math.abs(dueDate.getTime() - targetTime);
    return dateDiff <= threeDaysMs;
  });

  if (candidateInvoices.length === 0) {
    return { matchConfidence: 'unmatched', matchedInvoice: null };
  }

  if (candidateInvoices.length === 1) {
    return { matchConfidence: 'high', matchedInvoice: candidateInvoices[0] };
  }

  // Multiple candidates match on amount and date. Break ties using narration similarity.
  let bestInvoice = null;
  let bestScore = -1;

  for (const inv of candidateInvoices) {
    // Check match against studentName, guardianName, or rollNumber
    const studentNameSim = getStringSimilarity(narration, inv.studentName);
    const guardianNameSim = getStringSimilarity(narration, inv.guardianName);

    const maxSim = Math.max(studentNameSim, guardianNameSim);
    if (maxSim > bestScore) {
      bestScore = maxSim;
      bestInvoice = inv;
    }
  }

  if (bestInvoice && bestScore >= 0.7) {
    return { matchConfidence: 'medium', matchedInvoice: bestInvoice };
  }

  // If there are multiple invoices with the same amount and no name similarity can break the tie:
  // We mark it as unmatched for manual intervention.
  return { matchConfidence: 'unmatched', matchedInvoice: null };
}
