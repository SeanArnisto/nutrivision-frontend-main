import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/config/supabase";
import { reset } from "@/navigation/navigationRef";
import { Alert } from "react-native";

interface User {
  id: string;
  email?: string;
  user_metadata?: any;
}

interface AuthState {
  user: User | null;
  session: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  profileComplete: boolean | null; // Add this
  signUp: (
    email: string,
    password: string
  ) => Promise<{ data: any; error: any }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  checkProfileComplete: () => Promise<boolean>; // Add this
  setUser: (user: User | null) => void;
  setSession: (session: any) => void;
  resetPasswordInApp: (newPassword: string) => Promise<{ error: any | null }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  profileComplete: null,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
    // Manual persistence
    AsyncStorage.setItem("auth_user", JSON.stringify(user));
  },

  checkProfileComplete: async () => {
    try {
      const { user } = get();
      if (!user) return false;

      // Check if user has profile data in the profiles table
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("name, age, height, weight, gender")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error checking profile:", error);
        set({ profileComplete: false });
        return false;
      }

      // Check if all required fields are present
      const hasRequiredFields =
        profile &&
        profile.name &&
        profile.age &&
        profile.height &&
        profile.weight &&
        profile.gender;

      const isComplete = !!hasRequiredFields;
      set({ profileComplete: isComplete });
      return isComplete;
    } catch (error) {
      console.error("Profile check error:", error);
      set({ profileComplete: false });
      return false;
    }
  },

  resetPasswordInApp: async (newPassword: string) => {
    try {
      // You might want to set loading state here if you have it
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Sign out the user after successful password change
      await get().signOut();
      
      Alert.alert('Success', 'Password updated successfully! You have been logged out for security.');
      return { error: null };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { error: { message: error.message } };
    }
  },

  setSession: (session) => {
    set({
      session,
      user: session?.user || null,
      isAuthenticated: !!session?.user,
    });
    // Manual persistence
    //AsyncStorage.setItem("auth_session", JSON.stringify(session));

    // Check profile completion when setting session
    if (session?.user) {
      get().checkProfileComplete();
    }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (data.session && !error) {
        get().setSession(data.session);
        // Check profile completion after successful login
        await get().checkProfileComplete();
      }

      return { data, error };
    } catch (error) {
      return { data: null, error };
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        profileComplete: null,
      });
      AsyncStorage.removeItem("auth_user");
      AsyncStorage.removeItem("auth_session");
      
      // Reset navigation to prevent going back to authenticated pages
      reset('login');
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // First check AsyncStorage
      const storedUser = await AsyncStorage.getItem("auth_user");
      const storedSession = await AsyncStorage.getItem("auth_session");

      if (storedUser && storedSession) {
        const user = JSON.parse(storedUser);
        const session = JSON.parse(storedSession);
        set({
          user,
          session,
          isAuthenticated: true,
        });
      }

      // Then check Supabase for fresh session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (session && !error) {
        get().setSession(session);
      } else {
        set({
          session: null,
          user: null,
          isAuthenticated: false,
        });
        AsyncStorage.removeItem("auth_user");
        AsyncStorage.removeItem("auth_session");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      set({
        session: null,
        user: null,
        isAuthenticated: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },
}));
