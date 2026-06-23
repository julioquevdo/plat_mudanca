// Layer 4 — Controllers
// Orchestrates the weekly review view.

import { CompromissoModel } from '../models/CompromissoModel.js';
import { CheckModel } from '../models/CheckModel.js';
import { RevisaoService } from '../services/RevisaoService.js';
import { RevisaoView } from '../views/RevisaoView.js';

export const RevisaoController = {
  async init() {
    RevisaoView.showLoading();
    try {
      const compromissos = await CompromissoModel.listAll();

      // Load last 30 days of checks per commitment
      const checksPorCompromisso = {};
      for (const comp of compromissos) {
        checksPorCompromisso[comp.id] = await CheckModel.listRecent(comp.id, 30);
      }

      const resumos = compromissos.map(comp =>
        RevisaoService.gerarResumo(comp, checksPorCompromisso[comp.id] ?? [])
      );

      const melhor = RevisaoService.melhorCompromisso(compromissos, checksPorCompromisso);
      const sobrevivente = RevisaoService.compromissoSobrevivente(compromissos);
      const isRevisaoDay = RevisaoService.isRevisaoDay(compromissos);

      RevisaoView.render({
        resumos,
        melhor,
        sobrevivente,
        isRevisaoDay,
        compromissos,
        onEditarCompromisso: (id, data) => {
          // Delegate to CompromissoController — already has lock logic
          import('./CompromissoController.js').then(m => m.CompromissoController.handleEditar({ id, formData: data }));
        },
      });
    } catch (e) {
      RevisaoView.showError(e.message);
    }
  },
};
