import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/config/supabase';
import { useAuthStore } from '@/stores/authStore';

export interface NutritionStats {
  avg_carbs: number;
  avg_protein: number;
  avg_sodium: number;
  total_sessions: number;
}

export interface UseNutritionStatsReturn {
  nutritionData: NutritionStats | null;
  isLoading: boolean;
  error: string | null;
  fetchNutritionStats: () => Promise<void>;
}

export const useNutritionStats = (): UseNutritionStatsReturn => {
  const [nutritionData, setNutritionData] = useState<NutritionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get user from auth store
  const { user, isAuthenticated } = useAuthStore();

  const fetchNutritionStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('nutritional_records')
        .select('carbohydrates, protein, sodium, created_at')
        .eq('user_id', user.id);

      if (error) throw error;



      if (data && data.length > 0) {
        const totals = data.reduce((acc, record) => ({
          carbs: acc.carbs + (record.carbohydrates || 0),
          protein: acc.protein + (record.protein || 0),
          sodium: acc.sodium + (record.sodium || 0),
        }), { carbs: 0, protein: 0, sodium: 0 });

        const stats: NutritionStats = {
          avg_carbs: totals.carbs / data.length,
          avg_protein: totals.protein / data.length,
          avg_sodium: totals.sodium / data.length,
          total_sessions: data.length,
        };

        setNutritionData(stats);
      } else {
        // Set default values if no data
        setNutritionData({
          avg_carbs: 0,
          avg_protein: 0,
          avg_sodium: 0,
          total_sessions: 0,
        });
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching nutrition stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNutritionStats();
    } else {
      // Clear data when user is not authenticated
      setNutritionData(null);
      setError(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  return {
    nutritionData,
    isLoading,
    error,
    fetchNutritionStats,
  };
};