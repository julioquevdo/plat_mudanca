// Layer 5 — Views
// Renders commitment management: list, create form, edit inline modal, pause controls.

import { FREQUENCIA_TIPOS, DIAS_SEMANA } from '../config/constants.js';

export const CompromissoView = {
  showLoading() {
    const app = document.getElementById('router-outlet');
    app.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Carregando seus compromissos...</p>
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

  showLockMessage(comp) {
    const diaNome = DIAS_SEMANA.find(d => d.value === comp.dia_revisao)?.label || 'Domingo';
    alert(
      `RN01.2: Este compromisso está travado para edição hoje.\n\n` +
      `Como parte do princípio de consistência, edições só são permitidas no seu dia de revisão selecionado (${diaNome}).\n` +
      `Para desativar temporariamente essa trava, acesse a aba "Ajustes" no menu superior e desative a trava de revisão.`
    );
  },

  render({ compromissos, categorias, onNovoCompromisso, onEditar, onPausar, onRetomar, onDesativar, onReordenar, limiteSugerido = 3 }) {
    const app = document.getElementById('router-outlet');

    app.innerHTML = `
      <div class="commitments-page">
        <header class="page-header glass">
          <h1>Meus Compromissos 🌱</h1>
          <p>Configure pequenas ações sustentáveis que encaixam na sua rotina diária</p>
        </header>

        <div class="commitments-layout">
          
          <!-- Create Form Column -->
          <section class="form-column glass">
            <h2>Novo Compromisso</h2>
            ${compromissos.length >= limiteSugerido ? `
              <div class="suggestion-banner">
                <p>Voce ja tem ${compromissos.length} compromissos ativos. A sugestao atual e comecar com ate ${limiteSugerido}, mas voce pode adicionar mais se fizer sentido agora.</p>
              </div>
            ` : ''}
            <form id="form-novo-compromisso" class="vertical-form">
              <div class="form-group">
                <label for="comp-nome">Nome do compromisso</label>
                <input type="text" id="comp-nome" placeholder="Ex: Ler um livro" required />
              </div>

              <div class="form-group">
                <label for="comp-unidade-minima">Unidade Mínima (Essencial - RN01.1)</label>
                <input type="text" id="comp-unidade-minima" placeholder="Ex: Ler 1 página" required />
                <span class="input-help">O menor progresso possível executável nos piores dias.</span>
              </div>

              <div class="form-group">
                <label for="comp-unidade-emergencia">Unidade de Emergencia (opcional)</label>
                <input type="text" id="comp-unidade-emergencia" placeholder="Ex: abrir o livro e ler uma frase" maxlength="120" />
                <span class="input-help">Uma versao ainda menor para dias especialmente dificeis.</span>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="comp-categoria">Categoria</label>
                  <select id="comp-categoria" required>
                    <option value="">Selecione...</option>
                    ${categorias.map(cat => `<option value="${cat.id}">${cat.nome}</option>`).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label for="comp-dia-revisao">Dia de Revisão Semanal</label>
                  <select id="comp-dia-revisao" required>
                    ${DIAS_SEMANA.map(d => `<option value="${d.value}" ${d.value === 0 ? 'selected' : ''}>${d.label}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="comp-frequencia-tipo">Frequência</label>
                <select id="comp-frequencia-tipo" required>
                  <option value="${FREQUENCIA_TIPOS.DIARIA}">Diária</option>
                  <option value="${FREQUENCIA_TIPOS.DIAS_SEMANA}">Dias específicos da semana</option>
                  <option value="${FREQUENCIA_TIPOS.X_VEZES_SEMANA}">X vezes por semana</option>
                </select>
              </div>

              <!-- Days Selector (Hidden by default) -->
              <div class="form-group" id="frequencia-dias-container" style="display: none;">
                <label>Selecione os dias</label>
                <div class="weekday-selector">
                  ${DIAS_SEMANA.map(d => `
                    <label class="weekday-checkbox">
                      <input type="checkbox" name="dias-semana" value="${d.value}" />
                      <span>${d.label}</span>
                    </label>
                  `).join('')}
                </div>
              </div>

              <!-- Times Selector (Hidden by default) -->
              <div class="form-group" id="frequencia-vezes-container" style="display: none;">
                <label for="comp-frequencia-vezes">Quantas vezes na semana?</label>
                <input type="number" id="comp-frequencia-vezes" min="1" max="7" value="3" />
              </div>

              <div class="form-group">
                <label for="comp-gatilho">Gatilho (Quando / Onde acontecerá?)</label>
                <input type="text" id="comp-gatilho" placeholder="Ex: Logo após passar o café da manhã" maxlength="200" />
              </div>

              <div class="form-group">
                <label for="comp-ancoragem">Frase de Ancoragem (Se/Então)</label>
                <input type="text" id="comp-ancoragem" placeholder="Ex: Se eu for fazer café, então vou ler 1 página" maxlength="120" />
              </div>

              <button type="submit" class="btn btn-primary">Criar Compromisso</button>
            </form>
          </section>

          <!-- List Column -->
          <section class="list-column">
            <h2>Compromissos Ativos</h2>
            ${compromissos.length > 1 ? `
              <p class="priority-tip">🔀 Arraste os cards para reorganizar sua prioridade. Os de cima recebem um pouco mais de XP por check — a média geral entre todos continua a mesma, só a ênfase muda.</p>
            ` : ''}
            <div class="commitments-grid">
              ${compromissos.length === 0 ? `
                <div class="empty-card glass">
                  <p>Nenhum compromisso cadastrado ainda.</p>
                </div>
              ` : compromissos.map((comp, idx) => {
                const isPaused = comp.pausado_ate && new Date(comp.pausado_ate) >= new Date();
                const diaRevisaoNome = DIAS_SEMANA.find(d => d.value === comp.dia_revisao)?.label || 'Dom';
                const todayDay = new Date().getDay();
                const isLocked = comp.dia_revisao !== todayDay && localStorage.getItem('revisao_lock_disabled') !== 'true';
                const prioridadeNum = idx + 1;

                return `
                  <div class="commitment-item glass ${isPaused ? 'paused-item' : ''}" draggable="true" data-comp-id="${comp.id}">
                    <div class="item-header">
                      <div class="item-title">
                        <span class="drag-handle" title="Arraste para reordenar prioridade">⠿</span>
                        <span class="category-indicator" style="background-color: ${comp.categorias?.cor || '#6A9F7E'}"></span>
                        <h3>${comp.nome}</h3>
                      </div>
                      <span class="item-revisao">Revisão: ${diaRevisaoNome}</span>
                    </div>

                    <div class="priority-row">
                      <span class="priority-badge">Prioridade ${prioridadeNum}</span>
                    </div>

                    <div class="item-body">
                      <p><strong>Unidade Mínima:</strong> ${comp.unidade_minima}</p>
                      ${comp.unidade_emergencia ? `<p><strong>Dia dificil:</strong> ${comp.unidade_emergencia}</p>` : ''}
                      <p class="meta-desc">${comp.meta ? `<strong>Meta Ideal:</strong> ${comp.meta}` : '<em>Sem meta ideal definida</em>'}</p>
                      ${comp.gatilho ? `<p class="trigger-desc">⚡ Gatilho: ${comp.gatilho}</p>` : ''}
                      
                      <div class="item-footer">
                        <div class="item-stats">
                          <span class="stat-xp">✨ ${comp.xp_total || 0} XP</span>
                          <span class="stat-xp-per-check">+${comp.xp_estimado ?? ''} XP/check</span>
                          <span class="stat-streak">🔥 ${comp.streak_atual || 0} dias</span>
                        </div>

                        <div class="item-actions">
                          <button class="btn-icon btn-edit" data-id="${comp.id}" title="${isLocked ? 'Disponível no dia de revisão' : 'Editar'}">
                            ${isLocked ? 'Editar na revisão' : 'Editar'}
                          </button>
                          
                          ${isPaused ? `
                            <button class="btn btn-secondary btn-resume" data-id="${comp.id}">Retomar</button>
                          ` : `
                            <button class="btn btn-secondary btn-pause-trigger" data-id="${comp.id}">Pausar</button>
                          `}
                          
                          <button class="btn-icon btn-delete" data-id="${comp.id}" title="Desativar">🗑️</button>
                        </div>
                      </div>

                      <!-- Pause Date Selector Expander (RN09.1) -->
                      <div class="pause-expander" id="pause-exp-${comp.id}" style="display: none;">
                        <hr />
                        <div class="pause-form">
                          <label for="pause-date-${comp.id}">Retomar em (Data Obrigatória):</label>
                          <input type="date" id="pause-date-${comp.id}" min="${new Date().toISOString().split('T')[0]}" required />
                          <button class="btn btn-secondary btn-save-pause" data-id="${comp.id}">Confirmar Pausa</button>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </section>

        </div>
      </div>

      <!-- Edit Modal -->
      <div id="edit-modal" class="modal-overlay" style="display: none;">
        <div class="modal glass">
          <div class="modal-header">
            <h2>Editar Compromisso</h2>
            <button type="button" class="modal-close close-modal">&times;</button>
          </div>
          <div class="modal-body">
            <form id="form-editar-compromisso" class="vertical-form">
              <input type="hidden" id="edit-id" />
              
              <div class="form-group">
                <label for="edit-nome">Nome do compromisso</label>
                <input type="text" id="edit-nome" required />
              </div>

              <div class="form-group">
                <label for="edit-unidade-minima">Unidade Mínima (Essencial)</label>
                <input type="text" id="edit-unidade-minima" required />
              </div>

              <div class="form-group">
                <label for="edit-unidade-emergencia">Unidade de Emergencia (opcional)</label>
                <input type="text" id="edit-unidade-emergencia" maxlength="120" />
              </div>

              <div class="form-group">
                <label for="edit-meta">Meta Ideal (Opcional)</label>
                <input type="text" id="edit-meta" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="edit-categoria">Categoria</label>
                  <select id="edit-categoria" required>
                    ${categorias.map(cat => `<option value="${cat.id}">${cat.nome}</option>`).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label for="edit-dia-revisao">Dia de Revisão Semanal</label>
                  <select id="edit-dia-revisao" required>
                    ${DIAS_SEMANA.map(d => `<option value="${d.value}">${d.label}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="edit-gatilho">Gatilho</label>
                <input type="text" id="edit-gatilho" maxlength="200" />
              </div>

              <div class="form-group">
                <label for="edit-ancoragem">Frase de Ancoragem</label>
                <input type="text" id="edit-ancoragem" maxlength="120" />
              </div>

              <button type="submit" class="btn btn-primary mt-4">Salvar Alterações</button>
            </form>
          </div>
        </div>
      </div>
    `;

    // Dynamic frequency fields behavior
    const freqSelect = document.getElementById('comp-frequencia-tipo');
    const diasContainer = document.getElementById('frequencia-dias-container');
    const vezesContainer = document.getElementById('frequencia-vezes-container');

    freqSelect.addEventListener('change', () => {
      const val = freqSelect.value;
      if (val === FREQUENCIA_TIPOS.DIAS_SEMANA) {
        diasContainer.style.display = 'block';
        vezesContainer.style.display = 'none';
      } else if (val === FREQUENCIA_TIPOS.X_VEZES_SEMANA) {
        diasContainer.style.display = 'none';
        vezesContainer.style.display = 'block';
      } else {
        diasContainer.style.display = 'none';
        vezesContainer.style.display = 'none';
      }
    });

    // Form Submission for New Commitment
    const formNovo = document.getElementById('form-novo-compromisso');
    formNovo.addEventListener('submit', async (e) => {
      e.preventDefault();

      const freqTipo = freqSelect.value;
      let freqDias = null;
      let freqVezes = null;

      if (freqTipo === FREQUENCIA_TIPOS.DIAS_SEMANA) {
        const checked = Array.from(document.querySelectorAll('input[name="dias-semana"]:checked')).map(el => parseInt(el.value));
        if (checked.length === 0) {
          alert('Por favor, selecione pelo menos um dia da semana para a frequência.');
          return;
        }
        freqDias = checked;
      } else if (freqTipo === FREQUENCIA_TIPOS.X_VEZES_SEMANA) {
        freqVezes = parseInt(document.getElementById('comp-frequencia-vezes').value);
      }

      const submitBtn = formNovo.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      try {
        await onNovoCompromisso({
          nome: document.getElementById('comp-nome').value,
          unidade_minima: document.getElementById('comp-unidade-minima').value,
          unidade_emergencia: document.getElementById('comp-unidade-emergencia').value || null,
          frequencia_tipo: freqTipo,
          frequencia_dias: freqDias,
          frequencia_vezes: freqVezes,
          categoria_id: document.getElementById('comp-categoria').value,
          dia_revisao: parseInt(document.getElementById('comp-dia-revisao').value),
          gatilho: document.getElementById('comp-gatilho').value || null,
          frase_ancoragem: document.getElementById('comp-ancoragem').value || null,
        });
        // reset form
        formNovo.reset();
        diasContainer.style.display = 'none';
        vezesContainer.style.display = 'none';
      } catch (err) {
        CompromissoView.showError(err.message);
      } finally {
        submitBtn.disabled = false;
      }
    });

    // Priority drag-and-drop reordering (RF: priority-based XP)
    const grid = document.querySelector('.commitments-grid');
    if (grid && onReordenar) {
      let draggedId = null;

      grid.querySelectorAll('.commitment-item').forEach(item => {
        item.addEventListener('dragstart', () => {
          draggedId = item.getAttribute('data-comp-id');
          item.classList.add('dragging');
        });

        item.addEventListener('dragend', () => {
          item.classList.remove('dragging');
          grid.querySelectorAll('.commitment-item').forEach(el => el.classList.remove('drag-over'));
        });

        item.addEventListener('dragover', (e) => {
          e.preventDefault();
          if (item.getAttribute('data-comp-id') === draggedId) return;
          item.classList.add('drag-over');
        });

        item.addEventListener('dragleave', () => {
          item.classList.remove('drag-over');
        });

        item.addEventListener('drop', async (e) => {
          e.preventDefault();
          item.classList.remove('drag-over');
          const targetId = item.getAttribute('data-comp-id');
          if (!draggedId || draggedId === targetId) return;

          const draggedEl = grid.querySelector(`[data-comp-id="${draggedId}"]`);
          if (!draggedEl) return;

          const allItems = Array.from(grid.querySelectorAll('.commitment-item'));
          const draggedIndex = allItems.indexOf(draggedEl);
          const targetIndex = allItems.indexOf(item);

          if (draggedIndex < targetIndex) {
            item.after(draggedEl);
          } else {
            item.before(draggedEl);
          }

          const novaOrdem = Array.from(grid.querySelectorAll('.commitment-item'))
            .map(el => el.getAttribute('data-comp-id'));

          try {
            await onReordenar(novaOrdem);
          } catch (err) {
            CompromissoView.showError(err.message);
          }
        });
      });
    }

    // Edit modal wiring
    const modal = document.getElementById('edit-modal');
    const closeBtn = document.querySelector('.close-modal');
    const formEditar = document.getElementById('form-editar-compromisso');

    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const comp = compromissos.find(c => c.id === id);

        // Controller decides if locked
        const todayDay = new Date().getDay();
        const override = localStorage.getItem('revisao_lock_disabled') === 'true';
        const isLocked = comp.dia_revisao !== todayDay && !override;

        if (isLocked) {
          CompromissoView.showLockMessage(comp);
          return;
        }

        // populate and show modal
        document.getElementById('edit-id').value = comp.id;
        document.getElementById('edit-nome').value = comp.nome;
        document.getElementById('edit-unidade-minima').value = comp.unidade_minima;
        document.getElementById('edit-unidade-emergencia').value = comp.unidade_emergencia || '';
        document.getElementById('edit-meta').value = comp.meta || '';
        document.getElementById('edit-categoria').value = comp.categoria_id;
        document.getElementById('edit-dia-revisao').value = comp.dia_revisao;
        document.getElementById('edit-gatilho').value = comp.gatilho || '';
        document.getElementById('edit-ancoragem').value = comp.frase_ancoragem || '';

        modal.style.display = 'block';
      });
    });

    formEditar.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-id').value;
      const formData = {
        nome: document.getElementById('edit-nome').value,
        unidade_minima: document.getElementById('edit-unidade-minima').value,
        unidade_emergencia: document.getElementById('edit-unidade-emergencia').value || null,
        meta: document.getElementById('edit-meta').value || null,
        categoria_id: document.getElementById('edit-categoria').value,
        dia_revisao: parseInt(document.getElementById('edit-dia-revisao').value),
        gatilho: document.getElementById('edit-gatilho').value || null,
        frase_ancoragem: document.getElementById('edit-ancoragem').value || null,
      };

      try {
        await onEditar({ id, formData });
        modal.style.display = 'none';
      } catch (err) {
        CompromissoView.showError(err.message);
      }
    });

    // Pause triggers
    document.querySelectorAll('.btn-pause-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const expander = document.getElementById(`pause-exp-${id}`);
        expander.style.display = expander.style.display === 'none' ? 'block' : 'none';
      });
    });

    document.querySelectorAll('.btn-save-pause').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const dateInput = document.getElementById(`pause-date-${id}`);
        const dateVal = dateInput.value;

        if (!dateVal) {
          alert('RN09.1: A data de retomada é obrigatória para pausar o compromisso.');
          return;
        }

        btn.disabled = true;
        btn.textContent = '...';

        try {
          await onPausar({ id, pausadoAte: dateVal });
        } catch (err) {
          CompromissoView.showError(err.message);
          btn.disabled = false;
          btn.textContent = 'Confirmar Pausa';
        }
      });
    });

    // Resume trigger
    document.querySelectorAll('.btn-resume').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        btn.disabled = true;
        await onRetomar(id);
      });
    });

    // Soft delete (deactivate) trigger
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const comp = compromissos.find(c => c.id === id);
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay reflective-delete-modal';
        overlay.innerHTML = `
          <div class="modal glass">
            <div class="modal-header">
              <h2>${comp?.nome || 'Compromisso'}</h2>
              <button type="button" class="modal-close btn-reflect-cancel">&times;</button>
            </div>
            <div class="modal-body reflective-delete-body">
              <p>Este compromisso ainda te interessa, ou so esta dificil agora?</p>
              <div class="reflective-delete-actions">
                <button type="button" class="btn btn-secondary btn-reflect-pause">Quero pausar por alguns dias</button>
                <button type="button" class="btn btn-ghost btn-reflect-cancel">Voltar</button>
                <button type="button" class="btn btn-danger btn-reflect-delete">Nao me interessa mais</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelectorAll('.btn-reflect-cancel').forEach(cancelBtn => {
          cancelBtn.addEventListener('click', () => overlay.remove());
        });

        overlay.querySelector('.btn-reflect-pause').addEventListener('click', () => {
          overlay.remove();
          const expander = document.getElementById(`pause-exp-${id}`);
          if (expander) expander.style.display = 'block';
        });

        overlay.querySelector('.btn-reflect-delete').addEventListener('click', async () => {
          btn.disabled = true;
          overlay.remove();
          await onDesativar(id);
        });
      });
    });
  },
};