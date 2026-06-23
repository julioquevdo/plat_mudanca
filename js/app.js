// Layer 6 - App / Router
// Bootstraps the application, handles routing (SPA), and enforces authentication guards.

import { AuthService } from './services/AuthService.js';
import { AuthView } from './views/AuthView.js';
import { HomeController } from './controllers/HomeController.js';
import { CompromissoController } from './controllers/CompromissoController.js';
import { HistoricoController } from './controllers/HistoricoController.js';
import { RitmoController } from './controllers/RitmoController.js';
import { RevisaoController } from './controllers/RevisaoController.js';
import { CompromissoModel } from './models/CompromissoModel.js';
import { XPService } from './services/XPService.js';
import { LIMITE_COMPROMISSOS_SUGERIDO, TEMAS } from './config/constants.js';

export const App = {
  async init() {
    App.applyTheme();

    AuthService.onAuthStateChange((event, session) => {
      App.handleAuthChange(session);
    });

    window.addEventListener('hashchange', () => App.route());
    window.addEventListener('load', () => App.route());
  },

  async handleAuthChange(session) {
    const appEl = document.getElementById('app');

    if (session) {
      appEl.classList.remove('unauthenticated');
      App.renderSidebar(session.user);

      if (window.location.hash === '#auth') {
        window.location.hash = '#home';
      } else {
        App.route();
      }
    } else {
      appEl.classList.add('unauthenticated');
      const sidebarEl = document.getElementById('sidebar');
      if (sidebarEl) sidebarEl.innerHTML = '';
      window.location.hash = '#auth';
    }
  },

  async route() {
    const session = await AuthService.getSession();
    const hash = window.location.hash || '#home';

    if (!session) {
      window.location.hash = '#auth';
      App.renderAuth();
      return;
    }

    if (hash === '#auth') {
      window.location.hash = '#home';
      return;
    }

    App.updateSidebarActive(hash);

    switch (hash) {
      case '#home':
      case '#':
        await HomeController.init();
        break;
      case '#compromissos':
        await CompromissoController.init();
        break;
      case '#historico':
        await HistoricoController.init();
        break;
      case '#ritmo':
        await RitmoController.init();
        break;
      case '#revisao':
        await RevisaoController.init();
        break;
      case '#config':
        await App.renderConfigPage();
        break;
      default:
        window.location.hash = '#home';
    }
  },

  renderAuth() {
    document.getElementById('app').classList.add('unauthenticated');
    AuthView.render({
      onLogin: async ({ email, password }) => {
        await AuthService.signIn(email, password);
      },
    });
  },

  renderSidebar(user) {
    const sidebarEl = document.getElementById('sidebar');
    if (!sidebarEl) return;

    sidebarEl.innerHTML = `
      <div id="sidebar-logo">
        <div class="logo-icon">PM</div>
        <div class="logo-text">
          Plataforma de Mudanca
          <span>Foco no Progresso</span>
        </div>
      </div>

      <nav id="sidebar-nav">
        <button class="nav-item" data-hash="#home">
          <span class="nav-icon">01</span>
          <span>Painel Diario</span>
        </button>
        <button class="nav-item" data-hash="#compromissos">
          <span class="nav-icon">02</span>
          <span>Compromissos</span>
        </button>
        <button class="nav-item" data-hash="#historico">
          <span class="nav-icon">03</span>
          <span>Historico</span>
        </button>
        <button class="nav-item" data-hash="#ritmo">
          <span class="nav-icon">04</span>
          <span>Ritmo</span>
        </button>
        <button class="nav-item" data-hash="#revisao">
          <span class="nav-icon">05</span>
          <span>Revisao Semanal</span>
        </button>
        <button class="nav-item" data-hash="#config">
          <span class="nav-icon">06</span>
          <span>Ajustes</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <span class="user-email" title="${user.email}">${user.email}</span>
        <button id="btn-logout" class="btn-logout">Sair</button>
      </div>
    `;

    sidebarEl.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        window.location.hash = item.getAttribute('data-hash');
      });
    });

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await AuthService.signOut();
        } catch (e) {
          console.error('[App] Signout failed:', e.message);
        }
      });
    }
  },

  updateSidebarActive(hash) {
    const sidebarEl = document.getElementById('sidebar');
    if (!sidebarEl) return;
    const targetHash = (hash === '#' || hash === '') ? '#home' : hash;

    sidebarEl.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-hash') === targetHash) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  },

  async renderConfigPage() {
    const outlet = document.getElementById('router-outlet');
    const overrideDisabled = localStorage.getItem('revisao_lock_disabled') === 'true';
    const limiteSugerido = Number(localStorage.getItem('limite_compromissos_sugerido')) || LIMITE_COMPROMISSOS_SUGERIDO;
    const selectedTheme = localStorage.getItem('theme_id') || 'sage';
    const compromissos = await CompromissoModel.listAll();
    const totalXP = compromissos.reduce((acc, c) => acc + (c.xp_total || 0), 0);
    const nivelInfo = XPService.getNivel(totalXP);

    outlet.innerHTML = `
      <div class="config-page">
        <header class="page-header glass">
          <h1>Ajustes da Plataforma</h1>
          <p>Configuracoes avancadas do seu espaco seguro.</p>
        </header>

        <div class="config-card glass">
          <h2>Controle de Consistencia</h2>
          <p class="section-desc">Por padrao, a ferramenta limita edicoes de unidade minima e meta ideal ao seu dia de revisao semanal planejado. Voce pode desligar isso quando precisar.</p>

          <div class="config-option">
            <label class="switch-container">
              <input type="checkbox" id="chk-override-lock" ${overrideDisabled ? 'checked' : ''} />
              <span class="switch-label"><strong>Permitir edicoes a qualquer momento</strong></span>
            </label>
          </div>
        </div>

        <div class="config-card glass mt-6">
          <h2>Ritmo de Compromissos</h2>
          <p class="section-desc">Este numero e apenas uma sugestao para ajudar a evitar sobrecarga. Ele nao bloqueia a criacao de novos compromissos.</p>

          <div class="config-option limit-config-option">
            <label for="input-limite-sugerido">Sugestao de compromissos ativos</label>
            <input type="number" id="input-limite-sugerido" min="1" max="20" value="${limiteSugerido}" />
          </div>
        </div>

        <div class="config-card glass mt-6">
          <h2>Temas Visuais</h2>
          <p class="section-desc">Seu nivel atual: ${nivelInfo.nivel} (${nivelInfo.nome}). Temas futuros aparecem como possibilidades, sem visual de bloqueio.</p>

          <div class="theme-selector">
            ${TEMAS.map(theme => {
              const available = nivelInfo.nivel >= theme.nivelMinimo;
              return `
                <button type="button" class="theme-option ${selectedTheme === theme.id ? 'active' : ''}" data-theme-id="${theme.id}" data-available="${available}">
                  <span class="theme-swatches">
                    ${theme.cores.map(cor => `<span class="theme-swatch" style="background:${cor}"></span>`).join('')}
                  </span>
                  <span class="theme-name">${theme.nome}</span>
                  ${available ? '<span class="theme-tag">disponivel</span>' : `<span class="theme-tag">disponivel no nivel ${theme.nivelMinimo}</span>`}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <div class="config-card glass mt-6">
          <h2>Sobre a Plataforma</h2>
          <p>Este sistema foi desenvolvido sob principios de design nao-punitivo para apoiar consistencia leve, autocompaixao e progresso sustentavel.</p>
        </div>
      </div>
    `;

    const chkOverride = document.getElementById('chk-override-lock');
    chkOverride.addEventListener('change', () => {
      localStorage.setItem('revisao_lock_disabled', chkOverride.checked ? 'true' : 'false');
    });

    const inputLimite = document.getElementById('input-limite-sugerido');
    inputLimite.addEventListener('change', () => {
      const normalized = Math.max(1, Math.min(20, Number(inputLimite.value) || LIMITE_COMPROMISSOS_SUGERIDO));
      inputLimite.value = normalized;
      localStorage.setItem('limite_compromissos_sugerido', String(normalized));
    });

    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const available = btn.getAttribute('data-available') === 'true';
        const themeId = btn.getAttribute('data-theme-id');
        if (!available) {
          App.showToast('Este tema fica disponivel em um nivel futuro.');
          return;
        }
        localStorage.setItem('theme_id', themeId);
        App.applyTheme();
        document.querySelectorAll('.theme-option').forEach(option => option.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  },

  applyTheme() {
    const selectedTheme = localStorage.getItem('theme_id') || 'sage';
    const theme = TEMAS.find(t => t.id === selectedTheme) || TEMAS[0];
    document.body.classList.remove(...TEMAS.map(t => t.classe));
    document.body.classList.add(theme.classe);
  },

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast neutral';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
