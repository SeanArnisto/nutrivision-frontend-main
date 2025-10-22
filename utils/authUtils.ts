import { useAuthStore } from '@/stores/authStore';

export const authUtils = {
  // Check if user is authenticated
  isAuthenticated: () => useAuthStore.getState().isAuthenticated,
  
  // Get current user
  getCurrentUser: () => useAuthStore.getState().user,
  
  // Get session
  getSession: () => useAuthStore.getState().session,
  
  // Quick logout
  logout: () => useAuthStore.getState().signOut(),
  
  // Check auth and return boolean
  checkAuthStatus: async () => {
    await useAuthStore.getState().checkAuth();
    return useAuthStore.getState().isAuthenticated;
  },
};