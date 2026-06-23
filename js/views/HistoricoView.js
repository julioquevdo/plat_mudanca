// Layer 5 - Views
// Renders retrospective history: filters, self-comparison, fall points, heatmaps, timeline and exports.

import { CHECK_STATUS, SENSACOES } from '../config/constants.js';

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

  render({ compromissos, categorias, checksPorCompromisso, allChecks = [], from, to, onFilter, onExport, onExportDiario }) {
    const app = document.getElementById('router-outlet');
    const dates = HistoricoView._dateRange(from, to);
    const capsulaTempo = HistoricoView._calcularCapsulaTempo(allChecks, to);
    const pontosQueda = HistoricoView._calcularPontosQueda(allChecks);

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
          <div class="timeline-list">
            ${HistoricoView._renderTimelineList(compromissos, checksPorCompromisso)}
          </div>
        </section>
      </div>
    `;

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
  },

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

  _renderTimelineList(comps, checksMap) {
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

    logs.sort((a, b) => (a.date < b.date ? 1 : -1));

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

  _dateRange(start, end) {
    const dates = [];
    const curr = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    while (curr <= endDate) {
      dates.push(curr.toISOString().split('T')[0]);
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
