// Layer 3 — Services
// Calculates strict streak state based on frequency configuration.
// Supports daily, specific weekdays, and X times a week.
//
// Returns: { valor: number, estado: 'ativo' | 'zerado' }

import { CHECK_STATUS, STREAK_ESTADO } from '../config/constants.js';
import { formatDateLocal } from '../config/dateUtils.js';
import { FrequencyUtils } from '../config/frequencyUtils.js';

export const StreakService = {
  /**
   * Main calculation function.
   * @param {Array} checks - Sorted ascending by date. Each: { data: 'YYYY-MM-DD', status }
   * @param {string} today - 'YYYY-MM-DD'
   * @param {Object} comp - Commitment configuration
   * @returns {{ valor: number, estado: string }}
   */
  calcular(checks, today, comp) {
    if (!checks || checks.length === 0) {
      return { valor: 0, estado: STREAK_ESTADO.ZERADO };
    }

    const checkMap = new Map(checks.map(c => [c.data, c]));
    
    if (comp && comp.frequencia_tipo === 'xVezesSemana') {
      return this._calcularStreakSemanal(checkMap, today, comp);
    }
    
    return this._calcularStreakDiario(checkMap, today, comp);
  },

  _calcularStreakDiario(checkMap, today, comp) {
    const todayCheck = checkMap.get(today);

    if (todayCheck) {
      if (todayCheck.status === CHECK_STATUS.CUMPRIDO || todayCheck.status === CHECK_STATUS.PAUSADO) {
        return { valor: this._countConsecutive(checkMap, today, comp), estado: STREAK_ESTADO.ATIVO };
      } else {
        return { valor: 0, estado: STREAK_ESTADO.ZERADO };
      }
    }
    
    // Today not checked. Check backwards for the last expected day or fulfilled unexpected day.
    let current = this._offsetDate(today, -1);
    
    while (true) {
      const check = checkMap.get(current);
      const isExpected = comp ? FrequencyUtils.isExpectedOnDate(comp, current) : true;
      
      if (check) {
         if (check.status === CHECK_STATUS.CUMPRIDO || check.status === CHECK_STATUS.PAUSADO) {
            return { valor: this._countConsecutive(checkMap, current, comp), estado: STREAK_ESTADO.ATIVO };
         } else {
            return { valor: 0, estado: STREAK_ESTADO.ZERADO };
         }
      } else {
         if (isExpected) {
            // Expected day has no check! Streak is broken.
            return { valor: 0, estado: STREAK_ESTADO.ZERADO };
         }
      }
      
      current = this._offsetDate(current, -1);
      // Safety break
      if (comp && comp.criado_em && current < comp.criado_em.split('T')[0]) {
         break;
      }
      if (!comp && new Date(today).getTime() - new Date(current).getTime() > 30 * 24 * 60 * 60 * 1000) {
         break;
      }
    }
    
    return { valor: 0, estado: STREAK_ESTADO.ZERADO };
  },

  _calcularStreakSemanal(checkMap, today, comp) {
     const meta = comp.frequencia_vezes || 1;
     let totalDiasCumpridos = 0;
     
     let currentWeek = FrequencyUtils.getCalendarWeekRange(today);
     let isCurrentWeek = true;
     let broken = false;
     
     while (!broken) {
        if (comp.criado_em && currentWeek.end < comp.criado_em.split('T')[0]) {
           break;
        }
        
        let checksNaSemana = 0;
        let d = currentWeek.start;
        for (let i=0; i<7; i++) {
           const check = checkMap.get(d);
           if (check && (check.status === CHECK_STATUS.CUMPRIDO || check.status === CHECK_STATUS.PAUSADO)) {
              checksNaSemana++;
           }
           d = this._offsetDate(d, 1);
        }
        
        if (isCurrentWeek) {
           if (checksNaSemana >= meta) {
              totalDiasCumpridos += checksNaSemana;
           } else {
              let remaining = 0;
              let temp = today;
              while (temp <= currentWeek.end) {
                 const c = checkMap.get(temp);
                 if (!c || (c.status !== CHECK_STATUS.CUMPRIDO && c.status !== CHECK_STATUS.PAUSADO && c.status !== CHECK_STATUS.NAO_CUMPRIDO)) {
                    remaining++;
                 }
                 temp = this._offsetDate(temp, 1);
              }
              
              if (checksNaSemana + remaining >= meta) {
                 totalDiasCumpridos += checksNaSemana;
              } else {
                 return { valor: 0, estado: STREAK_ESTADO.ZERADO };
              }
           }
           isCurrentWeek = false;
        } else {
           if (checksNaSemana >= meta) {
              totalDiasCumpridos += checksNaSemana;
           } else {
              broken = true;
           }
        }
        
        const prevSunday = this._offsetDate(currentWeek.start, -1);
        currentWeek = FrequencyUtils.getCalendarWeekRange(prevSunday);
     }
     
     return { 
        valor: totalDiasCumpridos, 
        estado: totalDiasCumpridos > 0 ? STREAK_ESTADO.ATIVO : STREAK_ESTADO.ZERADO 
     };
  },

  /**
   * Counts strictly consecutive 'cumprido' or 'pausado' days going backwards from a date.
   * Days that are unexpected and unrecorded are skipped.
   */
  _countConsecutive(checkMap, fromDate, comp) {
    let count = 0;
    let current = fromDate;
    
    // Safety limit of 365 days
    for (let i = 0; i < 365; i++) {
      const check = checkMap.get(current);
      const isExpected = comp ? FrequencyUtils.isExpectedOnDate(comp, current) : true;
      
      if (check && (check.status === CHECK_STATUS.CUMPRIDO || check.status === CHECK_STATUS.PAUSADO)) {
        count++; // Counts even if unexpected, rewarding extra effort
        current = this._offsetDate(current, -1);
      } else if (!check && !isExpected) {
        // Safe to skip
        current = this._offsetDate(current, -1);
      } else {
        // Found a gap or explicit naoCumprido
        break;
      }
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
