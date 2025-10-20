import { create } from "zustand";
import { supabase } from "@/config/supabase"; // Adjust path as needed
import * as FileSystem from "expo-file-system/legacy";

type Nutrients = {
  carbs: number;
  protein: number;
  sodium: number;
  calories: number;
};

type NutrientRecord = {
  id?: string;
  carbohydrates: number;
  protein: number;
  sodium: number;
  total: number;
  created_at?: string;
};

type ImageData = {
  uri: string;
  type: string; // 'label' or 'fruit'
  orientation: string; // 'vertical' or 'horizontal'
};

type store = {
  setCarbs: (nutrients: Nutrients["carbs"]) => void;
  setProtein: (nutrients: Nutrients["protein"]) => void;
  setSodium: (nutrients: Nutrients["sodium"]) => void;
  setCalories: (nutrients: Nutrients["calories"]) => void;
  reset: () => void;
  saveToDatabase: (
    images?: ImageData[]
  ) => Promise<{ success: boolean; data?: any; error?: string }>;
  saveWithPhotos: (
    photos: { uri: string; type: string; orientation: string }[]
  ) => Promise<{ success: boolean; data?: any; error?: string }>;
  loading: boolean;
  error: string | null;
};

export const useNutrientsStore = create<Nutrients & store>((set, get) => ({
  carbs: 0,
  protein: 0,
  sodium: 0,
  calories: 0,
  loading: false,
  error: null,
  setCarbs: (carbs) => set(() => ({ carbs })),
  setProtein: (protein) => set(() => ({ protein })),
  setSodium: (sodium) => set(() => ({ sodium })),
  setCalories: (calories) => set(() => ({ calories })),
  reset: () => set({ carbs: 0, protein: 0, sodium: 0, error: null }),

  saveToDatabase: async (images: ImageData[] = []) => {
    const { carbs, protein, sodium, calories } = get();

    // Validate that we have at least some data
    if (carbs === 0 && protein === 0 && sodium === 0) {
      set({ error: "No nutritional data to save" });
      return { success: false, error: "No nutritional data to save" };
    }

    set({ loading: true, error: null });

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Calculate total (all nutrients are in grams)
      const total = carbs + protein + sodium;

      const localNow = new Date();

      // Insert nutritional record
      const { data: recordData, error: recordError } = await supabase
        .from("nutritional_records")
        .insert([
          {
            user_id: user.id,
            carbohydrates: carbs,
            protein: protein,
            sodium: sodium,
            total: total,
            created_at: localNow.toISOString(),
          },
        ])
        .select()
        .single();

      if (recordError) {
        throw recordError;
      }

      // Upload and save images if provided
      if (images.length > 0) {
        const imagePromises = images.map(async (image, index) => {
          try {
            // Check if file exists
            const fileInfo = await FileSystem.getInfoAsync(image.uri);
            if (!fileInfo.exists) {
              throw new Error("Image file not found");
            }

            // Define fileName for image upload
            const fileName = `record_${Date.now()}_${index + 1}.jpg`;

            // Create FormData for file upload
            const formData = new FormData();
            formData.append("file", {
              uri: image.uri,
              type: "image/jpeg",
              name: fileName,
            } as any);

            console.log("Uploading image:", fileName);
            console.log("Image URI:", image.uri);

            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("nutrition-images")
                .upload(`${user.id}/${fileName}`, formData, {
                  cacheControl: "3600",
                  upsert: false,
                });

            if (uploadError) {
              console.error("Upload error:", uploadError);
              return null;
            }

            // Get public URL
            const {
              data: { publicUrl },
            } = supabase.storage
              .from("nutrition-images")
              .getPublicUrl(uploadData.path);

            // Save image record to database
            const { data: imageData, error: imageError } = await supabase
              .from("nutritional_images")
              .insert([
                {
                  nutritional_record_id: recordData.id,
                  image_url: publicUrl,
                  image_order: index + 1,
                },
              ])
              .select()
              .single();

            if (imageError) {
              console.error("Image record error:", imageError);
              return null;
            }

            console.log("Image uploaded successfully:", fileName);
            return imageData;
          } catch (error) {
            console.error("Error processing image:", error);
            return null;
          }
        });

        await Promise.all(imagePromises);
      }

      set({ loading: false });
      return { success: true, data: recordData };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  saveWithPhotos: async (
    photos: { uri: string; type: string; orientation: string }[]
  ) => {
    const { carbs, protein, sodium, calories } = get();

    // Validate that we have at least some data
    if (carbs === 0 && protein === 0 && sodium === 0) {
      set({ error: "No nutritional data to save" });
      return { success: false, error: "No nutritional data to save" };
    }

    set({ loading: true, error: null });

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Calculate total (all nutrients are in grams)
      const total = carbs + protein + sodium;

      const localNow = new Date();

      // Insert nutritional record
      const { data: recordData, error: recordError } = await supabase
        .from("nutritional_records")
        .insert([
          {
            user_id: user.id,
            carbohydrates: carbs,
            protein: protein,
            calories: calories,
            sodium: sodium,
            total: total,
            created_at: localNow.toISOString(),
          },
        ])
        .select()
        .single();

      if (recordError) {
        throw recordError;
      }

      // Upload and save images if provided - matching your photo structure
      if (photos.length > 0) {
        const imagePromises = photos.map(async (photo, index) => {
          try {
            // Check if file exists
            const fileInfo = await FileSystem.getInfoAsync(photo.uri);
            if (!fileInfo.exists) {
              throw new Error("Image file not found");
            }

            const fileName = `${recordData.id}_${index + 1}_${Date.now()}.jpg`;

            // Create FormData for file upload
            const formData = new FormData();
            formData.append("file", {
              uri: photo.uri,
              type: "image/jpeg",
              name: fileName,
            } as any);

            console.log("Uploading photo:", fileName);
            console.log("Photo URI:", photo.uri);

            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("nutrition-images")
                .upload(`${user.id}/${fileName}`, formData, {
                  cacheControl: "3600",
                  upsert: false,
                });

            if (uploadError) {
              console.error("Upload error:", uploadError);
              return null;
            }

            // Get public URL
            const {
              data: { publicUrl },
            } = supabase.storage
              .from("nutrition-images")
              .getPublicUrl(uploadData.path);

            // Save image record to database
            const { data: imageData, error: imageError } = await supabase
              .from("nutritional_images")
              .insert([
                {
                  nutritional_record_id: recordData.id,
                  image_url: publicUrl,
                  image_order: index + 1,
                  created_at: localNow.toISOString(),
                },
              ])
              .select()
              .single();

            if (imageError) {
              console.error("Image record error:", imageError);
              return null;
            }

            console.log("Photo uploaded successfully:", fileName);
            return imageData;
          } catch (error) {
            console.error("Error processing image:", error);
            return null;
          }
        });

        await Promise.all(imagePromises);
      }

      set({ loading: false });
      return { success: true, data: recordData };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
}));

type Recommendation = {
  minCarb: number;
  maxCarb: number;
  minProtein: number;
  maxProtein: number;
  minSodium: number;
  maxSodium: number;
  minCalories: number;
  maxCalories: number;
};

type RecommStore = {
  setRecomMinCarb: (carbs: Recommendation["minCarb"]) => void;
  setRecomMaxCarb: (carbs: Recommendation["maxCarb"]) => void;
  setRecomMinProtein: (protein: Recommendation["minProtein"]) => void;
  setRecomMaxProtein: (protein: Recommendation["maxProtein"]) => void;
  setRecomMinSodium: (sodium: Recommendation["minSodium"]) => void;
  setRecomMaxSodium: (sodium: Recommendation["maxSodium"]) => void;
  setRecomMinCalories: (calories: Recommendation["minCalories"]) => void;
  setRecomMaxCalories: (calories: Recommendation["maxCalories"]) => void;
  calculateRecommendations: (userProfile: {
    weight: number;
    height: number;
    age: number;
    gender: string;
  }) => void;
  loadUserRecommendations: () => Promise<void>;
  saveRecommendations: () => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
  error: string | null;
};

export const useRecommStore = create<Recommendation & RecommStore>(
  (set, get) => ({
    minCarb: 0,
    maxCarb: 0,
    minProtein: 0,
    maxProtein: 0,
    minSodium: 0,
    maxSodium: 0,
    minCalories: 0,
    maxCalories: 0,
    loading: false,
    error: null,

    setRecomMinCarb: (minCarb) => set(() => ({ minCarb })),
    setRecomMinProtein: (minProtein) => set(() => ({ minProtein })),
    setRecomMinSodium: (minSodium) => set(() => ({ minSodium })),
    setRecomMaxCarb: (maxCarb) => set(() => ({ maxCarb })),
    setRecomMaxProtein: (maxProtein) => set(() => ({ maxProtein })),
    setRecomMaxSodium: (maxSodium) => set(() => ({ maxSodium })),
    setRecomMaxCalories: (maxCalories) => set(() => ({ maxCalories })),
    setRecomMinCalories: (minCalories) => set(() => ({minCalories})),

    calculateRecommendations: (userProfile) => {
      const { weight, height, age, gender } = userProfile;

      // Calculate BMR using Mifflin-St Jeor Equation
      let bmr;
      if (gender.toLowerCase() === "male") {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }

      // Assume moderate activity level (BMR * 1.55)
      const dailyCalories = bmr * 1.55;

      // WHO/AHA recommendations
      // Carbohydrates: 45-65% of total calories (4 cal/g)
      const minCarbCalories = dailyCalories * 0.45;
      const maxCarbCalories = dailyCalories * 0.65;
      const minCarb = minCarbCalories / 4;
      const maxCarb = maxCarbCalories / 4;

      // Protein: 10-35% of total calories (4 cal/g)
      const minProteinCalories = dailyCalories * 0.1;
      const maxProteinCalories = dailyCalories * 0.35;
      const minProtein = minProteinCalories / 4;
      const maxProtein = maxProteinCalories / 4;

      // Sodium: WHO recommends <2g/day, AHA recommends <1.5g/day
      const minSodium = 0;
      const maxSodium = 1.5; // Conservative AHA recommendation

      set({
        minCarb: Math.round(minCarb),
        maxCarb: Math.round(maxCarb),
        minProtein: Math.round(minProtein),
        maxProtein: Math.round(maxProtein),
        minSodium,
        maxSodium,
      });
    },

    loadUserRecommendations: async () => {
      set({ loading: true, error: null });

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error("User not authenticated");
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("weight, height, age, gender")
          .eq("id", user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (
          profile &&
          profile.weight &&
          profile.height &&
          profile.age &&
          profile.gender
        ) {
          get().calculateRecommendations(profile);
        }

        set({ loading: false });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        set({ loading: false, error: errorMessage });
      }
    },

    saveRecommendations: async () => {
      const state = get();
      set({ loading: true, error: null });

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error("User not authenticated");
        }

        // You could create a user_recommendations table to store custom recommendations
        // For now, recommendations are calculated from profile data

        set({ loading: false });
        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        set({ loading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    },
  })
);

// Utility function to get user's nutritional history
export const getNutritionalHistory = async (days: number = 30) => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("nutritional_records")
      .select(
        `
        *,
        nutritional_images (
          image_url,
          image_order
        )
      `
      )
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
};
