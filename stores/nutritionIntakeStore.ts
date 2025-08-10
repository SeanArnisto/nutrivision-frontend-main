import { create } from 'zustand';
import { supabase } from '@/config/supabase';
import { useAuthStore } from '@/stores/authStore';

interface NutritionIntakeData {
  avg_carbs: number;
  avg_protein: number;
  avg_sodium: number;
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
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchNutritionIntake: () => Promise<void>;
  clearNutritionData: () => void;
}

export const useNutritionIntakeStore = create<NutritionIntakeState>((set, get) => ({
  nutritionData: null,
  isLoading: false,
  error: null,

  fetchNutritionIntake: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Get current user
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Check if user already has nutrition intake data
      const { data: existingIntake, error: intakeError } = await supabase
        .from('user_nutrition_intake')
        .select('avg_carbs, avg_protein, avg_sodium')
        .eq('user_id', user.id)
        .single();

      if (existingIntake && !intakeError) {
        // User already has nutrition data, use existing
        set({ 
          nutritionData: {
            avg_carbs: existingIntake.avg_carbs,
            avg_protein: existingIntake.avg_protein,
            avg_sodium: existingIntake.avg_sodium,
          },
          isLoading: false 
        });
        return;
      }

      // User doesn't have nutrition data, get profile data and call API
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('height, weight, age')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('User profile not found or incomplete');
      }

      if (!profile.height || !profile.weight || !profile.age) {
        throw new Error('User profile is missing required data (height, weight, age)');
      }

      // Call nutrition API
      const apiResponse = await fetch('https://pel1-recommendation.hf.space/get-nutrition-range', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          height: profile.height,
          weight: profile.weight,
          age: profile.age,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error(`API request failed: ${apiResponse.status}`);
      }

      const nutritionResponse: NutritionApiResponse = await apiResponse.json();

      if (nutritionResponse.status !== 'success') {
        throw new Error('API returned unsuccessful status');
      }

      // Calculate averages from the ranges
      const avgCarbs = (nutritionResponse.nutrition_range.carbs[0] + nutritionResponse.nutrition_range.carbs[1]) / 2;
      const avgProtein = (nutritionResponse.nutrition_range.protein[0] + nutritionResponse.nutrition_range.protein[1]) / 2;
      const avgSodium = (nutritionResponse.nutrition_range.sodium[0] + nutritionResponse.nutrition_range.sodium[1]) / 2;

      // Store in Supabase
      const { data: savedData, error: saveError } = await supabase
        .from('user_nutrition_intake')
        .insert({
          user_id: user.id,
          avg_carbs: avgCarbs,
          avg_protein: avgProtein,
          avg_sodium: avgSodium,
        })
        .select()
        .single();

      if (saveError) {
        throw new Error(`Failed to save nutrition data: ${saveError.message}`);
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
      console.error('Nutrition intake fetch error:', error);
      set({
        error: error.message || 'Failed to fetch nutrition intake data',
        isLoading: false,
      });
    }
  },

  clearNutritionData: () => {
    set({
      nutritionData: null,
      error: null,
    });
  },
}));

// Helper hook for easier usage
export const useNutritionIntake = () => {
  const store = useNutritionIntakeStore();
  
  return {
    ...store,
    hasNutritionData: !!store.nutritionData,
  };
};