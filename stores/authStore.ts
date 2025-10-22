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
  profileComplete: boolean | null;
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
  checkProfileComplete: () => Promise<boolean>;
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
    AsyncStorage.setItem("auth_user", JSON.stringify(user));
  },

  checkProfileComplete: async () => {
    try {
      const { user } = get();
      if (!user) return false;

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
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

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
      // CRITICAL: Clear auth state FIRST before doing anything else
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        profileComplete: null,
      });

      // Clear AsyncStorage
      AsyncStorage.removeItem("auth_user");
      AsyncStorage.removeItem("auth_session");

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear nutrition stores
      // Import the stores dynamically to avoid circular dependencies
      const { useNutritionIntakeStore, fetchNutritionAverage } = await import("@/stores/nutritionIntakeStore");
      
      // Clear nutrition intake data and history
      useNutritionIntakeStore.getState().clearNutritionData();
      useNutritionIntakeStore.getState().clearNutritionalHistory();
      
      // Clear nutrition average data
      fetchNutritionAverage.getState().clearNutritionData();

      console.log("✅ All user data cleared on logout");
      
      // Reset navigation to login screen
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