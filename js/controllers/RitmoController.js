// Layer 4 - Controllers
// Orchestrates planning/load rhythm views: past days, future expectations, weekly/monthly percentages.

import { todayLocal, formatDateLocal } from '../config/dateUtils.js';

import { CompromissoModel } from '../models/CompromissoModel.js';
import { CheckModel } from '../models/CheckModel.js';
import { AuthService } from '../services/AuthService.js';
import { RitmoView } from '../views/RitmoView.js';

export const RitmoController = {
  async init() {
    RitmoView.showLoading();
    try {
      const user = await AuthService.getUser();
      const compromissos = await CompromissoModel.listAll();

      const today = todayLocal();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 180);
      const from = formatDateLocal(fromDate);

      const checks = await CheckModel.listByDateRange(user.id, from, today);

      RitmoView.render({
        compromissos,
        checks,
        from,
        to: today,
      });
    } catch (e) {
      RitmoView.showError(e.message);
    }
  },
};
