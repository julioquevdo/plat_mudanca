// Layer 5 - Views
// Renders planning rhythm: daily expectations, past completion, weekly/monthly normalized percentages.

import { CHECK_STATUS } from '../config/constants.js';
import { todayLocal, formatDateLocal } from '../config/dateUtils.js';
import { FrequencyUtils } from '../config/frequencyUtils.js';

export const RitmoView = {
  showLoading() {
    const app = document.getElementById('router-outlet');
    app.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Organizando seu ritmo...</p>
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

  render({ compromissos, checks, from, to }) {
    const app = document.getElementById('router-outlet');
    const ritmo = RitmoView._calcularRitmo(compromissos, checks, from, to);
    const todayDetail = ritmo.days.find(day => day.isToday) || ritmo.days[0];

    app.innerHTML = `
      <div class="rhythm-page">
        <header class="page-header glass">
          <h1>Ritmo e Planejamento</h1>
          <p>Uma leitura de carga: o que estava previsto, o que foi realizado e o que vem nos proximos dias.</p>
        </header>

        <section class="rhythm-section glass">
          <div class="rhythm-header">
            <div>
              <h2>Dias</h2>
              <p>Dias passados mostram previsto vs realizado. Dias futuros mostram o que esta previsto pela frequencia dos compromissos.</p>
            </div>
          </div>

          <div class="rhythm-days-layout">
            <div class="rhythm-days-list">
              ${ritmo.days.map(day => `
                <button type="button" class="rhythm-day ${day.isToday ? 'today selected' : ''} ${day.isFuture ? 'future' : 'past'}" data-day="${day.date}">
                  <span class="rhythm-day-date">${day.label}</span>
                  <span class="rhythm-day-score">${day.isFuture ? `${day.expected} previstos` : `${day.done}/${day.expected}`}</span>
                  <span class="rhythm-day-bar"><span style="width:${day.percent}%"></span></span>
                </button>
              `).join('')}
            </div>

            <div class="rhythm-day-detail" id="rhythm-day-detail">
              ${RitmoView._renderDayDetail(todayDetail)}
            </div>
          </div>
        </section>

        <section class="rhythm-section rhythm-aproveitamento-section glass">
          <div class="rhythm-header">
            <div>
              <h2>Aproveitamento por Compromisso</h2>
              <p>Um espelho de onde sua energia esta fluindo mais facil no periodo selecionado — nao e um ranking de cobranca, e so um jeito de notar padroes. Toque em um compromisso para ver a evolucao no periodo.</p>
            </div>
          </div>

          ${ritmo.aproveitamento.length === 0 ? `
            <p class="section-desc">Ainda nao ha dados suficientes neste periodo.</p>
          ` : `
            <div class="rhythm-period-tasks aproveitamento-list">
              ${ritmo.aproveitamento.map(task => `
                <button type="button" class="rhythm-task-percent rhythm-task-clickable" data-comp-id="${task.id}">
                  <div>
                    <span class="category-indicator" style="background-color:${task.color}"></span>
                    <strong>${task.nome}</strong>
                    <small>${task.frequencyLabel}</small>
                  </div>
                  <span class="rhythm-task-percent-value">${task.done}/${task.expected} - ${task.percent}%<span class="rhythm-chart-chevron" aria-hidden="true">&rsaquo;</span></span>
                </button>
              `).join('')}
            </div>
          `}
        </section>

        <section class="rhythm-section rhythm-periods-section glass">
          <div class="rhythm-header">
            <div>
              <h2>Semanas e Meses</h2>
              <p>As porcentagens respeitam a frequencia esperada de cada compromisso, entao tarefas diarias pesam mais que tarefas 2x por semana.</p>
            </div>
          </div>

          <div class="rhythm-period-grid">
            <article class="rhythm-panel">
              <h3>Semanas</h3>
              <div class="rhythm-period-list">
                ${ritmo.weeks.map(week => RitmoView._renderPeriodCard(week)).join('')}
              </div>
            </article>

            <article class="rhythm-panel">
              <h3>Meses</h3>
              <div class="rhythm-period-list">
                ${ritmo.months.map(month => RitmoView._renderPeriodCard(month)).join('')}
              </div>
            </article>
          </div>
        </section>
      </div>
    `;

    const rhythmDetail = document.getElementById('rhythm-day-detail');
    document.querySelectorAll('.rhythm-day').forEach(btn => {
      btn.addEventListener('click', () => {
        const selected = ritmo.days.find(day => day.date === btn.getAttribute('data-day'));
        if (!selected || !rhythmDetail) return;
        document.querySelectorAll('.rhythm-day').forEach(dayBtn => dayBtn.classList.remove('selected'));
        btn.classList.add('selected');
        rhythmDetail.innerHTML = RitmoView._renderDayDetail(selected);
      });
    });

    document.querySelectorAll('.rhythm-task-clickable').forEach(btn => {
      btn.addEventListener('click', () => {
        const comp = compromissos.find(c => String(c.id) === btn.getAttribute('data-comp-id'));
        if (!comp) return;
        RitmoView._openCompromissoChart(comp, checks, from, to);
      });
    });
  },

  _calcularRitmo(comps, checks, fromDate, toDate) {
    const today = todayLocal();
    const dayDates = RitmoView._dateRange(RitmoView._addDays(today, -7), RitmoView._addDays(today, 14));
    const days = dayDates.map(date => RitmoView._summarizeDay(date, comps, checks, today));

    const weekRanges = RitmoView._buildWeekRanges(fromDate, toDate).slice(-8);
    const monthRanges = RitmoView._buildMonthRanges(fromDate, toDate).slice(-6);

    return {
      days,
      weeks: weekRanges.map(range => RitmoView._summarizePeriod(range, comps, checks)),
      months: monthRanges.map(range => RitmoView._summarizePeriod(range, comps, checks)),
      aproveitamento: RitmoView._summarizeAproveitamento(comps, checks, fromDate, toDate),
    };
  },

  _summarizeDay(date, comps, checks, today) {
    const expectedComps = comps.filter(comp => FrequencyUtils.isExpectedOnDate(comp, date));
    const doneChecks = checks.filter(c => c.data === date && c.status === CHECK_STATUS.CUMPRIDO);
    const missedChecks = checks.filter(c => c.data === date && c.status === CHECK_STATUS.NAO_CUMPRIDO);
    const doneIds = new Set(doneChecks.map(c => c.compromisso_id));
    const expectedDone = expectedComps.filter(comp => doneIds.has(comp.id));
    const percent = expectedComps.length ? Math.round((expectedDone.length / expectedComps.length) * 100) : 0;

    return {
      date,
      label: RitmoView._formatDayLabel(date),
      isToday: date === today,
      isFuture: date > today,
      expected: expectedComps.length,
      done: expectedDone.length,
      percent,
      planned: expectedComps.map(comp => comp.nome),
      completed: expectedDone.map(comp => comp.nome),
      missed: missedChecks.map(check => RitmoView._getCompName(comps, check.compromisso_id)),
      flexible: comps.filter(comp => comp.frequencia_tipo === 'xVezesSemana').map(comp => ({
        nome: comp.nome,
        vezes: comp.frequencia_vezes || 1,
      })),
    };
  },

  _summarizePeriod(range, comps, checks) {
    const tasks = comps.map(comp => {
      const expected = RitmoView._expectedCountInRange(comp, range.start, range.end);
      const done = checks.filter(c =>
        c.compromisso_id === comp.id &&
        c.status === CHECK_STATUS.CUMPRIDO &&
        c.data >= range.start &&
        c.data <= range.end
      ).length;
      const percent = expected ? Math.min(100, Math.round((done / expected) * 100)) : 0;
      return {
        id: comp.id,
        nome: comp.nome,
        color: comp.categorias?.cor || '#6A9F7E',
        expected,
        done,
        percent,
        frequencyLabel: RitmoView._frequencyLabel(comp),
      };
    }).filter(task => task.expected > 0 || task.done > 0);

    const expectedTotal = tasks.reduce((acc, task) => acc + task.expected, 0);
    const doneTotal = tasks.reduce((acc, task) => acc + Math.min(task.done, task.expected || task.done), 0);
    const percent = expectedTotal ? Math.round((doneTotal / expectedTotal) * 100) : 0;

    return {
      start: range.start,
      end: range.end,
      label: range.label,
      expectedTotal,
      doneTotal,
      percent,
      tasks,
    };
  },

  /**
   * Rank commitments by completion rate ("taxa de aproveitamento") across
   * the whole `from`..`to` period. Highest percent first; ties broken by
   * raw count of completions so more-active commitments surface first.
   * Only includes commitments that actually had something expected in
   * the period (avoids 0/0 noise for brand-new or paused commitments).
   */
  _summarizeAproveitamento(comps, checks, fromDate, toDate) {
    return comps
      .map(comp => {
        const expected = RitmoView._expectedCountInRange(comp, fromDate, toDate);
        const done = checks.filter(c =>
          c.compromisso_id === comp.id &&
          c.status === CHECK_STATUS.CUMPRIDO &&
          c.data >= fromDate &&
          c.data <= toDate
        ).length;
        const percent = expected ? Math.min(100, Math.round((done / expected) * 100)) : 0;
        return {
          id: comp.id,
          nome: comp.nome,
          color: comp.categorias?.cor || '#6A9F7E',
          expected,
          done,
          percent,
          frequencyLabel: RitmoView._frequencyLabel(comp),
        };
      })
      .filter(task => task.expected > 0)
      .sort((a, b) => b.percent - a.percent || b.done - a.done);
  },

  // ---------------------------------------------------------------------
  // Drill-down chart: clicking a commitment in "Aproveitamento por
  // Compromisso" opens a line chart for that commitment across the
  // selected period. Short periods (<=21 days) are plotted day by day as
  // a "fiz / nao fiz" line; longer periods are aggregated into a
  // per-week completion percentage so the chart stays readable.
  // ---------------------------------------------------------------------

  _openCompromissoChart(comp, checks, fromDate, toDate) {
    RitmoView._ensureChartStyles();

    const series = RitmoView._buildCompromissoSeries(comp, checks, fromDate, toDate);
    const previous = document.getElementById('rhythm-chart-overlay');
    if (previous) previous.remove();

    const overlay = document.createElement('div');
    overlay.className = 'rhythm-chart-overlay';
    overlay.id = 'rhythm-chart-overlay';
    overlay.innerHTML = `
      <div class="rhythm-chart-modal glass">
        <button type="button" class="rhythm-chart-close" aria-label="Fechar">&times;</button>
        <div class="rhythm-chart-modal-header">
          <span class="category-indicator" style="background-color:${comp.categorias?.cor || '#6A9F7E'}"></span>
          <div>
            <h3>${comp.nome}</h3>
            <small>${RitmoView._frequencyLabel(comp)} · ${series.mode === 'weekly' ? 'visao semanal' : 'visao diaria'}</small>
          </div>
        </div>
        ${series.points.length === 0 ? `
          <p class="section-desc">Sem dados suficientes neste periodo para montar o grafico.</p>
        ` : RitmoView._renderChartSVG(series)}
        ${series.points.length === 0 ? '' : `
          <div class="rhythm-chart-legend">
            ${series.mode === 'daily' ? `
              <span><i class="rhythm-chart-dot done"></i> Cumprido</span>
              <span><i class="rhythm-chart-dot missed"></i> Nao cumprido</span>
            ` : `
              <span><i class="rhythm-chart-dot done"></i> % de aproveitamento na semana</span>
            `}
          </div>
        `}
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => {
      overlay.remove();
      document.removeEventListener('keydown', onKeydown);
    };
    function onKeydown(event) {
      if (event.key === 'Escape') close();
    }

    overlay.querySelector('.rhythm-chart-close').addEventListener('click', close);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });
    document.addEventListener('keydown', onKeydown);
  },

  _buildCompromissoSeries(comp, checks, fromDate, toDate) {
    const allDates = RitmoView._dateRange(fromDate, toDate);
    const DAILY_LIMIT = 21; // beyond ~3 weeks daily dots get too cramped - aggregate by week instead

    if (allDates.length > DAILY_LIMIT) {
      const weeks = RitmoView._buildWeekRanges(fromDate, toDate).slice(-26);
      const points = weeks
        .map(week => {
          const expected = RitmoView._expectedCountInRange(comp, week.start, week.end);
          const done = checks.filter(c =>
            c.compromisso_id === comp.id &&
            c.status === CHECK_STATUS.CUMPRIDO &&
            c.data >= week.start &&
            c.data <= week.end
          ).length;
          const percent = expected ? Math.min(100, Math.round((done / expected) * 100)) : 0;
          return { label: week.label, value: percent, expected, done };
        })
        .filter(point => point.expected > 0);

      return { mode: 'weekly', points };
    }

    // Daily mode. Fixed-schedule commitments (diaria/diasSemana) only plot
    // the days they were actually expected. Flexible ("xVezesSemana")
    // commitments don't have fixed expected days, so every active day is
    // plotted instead, marking whether it was completed that day.
    const isFixedSchedule = comp.frequencia_tipo === 'diaria' || comp.frequencia_tipo === 'diasSemana';
    const points = allDates
      .filter(date => isFixedSchedule ? FrequencyUtils.isExpectedOnDate(comp, date) : FrequencyUtils.isCompActiveOnDate(comp, date))
      .map(date => {
        const done = checks.some(c =>
          c.compromisso_id === comp.id &&
          c.data === date &&
          c.status === CHECK_STATUS.CUMPRIDO
        );
        return { label: RitmoView._formatDateShort(date), value: done ? 1 : 0, date };
      });

    return { mode: 'daily', points };
  },

  _renderChartSVG(series) {
    return series.mode === 'weekly'
      ? RitmoView._renderWeeklyLineSVG(series.points)
      : RitmoView._renderDailyLineSVG(series.points);
  },

  _renderDailyLineSVG(points) {
    const width = 640;
    const height = 220;
    const padX = 36;
    const innerW = width - padX * 2;
    const yDone = 32;
    const yMissed = height - 44;
    const step = points.length > 1 ? innerW / (points.length - 1) : 0;

    const coords = points.map((point, i) => ({
      x: padX + step * i,
      y: point.value === 1 ? yDone : yMissed,
      point,
    }));

    const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
    const dots = coords.map(c => `
      <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="5" class="rhythm-chart-point ${c.point.value === 1 ? 'done' : 'missed'}" />
    `).join('');

    const showEveryLabel = points.length <= 10;
    const labels = coords.map((c, i) => {
      if (!showEveryLabel && i % 2 !== 0 && i !== coords.length - 1) return '';
      return `<text x="${c.x.toFixed(1)}" y="${height - 14}" class="rhythm-chart-axis-label" text-anchor="middle">${c.point.label}</text>`;
    }).join('');

    return `
      <svg class="rhythm-chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        <line x1="${padX}" y1="${yDone}" x2="${width - padX}" y2="${yDone}" class="rhythm-chart-grid" />
        <line x1="${padX}" y1="${yMissed}" x2="${width - padX}" y2="${yMissed}" class="rhythm-chart-grid" />
        <text x="4" y="${yDone + 4}" class="rhythm-chart-axis-label">Fiz</text>
        <text x="4" y="${yMissed + 4}" class="rhythm-chart-axis-label">Nao fiz</text>
        <path d="${linePath}" class="rhythm-chart-line" fill="none" />
        ${dots}
        ${labels}
      </svg>
    `;
  },

  _renderWeeklyLineSVG(points) {
    const width = 640;
    const height = 220;
    const padX = 36;
    const padTop = 26;
    const padBottom = 44;
    const innerW = width - padX * 2;
    const innerH = height - padTop - padBottom;
    const step = points.length > 1 ? innerW / (points.length - 1) : 0;

    const coords = points.map((point, i) => ({
      x: padX + step * i,
      y: padTop + innerH - (innerH * point.value / 100),
      point,
    }));

    const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
    const lastX = coords[coords.length - 1].x.toFixed(1);
    const firstX = coords[0].x.toFixed(1);
    const areaPath = `${linePath} L ${lastX} ${(padTop + innerH).toFixed(1)} L ${firstX} ${(padTop + innerH).toFixed(1)} Z`;

    const dots = coords.map(c => `
      <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="4" class="rhythm-chart-point done" />
      <text x="${c.x.toFixed(1)}" y="${(c.y - 10).toFixed(1)}" class="rhythm-chart-value-label" text-anchor="middle">${c.point.value}%</text>
    `).join('');

    const showEveryLabel = points.length <= 8;
    const labels = coords.map((c, i) => {
      if (!showEveryLabel && i % 2 !== 0 && i !== coords.length - 1) return '';
      return `<text x="${c.x.toFixed(1)}" y="${height - 14}" class="rhythm-chart-axis-label" text-anchor="middle">${c.point.label}</text>`;
    }).join('');

    return `
      <svg class="rhythm-chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        <line x1="${padX}" y1="${padTop}" x2="${width - padX}" y2="${padTop}" class="rhythm-chart-grid" />
        <line x1="${padX}" y1="${padTop + innerH / 2}" x2="${width - padX}" y2="${padTop + innerH / 2}" class="rhythm-chart-grid" />
        <line x1="${padX}" y1="${padTop + innerH}" x2="${width - padX}" y2="${padTop + innerH}" class="rhythm-chart-grid" />
        <text x="4" y="${padTop + 4}" class="rhythm-chart-axis-label">100%</text>
        <text x="4" y="${padTop + innerH / 2 + 4}" class="rhythm-chart-axis-label">50%</text>
        <text x="4" y="${padTop + innerH + 4}" class="rhythm-chart-axis-label">0%</text>
        <path d="${areaPath}" class="rhythm-chart-area" />
        <path d="${linePath}" class="rhythm-chart-line" fill="none" />
        ${dots}
        ${labels}
      </svg>
    `;
  },

  _ensureChartStyles() {
    if (document.getElementById('rhythm-chart-styles')) return;
    const style = document.createElement('style');
    style.id = 'rhythm-chart-styles';
    style.textContent = `
      .rhythm-chart-overlay {
        position: fixed;
        inset: 0;
        background: rgba(20, 24, 22, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        z-index: 1000;
      }
      .rhythm-chart-modal {
        max-width: 680px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        padding: 24px;
        border-radius: 16px;
        position: relative;
      }
      .rhythm-chart-close {
        position: absolute;
        top: 12px;
        right: 16px;
        background: none;
        border: none;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
        color: inherit;
        opacity: 0.6;
      }
      .rhythm-chart-close:hover { opacity: 1; }
      .rhythm-chart-modal-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
        padding-right: 28px;
      }
      .rhythm-chart-modal-header h3 { margin: 0; }
      .rhythm-chart-modal-header small { opacity: 0.7; }
      .rhythm-chart-svg { width: 100%; height: auto; display: block; }
      .rhythm-chart-grid { stroke: currentColor; opacity: 0.15; stroke-width: 1; }
      .rhythm-chart-line { stroke: #6A9F7E; stroke-width: 2.5; }
      .rhythm-chart-area { fill: #6A9F7E; opacity: 0.12; stroke: none; }
      .rhythm-chart-point.done { fill: #6A9F7E; }
      .rhythm-chart-point.missed { fill: #D9786E; }
      .rhythm-chart-axis-label { font-size: 10px; fill: currentColor; opacity: 0.6; }
      .rhythm-chart-value-label { font-size: 10px; fill: currentColor; opacity: 0.8; }
      .rhythm-chart-legend {
        display: flex;
        gap: 16px;
        margin-top: 12px;
        font-size: 13px;
        opacity: 0.85;
      }
      .rhythm-chart-dot {
        display: inline-block;
        width: 9px;
        height: 9px;
        border-radius: 50%;
        margin-right: 5px;
      }
      .rhythm-chart-dot.done { background: #6A9F7E; }
      .rhythm-chart-dot.missed { background: #D9786E; }
      .rhythm-task-clickable {
        border: none;
        background: transparent;
        width: 100%;
        text-align: left;
        cursor: pointer;
        font: inherit;
        color: inherit;
      }
      .rhythm-task-clickable:hover { opacity: 0.85; }
      .rhythm-chart-chevron { opacity: 0.45; margin-left: 6px; }
    `;
    document.head.appendChild(style);
  },

  _renderDayDetail(day) {
    if (!day) return '';
    return `
      <div class="rhythm-detail-header">
        <strong>${day.label}</strong>
        <span>${day.isFuture ? 'Planejado' : `${day.percent}% concluido`}</span>
      </div>
      ${day.planned.length === 0 ? `
        <p class="section-desc">Nenhum compromisso previsto para este dia.</p>
      ` : `
        <div class="rhythm-task-list">
          ${day.planned.map(name => {
            const completed = day.completed.includes(name);
            const missed = day.missed.includes(name);
            const status = day.isFuture ? 'previsto' : completed ? 'cumprido' : missed ? 'nao cumprido' : 'sem registro';
            return `
              <div class="rhythm-task-row ${completed ? 'done' : missed ? 'missed' : ''}">
                <span>${name}</span>
                <strong>${status}</strong>
              </div>
            `;
          }).join('')}
        </div>
      `}
      ${day.flexible.length > 0 ? `
        <div class="rhythm-flexible-note">
          <span>Metas flexiveis da semana</span>
          ${day.flexible.map(item => `<strong>${item.nome}: ${item.vezes}x/semana</strong>`).join('')}
        </div>
      ` : ''}
    `;
  },

  _renderPeriodCard(period) {
    return `
      <div class="rhythm-period-card">
        <div class="rhythm-period-head">
          <strong>${period.label}</strong>
          <span>${period.doneTotal}/${period.expectedTotal} (${period.percent}%)</span>
        </div>
        <div class="rhythm-period-bar"><span style="width:${period.percent}%"></span></div>
        <div class="rhythm-period-tasks">
          ${period.tasks.length === 0 ? `
            <p class="section-desc">Sem compromissos previstos neste periodo.</p>
          ` : period.tasks.map(task => `
            <div class="rhythm-task-percent">
              <div>
                <span class="category-indicator" style="background-color:${task.color}"></span>
                <strong>${task.nome}</strong>
                <small>${task.frequencyLabel}</small>
              </div>
              <span>${task.done}/${task.expected} - ${task.percent}%</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  _expectedCountInRange(comp, start, end) {
    if (comp.frequencia_tipo === 'xVezesSemana') {
      const activeDays = RitmoView._dateRange(start, end).filter(date => FrequencyUtils.isCompActiveOnDate(comp, date)).length;
      return Math.ceil((activeDays / 7) * (comp.frequencia_vezes || 1));
    }
    return RitmoView._dateRange(start, end).filter(date => FrequencyUtils.isExpectedOnDate(comp, date)).length;
  },

  _buildWeekRanges(fromDate, toDate) {
    const ranges = [];
    const start = RitmoView._startOfWeek(fromDate);
    const end = new Date(`${toDate}T00:00:00`);
    const curr = new Date(start);
    while (curr <= end) {
      const weekStart = formatDateLocal(curr);
      const weekEndDate = new Date(curr);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      const weekEnd = formatDateLocal(weekEndDate);
      ranges.push({
        start: weekStart < fromDate ? fromDate : weekStart,
        end: weekEnd > toDate ? toDate : weekEnd,
        label: `${RitmoView._formatDateShort(weekStart)} - ${RitmoView._formatDateShort(weekEnd)}`,
      });
      curr.setDate(curr.getDate() + 7);
    }
    return ranges;
  },

  _buildMonthRanges(fromDate, toDate) {
    const ranges = [];
    const start = new Date(`${fromDate}T00:00:00`);
    start.setDate(1);
    const end = new Date(`${toDate}T00:00:00`);
    const curr = new Date(start);
    while (curr <= end) {
      const monthStart = formatDateLocal(curr);
      const monthEndDate = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);
      const monthEnd = formatDateLocal(monthEndDate);
      ranges.push({
        start: monthStart < fromDate ? fromDate : monthStart,
        end: monthEnd > toDate ? toDate : monthEnd,
        label: curr.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      });
      curr.setMonth(curr.getMonth() + 1);
    }
    return ranges;
  },

  _startOfWeek(dateStr) {
    const d = new Date(`${dateStr}T00:00:00`);
    d.setDate(d.getDate() - d.getDay());
    return d;
  },

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

  _addDays(dateStr, amount) {
    const d = new Date(`${dateStr}T00:00:00`);
    d.setDate(d.getDate() + amount);
    return formatDateLocal(d);
  },

  _formatDateShort(dateStr) {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  },

  _formatDayLabel(dateStr) {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  },

  _frequencyLabel(comp) {
    if (comp.frequencia_tipo === 'diaria') return 'Diario';
    if (comp.frequencia_tipo === 'xVezesSemana') return `${comp.frequencia_vezes || 1}x por semana`;
    if (comp.frequencia_tipo === 'diasSemana') {
      const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
      const nums = FrequencyUtils.normalizeWeekdays(comp.frequencia_dias);
      if (nums.length === 0) return 'Configuracao invalida';
      return nums.map(n => labels[n]).join(', ');
    }
    return 'Diario';
  },

  _getCompName(comps, id) {
    return comps.find(comp => comp.id === id)?.nome || 'Compromisso';
  },
};