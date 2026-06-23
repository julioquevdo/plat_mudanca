// Layer 4 — Controllers
// Orchestrates commitment creation, editing (with lock), pausing.

import { CompromissoModel } from '../models/CompromissoModel.js';
import { CategoriaModel } from '../models/CategoriaModel.js';
import { AuthService } from '../services/AuthService.js';
import { XPService } from '../services/XPService.js';
import { CompromissoView } from '../views/CompromissoView.js';
import { LIMITE_COMPROMISSOS_SUGERIDO } from '../config/constants.js';

export const CompromissoController = {
  _compromissos: [],
  _categorias: [],

  async init() {
    CompromissoView.showLoading();
    CompromissoController._compromissos = await CompromissoModel.listAll();
    CompromissoController._categorias = await CategoriaModel.listAll();

    const total = CompromissoController._compromissos.length;
    const compromissosComXP = CompromissoController._compromissos.map((c, idx) => ({
      ...c,
      // Fallback to display order if prioridade hasn't been set yet (pre-migration rows)
      xp_estimado: XPService.getXPPorPrioridade(c.prioridade ?? idx + 1, total),
    }));

    CompromissoView.render({
      compromissos: compromissosComXP,
      categorias: CompromissoController._categorias,
      onNovoCompromisso: CompromissoController.handleNovo,
      onEditar: CompromissoController.handleEditar,
      onPausar: CompromissoController.handlePausar,
      onRetomar: CompromissoController.handleRetomar,
      onDesativar: CompromissoController.handleDesativar,
      onReordenar: CompromissoController.handleReordenar,
      limiteSugerido: Number(localStorage.getItem('limite_compromissos_sugerido')) || LIMITE_COMPROMISSOS_SUGERIDO,
    });
  },

  async handleNovo(formData) {
    const user = await AuthService.getUser();
    await CompromissoModel.create({ ...formData, user_id: user.id });
    await CompromissoController.init();
  },

  async handleEditar({ id, formData }) {
    // Enforce revisao window lock (RN01.2 / RF07.2)
    const comp = await CompromissoModel.getById(id);
    const travado = CompromissoController._isLocked(comp);
    if (travado) {
      CompromissoView.showLockMessage(comp);
      return;
    }
    await CompromissoModel.update(id, formData);
    await CompromissoController.init();
  },

  async handlePausar({ id, pausadoAte }) {
    // RN09.1: pausado_ate is required
    if (!pausadoAte) {
      CompromissoView.showError('Data de retomada é obrigatória para pausar um compromisso.');
      return;
    }
    await CompromissoModel.pause(id, pausadoAte);
    await CompromissoController.init();
  },

  async handleRetomar(id) {
    await CompromissoModel.resume(id);
    await CompromissoController.init();
  },

  async handleDesativar(id) {
    await CompromissoModel.deactivate(id);
    await CompromissoController.init();
  },

  /**
   * Persist a new priority order coming from the drag-and-drop UI.
   * `novaOrdem` is an array of commitment IDs, index 0 = highest priority.
   */
  async handleReordenar(novaOrdem) {
    const ranking = novaOrdem.map((id, idx) => ({ id, prioridade: idx + 1 }));
    try {
      await CompromissoModel.updatePrioridades(ranking);
    } catch (err) {
      CompromissoView.showError(err.message);
    }
    await CompromissoController.init();
  },

  /**
   * Check if a commitment is locked for editing.
   * Returns true if today is NOT the dia_revisao AND the override is not active.
   * Override stored in localStorage (settings) — requires 2 levels of navigation.
   */
  _isLocked(comp) {
    const overrideAtivo = localStorage.getItem('revisao_lock_disabled') === 'true';
    if (overrideAtivo) return false;
    const today = new Date().getDay(); // 0=Sun
    return comp.dia_revisao !== today;
  },
};