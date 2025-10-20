import { create } from "zustand";
import { supabase } from "@/config/supabase";
import { useAuthStore } from "@/stores/authStore";
import { getNutritionalHistory } from "@/hooks/store";

interface NutritionIntakeData {
  avg_carbs: number;
  avg_protein: number;
  avg_sodium: number;
  avg_calories: number;
}

interface AverageIntakeData {
  minCarbs: number;
  maxCarbs: number;
  minSodium: number;
  maxSodium: number;
  minProtein: number;
  maxProtein: number;
  minCalories: number;
  maxCalories: number;
}

interface NutritionalRecord {
  id: string;
  user_id: string;
  calories?: number;
  carbohydrates?: number;
  protein?: number;
  sodium?: number;
  created_at: string;
  nutritional_images?: Array<{
    image_url: string;
    image_order: number;
  }>;
}

interface NutritionApiResponse {
  status: string;
  age_range: [number, number];
  height_range: [number, number];
  weight_range: [number, number];
  nutrition_range: {
    carbs: [number, number];
    protein: [number, number];
    sodium: [number, number];
    calories: [number, number];
  };
}

interface NutritionIntakeState {
  nutritionData: NutritionIntakeData | null;
  nutritionalHistory: NutritionalRecord[];
  isLoading: boolean;
  isHistoryLoading: boolean;
  error: string | null;
  historyError: string | null;
  currentUserId: string | null;

  fetchNutritionIntake: () => Promise<void>;
  fetchNutritionalHistory: (days?: number) => Promise<void>;
  clearNutritionData: () => void;
  clearNutritionalHistory: () => void;
  resetAllData: () => void;
}

interface AverageIntakeState {
  nutritionDataAve: AverageIntakeData | null;
  isLoading: boolean;
  error: string | null;
  currentUserId: string | null;

  fetchNutritionIntakeAve: () => Promise<void>;
  updateNutritionIntakeAve: () => Promise<void>;
  clearNutritionData: () => void;
  resetAllData: () => void;
}

export const fetchNutritionAverage = create<AverageIntakeState>((set, get) => ({
  nutritionDataAve: null,
  isLoading: false,
  error: null,
  currentUserId: null,

  fetchNutritionIntakeAve: async () => {
    try {
      set({ isLoading: true, error: null });

      // Get auth state
      const authState = useAuthStore.getState();
      if (!authState) {
        console.log("Auth store not initialized");
        set({ isLoading: false, error: null });
        return;
      }

      const { user, profileComplete } = authState;

      if (!user) {
        console.log("No authenticated user found");
        set({ isLoading: false, error: null });
        return;
      }

      // Check if user changed
      const { currentUserId } = get();
      if (currentUserId && currentUserId !== user.id) {
        console.log("User changed, clearing nutrition average data");
        get().resetAllData();
      }

      set({ currentUserId: user.id });

      if (profileComplete === false) {
        console.log("Profile not complete, skipping nutrition intake fetch");
        set({ isLoading: false, error: null });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("height, weight, age")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("User profile not found or incomplete");
      }

      if (!profile.height || !profile.weight || !profile.age) {
        throw new Error(
          "User profile is missing required data (height, weight, age)"
        );
      }

      const apiResponse = await fetch(
        "https://pel1-recommendation.hf.space/get-nutrition-range",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            height: profile.height,
            weight: profile.weight,
            age: profile.age,
          }),
        }
      );

      if (!apiResponse.ok) {
        throw new Error(`API request failed: ${apiResponse.status}`);
      }

      const nutritionResponse: NutritionApiResponse = await apiResponse.json();

      if (nutritionResponse.status !== "success") {
        throw new Error("API returned unsuccessful status");
      }

      if (!nutritionResponse.nutrition_range) {
        throw new Error("API response missing nutrition_range");
      }

      const nutritionDataAve: AverageIntakeData = {
        minCarbs: nutritionResponse.nutrition_range.carbs?.[0] ?? 0,
        maxCarbs: nutritionResponse.nutrition_range.carbs?.[1] ?? 0,
        minProtein: nutritionResponse.nutrition_range.protein?.[0] ?? 0,
        maxProtein: nutritionResponse.nutrition_range.protein?.[1] ?? 0,
        minSodium: nutritionResponse.nutrition_range.sodium?.[0] ?? 0,
        maxSodium: nutritionResponse.nutrition_range.sodium?.[1] ?? 0,
        minCalories: nutritionResponse.nutrition_range.calories?.[0] ?? 0,
        maxCalories: nutritionResponse.nutrition_range.calories?.[1] ?? 0
      };

      set({
        nutritionDataAve,
        isLoading: false,
      });
    } catch (error: any) {
      console.error("Nutrition average fetch error:", error);

      const isNetworkError =
        error.message &&
        (error.message.includes("Network request failed") ||
          error.message.includes("fetch") ||
          error.name === "TypeError");

      if (isNetworkError) {
        console.log("Network error detected - setting silent error flag");
        set({
          error: "Network request failed",
          isLoading: false,
        });
      } else {
        set({
          error: error.message || "Failed to fetch nutrition average data",
          isLoading: false,
        });
      }
    }
  },

  updateNutritionIntakeAve: async () => {
    try {
      set({ isLoading: true, error: null });

      // Get auth state
      const authState = useAuthStore.getState();
      if (!authState) {
        console.log("Auth store not initialized");
        set({ isLoading: false, error: null });
        return;
      }

      const { user, profileComplete } = authState;

      if (!user || profileComplete === false) {
        console.log("❌ no authenticated user or user's profile isnt complete");
        set({ isLoading: false, error: "System did not find any record." });
        return;
      }

      // 🔥 CHECK: Don't update if data is manual
      const { data: existingIntake, error: checkError } = await supabase
        .from("user_nutrition_intake")
        .select("is_manual")
        .eq("user_id", user.id)
        .single();

      if (existingIntake && existingIntake.is_manual === true) {
        console.log("⚠️ Cannot update - user has manual nutrition data");
        set({
          isLoading: false,
          error: "Cannot update manually entered nutrition data. Please update manually in settings."
        });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("height, weight, age")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        set({
          isLoading: false,
          error: "User has no profile, please check back",
        });
        return;
      }

      if (!profile.height || !profile.weight || !profile.age) {
        set({
          isLoading: false,
          error:
            "User demographic is incomplete, please finish the onboarding first.",
        });
        return;
      }

      const apiResponse = await fetch(
        "https://pel1-recommendation.hf.space/get-nutrition-range",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            height: profile.height,
            weight: profile.weight,
            age: profile.age,
          }),
        }
      );

      if (!apiResponse.ok) {
        throw new Error(`API request failed: ${apiResponse.status}`);
      }

      const nutritionResponse: NutritionApiResponse = await apiResponse.json();

      if (nutritionResponse.status !== "success") {
        throw new Error("API returned unsuccessful status");
      }

      if (!nutritionResponse.nutrition_range) {
        throw new Error("API response missing nutrition_range");
      }

      const nutritionDataAve: AverageIntakeData = {
        minCarbs: nutritionResponse.nutrition_range.carbs?.[0] ?? 0,
        maxCarbs: nutritionResponse.nutrition_range.carbs?.[1] ?? 0,
        minProtein: nutritionResponse.nutrition_range.protein?.[0] ?? 0,
        maxProtein: nutritionResponse.nutrition_range.protein?.[1] ?? 0,
        minSodium: nutritionResponse.nutrition_range.sodium?.[0] ?? 0,
        maxSodium: nutritionResponse.nutrition_range.sodium?.[1] ?? 0,
        minCalories: nutritionResponse.nutrition_range.calories?.[0] ?? 0,
        maxCalories: nutritionResponse.nutrition_range.calories?.[1] ?? 0
      };

      const averageCarb =
        (nutritionDataAve.minCarbs + nutritionDataAve.maxCarbs) / 2;
      const averageSodium =
        (nutritionDataAve.minSodium + nutritionDataAve.maxSodium) / 2;
      const averageProtein =
        (nutritionDataAve.minProtein + nutritionDataAve.maxProtein) / 2;
      const averageCalories =
        (nutritionDataAve.minCalories + nutritionDataAve.maxCalories) / 2;

      // Only update if NOT manual
      const { data, error } = await supabase
        .from("user_nutrition_intake")
        .update({
          avg_carbs: averageCarb,
          avg_sodium: averageSodium,
          avg_protein: averageProtein,
          avg_calories: averageCalories,
          is_manual: false,  // 🔥 Ensure it's marked as calculated
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.log("❌ Failed updating in supabase", error);
      } else {
        console.log("✔️ user nutrition updated!");
      }
    } catch (error: any) {
      console.log("❗Update error", error);
      set({
        error: error.message || "Failed to update nutrition intake",
        isLoading: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  clearNutritionData: () => {
    set({
      nutritionDataAve: null,
      error: null,
    });
  },

  resetAllData: () => {
    set({
      nutritionDataAve: null,
      isLoading: false,
      error: null,
      currentUserId: null,
    });
  },
}));

export const useNutritionIntakeStore = create<NutritionIntakeState>(
  (set, get) => ({
    nutritionData: null,
    nutritionalHistory: [],
    isLoading: false,
    isHistoryLoading: false,
    error: null,
    historyError: null,
    currentUserId: null,

    fetchNutritionIntake: async () => {
      try {
        set({ isLoading: true, error: null });

        // Get auth state
        const authState = useAuthStore.getState();
        if (!authState) {
          console.log("Auth store not initialized");
          set({ isLoading: false, error: null });
          return;
        }

        const { user, profileComplete } = authState;

        if (!user) {
          console.log("No authenticated user found");
          set({ isLoading: false, error: null });
          return;
        }

        // Check if user changed
        const { currentUserId } = get();
        if (currentUserId && currentUserId !== user.id) {
          console.log("User changed, clearing nutrition intake data");
          get().resetAllData();
        }

        set({ currentUserId: user.id });

        if (profileComplete === false) {
          console.log("Profile not complete, skipping nutrition intake fetch");
          set({ isLoading: false, error: null });
          return;
        }

        // Check if user already has nutrition intake data
        // 🔥 CRITICAL: Also select is_manual field
        const { data: existingIntake, error: intakeError } = await supabase
          .from("user_nutrition_intake")
          .select("avg_carbs, avg_protein, avg_sodium, avg_calories, is_manual")
          .eq("user_id", user.id)
          .single();

        // 🔥 PROTECTION: If data is manually entered, NEVER recalculate
        if (existingIntake && !intakeError && existingIntake.is_manual === true) {
          console.log("✅ Manual nutrition data detected - protecting from recalculation");
          set({
            nutritionData: {
              avg_carbs: existingIntake.avg_carbs,
              avg_protein: existingIntake.avg_protein,
              avg_sodium: existingIntake.avg_sodium,
              avg_calories: existingIntake.avg_calories || 0,
            },
            isLoading: false,
          });
          return; // Stop here - manual data is sacred!
        }

        // If data exists but is NOT manual, use it (allow future updates)
        if (existingIntake && !intakeError) {
          console.log("ℹ️ Using existing calculated nutrition data");
          set({
            nutritionData: {
              avg_carbs: existingIntake.avg_carbs,
              avg_protein: existingIntake.avg_protein,
              avg_sodium: existingIntake.avg_sodium,
              avg_calories: existingIntake.avg_calories || 0,
            },
            isLoading: false,
          });
          return;
        }

        // No existing data - calculate from profile
        console.log("📊 No nutrition data found - calculating from profile");
        
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("height, weight, age")
          .eq("user_id", user.id)
          .single();

        if (profileError || !profile) {
          throw new Error("User profile not found or incomplete");
        }

        if (!profile.height || !profile.weight || !profile.age) {
          throw new Error(
            "User profile is missing required data (height, weight, age)"
          );
        }

        const apiResponse = await fetch(
          "https://pel1-recommendation.hf.space/get-nutrition-range",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              height: profile.height,
              weight: profile.weight,
              age: profile.age,
            }),
          }
        );

        if (!apiResponse.ok) {
          throw new Error(`API request failed: ${apiResponse.status}`);
        }

        const nutritionResponse: NutritionApiResponse =
          await apiResponse.json();

        if (nutritionResponse.status !== "success") {
          throw new Error("API returned unsuccessful status");
        }

        const avgCarbs =
          (nutritionResponse.nutrition_range.carbs[0] +
            nutritionResponse.nutrition_range.carbs[1]) /
          2;
        const avgProtein =
          (nutritionResponse.nutrition_range.protein[0] +
            nutritionResponse.nutrition_range.protein[1]) /
          2;
        const avgSodium =
          (nutritionResponse.nutrition_range.sodium[0] +
            nutritionResponse.nutrition_range.sodium[1]) /
          2;
        const avgCalories =
          (nutritionResponse.nutrition_range.calories[0] +
            nutritionResponse.nutrition_range.calories[1]) /
          2;

        // 🔥 IMPORTANT: Mark calculated data as NOT manual
        const { data: savedData, error: saveError } = await supabase
          .from("user_nutrition_intake")
          .insert({
            user_id: user.id,
            avg_carbs: avgCarbs,
            avg_protein: avgProtein,
            avg_sodium: avgSodium,
            avg_calories: avgCalories,
            is_manual: false,  // 🔥 Mark as calculated (not manual)
          })
          .select()
          .single();

        if (saveError) {
          throw new Error(
            `Failed to save nutrition data: ${saveError.message}`
          );
        }

        console.log("✅ Calculated nutrition data saved successfully");

        set({
          nutritionData: {
            avg_carbs: avgCarbs,
            avg_protein: avgProtein,
            avg_sodium: avgSodium,
            avg_calories: avgCalories
          },
          isLoading: false,
        });
      } catch (error: any) {
        console.error("Nutrition intake fetch error:", error);
        set({
          error: error.message || "Failed to fetch nutrition intake data",
          isLoading: false,
        });
      }
    },

    fetchNutritionalHistory: async (days = 30) => {
      try {
        set({ isHistoryLoading: true, historyError: null });

        // Get auth state
        const authState = useAuthStore.getState();
        if (!authState) {
          console.log("Auth store not initialized");
          set({ isHistoryLoading: false, historyError: null });
          return;
        }

        const { user } = authState;

        if (!user) {
          console.log("No authenticated user found");
          set({ isHistoryLoading: false, historyError: null });
          return;
        }

        // Check if user changed
        const { currentUserId } = get();
        if (currentUserId && currentUserId !== user.id) {
          console.log("User changed, clearing nutritional history");
          get().clearNutritionalHistory();
        }

        console.log(`Fetching ${days} days of nutritional history...`);
        const result = await getNutritionalHistory(days);

        if (result.success) {
          console.log(`History loaded: ${result.data?.length || 0} records`);
          set({
            nutritionalHistory: result.data || [],
            isHistoryLoading: false,
          });
        } else {
          console.error("History fetch failed:", result.error);
          set({
            historyError: result.error || "Failed to load nutritional data",
            isHistoryLoading: false,
          });
        }
      } catch (error: any) {
        console.error("Nutritional history fetch error:", error);

        const isNetworkError =
          error.message &&
          (error.message.includes("Network request failed") ||
            error.message.includes("fetch") ||
            error.name === "TypeError");

        if (isNetworkError) {
          console.log(
            "Network error detected in history fetch - setting silent error flag"
          );
          set({
            historyError: "Network request failed",
            isHistoryLoading: false,
          });
        } else {
          set({
            historyError:
              error.message || "Failed to fetch nutritional history",
            isHistoryLoading: false,
          });
        }
      }
    },

    clearNutritionData: () => {
      set({
        nutritionData: null,
        error: null,
      });
    },

    clearNutritionalHistory: () => {
      set({
        nutritionalHistory: [],
        historyError: null,
      });
    },

    resetAllData: () => {
      set({
        nutritionData: null,
        nutritionalHistory: [],
        isLoading: false,
        isHistoryLoading: false,
        error: null,
        historyError: null,
        currentUserId: null,
      });
    },
  })
);

// Helper hook for easier usage
export const useNutritionIntake = () => {
  const store = useNutritionIntakeStore();

  return {
    ...store,
    hasNutritionData: !!store.nutritionData,
    hasNutritionalHistory: store.nutritionalHistory.length > 0,
  };
};

// Helper hook for nutrition average
export const useNutritionAverage = () => {
  const store = fetchNutritionAverage();

  return {
    ...store,
    hasNutritionData: !!store.nutritionDataAve,
  };
};