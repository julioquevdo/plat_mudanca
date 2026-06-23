// Layer 5 — Views
// Renders weekly reviews screen: non-evaluative statistics, consistency highlights, adjustments forms.

import { DIAS_SEMANA } from '../config/constants.js';

export const RevisaoView = {
  showLoading() {
    const app = document.getElementById('router-outlet');
    app.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Analisando dados do último mês...</p>
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

  render({ resumos, melhor, sobrevivente, isRevisaoDay, compromissos, onEditarCompromisso }) {
    const app = document.getElementById('router-outlet');

    app.innerHTML = `
      <div class="reviews-page">
        <header class="page-header glass">
          <h1>Revisão e Ajustes Semanais 🌿</h1>
          <p>Dados objetivos sobre sua rotina para ajudar a calibrar suas metas sem cobranças.</p>
        </header>

        <!-- Best commitment callout (US16) -->
        ${melhor ? `
          <div class="highlight-card glass">
            <span class="highlight-badge">⭐️ Destaque de Consistência</span>
            <div class="highlight-content">
              <h3>${melhor.compromisso.nome}</h3>
              <p>Este compromisso registrou a maior taxa de cumprimento histórico: <strong>${melhor.taxa}%</strong> das vezes. Mostra um padrão estável de execução!</p>
            </div>
          </div>
        ` : ''}

        ${sobrevivente ? `
          <div class="highlight-card survival-card glass">
            <span class="highlight-badge">O que sobreviveu</span>
            <div class="highlight-content">
              <h3>${sobrevivente.compromisso.nome}</h3>
              <p>Este compromisso permanece ativo ha <strong>${sobrevivente.dias} dias</strong>. Esse dado olha para continuidade, nao para perfeicao.</p>
            </div>
          </div>
        ` : ''}

        <!-- Revision Day Alert -->
        ${!isRevisaoDay ? `
          <div class="info-banner glass">
            <span class="info-icon">ℹ️</span>
            <p><strong>Nota:</strong> Hoje não é o dia de revisão cadastrado para nenhum dos seus compromissos. Você pode ver as estatísticas livremente, mas as travas de edição de meta/unidade mínima estão ativas (salvo se desativadas nos Ajustes).</p>
          </div>
        ` : `
          <div class="info-banner success-banner glass">
            <span class="info-icon">🌱</span>
            <p><strong>Janela ativa:</strong> Hoje é o dia de revisão de algum compromisso seu! Ajustes de unidade mínima ou meta ideal estão destravados para calibração.</p>
          </div>
        `}

        <div class="reviews-list">
          ${resumos.length === 0 ? `
            <div class="empty-card glass">
              <p>Nenhum compromisso ativo para revisar.</p>
              <a href="#compromissos" class="btn btn-secondary">Cadastrar Compromisso</a>
            </div>
          ` : resumos.map(res => {
            const comp = res.compromisso;
            const period = res.periodo;
            
            // Lock logic check
            const todayDay = new Date().getDay();
            const override = localStorage.getItem('revisao_lock_disabled') === 'true';
            const isLocked = comp.dia_revisao !== todayDay && !override;

            return `
              <div class="review-card glass">
                <div class="review-card-header">
                  <div class="item-title">
                    <span class="category-indicator" style="background-color: ${comp.categorias?.cor || '#6A9F7E'}"></span>
                    <h2>${comp.nome}</h2>
                  </div>
                  <span class="success-rate-badge ${period.taxa >= 70 ? 'high' : period.taxa >= 40 ? 'mid' : 'low'}">
                    ${period.taxa}% de conclusão
                  </span>
                </div>

                <div class="review-grid">
                  <!-- Descriptive Statistics (RN11.1) -->
                  <div class="review-stats">
                    <h3>Padrões Observados (Últimos 30 dias)</h3>
                    <ul>
                      <li>Concluído <strong>${period.cumpridos} vezes</strong> de um total de <strong>${period.total} dias</strong> monitorados.</li>
                      <li>Retomado apos um registro nao cumprido <strong>${period.retomadas} vezes</strong>.</li>
                      
                      ${res.diaMaisAlto ? `
                        <li>O dia da semana de maior consistência foi <strong>${res.diaMaisAlto.dia}</strong> (${res.diaMaisAlto.taxa}% de conclusão).</li>
                      ` : ''}

                      ${res.diaMaisBaixo ? `
                        <li>O dia da semana de menor consistência foi <strong>${res.diaMaisBaixo.dia}</strong> (${res.diaMaisBaixo.taxa}% de conclusão).</li>
                      ` : ''}

                      ${res.contextoFrequente.length > 0 ? `
                        <li>Contextos mais recorrentes anotados: <em>"${res.contextoFrequente.join(', ')}"</em></li>
                      ` : '<li>Nenhum contexto anotado frequentemente neste período.</li>'}
                    </ul>
                  </div>

                  <!-- Calibrate Meta Form -->
                  <div class="review-actions">
                    <h3>Ajustar Foco</h3>
                    <p class="section-desc">Se a taxa estiver baixa, reduza a unidade mínima. Se estiver confortável, suba a meta ideal.</p>
                    
                    <form class="form-calibrate" data-id="${comp.id}">
                      <div class="form-group">
                        <label for="calib-min-${comp.id}">Unidade Mínima</label>
                        <input type="text" id="calib-min-${comp.id}" value="${comp.unidade_minima}" ${isLocked ? 'disabled' : ''} required />
                      </div>
                      <div class="form-group">
                        <label for="calib-emergency-${comp.id}">Unidade de Emergencia</label>
                        <input type="text" id="calib-emergency-${comp.id}" value="${comp.unidade_emergencia || ''}" ${isLocked ? 'disabled' : ''} placeholder="Ex: abrir o app por 1 minuto" />
                      </div>
                      <div class="form-group">
                        <label for="calib-meta-${comp.id}">Meta Ideal</label>
                        <input type="text" id="calib-meta-${comp.id}" value="${comp.meta || ''}" ${isLocked ? 'disabled' : ''} placeholder="Ex: Ler 15 páginas" />
                      </div>
                      
                      ${isLocked ? `
                        <button type="button" class="btn btn-secondary disabled-lock-btn" disabled>
                          Disponivel na revisao de ${DIAS_SEMANA.find(d => d.value === comp.dia_revisao)?.label || 'Dom'}
                        </button>
                      ` : `
                        <button type="submit" class="btn btn-secondary">Calibrar Compromisso</button>
                      `}
                    </form>
                  </div>
                </div>

                <!-- Small Weekday success bar chart -->
                <div class="review-chart-row">
                  <h4>Consistência Diária:</h4>
                  <div class="weekday-bar-chart">
                    ${res.porDia.map(d => {
                      const h = d.taxa !== null ? d.taxa : 0;
                      const hasData = d.taxa !== null;
                      return `
                        <div class="bar-col">
                          <div class="bar-track">
                            <div class="bar-fill" style="height: ${h}%" title="${hasData ? `${h}% de conclusão` : 'Sem registros'}"></div>
                          </div>
                          <span class="bar-label">${d.dia}</span>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Event listener for calibration submit
    document.querySelectorAll('.form-calibrate').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = form.getAttribute('data-id');
        const minVal = document.getElementById(`calib-min-${id}`).value;
        const emergencyVal = document.getElementById(`calib-emergency-${id}`).value;
        const metaVal = document.getElementById(`calib-meta-${id}`).value;

        const comp = compromissos.find(c => c.id === id);
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Gravando...';

        try {
          await onEditarCompromisso(id, {
            unidade_minima: minVal,
            unidade_emergencia: emergencyVal || null,
            meta: metaVal || null,
          });
          RevisaoView.showError('Compromisso recalibrado com sucesso!'); // reuse error notification style for success toast
        } catch (err) {
          RevisaoView.showError(err.message);
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Calibrar Compromisso';
        }
      });
    });
  },
};
