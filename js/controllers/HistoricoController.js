// Layer 4 — Controllers
// Orchestrates the history/heatmap view.

import { todayLocal, formatDateLocal } from '../config/dateUtils.js';

import { CompromissoModel } from '../models/CompromissoModel.js';
import { CheckModel } from '../models/CheckModel.js';
import { DiarioModel } from '../models/DiarioModel.js';
import { CategoriaModel } from '../models/CategoriaModel.js';
import { AuthService } from '../services/AuthService.js';
import { ExportService } from '../services/ExportService.js';
import { HistoricoView } from '../views/HistoricoView.js';

export const HistoricoController = {
  _compromissos: [],
  _categorias: [],

  async init(filters = {}) {
    HistoricoView.showLoading();
    try {
      const user = await AuthService.getUser();
      HistoricoController._compromissos = await CompromissoModel.listAll();
      HistoricoController._categorias = await CategoriaModel.listAll();

      // Default: last 90 days
      const to = todayLocal();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 90);
      const from = formatDateLocal(fromDate);

      const allChecks = await CheckModel.listByDateRange(user.id, filters.from ?? from, filters.to ?? to);

      // Group checks by compromisso
      const checksPorCompromisso = {};
      for (const comp of HistoricoController._compromissos) {
        checksPorCompromisso[comp.id] = allChecks.filter(c => c.compromisso_id === comp.id);
      }

      // Filter by category if provided
      let compsToShow = HistoricoController._compromissos;
      if (filters.categoriaId) {
        compsToShow = compsToShow.filter(c => c.categoria_id === filters.categoriaId);
      }

      HistoricoView.render({
        compromissos: compsToShow,
        categorias: HistoricoController._categorias,
        checksPorCompromisso,
        allChecks,
        from: filters.from ?? from,
        to: filters.to ?? to,
        onFilter: HistoricoController.init,
        onExport: HistoricoController.handleExport,
        onExportDiario: HistoricoController.handleExportDiario,
      });
    } catch (e) {
      HistoricoView.showError(e.message);
    }
  },

  async handleExport() {
    try {
      const user = await AuthService.getUser();
      const to = todayLocal();
      const from = formatDateLocal(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));
      const checks = await CheckModel.listByDateRange(user.id, from, to);
      ExportService.exportChecksCSV(checks, HistoricoController._compromissos);
    } catch (e) {
      HistoricoView.showError(e.message);
    }
  },

  async handleExportDiario() {
    try {
      const to = todayLocal();
      const from = formatDateLocal(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));
      const entries = await DiarioModel.listByDateRange(from, to);
      ExportService.exportDiarioCSV(entries);
    } catch (e) {
      HistoricoView.showError(e.message);
    }
  },
};
