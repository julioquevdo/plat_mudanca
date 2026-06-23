// Layer 2 — Models
// Pure CRUD for 'compromissos' table. No business logic here.

import { supabase } from '../config/supabase.js';

export const CompromissoModel = {
  /**
   * List all active commitments for the current user, ordered by priority
   * (1 = highest priority, shown first).
   */
  async listAll() {
    const { data, error } = await supabase
      .from('compromissos')
      .select('*, categorias(id, nome, cor)')
      .eq('ativo', true)
      .order('prioridade', { ascending: true, nullsFirst: false })
      .order('criado_em', { ascending: true });
    if (error) throw error;
    return data;
  },

  /**
   * Get a single commitment by ID.
   */
  async getById(id) {
    const { data, error } = await supabase
      .from('compromissos')
      .select('*, categorias(id, nome, cor)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Create a new commitment.
   * Validates that unidade_minima is present before sending to DB.
   */
  async create(payload) {
    if (!payload.unidade_minima?.trim()) {
      throw new Error('RN01.1: unidade_minima é obrigatória.');
    }
    const { data, error } = await supabase
      .from('compromissos')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Update a commitment. Only allowed during the revisao window.
   * The Controller is responsible for enforcing the window;
   * this model does the raw update.
   */
  async update(id, payload) {
    if (payload.unidade_minima !== undefined && !payload.unidade_minima?.trim()) {
      throw new Error('RN01.1: unidade_minima não pode ser vazia.');
    }
    const { data, error } = await supabase
      .from('compromissos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Soft-delete: sets ativo = false instead of deleting.
   */
  async deactivate(id) {
    const { error } = await supabase
      .from('compromissos')
      .update({ ativo: false })
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Update streak and XP fields after a check is saved.
   * XP never decreases (RN04.2).
   */
  async updateStreakXP(id, { streak_atual, streak_estado, xp_total }) {
    const { data, error } = await supabase
      .from('compromissos')
      .update({ streak_atual, streak_estado, xp_total })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Pause a commitment until a given date.
   * pausado_ate is required (RN09.1).
   */
  async pause(id, pausadoAte) {
    if (!pausadoAte) throw new Error('RN09.1: data de retomada é obrigatória para pausar.');
    const { error } = await supabase
      .from('compromissos')
      .update({ pausado_ate: pausadoAte })
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Resume a paused commitment.
   */
  async resume(id) {
    const { error } = await supabase
      .from('compromissos')
      .update({ pausado_ate: null })
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Persist a new priority order after drag-and-drop reordering.
   * `ranking` = array of { id, prioridade } pairs (1 = highest priority).
   * This never touches xp_total or streak fields — only the rank used
   * to weight future XP gains (RN: XP never decreases retroactively).
   */
  async updatePrioridades(ranking) {
    const updates = ranking.map(({ id, prioridade }) =>
      supabase.from('compromissos').update({ prioridade }).eq('id', id)
    );
    const results = await Promise.all(updates);
    const failed = results.find(r => r.error);
    if (failed) throw failed.error;
    return true;
  },
};