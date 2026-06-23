// Layer 4 - Controllers
// Orchestrates the home/dashboard view: checks for today, streak/XP updates.

import { CompromissoModel } from '../models/CompromissoModel.js';
import { CheckModel } from '../models/CheckModel.js';
import { StreakService } from '../services/StreakService.js';
import { XPService } from '../services/XPService.js';
import { AuthService } from '../services/AuthService.js';
import { HomeView } from '../views/HomeView.js';
import { DiarioModel } from '../models/DiarioModel.js';
import { VitoriaPequenaModel } from '../models/VitoriaPequenaModel.js';
import { CHECK_STATUS } from '../config/constants.js';

export const HomeController = {
  _compromissos: [],
  _todayChecks: {},

  async init() {
    HomeView.showLoading();
    try {
      const today = HomeController._today();
      const user = await AuthService.getUser();
      HomeController._todayChecks = {};
      HomeController._compromissos = await CompromissoModel.listAll();

      for (const comp of HomeController._compromissos) {
        const check = await CheckModel.getTodayCheck(comp.id, today);
        HomeController._todayChecks[comp.id] = check;
      }

      const diarioEntry = await DiarioModel.getToday(today);
      const vitoriasPequenas = await VitoriaPequenaModel.listByDate(today);
      const totalCumpridos = await CheckModel.countCumpridosByUser(user.id);
      const treeStats = await HomeController._buildTreeStats(HomeController._compromissos);

      HomeView.render({
        compromissos: HomeController._compromissos,
        todayChecks: HomeController._todayChecks,
        today,
        diarioEntry,
        vitoriasPequenas,
        totalCumpridos,
        treeStats,
        onCheck: HomeController.handleCheck,
        onRetroativo: HomeController.handleRetroativo,
        onSaveDiario: HomeController.handleSaveDiario,
        onAddVitoriaPequena: HomeController.handleAddVitoriaPequena,
        onDeleteVitoriaPequena: HomeController.handleDeleteVitoriaPequena,
      });
    } catch (e) {
      HomeView.showError(e.message);
    }
  },

  async handleCheck({ compromissoId, status, data, sensacao, contexto, diaRuim = false }) {
    const user = await AuthService.getUser();
    try {
      const existingCheck = await CheckModel.getTodayCheck(compromissoId, data);

      await CheckModel.save({
        compromisso_id: compromissoId,
        user_id: user.id,
        data,
        status,
        contexto: contexto ?? null,
        sensacao: sensacao ?? null,
        dia_ruim: diaRuim,
      });

      const comp = HomeController._compromissos.find(c => c.id === compromissoId);
      const recentChecks = await CheckModel.listRecent(compromissoId, 90);
      const streakResult = StreakService.calcular(recentChecks, HomeController._today());
      const shouldAwardXP = status === 'cumprido' && existingCheck?.status !== 'cumprido';
      const newXP = XPService.calcularNovoXP(comp.xp_total, status, {
        diaRuim,
        shouldAward: shouldAwardXP,
      });
      const previousCheck = [...recentChecks]
        .filter(c => c.data < data)
        .sort((a, b) => (a.data < b.data ? 1 : -1))[0];
      const retomada = status === 'cumprido' && previousCheck?.status === 'naoCumprido';

      await CompromissoModel.updateStreakXP(compromissoId, {
        streak_atual: streakResult.valor,
        streak_estado: streakResult.estado,
        xp_total: newXP,
      });

      if (retomada) {
        HomeView.showSuccess('Retomada registrada. Voltar depois de um dia dificil tambem conta.');
      }

      await HomeController.init();
    } catch (e) {
      HomeView.showError(e.message);
    }
  },

  async handleRetroativo({ compromissoId, data, status }) {
    const user = await AuthService.getUser();
    await CheckModel.save({
      compromisso_id: compromissoId,
      user_id: user.id,
      data,
      status,
    });
    const recentChecks = await CheckModel.listRecent(compromissoId, 90);
    const streakResult = StreakService.calcular(recentChecks, HomeController._today());
    const comp = HomeController._compromissos.find(c => c.id === compromissoId);
    await CompromissoModel.updateStreakXP(compromissoId, {
      streak_atual: streakResult.valor,
      streak_estado: streakResult.estado,
      xp_total: comp.xp_total,
    });
    await HomeController.init();
  },

  async handleSaveDiario({ conteudo }) {
    const user = await AuthService.getUser();
    const today = HomeController._today();
    await DiarioModel.saveToday({ user_id: user.id, data: today, conteudo });
  },

  async handleAddVitoriaPequena({ conteudo }) {
    const user = await AuthService.getUser();
    const today = HomeController._today();
    await VitoriaPequenaModel.create({ user_id: user.id, data: today, conteudo });
    await HomeController.init();
  },

  async handleDeleteVitoriaPequena(id) {
    await VitoriaPequenaModel.delete(id);
    await HomeController.init();
  },

  _today() {
    return new Date().toISOString().split('T')[0];
  },

  async _buildTreeStats(compromissos) {
    const branches = [];

    for (const comp of compromissos) {
      const checks = await CheckModel.listRecent(comp.id, 365);
      const ordered = [...checks].sort((a, b) => (a.data > b.data ? 1 : -1));
      const totalDone = ordered.filter(c => c.status === CHECK_STATUS.CUMPRIDO).length;
      const totalMissed = ordered.filter(c => c.status === CHECK_STATUS.NAO_CUMPRIDO).length;
      const badDays = ordered.filter(c => c.dia_ruim).length;
      const retomadas = ordered.reduce((acc, check, index) => {
        const previous = ordered[index - 1];
        if (check.status === CHECK_STATUS.CUMPRIDO && previous?.status === CHECK_STATUS.NAO_CUMPRIDO) {
          return acc + 1;
        }
        return acc;
      }, 0);

      const gaps = HomeController._getMissedSegments(ordered);
      const longestGap = gaps.reduce((max, gap) => Math.max(max, gap.days), 0);
      const currentGap = gaps[gaps.length - 1]?.isOpen ? gaps[gaps.length - 1].days : 0;
      const recentDone = ordered.filter(c => {
        if (c.status !== CHECK_STATUS.CUMPRIDO) return false;
        const diffMs = Date.now() - new Date(`${c.data}T00:00:00`).getTime();
        return diffMs <= 14 * 24 * 60 * 60 * 1000;
      }).length;

      branches.push({
        id: comp.id,
        nome: comp.nome,
        color: comp.categorias?.cor || '#6A9F7E',
        streak: comp.streak_atual || 0,
        totalDone,
        totalMissed,
        totalChecks: ordered.length,
        badDays,
        retomadas,
        recentDone,
        longestGap,
        currentGap,
        gaps: gaps.slice(-4),
      });
    }

    return {
      branches,
      totalBranches: branches.length,
      totalDone: branches.reduce((acc, branch) => acc + branch.totalDone, 0),
      totalRetomadas: branches.reduce((acc, branch) => acc + branch.retomadas, 0),
    };
  },

  _getMissedSegments(checks) {
    const gaps = [];
    let current = null;

    for (const check of checks) {
      if (check.status === CHECK_STATUS.NAO_CUMPRIDO) {
        if (!current) {
          current = { start: check.data, end: check.data, days: 0, isOpen: true };
        }
        current.end = check.data;
        current.days += 1;
      } else if (current) {
        current.isOpen = false;
        gaps.push(current);
        current = null;
      }
    }

    if (current) {
      gaps.push(current);
    }

    return gaps;
  },
};
