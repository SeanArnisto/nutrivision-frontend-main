import { create } from "zustand";
import { supabase } from "@/config/supabase";
import * as FileSystem from "expo-file-system/legacy";

type NutrientIntake = {
  type: string;
  imageUrl: string;
  carbs: number;
  sodium: number;
  protein: number;
  calories: number;
  servings?: number;
  originalServings?: number; // Store original servings from package
  fruitCut?: number; // How many portions the fruit is cut into (1 = whole)
  selectedAmount?: number; // Amount or slices selected
};

type store = {
  intakes: NutrientIntake[];
  setIntake: (nutrientIntake: NutrientIntake[]) => void;
  updateIntakeByIndex: (index: number, nutrients: Partial<NutrientIntake>) => void;
  saveToDatabase: (
    intakes: NutrientIntake[]
  ) => Promise<{ success: boolean; data?: any; error?: string }>;
  loading: boolean;
  error: string | null;
  reset: () => void;
};

export const useDetailedNutrientStore = create<store>((set, get) => ({
  intakes: [],
  setIntake: (nutrientIntake: NutrientIntake[]) =>
    set(() => ({ intakes: nutrientIntake })),
  updateIntakeByIndex: (index: number, nutrients: Partial<NutrientIntake>) => {
    console.log(`🔴 [STORE] updateIntakeByIndex called for index ${index}:`, nutrients);
    const currentIntakes = get().intakes;
    if (index >= 0 && index < currentIntakes.length) {
      const updatedIntakes = [...currentIntakes];
      updatedIntakes[index] = { ...updatedIntakes[index], ...nutrients };
      console.log(`🔴 [STORE] Store updated! New intake:`, updatedIntakes[index]);
      set({ intakes: updatedIntakes });
    }
  },
  loading: false,
  error: null,
  reset: () => set({ intakes: [] }),
  saveToDatabase: async (intakes: NutrientIntake[]) => {
    if (!intakes || intakes.length === 0) {
      return { success: false, error: "No data to save" };
    }

    if (intakes.length > 5) {
      return {
        success: false,
        error: "Cannot save more than 5 nutrient intakes per session",
      };
    }

    set({ loading: true, error: null });

    try {
      // Get authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Calculate total adjusted values for all intakes
      let totalCarbs = 0;
      let totalProtein = 0;
      let totalSodium = 0;
      let totalCalories = 0;

      for (const intake of intakes) {
        const multiplier = (intake.fruitCut !== undefined && intake.selectedAmount !== undefined)
          ? (intake.fruitCut === 1 ? intake.selectedAmount : (intake.selectedAmount / intake.fruitCut))
          : (intake.servings || 1);

        totalCarbs += intake.carbs * multiplier;
        totalProtein += intake.protein * multiplier;
        totalSodium += intake.sodium * multiplier;
        totalCalories += intake.calories * multiplier;
      }

      // Calculate total (all nutrients are in grams)
      const total = totalCarbs + totalProtein + totalSodium;
      const localNow = new Date();

      // Step 1: Insert nutritional record
      const { data: recordData, error: recordError } = await supabase
        .from("nutritional_records")
        .insert([
          {
            user_id: user.id,
            carbohydrates: totalCarbs,
            protein: totalProtein,
            sodium: totalSodium,
            calories: totalCalories,
            total: total,
            created_at: localNow.toISOString(),
          },
        ])
        .select()
        .single();

      if (recordError) {
        throw new Error(`Failed to create record: ${recordError.message}`);
      }

      // Step 2: Upload and save images
      for (let i = 0; i < intakes.length; i++) {
        const intake = intakes[i];
        let uploadedImageUrl = intake.imageUrl;

        // Check if the imageUrl is a local file (starts with file://)
        if (intake.imageUrl.startsWith("file://")) {
          try {
            // Check if file exists
            const fileInfo = await FileSystem.getInfoAsync(intake.imageUrl);
            if (!fileInfo.exists) {
              console.warn(`Image file not found: ${intake.imageUrl}`);
              continue; // Skip this image but continue with others
            }

            // Generate unique filename
            const fileName = `record_${recordData.id}_${i + 1}_${Date.now()}.jpg`;

            // Create FormData for file upload
            const formData = new FormData();
            formData.append("file", {
              uri: intake.imageUrl,
              type: "image/jpeg",
              name: fileName,
            } as any);

            console.log("Uploading image:", fileName);

            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("nutrition-images")
                .upload(`${user.id}/${fileName}`, formData, {
                  cacheControl: "3600",
                  upsert: false,
                });

            if (uploadError) {
              console.error("Upload error:", uploadError);
              continue; // Skip this image but continue with others
            }

            // Get public URL
            const {
              data: { publicUrl },
            } = supabase.storage
              .from("nutrition-images")
              .getPublicUrl(uploadData.path);

            uploadedImageUrl = publicUrl;
            console.log("Image uploaded successfully:", fileName);

            // Save image record to database
            const { error: imageError } = await supabase
              .from("nutritional_images")
              .insert([
                {
                  nutritional_record_id: recordData.id,
                  image_url: uploadedImageUrl,
                  image_order: i + 1,
                  created_at: localNow.toISOString(),
                },
              ]);

            if (imageError) {
              console.error("Image record error:", imageError);
            }
          } catch (uploadError: any) {
            console.error("Error processing image:", uploadError);
            // Continue with other images
          }
        }
      }

      set({ loading: false });
      return {
        success: true,
        data: recordData,
      };
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error occurred";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
}));

// Utility function to retrieve nutritional records with images
export const getUserSessions = async (days: number = 30) => {
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

// Utility function to get a specific nutritional record with images
export const getSessionById = async (recordId: string) => {
  try {
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
      .eq("id", recordId)
      .single();

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