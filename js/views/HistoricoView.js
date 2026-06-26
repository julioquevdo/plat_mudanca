// Layer 5 - Views
// Renders retrospective history: filters, self-comparison, fall points, streaks,
// weekday patterns, heatmaps, timeline (paginated) and exports.
//
import { formatDateLocal } from '../config/dateUtils.js';
// Layout, de cima para baixo:
//   1. Header + filtros
//   2. Resumo do periodo
//   3. Insights (capsula do tempo + pontos de queda)
//   4. Sequencias (streaks)
//   5. Padrao por dia da semana
//   6. Heatmap de habitos
//   7. Timeline de percepcoes/sensacoes (paginada)

import { CHECK_STATUS, SENSACOES } from '../config/constants.js';

const TIMELINE_PAGE_SIZE = 10;
const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export const HistoricoView = {
  showLoading() {
    const app = document.getElementById('router-outlet');
    app.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Carregando historico e padroes...</p>
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

  // -----------------------------------------------------------------------
  // Render principal
  // -----------------------------------------------------------------------

  render({ compromissos, categorias, checksPorCompromisso, allChecks = [], from, to, onFilter, onExport, onExportDiario }) {
    const app = document.getElementById('router-outlet');
    const dates = HistoricoView._dateRange(from, to);

    // --- Calculos (todos derivados do periodo ja filtrado) ---
    const resumo = HistoricoView._calcularResumoGeral(allChecks);
    const capsulaTempo = HistoricoView._calcularCapsulaTempo(allChecks, to);
    const pontosQueda = HistoricoView._calcularPontosQueda(allChecks);
    const streaks = HistoricoView._calcularStreaks(compromissos, checksPorCompromisso);
    const padraoDiaSemana = HistoricoView._calcularPadraoDiaSemana(allChecks);
    const timelineLogs = HistoricoView._buildTimelineLogs(compromissos, checksPorCompromisso);

    let timelineVisibleCount = Math.min(TIMELINE_PAGE_SIZE, timelineLogs.length);

    app.innerHTML = `
      <div class="history-page">
        <header class="page-header glass">
          <div class="header-main-row">
            <h1>Historico e Padroes</h1>
            <div class="export-buttons">
              <button id="btn-export-csv" class="btn btn-secondary">Exportar Dados (CSV)</button>
              <button id="btn-export-diario" class="btn btn-secondary">Exportar Diario (CSV)</button>
            </div>
          </div>
          <p>Analise retrospectiva dos seus registros, contextos e padroes de execucao.</p>
        </header>

        <section class="filters-card glass">
          <form id="form-filtros" class="form-row">
            <div class="form-group">
              <label for="filter-categoria">Filtrar Categoria</label>
              <select id="filter-categoria">
                <option value="">Todas</option>
                ${categorias.map(cat => `<option value="${cat.id}">${cat.nome}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="filter-from">De</label>
              <input type="date" id="filter-from" value="${from}" />
            </div>
            <div class="form-group">
              <label for="filter-to">Ate</label>
              <input type="date" id="filter-to" value="${to}" />
            </div>
            <button type="submit" class="btn btn-primary align-self-end">Filtrar</button>
          </form>
        </section>

        ${HistoricoView._renderResumoGeral(resumo)}

        <section class="insights-grid">
          <div class="insight-card glass">
            <h2>Capsula do Tempo</h2>
            <p class="section-desc">Comparacao consigo mesmo, sem ranking.</p>
            <div class="time-capsule-row">
              <div>
                <span class="capsule-label">30 dias anteriores</span>
                <strong>${capsulaTempo.anterior.taxa}%</strong>
                <span>${capsulaTempo.anterior.cumpridos}/${capsulaTempo.anterior.total} registros</span>
              </div>
              <div>
                <span class="capsule-label">Ultimos 30 dias</span>
                <strong>${capsulaTempo.atual.taxa}%</strong>
                <span>${capsulaTempo.atual.cumpridos}/${capsulaTempo.atual.total} registros</span>
              </div>
            </div>
          </div>

          <div class="insight-card glass">
            <h2>Pontos de Queda</h2>
            <p class="section-desc">Leitura simples por sensacoes e palavras exatas; sinonimos e variacoes ficam como melhoria futura.</p>
            ${pontosQueda.length === 0 ? `
              <p class="section-desc">Ainda nao ha padroes frequentes em dias nao cumpridos neste periodo.</p>
            ` : `
              <div class="drop-points-list">
                ${pontosQueda.map(item => `<span class="drop-point-pill">${item.label} (${item.count})</span>`).join('')}
              </div>
            `}
          </div>
        </section>

        ${HistoricoView._renderStreaksSection(streaks)}

        ${HistoricoView._renderPadraoDiaSemanaSection(padraoDiaSemana)}

        <section class="heatmap-section">
          <h2>Heatmap de Habitos</h2>
          <div class="heatmaps-list">
            ${compromissos.length === 0 ? `
              <div class="empty-card glass">
                <p>Nenhum compromisso para exibir no historico.</p>
              </div>
            ` : compromissos.map(comp => HistoricoView._renderHeatmapCard(comp, checksPorCompromisso[comp.id] || [], dates)).join('')}
          </div>
        </section>

        <section class="timeline-section">
          <h2>Percepcoes e Sensacoes</h2>
          <p class="section-desc">Contextos e humores registrados no periodo selecionado.</p>
          <div class="timeline-list" id="timeline-list">
            ${HistoricoView._renderTimelineItems(timelineLogs.slice(0, timelineVisibleCount))}
          </div>
          <div class="timeline-section-footer" id="timeline-section-footer">
            ${HistoricoView._renderTimelineFooter(timelineLogs.length, timelineVisibleCount)}
          </div>
        </section>
      </div>
    `;

    // --- Listeners ---
    const formFiltros = document.getElementById('form-filtros');
    formFiltros.addEventListener('submit', (e) => {
      e.preventDefault();
      const categoriaId = document.getElementById('filter-categoria').value || null;
      const fromVal = document.getElementById('filter-from').value;
      const toVal = document.getElementById('filter-to').value;
      onFilter({ categoriaId, from: fromVal, to: toVal });
    });

    document.getElementById('btn-export-csv').addEventListener('click', () => onExport());
    document.getElementById('btn-export-diario').addEventListener('click', () => onExportDiario());

    const attachTimelineLoadMore = () => {
      const btn = document.getElementById('btn-timeline-more');
      if (!btn) return;
      btn.addEventListener('click', () => {
        timelineVisibleCount = Math.min(timelineVisibleCount + TIMELINE_PAGE_SIZE, timelineLogs.length);
        document.getElementById('timeline-list').innerHTML =
          HistoricoView._renderTimelineItems(timelineLogs.slice(0, timelineVisibleCount));
        document.getElementById('timeline-section-footer').innerHTML =
          HistoricoView._renderTimelineFooter(timelineLogs.length, timelineVisibleCount);
        attachTimelineLoadMore();
      });
    };
    attachTimelineLoadMore();
  },

  // -----------------------------------------------------------------------
  // Render: Resumo do Periodo
  // -----------------------------------------------------------------------

  _renderResumoGeral(resumo) {
    if (!resumo.total) {
      return `
        <section class="summary-card glass">
          <h2>Resumo do Periodo</h2>
          <p class="section-desc">Ainda nao ha registros neste periodo.</p>
        </section>
      `;
    }

    return `
      <section class="summary-card glass">
        <h2>Resumo do Periodo</h2>
        <div class="summary-grid">
          <div class="summary-stat">
            <strong>${resumo.taxa}%</strong>
            <span>Taxa de cumprimento</span>
          </div>
          <div class="summary-stat">
            <strong>${resumo.cumpridos}</strong>
            <span>Cumpridos</span>
          </div>
          <div class="summary-stat">
            <strong>${resumo.naoCumpridos}</strong>
            <span>Nao cumpridos</span>
          </div>
          <div class="summary-stat">
            <strong>${resumo.pausados}</strong>
            <span>Pausados</span>
          </div>
          <div class="summary-stat">
            <strong>${resumo.diasComRegistro}</strong>
            <span>Dias com registro</span>
          </div>
        </div>
      </section>
    `;
  },

  // -----------------------------------------------------------------------
  // Render: Sequencias (streaks)
  // -----------------------------------------------------------------------

  _renderStreaksSection(streaks) {
    const comDados = streaks.filter(s => s.recorde > 0 || s.atual > 0);

    return `
      <section class="streaks-section glass">
        <h2>Sequencias</h2>
        <p class="section-desc">Dias consecutivos cumprindo cada habito, sem contar dias pausados.</p>
        ${comDados.length === 0 ? `
          <p class="section-desc">Ainda nao ha sequencias registradas neste periodo.</p>
        ` : `
          <div class="streaks-list">
            ${comDados.map(s => `
              <div class="streak-pill">
                <span class="category-indicator" style="background-color: ${s.color}"></span>
                <strong>${s.nome}</strong>
                <span class="streak-value">${s.atual > 0 ? `${s.atual} dia${s.atual === 1 ? '' : 's'} seguidos` : 'sequencia interrompida'}</span>
                <span class="streak-record">recorde: ${s.recorde} dia${s.recorde === 1 ? '' : 's'}</span>
              </div>
            `).join('')}
          </div>
        `}
      </section>
    `;
  },

  // -----------------------------------------------------------------------
  // Render: Padrao por Dia da Semana
  // -----------------------------------------------------------------------

  _renderPadraoDiaSemanaSection(padrao) {
    const temDados = padrao.some(d => d.total > 0);
    const piorDia = padrao.find(d => d.isPior);

    return `
      <section class="weekday-pattern-section glass">
        <h2>Padrao por Dia da Semana</h2>
        <p class="section-desc">Taxa de cumprimento por dia da semana neste periodo.</p>
        ${!temDados ? `
          <p class="section-desc">Ainda nao ha dados suficientes para identificar um padrao.</p>
        ` : `
          <div class="weekday-bar-chart">
            ${padrao.map(d => `
              <div class="weekday-bar ${d.isPior ? 'weakest' : ''}" title="${d.total ? `${d.cumpridos}/${d.total} cumpridos` : 'Sem registro'}">
                <div class="weekday-bar-track">
                  <div class="weekday-bar-fill" style="height: ${d.taxa ?? 0}%"></div>
                </div>
                <span class="weekday-bar-value">${d.taxa !== null ? `${d.taxa}%` : '-'}</span>
                <span class="weekday-bar-label">${d.label}</span>
              </div>
            `).join('')}
          </div>
          ${piorDia ? `
            <p class="section-desc weekday-pattern-highlight">Ponto de atencao: ${piorDia.label} costuma ter a menor taxa de cumprimento.</p>
          ` : ''}
        `}
      </section>
    `;
  },

  // -----------------------------------------------------------------------
  // Render: Heatmap
  // -----------------------------------------------------------------------

  _renderHeatmapCard(comp, checks, dates) {
    const checksMap = Object.fromEntries(checks.map(c => [c.data, c]));
    return `
      <div class="heatmap-card glass">
        <div class="heatmap-header">
          <span class="category-indicator" style="background-color: ${comp.categorias?.cor || '#6A9F7E'}"></span>
          <h3>${comp.nome}</h3>
          <span class="heatmap-sub">Unidade minima: ${comp.unidade_minima}</span>
        </div>

        <div class="heatmap-container">
          <div class="heatmap-grid">
            ${dates.map(date => {
              const check = checksMap[date];
              let statusClass = 'empty';
              let titleText = `${HistoricoView._formatDateShort(date)}: Sem registro`;

              if (check) {
                statusClass = check.status;
                const statusLabel = check.status === CHECK_STATUS.CUMPRIDO ? 'Cumprido' :
                  check.status === CHECK_STATUS.NAO_CUMPRIDO ? 'Nao cumprido' : 'Pausado';
                titleText = `${HistoricoView._formatDateShort(date)}: ${statusLabel}${check.sensacao ? ` (${HistoricoView._getSensationLabel(check.sensacao)})` : ''}`;
              }

              return `<div class="heatmap-cell ${statusClass}" title="${titleText}"></div>`;
            }).join('')}
          </div>
          <div class="heatmap-legend">
            <span>Sem registro</span>
            <div class="legend-cell empty"></div>
            <div class="legend-cell cumprido"></div>
            <div class="legend-cell naoCumprido"></div>
            <div class="legend-cell pausado"></div>
            <span>Registrado</span>
          </div>
        </div>
      </div>
    `;
  },

  // -----------------------------------------------------------------------
  // Render: Timeline (paginada)
  // -----------------------------------------------------------------------

  _renderTimelineItems(logs) {
    if (logs.length === 0) {
      return `
        <div class="empty-card glass">
          <p>Nenhuma sensacao ou comentario registrado no periodo.</p>
        </div>
      `;
    }

    return logs.map(log => {
      const sensacaoObj = SENSACOES.find(s => s.value === log.sensacao);
      const emoji = sensacaoObj ? sensacaoObj.emoji : '';
      const label = sensacaoObj ? sensacaoObj.label : '';
      const d = new Date(`${log.date}T00:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

      return `
        <div class="timeline-card glass">
          <div class="timeline-meta">
            <span class="timeline-date">${d}</span>
            <div class="timeline-habit-badge">
              <span class="category-indicator" style="background-color: ${log.color}"></span>
              <span>${log.habit}</span>
            </div>
          </div>
          <div class="timeline-content">
            ${log.sensacao ? `
              <div class="timeline-feeling-badge">
                <span class="feeling-emoji">${emoji}</span>
                <span class="feeling-label">${label}</span>
              </div>
            ` : ''}
            ${log.contexto ? `<p class="timeline-text">"${log.contexto}"</p>` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  _renderTimelineFooter(total, visible) {
    if (total <= visible) return '';
    const restantes = total - visible;
    return `
      <button type="button" id="btn-timeline-more" class="btn btn-secondary timeline-load-more">
        Carregar mais (${restantes} restante${restantes === 1 ? '' : 's'})
      </button>
    `;
  },

  _buildTimelineLogs(comps, checksMap) {
    const logs = [];
    for (const comp of comps) {
      const checks = checksMap[comp.id] || [];
      checks.forEach(c => {
        if (c.sensacao || c.contexto) {
          logs.push({
            date: c.data,
            habit: comp.nome,
            color: comp.categorias?.cor || '#6A9F7E',
            sensacao: c.sensacao,
            contexto: c.contexto,
          });
        }
      });
    }
    return logs.sort((a, b) => (a.date < b.date ? 1 : -1));
  },

  // -----------------------------------------------------------------------
  // Calculos
  // -----------------------------------------------------------------------

  _calcularResumoGeral(checks) {
    const relevantes = checks.filter(c => c.status !== CHECK_STATUS.PAUSADO);
    const cumpridos = relevantes.filter(c => c.status === CHECK_STATUS.CUMPRIDO).length;
    const naoCumpridos = relevantes.length - cumpridos;
    const pausados = checks.length - relevantes.length;
    const diasComRegistro = new Set(checks.map(c => c.data)).size;

    return {
      total: checks.length,
      cumpridos,
      naoCumpridos,
      pausados,
      diasComRegistro,
      taxa: relevantes.length ? Math.round((cumpridos / relevantes.length) * 100) : 0,
    };
  },

  _calcularCapsulaTempo(checks, toDate) {
    const end = new Date(`${toDate}T00:00:00`);
    const startAtual = new Date(end);
    startAtual.setDate(startAtual.getDate() - 29);
    const endAnterior = new Date(startAtual);
    endAnterior.setDate(endAnterior.getDate() - 1);
    const startAnterior = new Date(endAnterior);
    startAnterior.setDate(startAnterior.getDate() - 29);

    const summarize = (start, finish) => {
      const rows = checks.filter(c => {
        const d = new Date(`${c.data}T00:00:00`);
        return d >= start && d <= finish && c.status !== CHECK_STATUS.PAUSADO;
      });
      const cumpridos = rows.filter(c => c.status === CHECK_STATUS.CUMPRIDO).length;
      return {
        total: rows.length,
        cumpridos,
        taxa: rows.length ? Math.round((cumpridos / rows.length) * 100) : 0,
      };
    };

    return {
      atual: summarize(startAtual, end),
      anterior: summarize(startAnterior, endAnterior),
    };
  },

  _calcularPontosQueda(checks) {
    const stopwords = new Set(['para', 'com', 'sem', 'que', 'uma', 'um', 'por', 'das', 'dos', 'mais', 'hoje', 'muito', 'pouco']);
    const counts = {};
    checks
      .filter(c => c.status === CHECK_STATUS.NAO_CUMPRIDO)
      .forEach(c => {
        if (c.sensacao) {
          const label = HistoricoView._getSensationLabel(c.sensacao);
          counts[label] = (counts[label] ?? 0) + 1;
        }
        (c.contexto || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length >= 4 && !stopwords.has(word))
          .forEach(word => {
            counts[word] = (counts[word] ?? 0) + 1;
          });
      });

    return Object.entries(counts)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count]) => ({ label, count }));
  },

  /**
   * Sequencia atual: dias consecutivos mais recentes com status CUMPRIDO,
   * ignorando dias pausados (nao contam a favor nem contra) e parando no
   * primeiro NAO_CUMPRIDO encontrado.
   */
  _streakAtual(checks) {
    const ordenado = [...checks]
      .filter(c => c.status !== CHECK_STATUS.PAUSADO)
      .sort((a, b) => (a.data < b.data ? 1 : -1));

    let streak = 0;
    for (const c of ordenado) {
      if (c.status === CHECK_STATUS.CUMPRIDO) streak++;
      else break;
    }
    return streak;
  },

  /** Maior sequencia de dias CUMPRIDO consecutivos ja registrada (recorde). */
  _streakRecorde(checks) {
    const ordenado = [...checks]
      .filter(c => c.status !== CHECK_STATUS.PAUSADO)
      .sort((a, b) => (a.data > b.data ? 1 : -1));

    let max = 0;
    let atual = 0;
    for (const c of ordenado) {
      if (c.status === CHECK_STATUS.CUMPRIDO) {
        atual++;
        max = Math.max(max, atual);
      } else {
        atual = 0;
      }
    }
    return max;
  },

  _calcularStreaks(compromissos, checksPorCompromisso) {
    return compromissos
      .map(comp => {
        const checks = checksPorCompromisso[comp.id] || [];
        return {
          id: comp.id,
          nome: comp.nome,
          color: comp.categorias?.cor || '#6A9F7E',
          atual: HistoricoView._streakAtual(checks),
          recorde: HistoricoView._streakRecorde(checks),
        };
      })
      .sort((a, b) => b.atual - a.atual);
  },

  /**
   * Agrupa os checks por dia da semana (0=Dom .. 6=Sab) e calcula a taxa de
   * cumprimento de cada um, marcando o de menor taxa como "isPior" (ponto
   * de atencao). Dias pausados sao ignorados no calculo.
   *
   * O dia atual e excluido do calculo para evitar distorcer a taxa do dia em andamento.
   */
  _calcularPadraoDiaSemana(checks) {
    const buckets = WEEKDAY_LABELS.map(label => ({ label, cumpridos: 0, total: 0 }));
    const todayStr = formatDateLocal(new Date());

    checks
      .filter(c => c.status !== CHECK_STATUS.PAUSADO && c.data !== todayStr)
      .forEach(c => {
        const weekday = new Date(`${c.data}T00:00:00`).getDay();
        buckets[weekday].total++;
        if (c.status === CHECK_STATUS.CUMPRIDO) buckets[weekday].cumpridos++;
      });

    const comDados = buckets.filter(b => b.total > 0);
    const taxas = comDados.map(b => b.cumpridos / b.total);
    const minTaxa = taxas.length ? Math.min(...taxas) : null;
    const maxTaxa = taxas.length ? Math.max(...taxas) : null;

    // So existe "pior dia" se houver variacao real nas taxas (nao estao todos empatados)
    const temVariacao = minTaxa !== null && maxTaxa !== null && minTaxa < maxTaxa;

    return buckets.map(b => {
      const taxa = b.total ? Math.round((b.cumpridos / b.total) * 100) : null;
      const taxaReal = b.total ? b.cumpridos / b.total : null;
      return {
        ...b,
        taxa,
        isPior: temVariacao && taxaReal === minTaxa,
      };
    });
  },

  // -----------------------------------------------------------------------
  // Utilitarios
  // -----------------------------------------------------------------------

  _dateRange(start, end) {
    const dates = [];
    const curr = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    while (curr <= endDate) {
      dates.push(formatDateLocal(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  },

  _formatDateShort(dateStr) {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  },

  _getSensationLabel(val) {
    return SENSACOES.find(s => s.value === val)?.label || val;
  },
};