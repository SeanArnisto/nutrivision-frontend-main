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
    const currentIntakes = get().intakes;
    if (index >= 0 && index < currentIntakes.length) {
      const updatedIntakes = [...currentIntakes];
      updatedIntakes[index] = { ...updatedIntakes[index], ...nutrients };
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

      // Step 1: Create a user session first
      const { data: sessionData, error: sessionError } = await supabase
        .from("user_session")
        .insert({
          uuid: user.id,
        })
        .select("session_id")
        .single();

      if (sessionError) {
        throw new Error(`Failed to create session: ${sessionError.message}`);
      }

      const sessionId = sessionData.session_id;

      // Step 2: Insert nutrient intakes with uploaded images
      const nutrientIntakeIds: number[] = [];

      for (let i = 0; i < intakes.length; i++) {
        const intake = intakes[i];
        let uploadedImageUrl = intake.imageUrl;

        // Check if the imageUrl is a local file (starts with file://)
        if (intake.imageUrl.startsWith("file://")) {
          try {
            // Check if file exists
            const fileInfo = await FileSystem.getInfoAsync(intake.imageUrl);
            if (!fileInfo.exists) {
              throw new Error("Image file not found");
            }

            // Generate unique filename
            const fileName = `intake_${sessionId}_${i + 1}_${Date.now()}.jpg`;

            // Create FormData for file upload
            const formData = new FormData();
            formData.append("file", {
              uri: intake.imageUrl,
              type: "image/jpeg",
              name: fileName,
            } as any);

            console.log("Uploading image:", fileName);
            console.log("Image URI:", intake.imageUrl);

            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("single_images")
                .upload(`${user.id}/${fileName}`, formData, {
                  cacheControl: "3600",
                  upsert: false,
                });

            if (uploadError) {
              console.error("Upload error:", uploadError);
              throw new Error(
                `Failed to upload image ${i + 1}: ${uploadError.message}`
              );
            }

            // Get public URL
            const {
              data: { publicUrl },
            } = supabase.storage
              .from("single_images")
              .getPublicUrl(uploadData.path);

            uploadedImageUrl = publicUrl;
            console.log("Image uploaded successfully:", fileName);
          } catch (uploadError: any) {
            console.error("Error processing image:", uploadError);
            throw new Error(
              `Failed to process image ${i + 1}: ${uploadError.message}`
            );
          }
        }

        // Insert nutrient intake linked to the session
        const { data: nutrientData, error: nutrientError } = await supabase
          .from("nutrient_intake")
          .insert({
            session_id: sessionId, // Link to session
            type: intake.type,
            carbs: intake.carbs,
            protein: intake.protein,
            calories: intake.calories,
            sodium: intake.sodium,
            image_url: uploadedImageUrl,
            image_order: i + 1,
          })
          .select("id")
          .single();

        if (nutrientError) {
          throw new Error(
            `Failed to save nutrient intake ${i + 1}: ${nutrientError.message}`
          );
        }

        if (nutrientData) {
          nutrientIntakeIds.push(nutrientData.id);
        }
      }

      set({ loading: false });
      return {
        success: true,
        data: {
          sessionId,
          nutrientIntakeIds,
        },
      };
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error occurred";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
}));

// Utility function to retrieve sessions with all nutrient intakes
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
      .from("user_session")
      .select(
        `
        session_id,
        created_at,
        nutrient_intake (
          id,
          type,
          carbs,
          protein,
          calories,
          sodium,
          image_url,
          image_order
        )
      `
      )
      .eq("uuid", user.id)
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

// Utility function to get a specific session with all its intakes
export const getSessionById = async (sessionId: number) => {
  try {
    const { data, error } = await supabase
      .from("user_session")
      .select(
        `
        session_id,
        created_at,
        nutrient_intake (
          id,
          type,
          carbs,
          calories,
          protein,
          sodium,
          image_url,
          image_order
        )
      `
      )
      .eq("session_id", sessionId)
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