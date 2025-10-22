// stores/userProfileStore.ts
import { create } from "zustand";
import { supabase } from "@/config/supabase";
import { useAuthStore } from "@/stores/authStore";

interface UserProfile {
  id: string;
  name: string | null;
  age: number | null;
  weight: number | null;
  height: number | null;
  gender: string | null;
}

interface UserProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  currentUserId: string | null;

  fetchUserProfile: () => Promise<void>;
  clearProfileData: () => void;
  resetAllData: () => void;
  calculateBMI: () => number | null;
  getBMICategory: () => string;
}

export const useUserProfileStore = create<UserProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,
  currentUserId: null,

  fetchUserProfile: async () => {
    try {
      set({ isLoading: true, error: null });

      // Get auth state
      const authState = useAuthStore.getState();
      if (!authState) {
        console.log("Auth store not initialized");
        set({ isLoading: false, error: null });
        return;
      }

      const { user } = authState;

      if (!user) {
        console.log("No authenticated user found");
        set({ isLoading: false, error: null });
        return;
      }

      // Check if user changed
      const { currentUserId } = get();
      if (currentUserId && currentUserId !== user.id) {
        console.log("User changed, clearing profile data");
        get().resetAllData();
      }

      // Fetch user profile directly from Supabase
      console.log("🔄 Fetching profile for user:", user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, age, weight, height, gender")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("❌ Supabase profile error:", profileError);
        throw new Error(`Failed to fetch profile: ${profileError.message}`);
      }

      if (!profile) {
        console.error("❌ No profile data returned");
        throw new Error("User profile not found in database");
      }

      console.log("✅ Raw profile from DB:", {
        id: profile.id,
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
      });

      // Parse numeric values properly
      const userProfile: UserProfile = {
        id: profile.id,
        name: profile.name || null,
        age: profile.age ? parseInt(profile.age) : null,
        weight: profile.weight ? Number(profile.weight) : null,
        height: profile.height ? Number(profile.height) : null,
        gender: profile.gender || null,
      };

      console.log("✅ Parsed profile:", {
        weight: userProfile.weight,
        height: userProfile.height,
        age: userProfile.age,
      });

      set({
        profile: userProfile,
        isLoading: false,
        currentUserId: user.id,
      });
    } catch (error: any) {
      console.error("❌ Profile fetch error:", error.message);
      set({
        error: error.message || "Failed to fetch user profile",
        isLoading: false,
      });
    }
  },

  calculateBMI: () => {
    const { profile } = get();
    
    if (!profile) {
      console.log("❌ No profile available for BMI calculation");
      return null;
    }

    if (!profile.weight || !profile.height) {
      console.log("❌ Missing weight or height:", {
        weight: profile.weight,
        height: profile.height,
      });
      return null;
    }

    const heightInMeters = profile.height / 100;
    const bmi = parseFloat((profile.weight / Math.pow(heightInMeters, 2)).toFixed(4));

    
    console.log("✅ BMI calculated:", {
      weight: profile.weight,
      height: profile.height,
      bmi,
    });

    return bmi;
  },

  getBMICategory: () => {
    const { calculateBMI } = get();
    const bmi = calculateBMI();
    
    if (!bmi) return "Unknown";
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obese";
  },

  clearProfileData: () => {
    set({
      profile: null,
      error: null,
    });
  },

  resetAllData: () => {
    set({
      profile: null,
      isLoading: false,
      error: null,
      currentUserId: null,
    });
  },
}));