// Layer 2 — Models
// Pure CRUD for 'diario' (daily free-text journal) table.

import { supabase } from '../config/supabase.js';
import { MAX_CHARS_DIARIO } from '../config/constants.js';

export const DiarioModel = {
  /**
   * Save a diary entry for today (upsert — one per day).
   */
  async saveToday({ user_id, data, conteudo }) {
    if (conteudo.length > MAX_CHARS_DIARIO) {
      throw new Error(`Diário limitado a ${MAX_CHARS_DIARIO} caracteres.`);
    }
    const { data: result, error } = await supabase
      .from('diario')
      .upsert({ user_id, data, conteudo }, { onConflict: 'user_id,data' })
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  /**
   * Get today's entry if it exists.
   */
  async getToday(today) {
    const { data, error } = await supabase
      .from('diario')
      .select('*')
      .eq('data', today)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /**
   * List diary entries for a date range (for export).
   */
  async listByDateRange(from, to) {
    const { data, error } = await supabase
      .from('diario')
      .select('*')
      .gte('data', from)
      .lte('data', to)
      .order('data', { ascending: false });
    if (error) throw error;
    return data;
  },
};
