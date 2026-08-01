import { supabase } from '../config/supabaseClient';

class SupabaseAuthService {
  // Đăng nhập Google
  async signInWithGoogle(redirectTo) {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        console.error("[SUPABASE] Google login error:", error);
        throw error;
      }
      
      // Supabase sẽ tự động redirect, không cần return gì cả
      return { success: true };
    } catch (error) {
      console.error('[SUPABASE] Google login error:', error);
      return { 
        success: false, 
        error: error.message || 'Đăng nhập Google thất bại' 
      };
    }
  }

  // Lấy user hiện tại
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error("[SUPABASE] Get user error:", error);
        throw error;
      }
      
      return { user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  }

  // Lấy session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("[SUPABASE] Get session error:", error);
        throw error;
      }
      
      return { session, error: null };
    } catch (error) {
      return { session: null, error };
    }
  }

  // Đăng xuất
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("[SUPABASE] Sign out error:", error);
        throw error;
      }
      
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error };
    }
  }
}

export default new SupabaseAuthService();
