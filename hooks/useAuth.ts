import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';
import { supabase } from '@/config/supabase';

export const useAuth = () => {
  const store = useAuthStore();

  // Check auth status on mount
  useEffect(() => {
    store.checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        
        if (event === 'SIGNED_IN' && session) {
          store.setSession(session);
        } else if (event === 'SIGNED_OUT') {
          store.clearAuth();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return store;
};