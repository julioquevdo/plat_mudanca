// Layer 3 — Services
// Generates the descriptive (non-evaluative) weekly review summary (US11).
// Language is always descriptive, never evaluative (RN11.1).

import { CHECK_STATUS, DIAS_SEMANA } from '../config/constants.js';

export const RevisaoService = {
  /**
   * Generate a summary for a commitment given its checks for the past ~30 days.
   * Returns an object with computed stats for the RevisaoView to render.
   */
  gerarResumo(compromisso, checks) {
    const relevantes = checks.filter(c => c.status !== CHECK_STATUS.PAUSADO);
    const total = relevantes.length;
    const cumpridos = relevantes.filter(c => c.status === CHECK_STATUS.CUMPRIDO).length;
    const taxa = total > 0 ? Math.round((cumpridos / total) * 100) : 0;
    const ordenados = [...relevantes].sort((a, b) => (a.data > b.data ? 1 : -1));
    const retomadas = ordenados.reduce((acc, check, index) => {
      const anterior = ordenados[index - 1];
      if (check.status === CHECK_STATUS.CUMPRIDO && anterior?.status === CHECK_STATUS.NAO_CUMPRIDO) {
        return acc + 1;
      }
      return acc;
    }, 0);

    // Taxa por dia da semana
    const porDia = DIAS_SEMANA.map(dia => {
      const doDia = relevantes.filter(c => new Date(c.data + 'T00:00:00').getDay() === dia.value);
      const cumprDia = doDia.filter(c => c.status === CHECK_STATUS.CUMPRIDO).length;
      return {
        dia: dia.label,
        total: doDia.length,
        cumpridos: cumprDia,
        taxa: doDia.length > 0 ? Math.round((cumprDia / doDia.length) * 100) : null,
      };
    });

    // Contextos mais frequentes
    const contextos = checks
      .filter(c => c.contexto)
      .map(c => c.contexto.trim().toLowerCase())
      .reduce((acc, ctx) => {
        acc[ctx] = (acc[ctx] ?? 0) + 1;
        return acc;
      }, {});
    const contextoFrequente = Object.entries(contextos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([ctx]) => ctx);

    // Dia da semana com menor taxa
    const diasComDados = porDia.filter(d => d.total >= 2);
    const diaMaisBaixo = diasComDados.sort((a, b) => (a.taxa ?? 100) - (b.taxa ?? 100))[0] ?? null;
    const diaMaisAlto  = diasComDados.sort((a, b) => (b.taxa ?? 0) - (a.taxa ?? 0))[0] ?? null;

    return {
      compromisso,
      periodo: {
        total,
        cumpridos,
        taxa,
        retomadas,
      },
      porDia,
      diaMaisBaixo,
      diaMaisAlto,
      contextoFrequente,
    };
  },

  /**
   * Finds the commitment with the highest historical fulfillment rate (US16).
   */
  melhorCompromisso(compromissos, checksPorCompromisso) {
    let melhor = null;
    let melhorTaxa = -1;
    for (const comp of compromissos) {
      const checks = checksPorCompromisso[comp.id] ?? [];
      const relevantes = checks.filter(c => c.status !== CHECK_STATUS.PAUSADO);
      if (relevantes.length < 5) continue; // need enough data
      const taxa = relevantes.filter(c => c.status === CHECK_STATUS.CUMPRIDO).length / relevantes.length;
      if (taxa > melhorTaxa) {
        melhorTaxa = taxa;
        melhor = { compromisso: comp, taxa: Math.round(taxa * 100) };
      }
    }
    return melhor;
  },

  compromissoSobrevivente(compromissos) {
    const ativosComData = compromissos
      .filter(comp => comp.criado_em)
      .sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em));
    const compromisso = ativosComData[0] ?? compromissos[0] ?? null;
    if (!compromisso) return null;

    const criado = new Date(compromisso.criado_em);
    const hoje = new Date();
    const dias = Math.max(0, Math.floor((hoje - criado) / (1000 * 60 * 60 * 24)));
    return { compromisso, dias };
  },

  /**
   * Check if today is a revision day for any commitment.
   */
  isRevisaoDay(compromissos) {
    const today = new Date().getDay(); // 0=Sun
    return compromissos.some(c => c.dia_revisao === today);
  },
};
