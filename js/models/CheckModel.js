// Layer 2 — Models
// Pure CRUD for 'checks' table.
// IMPORTANT: save() uses UPSERT — required by RF03.2 (retroactive check correction)
// and by the UNIQUE(compromisso_id, data) constraint.

import { supabase } from '../config/supabase.js';

export const CheckModel = {
  /**
   * Save a check for a given commitment + date.
   * Uses UPSERT on (compromisso_id, data) to support retroactive corrections (RF03.2).
   */
  async save({ compromisso_id, user_id, data, status, contexto, sensacao, dia_ruim }) {
    const payload = {
      compromisso_id,
      user_id,
      data,
      status,
      contexto: contexto ?? null,
      sensacao: sensacao ?? null,
      dia_ruim: dia_ruim ?? false,
    };
    const { data: result, error } = await supabase
      .from('checks')
      .upsert(payload, { onConflict: 'compromisso_id,data' })
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  /**
   * Get all checks for a commitment, ordered by date descending.
   */
  async listByCompromisso(compromisso_id, { limit } = {}) {
    let query = supabase
      .from('checks')
      .select('*')
      .eq('compromisso_id', compromisso_id)
      .order('data', { ascending: false });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * Get checks for a user within a date range (for history views).
   */
  async listByDateRange(user_id, from, to) {
    const { data, error } = await supabase
      .from('checks')
      .select('*, compromissos(id, nome, categoria_id)')
      .eq('user_id', user_id)
      .gte('data', from)
      .lte('data', to)
      .order('data', { ascending: false });
    if (error) throw error;
    return data;
  },

  /**
   * Get today's check for a specific commitment.
   */
  async getTodayCheck(compromisso_id, today) {
    const { data, error } = await supabase
      .from('checks')
      .select('*')
      .eq('compromisso_id', compromisso_id)
      .eq('data', today)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async countCumpridosByUser(user_id) {
    const { count, error } = await supabase
      .from('checks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('status', 'cumprido');
    if (error) throw error;
    return count ?? 0;
  },

  /**
   * Get checks for the last N days for a commitment.
   */
  async listRecent(compromisso_id, days = 90) {
    const from = new Date();
    from.setDate(from.getDate() - days);
    const fromStr = from.toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('checks')
      .select('*')
      .eq('compromisso_id', compromisso_id)
      .gte('data', fromStr)
      .order('data', { ascending: true });
    if (error) throw error;
    return data;
  },
};
