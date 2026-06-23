// Layer 2 - Models
// CRUD for spontaneous daily wins.

import { supabase } from '../config/supabase.js';

export const VitoriaPequenaModel = {
  async listByDate(data) {
    const { data: rows, error } = await supabase
      .from('vitorias_pequenas')
      .select('*')
      .eq('data', data)
      .order('criado_em', { ascending: false });
    if (error) throw error;
    return rows;
  },

  async create({ user_id, data, conteudo }) {
    if (!conteudo?.trim()) {
      throw new Error('Escreva uma vitória pequena antes de registrar.');
    }

    const { data: row, error } = await supabase
      .from('vitorias_pequenas')
      .insert({
        user_id,
        data,
        conteudo: conteudo.trim(),
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  },

  async update(id, { conteudo }) {
    if (!conteudo?.trim()) {
      throw new Error('A vitória pequena não pode ficar vazia.');
    }

    const { data: row, error } = await supabase
      .from('vitorias_pequenas')
      .update({ conteudo: conteudo.trim() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return row;
  },

  async delete(id) {
    const { error } = await supabase
      .from('vitorias_pequenas')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
