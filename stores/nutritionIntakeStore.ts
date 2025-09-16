import { create } from "zustand";
import { supabase } from "@/config/supabase";
import { useAuthStore } from "@/stores/authStore";
import { getNutritionalHistory } from "@/hooks/store"; // Import your existing utility

interface NutritionIntakeData {
  avg_carbs: number;
  avg_protein: number;
  avg_sodium: number;
}

interface AverageIntakeData {
  minCarbs: number;
  maxCarbs: number;
  minSodium: number;
  maxSodium: number;
  minProtein: number;
  maxProtein: number;
}

// Add interface for nutritional record (from your store file)
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
  };
}

interface UserProfile {
  height: number;
  weight: number;
  age: number;
}

interface NutritionIntakeState {
  nutritionData: NutritionIntakeData | null;
  nutritionalHistory: NutritionalRecord[]; // Add nutritional history
  isLoading: boolean;
  isHistoryLoading: boolean; // Separate loading state for history
  error: string | null;
  historyError: string | null; // Separate error state for history

  // Actions
  fetchNutritionIntake: () => Promise<void>;
  fetchNutritionalHistory: (days?: number) => Promise<void>; // Add history fetching
  clearNutritionData: () => void;
  clearNutritionalHistory: () => void; // Add history clearing
}

// Keep existing AverageIntakeState interface unchanged
interface AverageIntakeState {
  nutritionDataAve: AverageIntakeData | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNutritionIntakeAve: () => Promise<void>;
  clearNutritionData: () => void;
}

export const fetchNutritionAverage = create<AverageIntakeState>((set, get) => ({
  nutritionDataAve: null,
  isLoading: false,
  error: null,

  fetchNutritionIntakeAve: async () => {
    try {
      set({ isLoading: true, error: null });

      const { user, profileComplete } = useAuthStore.getState();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      if (profileComplete === false) {
        console.log("Profile not complete, skipping nutrition intake fetch");
        set({
          isLoading: false,
          error: null,
        });
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

      // Call nutrition API
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

      const nutritionDataAve: AverageIntakeData = {
        minCarbs: nutritionResponse.nutrition_range.carbs[0],
        maxCarbs: nutritionResponse.nutrition_range.carbs[1],
        minProtein: nutritionResponse.nutrition_range.protein[0],
        maxProtein: nutritionResponse.nutrition_range.protein[1],
        minSodium: nutritionResponse.nutrition_range.sodium[0],
        maxSodium: nutritionResponse.nutrition_range.sodium[1],
      };

      set({
        nutritionDataAve,
        isLoading: false,
      });
    } catch (error: any) {
      console.error("Nutrition average fetch error:", error);

      // Check if it's a network error
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

  clearNutritionData: () => {
    set({
      nutritionDataAve: null,
      error: null,
    });
  },
}));

export const useNutritionIntakeStore = create<NutritionIntakeState>(
  (set, get) => ({
    nutritionData: null,
    nutritionalHistory: [], // Initialize as empty array
    isLoading: false,
    isHistoryLoading: false,
    error: null,
    historyError: null,

    fetchNutritionIntake: async () => {
      try {
        set({ isLoading: true, error: null });

        // Get current user
        const { user, profileComplete } = useAuthStore.getState();
        if (!user) {
          throw new Error("No authenticated user found");
        }

         if (profileComplete === false) {
        console.log("Profile not complete, skipping nutrition intake fetch");
        set({
          isLoading: false,
          error: null,
        });
        return;
      }

        // Check if user already has nutrition intake data
        const { data: existingIntake, error: intakeError } = await supabase
          .from("user_nutrition_intake")
          .select("avg_carbs, avg_protein, avg_sodium")
          .eq("user_id", user.id)
          .single();

        if (existingIntake && !intakeError) {
          // User already has nutrition data, use existing
          set({
            nutritionData: {
              avg_carbs: existingIntake.avg_carbs,
              avg_protein: existingIntake.avg_protein,
              avg_sodium: existingIntake.avg_sodium,
            },
            isLoading: false,
          });
          return;
        }

        // User doesn't have nutrition data, get profile data and call API
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

        // Call nutrition API
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

        // Calculate averages from the ranges
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

        // Store in Supabase
        const { data: savedData, error: saveError } = await supabase
          .from("user_nutrition_intake")
          .insert({
            user_id: user.id,
            avg_carbs: avgCarbs,
            avg_protein: avgProtein,
            avg_sodium: avgSodium,
          })
          .select()
          .single();

        if (saveError) {
          throw new Error(
            `Failed to save nutrition data: ${saveError.message}`
          );
        }

        // Update store with the new data
        set({
          nutritionData: {
            avg_carbs: avgCarbs,
            avg_protein: avgProtein,
            avg_sodium: avgSodium,
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

    // Add new function to fetch nutritional history using your existing utility
    fetchNutritionalHistory: async (days = 30) => {
      try {
        set({ isHistoryLoading: true, historyError: null });

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

        // Check if it's a network error
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
