// Layer 3 — Services
// Handles authentication via Supabase Auth.
// Only email + password sign-in is supported.
// New users must be created directly in the Supabase dashboard (Authentication → Users).

import { supabase } from '../config/supabase.js';
import { CategoriaModel } from '../models/CategoriaModel.js';
import { CORES_CATEGORIA } from '../config/constants.js';

export const AuthService = {
  /**
   * Sign in with email + password.
   */
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Create default categories on very first login (idempotent — skips if they exist)
    if (data.user) {
      await AuthService.ensureDefaultCategories(data.user.id);
    }

    return data;
  },

  /**
   * Sign out.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get current session.
   */
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  /**
   * Get current user.
   */
  async getUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  /**
   * Subscribe to auth state changes.
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },

  /**
   * Ensure default categories exist for this user.
   * Called on first login — silently skips duplicates.
   */
  async ensureDefaultCategories(userId) {
    const defaults = [
      { nome: 'Saúde',    cor: CORES_CATEGORIA[0] },
      { nome: 'Estudo',   cor: CORES_CATEGORIA[1] },
      { nome: 'Projetos', cor: CORES_CATEGORIA[2] },
      { nome: 'Relações', cor: CORES_CATEGORIA[3] },
    ];
    for (const cat of defaults) {
      try {
        await CategoriaModel.create({ ...cat, user_id: userId });
      } catch (e) {
        // Silently skip if category already exists (unique constraint)
        if (!e.message?.includes('duplicate') && !e.message?.includes('unique')) {
          console.warn('[AuthService] Could not create default category:', cat.nome, e.message);
        }
      }
    }
  },
};
