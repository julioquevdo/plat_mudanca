// Layer 3 — Services

import { todayLocal } from '../config/dateUtils.js';
// CSV export of commitment history and diary entries (US13).

export const ExportService = {
  /**
   * Export checks as CSV.
   * @param {Array} checks - Array of check objects with joined compromisso name
   * @param {Array} compromissos - Array of compromisso objects
   */
  exportChecksCSV(checks, compromissos) {
    const compMap = Object.fromEntries(compromissos.map(c => [c.id, c.nome]));
    const headers = ['data', 'compromisso', 'status', 'contexto', 'sensacao'];
    const rows = checks.map(c => [
      c.data,
      compMap[c.compromisso_id] ?? c.compromisso_id,
      c.status,
      c.contexto ?? '',
      c.sensacao ?? '',
    ]);
    ExportService._download(
      ExportService._buildCSV(headers, rows),
      `compromissos_historico_${todayLocal()}.csv`,
    );
  },

  /**
   * Export diary entries as CSV.
   */
  exportDiarioCSV(entries) {
    const headers = ['data', 'conteudo'];
    const rows = entries.map(e => [e.data, e.conteudo]);
    ExportService._download(
      ExportService._buildCSV(headers, rows),
      `diario_${todayLocal()}.csv`,
    );
  },

  _buildCSV(headers, rows) {
    const escape = val => `"${String(val).replace(/"/g, '""')}"`;
    const lines = [
      headers.map(escape).join(','),
      ...rows.map(row => row.map(escape).join(',')),
    ];
    return lines.join('\n');
  },

  _download(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};
