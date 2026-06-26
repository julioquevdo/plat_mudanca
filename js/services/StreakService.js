// Layer 3 — Services
// Calculates streak state using the non-punitive protection rule:
// A single missed day does NOT break the streak if the next day is completed.
//
// Returns: { valor: number, estado: 'ativo' | 'pendente' | 'zerado' }
//
// Estado 'pendente': user failed today but tomorrow is still possible
//   → no "0" is shown on the day of the failure (RN04.1)

import { CHECK_STATUS, STREAK_ESTADO } from '../config/constants.js';
import { formatDateLocal } from '../config/dateUtils.js';

export const StreakService = {
  /**
   * Main calculation function.
   * @param {Array} checks - Sorted ascending by date. Each: { data: 'YYYY-MM-DD', status }
   * @param {string} today - 'YYYY-MM-DD'
   * @returns {{ valor: number, estado: string }}
   */
  calcular(checks, today) {
    if (!checks || checks.length === 0) {
      return { valor: 0, estado: STREAK_ESTADO.ZERADO };
    }

    // Work with sorted descending
    const sorted = [...checks].sort((a, b) => (a.data < b.data ? 1 : -1));
    const todayCheck = sorted.find(c => c.data === today);

    // If today is not yet checked, check what happened yesterday
    if (!todayCheck) {
      const yesterday = StreakService._offsetDate(today, -1);
      const yesterdayCheck = sorted.find(c => c.data === yesterday);
      if (yesterdayCheck?.status === CHECK_STATUS.NAO_CUMPRIDO) {
        // Yesterday was failed, today not yet checked → streak is PENDENTE
        const streakBeforeYesterday = StreakService._countConsecutiveFrom(sorted, StreakService._offsetDate(yesterday, -1));
        return { valor: streakBeforeYesterday, estado: STREAK_ESTADO.PENDENTE };
      }
      // No check today and yesterday was fine → just count from most recent
      return { valor: StreakService._countConsecutiveFrom(sorted, today), estado: STREAK_ESTADO.ATIVO };
    }

    // Today IS checked
    if (todayCheck.status === CHECK_STATUS.CUMPRIDO || todayCheck.status === CHECK_STATUS.PAUSADO) {
      const valor = StreakService._countConsecutiveFrom(sorted, today);
      return { valor, estado: STREAK_ESTADO.ATIVO };
    }

    // Today is naoCumprido → PENDENTE state (don't show 0 yet)
    // The streak value shown is the count BEFORE today
    const yesterday = StreakService._offsetDate(today, -1);
    const valor = StreakService._countConsecutiveFrom(sorted, yesterday);
    return { valor, estado: STREAK_ESTADO.PENDENTE };
  },

  /**
   * Counts consecutive 'cumprido' or 'pausado' days going backwards from a date.
   * A single 'naoCumprido' gap is allowed if the surrounding days are cumprido.
   */
  _countConsecutiveFrom(sortedDesc, fromDate) {
    let count = 0;
    let current = fromDate;
    let skippedOnce = false;

    for (let i = 0; i < 365; i++) {
      const check = sortedDesc.find(c => c.data === current);
      if (!check) {
        // No check for this date — could be future or just never tracked
        // If we haven't started counting yet, move back one more day to find the start
        if (count === 0) {
          current = StreakService._offsetDate(current, -1);
          continue;
        }
        break;
      }
      if (check.status === CHECK_STATUS.CUMPRIDO || check.status === CHECK_STATUS.PAUSADO) {
        count++;
        skippedOnce = false; // gap-and-recover resets the used skip
      } else if (check.status === CHECK_STATUS.NAO_CUMPRIDO && !skippedOnce && count > 0) {
        // Protection: one gap is forgivable if surrounded by cumprido
        // Look ahead (next day in desc = previous day chronologically)
        skippedOnce = true;
        // Don't break — allow the streak to continue through this gap
      } else {
        break;
      }
      current = StreakService._offsetDate(current, -1);
    }
    return count;
  },

  /**
   * Offset a date string by N days.
   */
  _offsetDate(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return formatDateLocal(d);
  },
};
