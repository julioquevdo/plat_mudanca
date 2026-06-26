// Layer 5 - Views
// Renders the main dashboard: commitments list, XP/Level tracker, small wins, micro-journal.

import { XPService } from '../services/XPService.js';
import { SENSACOES, CHECK_STATUS, STREAK_ESTADO, MARCOS_VOLUME } from '../config/constants.js';

export const HomeView = {
  showLoading() {
    const app = document.getElementById('router-outlet');
    app.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Alinhando seus compromissos...</p>
      </div>
    `;
  },

  showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  },

  showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  },

  render({
    compromissos,
    todayChecks,
    today,
    diarioEntry,
    vitoriasPequenas = [],
    totalCumpridos = 0,
    treeStats = { branches: [] },
    onCheck,
    onRetroativo,
    onSaveDiario,
    onAddVitoriaPequena,
    onDeleteVitoriaPequena,
  }) {
    HomeView._closeActionMenu();
    const app = document.getElementById('router-outlet');
    const totalXP = compromissos.reduce((acc, c) => acc + (c.xp_total || 0), 0);
    const nivelInfo = XPService.getNivel(totalXP);
    const progressPercent = XPService.getProgressoNivel(totalXP);
    const xpNext = XPService.getXPParaProximoNivel(totalXP);
    const formattedDate = new Date(`${today}T00:00:00`).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    app.innerHTML = `
      <div class="dashboard-container">
        <header class="dashboard-header glass">
          <div class="header-main">
            <span class="header-date">${capitalizedDate}</span>
            <h1>Seu Dia</h1>
          </div>
          <div class="profile-xp-box">
            <div class="level-badge">
              <span class="level-icon">${HomeView._getLevelEmoji(nivelInfo.nivel)}</span>
              <div class="level-text">
                <span class="level-rank">Nivel ${nivelInfo.nivel}</span>
                <span class="level-name">${nivelInfo.nome}</span>
              </div>
            </div>
            <div class="xp-progress-bar-container">
              <div class="xp-progress-bar" style="width: ${progressPercent}%"></div>
              <span class="xp-ratio">${totalXP} XP ${xpNext ? `(${xpNext} XP para o proximo nivel)` : '(Nivel maximo)'}</span>
            </div>
            <div class="volume-milestones">
              ${MARCOS_VOLUME.map(marco => `
                <span class="volume-badge ${totalCumpridos >= marco ? 'achieved' : ''}" title="${totalCumpridos >= marco ? 'Marco alcancado' : `${totalCumpridos}/${marco} conclusoes`}">
                  ${marco}
                </span>
              `).join('')}
            </div>
          </div>
        </header>

        ${HomeView._renderTreePanel(treeStats)}

        <div class="dashboard-grid">
          <section class="commitments-section">
            <h2>Compromissos para Hoje</h2>
            ${compromissos.length === 0 ? `
              <div class="empty-card glass">
                <p>Nenhum compromisso cadastrado para hoje.</p>
                <a href="#compromissos" class="btn btn-secondary">Cadastrar Compromisso</a>
              </div>
            ` : `
              <div class="commitments-list">
                ${compromissos.map(comp => {
                  const check = todayChecks[comp.id];
                  const isChecked = !!check;
                  const isCumprido = isChecked && check.status === CHECK_STATUS.CUMPRIDO;
                  const isNaoCumprido = isChecked && check.status === CHECK_STATUS.NAO_CUMPRIDO;
                  const isDiaRuim = isCumprido && check.dia_ruim;
                  const isPausado = comp.pausado_ate && new Date(comp.pausado_ate) >= new Date(today);

                  return `
                    <div class="commitment-card glass ${isChecked ? `status-${check.status}` : ''} ${isPausado ? 'status-pausado' : ''}" id="card-${comp.id}">
                      <div class="card-body">
                        <div class="card-details">
                          <div class="card-title-row">
                             <span class="category-indicator" style="background-color: ${comp.categorias?.cor || '#6A9F7E'}"></span>
                             <div class="card-title-group">
                               ${comp.meta ? `<p class="card-meta-label">${comp.meta}</p>` : ''}
                               <h3 class="card-comp-name ${comp.meta ? 'is-secondary' : ''}">${comp.nome}</h3>
                             </div>
                           </div>
                          <p class="min-unit"><strong>Unidade minima:</strong> ${comp.unidade_minima}</p>
                          ${comp.unidade_emergencia ? `<p class="emergency-unit"><strong>Em dia dificil:</strong> ${comp.unidade_emergencia}</p>` : ''}
                          ${isDiaRuim ? '<span class="bad-day-pill">Dia dificil acolhido</span>' : ''}
                          ${comp.frase_ancoragem ? `<p class="anchoring-phrase"><em>"${comp.frase_ancoragem}"</em></p>` : ''}
                        </div>

                        <div class="streak-badge-container">
                          ${HomeView._renderStreakBadge(comp.streak_atual, comp.streak_estado)}
                        </div>

                        <div class="card-actions">
                          ${isPausado ? `
                            <span class="pause-badge">Pausado ate ${new Date(`${comp.pausado_ate}T00:00:00`).toLocaleDateString('pt-BR')}</span>
                          ` : `
                            <button class="btn-check ${isCumprido && !isDiaRuim ? 'active' : ''}" data-id="${comp.id}" data-status="${CHECK_STATUS.CUMPRIDO}" title="Cumprido">
                              ${isCumprido ? 'Concluido' : 'Cumpri'}
                            </button>

                            <div class="dropdown">
                              <button class="btn-more-actions" data-id="${comp.id}" aria-label="Mais acoes">...</button>
                            </div>
                          `}
                        </div>
                      </div>

                      <div class="context-expander" id="context-form-${comp.id}" style="display: none;">
                        <hr />
                        <div class="context-form-body">
                          <div class="form-group">
                            <label>Como voce se sentiu hoje?</label>
                            <div class="feeling-selector">
                              ${SENSACOES.map(s => {
                                const selected = check?.sensacao === s.value;
                                return `
                                  <button type="button" class="btn-feeling ${selected ? 'active' : ''}" data-id="${comp.id}" data-value="${s.value}">
                                    <span class="feeling-emoji">${s.emoji}</span>
                                    <span class="feeling-label">${s.label}</span>
                                  </button>
                                `;
                              }).join('')}
                            </div>
                          </div>
                          <div class="form-group">
                            <label for="context-text-${comp.id}">Contexto (max 200 caracteres)</label>
                            <textarea id="context-text-${comp.id}" class="textarea-mini" maxlength="200" placeholder="Ex: choveu, dormi pouco, fiz no quarto">${check?.contexto || ''}</textarea>
                          </div>
                          <button class="btn btn-secondary btn-save-context" data-id="${comp.id}">Salvar Contexto</button>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </section>

          <section class="journal-section">
            <div class="small-wins-card glass">
              <h2>Vitorias Pequenas</h2>
              <form id="form-vitoria-pequena" class="small-win-form">
                <input type="text" id="small-win-text" maxlength="120" placeholder="Ex: bebi agua, respondi uma mensagem" />
                <button type="submit" class="btn btn-secondary">Registrar</button>
              </form>
              <div class="small-wins-list">
                ${vitoriasPequenas.length === 0 ? `
                  <p class="section-desc">Nenhuma vitoria pequena registrada hoje.</p>
                ` : vitoriasPequenas.map(vitoria => `
                  <div class="small-win-item">
                    <span>${vitoria.conteudo}</span>
                    <button type="button" class="btn-small-win-delete" data-id="${vitoria.id}" title="Remover">x</button>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="journal-card glass mt-6">
              <h2>Diario Livre</h2>
              <p class="section-desc">Registre pensamentos ou percepcoes sobre o seu dia (maximo 280 caracteres).</p>
              <div class="journal-textarea-container">
                <textarea id="journal-text" maxlength="280" placeholder="Escreva sobre o seu dia...">${diarioEntry?.conteudo || ''}</textarea>
                <div class="journal-footer">
                  <span id="journal-counter">0 / 280</span>
                  <span id="journal-save-status" class="save-status-text"></span>
                </div>
              </div>
            </div>

            <div class="retroactive-card glass mt-6">
              <h3>Registrar Data Retroativa</h3>
              <p class="section-desc">Adicione ou corrija registros de dias passados para manter seu historico em dia.</p>
              <form id="form-retroativo" class="form-stack">
                <div class="form-group">
                  <label for="retro-compromisso">Compromisso</label>
                  <select id="retro-compromisso" required>
                    <option value="">Selecione...</option>
                    ${compromissos.map(c => `<option value="${c.id}">${c.nome}</option>`).join('')}
                  </select>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="retro-data">Data</label>
                    <input type="date" id="retro-data" max="${today}" required />
                  </div>
                  <div class="form-group">
                    <label for="retro-status">Status</label>
                    <select id="retro-status" required>
                      <option value="${CHECK_STATUS.CUMPRIDO}">Cumprido</option>
                      <option value="${CHECK_STATUS.NAO_CUMPRIDO}">Nao cumprido</option>
                    </select>
                  </div>
                </div>
                <button type="submit" class="btn btn-secondary btn-full">Gravar Registro</button>
              </form>
            </div>
          </section>
        </div>
      </div>
    `;

    HomeView._wireEvents({
      today,
      todayChecks,
      treeStats,
      onCheck,
      onRetroativo,
      onSaveDiario,
      onAddVitoriaPequena,
      onDeleteVitoriaPequena,
    });
  },

  _wireEvents({ today, todayChecks, treeStats, onCheck, onRetroativo, onSaveDiario, onAddVitoriaPequena, onDeleteVitoriaPequena }) {
    const journalText = document.getElementById('journal-text');
    const journalCounter = document.getElementById('journal-counter');
    if (journalText && journalCounter) {
      const updateCounter = () => {
        journalCounter.textContent = `${journalText.value.length} / 280`;
      };
      updateCounter();
      let saveTimeout;
      journalText.addEventListener('input', () => {
        updateCounter();
        const saveStatus = document.getElementById('journal-save-status');
        saveStatus.textContent = 'Digitando...';
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
          try {
            saveStatus.textContent = 'Salvando...';
            await onSaveDiario({ conteudo: journalText.value });
            saveStatus.textContent = 'Salvo automaticamente';
          } catch (e) {
            saveStatus.textContent = 'Erro ao salvar';
            HomeView.showError(e.message);
          }
        }, 1000);
      });
    }

    HomeView._wireTree(treeStats);

    document.querySelectorAll('.btn-check').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const status = btn.getAttribute('data-status');
        btn.disabled = true;
        btn.textContent = '...';
        await onCheck({ compromissoId: id, status, data: today });
      });
    });

    document.querySelectorAll('.btn-more-actions').forEach(btn => {
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        const id = btn.getAttribute('data-id');
        HomeView._toggleActionMenu(btn, id, { todayChecks, today, onCheck });
      });
    });

    document.querySelectorAll('.btn-feeling').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        document.querySelectorAll(`.btn-feeling[data-id="${id}"]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    document.querySelectorAll('.btn-save-context').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const text = document.getElementById(`context-text-${id}`).value;
        const activeFeelingBtn = document.querySelector(`.btn-feeling[data-id="${id}"].active`);
        const sensacao = activeFeelingBtn ? activeFeelingBtn.getAttribute('data-value') : null;
        const existingCheck = todayChecks[id];
        const status = existingCheck ? existingCheck.status : CHECK_STATUS.CUMPRIDO;

        btn.disabled = true;
        btn.textContent = 'Salvando...';
        await onCheck({
          compromissoId: id,
          status,
          data: today,
          contexto: text,
          sensacao,
          diaRuim: existingCheck?.dia_ruim ?? false,
        });
      });
    });

    const formVitoria = document.getElementById('form-vitoria-pequena');
    if (formVitoria) {
      formVitoria.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('small-win-text');
        const submitBtn = formVitoria.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        try {
          await onAddVitoriaPequena({ conteudo: input.value });
          input.value = '';
        } catch (err) {
          HomeView.showError(err.message);
          submitBtn.disabled = false;
        }
      });
    }

    document.querySelectorAll('.btn-small-win-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        await onDeleteVitoriaPequena(btn.getAttribute('data-id'));
      });
    });

    const formRetroativo = document.getElementById('form-retroativo');
    if (formRetroativo) {
      formRetroativo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const compromissoId = document.getElementById('retro-compromisso').value;
        const data = document.getElementById('retro-data').value;
        const status = document.getElementById('retro-status').value;
        const submitBtn = formRetroativo.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        try {
          await onRetroativo({ compromissoId, data, status });
        } catch (err) {
          HomeView.showError(err.message);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Gravar Registro';
        }
      });
    }
  },

  _toggleActionMenu(triggerBtn, compId, { todayChecks, today, onCheck }) {
    const menu = HomeView._ensureActionMenu();
    const isOpenForSameButton = menu.dataset.openFor === compId && menu.style.display === 'block';
    if (isOpenForSameButton) {
      HomeView._closeActionMenu();
      return;
    }
    HomeView._openActionMenu(menu, triggerBtn, compId, { todayChecks, today, onCheck });
  },

  // The menu lives as a single element directly under <body>, completely outside the
  // commitment cards. This is intentional: a "glass" card with overflow/backdrop-filter
  // can clip or trap a positioned child, which is what caused the menu to render cut off
  // and overlapping the next card. Living outside that subtree, it can never be clipped
  // or covered by a sibling card again, regardless of how the cards themselves are styled.
  _ensureActionMenu() {
    let menu = document.getElementById('shared-action-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'shared-action-menu';
      menu.className = 'dropdown-content glass';
      menu.style.position = 'fixed';
      menu.style.display = 'none';
      menu.style.zIndex = '9999';
      menu.style.margin = '0';
      document.body.appendChild(menu);
    }

    if (!HomeView._actionMenuGloballyWired) {
      document.addEventListener('click', (event) => {
        const openMenu = document.getElementById('shared-action-menu');
        if (!openMenu || openMenu.style.display === 'none') return;
        if (openMenu.contains(event.target) || event.target.closest('.btn-more-actions')) return;
        HomeView._closeActionMenu();
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') HomeView._closeActionMenu();
      });
      window.addEventListener('scroll', () => HomeView._closeActionMenu(), true);
      window.addEventListener('resize', () => HomeView._closeActionMenu());
      HomeView._actionMenuGloballyWired = true;
    }

    return menu;
  },

  _openActionMenu(menu, triggerBtn, compId, { todayChecks, today, onCheck }) {
    const check = todayChecks[compId];
    const isCumprido = check && check.status === CHECK_STATUS.CUMPRIDO;
    const isNaoCumprido = check && check.status === CHECK_STATUS.NAO_CUMPRIDO;
    const isDiaRuim = isCumprido && check.dia_ruim;

    menu.innerHTML = `
      <button class="action-btn-bad-day ${isDiaRuim ? 'active' : ''}" data-id="${compId}">Hoje esta dificil</button>
      <button class="action-btn ${isNaoCumprido ? 'active' : ''}" data-id="${compId}" data-status="${CHECK_STATUS.NAO_CUMPRIDO}">Nao cumprido hoje</button>
      <button class="action-btn-expand-context" data-id="${compId}">Adicionar contexto/sensacao</button>
    `;

    menu.querySelector('.action-btn-bad-day').addEventListener('click', async (event) => {
      const btn = event.currentTarget;
      btn.disabled = true;
      btn.textContent = '...';
      HomeView._closeActionMenu();
      await onCheck({ compromissoId: compId, status: CHECK_STATUS.CUMPRIDO, data: today, diaRuim: true });
    });

    menu.querySelector('.action-btn').addEventListener('click', async (event) => {
      const btn = event.currentTarget;
      const status = btn.getAttribute('data-status');
      btn.disabled = true;
      btn.textContent = '...';
      HomeView._closeActionMenu();
      await onCheck({ compromissoId: compId, status, data: today });
    });

    menu.querySelector('.action-btn-expand-context').addEventListener('click', () => {
      const form = document.getElementById(`context-form-${compId}`);
      if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
      HomeView._closeActionMenu();
    });

    // Measure off-screen first so we can flip the menu above the trigger or clamp it
    // horizontally before it becomes visible, avoiding any flash in the wrong spot.
    menu.style.visibility = 'hidden';
    menu.style.display = 'block';
    menu.style.top = '0px';
    menu.style.left = '0px';

    const triggerRect = triggerBtn.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();

    let top = triggerRect.bottom + 6;
    if (top + menuRect.height > window.innerHeight - 8) {
      top = Math.max(8, triggerRect.top - menuRect.height - 6);
    }

    let left = triggerRect.right - menuRect.width;
    left = Math.max(8, Math.min(left, window.innerWidth - menuRect.width - 8));

    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
    menu.style.visibility = 'visible';
    menu.dataset.openFor = compId;
  },

  _closeActionMenu() {
    const menu = document.getElementById('shared-action-menu');
    if (!menu) return;
    menu.style.display = 'none';
    menu.removeAttribute('data-open-for');
    menu.innerHTML = '';
  },

  _getLevelEmoji(level) {
    if (level === 1) return '🌱';
    if (level === 2) return '🌿';
    if (level === 3) return '☘️';
    if (level === 4) return '🪵';
    if (level === 5) return '🌳';
    return '🌲';
  },

  _renderStreakBadge(streak, estado) {
    if (estado === STREAK_ESTADO.PENDENTE) {
      return `<span class="streak-badge status-pendente" title="Streak em pausa: cumpra amanha para manter">${streak} em pausa</span>`;
    }
    if (streak === 0) {
      return '<span class="streak-badge status-zerado">Novo streak</span>';
    }
    return `<span class="streak-badge status-ativo">${streak} dias</span>`;
  },

  _renderTreePanel(treeStats) {
    const branches = treeStats.branches || [];
    if (branches.length === 0) {
      return `
        <section class="tree-panel glass">
          <div class="tree-panel-header">
            <div>
              <h2>Arvore de Presenca</h2>
              <p>Seus compromissos vao aparecer aqui como galhos quando forem cadastrados.</p>
            </div>
          </div>
        </section>
      `;
    }

    const selected = branches[0];

    return `
      <section class="tree-panel glass">
        <div class="tree-panel-header">
          <div>
            <h2>Arvore de Presenca</h2>
            <p>Galhos crescem com constancia e volume. Os nos mostram retomadas e intervalos, sem transformar isso no centro da tela.</p>
          </div>
          <div class="tree-summary">
            <span>${branches.length} galhos</span>
            <span>${treeStats.totalDone || 0} cumprimentos</span>
            <span>${treeStats.totalRetomadas || 0} retomadas</span>
          </div>
        </div>

        <div class="tree-layout">
          <div class="tree-stage">
            ${HomeView._renderTreeSvg(branches)}
          </div>
          <aside class="tree-detail" id="tree-detail">
            ${HomeView._renderTreeDetail(selected)}
          </aside>
        </div>
      </section>
    `;
  },

  _renderTreeSvg(branches) {
    const trunk = {
      cx: 450,
      baseY: 322,
      topY: 322 - Math.min(150, 84 + branches.length * 10),
      baseHalf: 24,
      topHalf: 9,
    };
    const branchMarkup = branches.map((branch, index) => HomeView._renderBranch(branch, index, branches.length, trunk)).join('');

    return `
      <svg class="presence-tree" viewBox="0 0 900 360" role="img" aria-label="Arvore visual dos compromissos">
        <defs>
          <linearGradient id="treeTrunkGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stop-color="#6E8F62" />
            <stop offset="45%" stop-color="#8AAA78" />
            <stop offset="100%" stop-color="#4F6B53" />
          </linearGradient>
          <filter id="treeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="treeSoftShadow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>
        <ellipse class="tree-ground-shadow" cx="${trunk.cx}" cy="${trunk.baseY + 10}" rx="150" ry="13" style="fill:rgba(10,15,10,0.22); filter:url(#treeSoftShadow);" />
        <path class="tree-ground" d="M120 326 C250 307 360 336 462 318 C570 300 690 314 790 325" />
        ${HomeView._renderTrunk(trunk)}
        ${branchMarkup}
      </svg>
    `;
  },

  _renderTrunk({ cx, baseY, topY, baseHalf, topHalf }) {
    const flare = baseHalf * 0.5;
    const outline = `
      M ${(cx - baseHalf - flare).toFixed(1)} ${(baseY + 6).toFixed(1)}
      Q ${(cx - baseHalf - 3).toFixed(1)} ${(baseY - 12).toFixed(1)} ${(cx - baseHalf + 2).toFixed(1)} ${(baseY - 36).toFixed(1)}
      C ${(cx - topHalf - 8).toFixed(1)} ${(topY + (baseY - topY) * 0.55).toFixed(1)} ${(cx - topHalf - 1).toFixed(1)} ${(topY + 24).toFixed(1)} ${(cx - topHalf).toFixed(1)} ${(topY + 2).toFixed(1)}
      Q ${cx.toFixed(1)} ${(topY - 8).toFixed(1)} ${(cx + topHalf).toFixed(1)} ${(topY + 2).toFixed(1)}
      C ${(cx + topHalf + 1).toFixed(1)} ${(topY + 24).toFixed(1)} ${(cx + topHalf + 8).toFixed(1)} ${(topY + (baseY - topY) * 0.55).toFixed(1)} ${(cx + baseHalf - 2).toFixed(1)} ${(baseY - 36).toFixed(1)}
      Q ${(cx + baseHalf + 3).toFixed(1)} ${(baseY - 12).toFixed(1)} ${(cx + baseHalf + flare).toFixed(1)} ${(baseY + 6).toFixed(1)}
      Q ${(cx + baseHalf * 0.35).toFixed(1)} ${(baseY + 16).toFixed(1)} ${cx.toFixed(1)} ${(baseY + 12).toFixed(1)}
      Q ${(cx - baseHalf * 0.35).toFixed(1)} ${(baseY + 16).toFixed(1)} ${(cx - baseHalf - flare).toFixed(1)} ${(baseY + 6).toFixed(1)}
      Z
    `;
    const barkLines = [-0.5, 0.05, 0.55].map((offset, i) => {
      const x = cx + offset * baseHalf;
      const topX = cx + offset * topHalf * 1.3;
      const midX = (x + topX) / 2 + (i - 1) * 5;
      return `<path class="tree-bark-line" d="M ${x.toFixed(1)} ${(baseY - 6).toFixed(1)} Q ${midX.toFixed(1)} ${((baseY + topY) / 2).toFixed(1)} ${topX.toFixed(1)} ${(topY + 12).toFixed(1)}" style="fill:none; stroke:rgba(35,45,30,0.22); stroke-width:1.6; stroke-linecap:round;" />`;
    }).join('');

    return `
      <path class="tree-trunk" d="${outline}" />
      ${barkLines}
    `;
  },

  _renderBranch(branch, index, total, trunk) {
    const { cx, baseY, topY, baseHalf, topHalf } = trunk;
    const side = index % 2 === 0 ? -1 : 1;
    const sideIndex = Math.floor(index / 2);
    const leftCount = Math.ceil(total / 2);
    const rightCount = Math.floor(total / 2);
    const sideCount = side === -1 ? leftCount : rightCount;
    // sideRatio: where this branch sits among the others on the same side (0 = lowest, 1 = highest).
    const sideRatio = sideCount <= 1 ? 0.5 : sideIndex / (sideCount - 1);

    const trunkHeight = baseY - topY;
    const crownHeight = Math.min(trunkHeight * 0.78, 46 + sideCount * 15);
    const crownTop = topY + 12;
    const crownBottom = crownTop + crownHeight;
    const attachY = crownBottom - sideRatio * crownHeight;
    const heightRatio = (baseY - attachY) / trunkHeight;
    const halfWidthHere = baseHalf + (topHalf - baseHalf) * heightRatio;
    const startX = cx + side * (halfWidthHere - 2);
    const startY = attachY;

    // Branches lower on the trunk reach out sideways; branches near the top point upward.
    // Pairing attach height with angle this way makes the branches fan out without crossing each other.
    const angle = ((20 + sideRatio * 52) * Math.PI) / 180;
    const length = Math.min(280, 92 + branch.streak * 6 + Math.sqrt(branch.totalDone || 0) * 12);
    const endX = startX + side * length * Math.cos(angle);
    const endY = Math.max(22, startY - length * Math.sin(angle));
    const controlX = startX + side * (length * 0.55) * Math.cos(angle);
    const controlY = startY - (startY - endY) * 0.62 - 10;
    const thickness = Math.min(18, 4 + Math.sqrt(branch.totalDone || 0) * 1.1 + branch.streak * 0.14);
    const leafCount = branch.totalDone > 0 ? Math.min(14, 3 + Math.round(branch.totalDone / 3)) : 0;
    const knotCount = Math.min(4, branch.retomadas + branch.gaps.length);
    const branchPath = `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
    const leaves = Array.from({ length: leafCount }, (_, leafIndex) => {
      const t = 0.5 + (leafIndex / leafCount) * 0.5;
      const point = HomeView._quadraticPoint(startX, startY, controlX, controlY, endX, endY, t);
      const jitterSeed = (index * 31 + leafIndex * 17) % 11;
      const jitterX = (jitterSeed - 5) * 1.1;
      const jitterY = (((jitterSeed * 3) % 9) - 4) * 1;
      const spreadOut = 3 + (t - 0.5) * 10;
      const leafSide = leafIndex % 2 === 0 ? -1 : 1;
      const leafX = point.x + side * spreadOut * 0.3 + leafSide * 5 + jitterX;
      const leafY = point.y - spreadOut * 0.4 + jitterY;
      const size = 5 + Math.min(3, t * 3.5);
      return `<ellipse class="tree-leaf" cx="${leafX.toFixed(1)}" cy="${leafY.toFixed(1)}" rx="${size.toFixed(1)}" ry="${(size * 0.6).toFixed(1)}" transform="rotate(${(side * -24 + leafSide * 12).toFixed(0)} ${leafX.toFixed(1)} ${leafY.toFixed(1)})" />`;
    }).join('');
    const knots = Array.from({ length: knotCount }, (_, knotIndex) => {
      const t = 0.3 + knotIndex * 0.15;
      const point = HomeView._quadraticPoint(startX, startY, controlX, controlY, endX, endY, t);
      const gap = branch.gaps[knotIndex] || null;
      const label = gap
        ? `${gap.days} dias sem cumprir (${HomeView._formatDate(gap.start)} ate ${HomeView._formatDate(gap.end)})`
        : 'Retomada depois de um intervalo';
      return `<circle class="tree-knot" data-branch-id="${branch.id}" data-knot-label="${HomeView._escapeAttr(label)}" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${Math.max(4, thickness * 0.4).toFixed(1)}" />`;
    }).join('');

    const labelX = endX + side * 14;
    const labelY = endY - 10;

    return `
      <g class="tree-branch ${index === 0 ? 'active' : ''}" data-branch-id="${branch.id}" tabindex="0" role="button">
        <path class="tree-branch-shadow" d="${branchPath}" stroke-width="${(thickness + 5).toFixed(1)}" />
        <path class="tree-branch-line" d="${branchPath}" stroke="${branch.color}" stroke-width="${thickness.toFixed(1)}" />
        ${leaves}
        ${knots}
        <text class="tree-branch-label" x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="${side < 0 ? 'end' : 'start'}">${HomeView._escapeHtml(HomeView._truncate(branch.nome, 22))}</text>
      </g>
    `;
  },

  _wireTree(treeStats) {
    const detail = document.getElementById('tree-detail');
    if (!detail) return;

    const branches = treeStats.branches || [];
    const showBranch = (branchId, knotLabel = null) => {
      const branch = branches.find(item => item.id === branchId);
      if (!branch) return;
      detail.innerHTML = HomeView._renderTreeDetail(branch, knotLabel);
      document.querySelectorAll('.tree-branch').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-branch-id') === branchId);
      });
    };

    document.querySelectorAll('.tree-branch').forEach(el => {
      el.addEventListener('click', () => showBranch(el.getAttribute('data-branch-id')));
      el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          showBranch(el.getAttribute('data-branch-id'));
        }
      });
    });

    document.querySelectorAll('.tree-knot').forEach(el => {
      el.addEventListener('click', (event) => {
        event.stopPropagation();
        showBranch(el.getAttribute('data-branch-id'), el.getAttribute('data-knot-label'));
      });
    });
  },

  _renderTreeDetail(branch, knotLabel = null) {
    const latestGap = branch.gaps?.[branch.gaps.length - 1];
    const gapText = knotLabel || (latestGap
      ? `${latestGap.days} dias sem cumprir (${HomeView._formatDate(latestGap.start)} ate ${HomeView._formatDate(latestGap.end)})`
      : 'Sem intervalos recentes registrados.');

    return `
      <div class="tree-detail-heading">
        <span class="tree-detail-color" style="background:${branch.color}"></span>
        <h3>${HomeView._escapeHtml(branch.nome)}</h3>
      </div>
      <div class="tree-metrics">
        <div><strong>${branch.streak}</strong><span>dias de streak</span></div>
        <div><strong>${branch.totalDone}</strong><span>cumprimentos</span></div>
        <div><strong>${branch.retomadas}</strong><span>retomadas</span></div>
      </div>
      <p class="tree-detail-copy">O galho cresce com constancia e engrossa com volume total. Intervalos reduzem o ritmo, mas as retomadas ficam marcadas como historia de volta.</p>
      <div class="tree-gap-note">
        <span>Intervalo observado</span>
        <strong>${gapText}</strong>
      </div>
      <div class="tree-detail-footer">
        <span>${branch.totalMissed} nao cumpridos</span>
        <span>${branch.badDays} dias dificeis acolhidos</span>
        <span>maior intervalo: ${branch.longestGap} dias</span>
      </div>
    `;
  },

  _quadraticPoint(x0, y0, x1, y1, x2, y2, t) {
    const inv = 1 - t;
    return {
      x: inv * inv * x0 + 2 * inv * t * x1 + t * t * x2,
      y: inv * inv * y0 + 2 * inv * t * y1 + t * t * y2,
    };
  },

  _formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  },

  _truncate(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
  },

  _escapeAttr(text) {
    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  },

  _escapeHtml(text) {
    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  },
};