// hooks/useNutritionCalendar.ts
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/config/supabase";
import { useAuthStore } from "@/stores/authStore";

export interface NutritionalRecord {
  id: string;
  user_id: string;
  carbohydrates: number | null;
  protein: number | null;
  sodium: number | null;
  total: number | null;
  created_at: string;
  updated_at: string;
}

export interface NutritionalImage {
  id: string;
  nutritional_record_id: string;
  image_url: string;
  image_order: number;
  created_at: string;
}

export interface Session {
  id: string;
  name: string;
  time: string;
  foodCount: number;
  previewImage?: string;
  nutritionData: {
    carbohydrates: number;
    protein: number;
    sodium: number;
    total: number;
  };
}

export interface FoodEntry {
  id: string;
  image: string;
  type: "fruit" | "label";
}

export interface NutritionSummary {
  carbs: number;
  sodium: number;
  protein: number;
  total: number;
}

export interface UseNutritionCalendarReturn {
  sessionsData: { [date: string]: number };
  isLoading: boolean;
  error: string | null;
  getSessionsForDate: (date: Date) => Session[];
  getFoodEntriesForSession: (recordId: string) => Promise<FoodEntry[]>;
  getNutritionSummaryForSession: (recordId: string) => NutritionSummary | null;
  refreshData: () => Promise<void>;
}

export const useNutritionCalendar = (): UseNutritionCalendarReturn => {
  const [nutritionalRecords, setNutritionalRecords] = useState<
    NutritionalRecord[]
  >([]);
  const [nutritionalImages, setNutritionalImages] = useState<{
    [recordId: string]: NutritionalImage[];
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user from auth store
  const { user, isAuthenticated } = useAuthStore();

  // Format date to YYYY-MM-DD
  const formatDateKey = (date: Date | string): string => {
    const d = new Date(date); // handles both string and Date
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Format time from timestamp
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Fetch nutritional records
  const fetchNutritionalRecords = async () => {
    try {
      const { user } = useAuthStore.getState();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("nutritional_records")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error("Error fetching nutritional records:", err);
      throw err;
    }
  };

  // Fetch images for records
  const fetchNutritionalImages = async (recordIds: string[]) => {
    if (recordIds.length === 0) return {};

    try {
      const { data, error } = await supabase
        .from("nutritional_images")
        .select("*")
        .in("nutritional_record_id", recordIds)
        .order("image_order", { ascending: true });

      if (error) throw error;

      // Group images by record ID
      const groupedImages: { [recordId: string]: NutritionalImage[] } = {};
      data?.forEach((image) => {
        if (!groupedImages[image.nutritional_record_id]) {
          groupedImages[image.nutritional_record_id] = [];
        }
        groupedImages[image.nutritional_record_id].push(image);
      });

      return groupedImages;
    } catch (err) {
      console.error("Error fetching nutritional images:", err);
      return {};
    }
  };

  // Main data loading function
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const records = await fetchNutritionalRecords();
      setNutritionalRecords(records);

      const recordIds = records.map((record) => record.id);
      const images = await fetchNutritionalImages(recordIds);
      setNutritionalImages(images);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data function
  const refreshData = useCallback(async () => {
    await loadData();
  }, []);

  // Calculate sessions data for calendar
  const sessionsData = useMemo(() => {
    const data: { [date: string]: number } = {};

    nutritionalRecords.forEach((record) => {
      const dateKey = formatDateKey(record.created_at);
      data[dateKey] = (data[dateKey] || 0) + 1;
    });

    return data;
  }, [nutritionalRecords]);

  // Get sessions for a specific date
  const getSessionsForDate = useCallback(
    (date: Date): Session[] => {
      const dateKey = formatDateKey(date);

      const recordsForDate = nutritionalRecords.filter((record) => {
        return formatDateKey(record.created_at) === dateKey;
      });

      return recordsForDate.map((record, index) => {
        const images = nutritionalImages[record.id] || [];
        const previewImage = images[0]?.image_url;

        return {
          id: record.id,
          name: `Session ${index + 1}`,
          time: formatTime(record.created_at),
          foodCount: images.length,
          previewImage,
          nutritionData: {
            carbohydrates: record.carbohydrates || 0,
            protein: record.protein || 0,
            sodium: record.sodium || 0,
            total: record.total || 0,
          },
        };
      });
    },
    [nutritionalRecords, nutritionalImages]
  );

  // Get food entries for a specific session
  const getFoodEntriesForSession = useCallback(
    async (recordId: string): Promise<FoodEntry[]> => {
      const images = nutritionalImages[recordId] || [];

      return images.map((image) => ({
        id: image.id,
        image: image.image_url,
        type: "label" as const, // You might want to add logic to determine fruit vs label
      }));
    },
    [nutritionalImages]
  );

  // Get nutrition summary for a specific session
  const getNutritionSummaryForSession = useCallback(
    (recordId: string): NutritionSummary | null => {
      const record = nutritionalRecords.find((r) => r.id === recordId);

      if (!record) return null;

      return {
        carbs: record.carbohydrates
          ? parseFloat(record.carbohydrates.toFixed(5))
          : 0,
        sodium: record.sodium ? parseFloat(record.sodium.toFixed(5)) : 0, // Convert to grams
        protein: record.protein ? parseFloat(record.protein.toFixed(5)) : 0,
        total: record.total || 0,
      };
    },
    [nutritionalRecords]
  );

  // Load data on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadData();
    } else {
      // Clear data when user is not authenticated
      setNutritionalRecords([]);
      setNutritionalImages({});
      setError(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("nutrition-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "nutritional_records",
        },
        () => {
          refreshData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "nutritional_images",
        },
        () => {
          refreshData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshData]);

  return {
    sessionsData,
    isLoading,
    error,
    getSessionsForDate,
    getFoodEntriesForSession,
    getNutritionSummaryForSession,
    refreshData,
  };
};
