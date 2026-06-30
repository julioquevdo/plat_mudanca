import { formatDateLocal } from './dateUtils.js';

export const FrequencyUtils = {
  /**
   * Verifica se o compromisso está ativo (não pausado, já criado) na data.
   */
  isCompActiveOnDate(comp, dateStr) {
    if (comp.criado_em && dateStr < comp.criado_em.split('T')[0]) return false;
    if (comp.pausado_ate && dateStr <= comp.pausado_ate) return false;
    return true;
  },

  /**
   * Verifica se um compromisso é esperado/obrigatório em uma data específica.
   * Obs: xVezesSemana sempre retorna `false` aqui, porque a expectativa não está
   * presa a uma data individual, mas à janela semanal.
   */
  isExpectedOnDate(comp, dateStr) {
    if (!this.isCompActiveOnDate(comp, dateStr)) return false;
    
    if (comp.frequencia_tipo === 'diaria') return true;
    
    if (comp.frequencia_tipo === 'diasSemana') {
      const d = new Date(`${dateStr}T00:00:00`);
      // No JS: 0=Domingo, 6=Sábado. O banco também usa [0..6]
      const weekday = d.getDay();
      return this.normalizeWeekdays(comp.frequencia_dias).includes(weekday);
    }
    
    // xVezesSemana nunca é esperado num dia específico
    return false;
  },

  /**
   * Garante que um array de dias da semana retorne inteiros válidos.
   */
  normalizeWeekdays(dias) {
    if (!Array.isArray(dias)) return [];
    return dias.map(d => parseInt(d, 10)).filter(d => !isNaN(d));
  },

  /**
   * Identifica o "início" e "fim" da semana (Segunda a Domingo) em que a data cai.
   * Retorna { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
   */
  getCalendarWeekRange(dateStr) {
    const d = new Date(`${dateStr}T00:00:00`);
    const day = d.getDay(); // 0 = Dom, 1 = Seg, ...
    
    // Calcula quantos dias voltar para chegar na Segunda-feira (1)
    // Se hoje é Dom (0), voltamos 6 dias.
    // Se hoje é Seg (1), voltamos 0 dias.
    // Se hoje é Ter (2), voltamos 1 dia.
    const diffToMonday = day === 0 ? 6 : day - 1;
    
    const monday = new Date(d);
    monday.setDate(monday.getDate() - diffToMonday);
    
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    
    return {
      start: formatDateLocal(monday),
      end: formatDateLocal(sunday),
    };
  }
};
