// Layer 3 — Services
// XP and level calculations. XP only ever increases (RN04.2).

import { XP_POR_CHECK, XP_DIA_RUIM, NIVEIS, CHECK_STATUS } from '../config/constants.js';

export const XPService = {
  /**
   * Calculate the XP a single check is worth, based on the commitment's
   * priority rank among the user's active commitments.
   *
   * `prioridade` = 1 means highest priority (gets more XP), and the
   * lowest priority among `totalAtivos` commitments gets the least.
   * The WEIGHTED AVERAGE across all priorities always equals `baseXP`,
   * so redistributing priority never changes the overall pace of
   * progression — it only shifts emphasis between commitments.
   *
   * Formula: peso(rank) = total - rank + 1 (linear, highest rank = highest weight)
   *          xp(rank)   = baseXP * peso(rank) / pesoMédio
   * where pesoMédio = (total + 1) / 2, so the average of xp(rank) over
   * all ranks 1..total is exactly baseXP.
   */
  getXPPorPrioridade(prioridade, totalAtivos, baseXP = XP_POR_CHECK) {
    const total = Math.max(1, Number(totalAtivos) || 1);
    const rankBruto = Number(prioridade) || total;
    const rank = Math.min(Math.max(1, rankBruto), total); // clamp to [1, total]
    const peso = total - rank + 1;
    const pesoMedio = (total + 1) / 2;
    const xp = Math.round((baseXP * peso) / pesoMedio);
    return Math.max(1, xp); // never zero — every completed check still feels like progress
  },

  /**
   * Calculate new XP after a check is saved.
   * XP increases only on 'cumprido'. Never decreases.
   *
   * Pass `prioridade` + `totalAtivos` to use the priority-weighted amount;
   * if omitted, falls back to the flat XP_POR_CHECK / XP_DIA_RUIM values.
   */
  calcularNovoXP(xpAtual, status, { diaRuim = false, shouldAward = true, prioridade = null, totalAtivos = null } = {}) {
    if (status === CHECK_STATUS.CUMPRIDO && shouldAward) {
      const xpBase = diaRuim ? XP_DIA_RUIM : XP_POR_CHECK;
      const ganho = (prioridade != null && totalAtivos)
        ? XPService.getXPPorPrioridade(prioridade, totalAtivos, xpBase)
        : xpBase;
      return xpAtual + ganho;
    }
    return xpAtual; // XP never decreases
  },

  /**
   * Get the current level data for a given XP total.
   */
  getNivel(xpTotal) {
    return NIVEIS.find(n => xpTotal >= n.min && xpTotal <= n.max) ?? NIVEIS[NIVEIS.length - 1];
  },

  /**
   * Get progress percentage within the current level.
   */
  getProgressoNivel(xpTotal) {
    const nivel = XPService.getNivel(xpTotal);
    if (nivel.max === Infinity) return 100;
    const range = nivel.max - nivel.min;
    const progress = xpTotal - nivel.min;
    return Math.min(100, Math.round((progress / range) * 100));
  },

  /**
   * Get XP needed to reach next level.
   */
  getXPParaProximoNivel(xpTotal) {
    const nivel = XPService.getNivel(xpTotal);
    if (nivel.max === Infinity) return null;
    return nivel.max - xpTotal + 1;
  },
};