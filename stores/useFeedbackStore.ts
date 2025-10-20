import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types for the store
interface FeedbackData {
  comparison_analysis?: string;
  health_implication?: string;
}

interface NutritionRequest {
  carbs_total: number;
  sodium_total: number;
  protein_total: number;
  calories_total: number;
  recommended_carbs: [number, number];
  recommended_sodium: [number, number];
  recommended_protein: [number, number];
  recommended_calories: [number, number];
}

interface NutritionFeedbackState {
  // State
  comparisonAnalysis: string;
  healthImplication: string;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Actions
  setComparisonAnalysis: (analysis: string) => void;
  setHealthImplication: (implication: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchFeedback: (requestData: NutritionRequest) => Promise<void>;
  resetFeedback: () => void;
  clearError: () => void;
}

const useFeedbackStore = create<NutritionFeedbackState>()(
  devtools(
    (set, get) => ({
      // Initial state
      comparisonAnalysis: '',
      healthImplication: '',
      isLoading: false,
      error: null,
      lastUpdated: null,

      // Actions
      setComparisonAnalysis: (analysis: string) =>
        set(
          { 
            comparisonAnalysis: analysis,
            lastUpdated: new Date() 
          },
          false,
          'setComparisonAnalysis'
        ),

      setHealthImplication: (implication: string) =>
        set(
          { 
            healthImplication: implication,
            lastUpdated: new Date() 
          },
          false,
          'setHealthImplication'
        ),

      setLoading: (loading: boolean) =>
        set({ isLoading: loading }, false, 'setLoading'),

      setError: (error: string | null) =>
        set({ error }, false, 'setError'),

      clearError: () =>
        set({ error: null }, false, 'clearError'),

      fetchFeedback: async (requestData: NutritionRequest) => {
        const { setLoading, setError, setComparisonAnalysis, setHealthImplication } = get();
        
        try {
          setLoading(true);
          setError(null);

          console.log("Sending feedback request:", requestData);

          const response = await fetch(
            "https://pel1-feedback-llm.hf.space/get-response",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestData),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              `HTTP error! status: ${response.status}, response:`,
              errorText
            );
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log("Received feedback response:", data);

          if (data && data.feedback) {
            const { comparison_analysis, health_implication }: FeedbackData = data.feedback;
            setComparisonAnalysis(
              comparison_analysis || "No comparison analysis available."
            );
            setHealthImplication(
              health_implication || "No health implications available."
            );
          } else {
            setComparisonAnalysis(
              "No feedback available. If values are 0, make sure to manually input them."
            );
            setHealthImplication(
              "No feedback available. If values are 0, make sure to manually input them."
            );
          }
        } catch (error) {
          console.error("Feedback fetch error:", error);
          
          if (error instanceof Error && error.message.includes("500")) {
            setComparisonAnalysis(
              "The feedback service is currently experiencing issues. Your nutritional data has been recorded and displayed above."
            );
            setHealthImplication(
              "Unable to generate health implications at this time due to a server error. Please try again later."
            );
            setError("Server error (500)");
          } else {
            setComparisonAnalysis(
              "Unable to connect to feedback service. Please check your internet connection and try again."
            );
            setHealthImplication(
              "Unable to connect to feedback service. Please check your internet connection and try again."
            );
            setError(error instanceof Error ? error.message : "Unknown error occurred");
          }
        } finally {
          setLoading(false);
        }
      },

      resetFeedback: () =>
        set(
          {
            comparisonAnalysis: '',
            healthImplication: '',
            error: null,
            lastUpdated: null,
          },
          false,
          'resetFeedback'
        ),
    }),
    {
      name: 'nutrition-feedback-store', // Store name for devtools
    }
  )
);

// Selectors for better performance
export const useComparisonAnalysis = () => useFeedbackStore(state => state.comparisonAnalysis);
export const useHealthImplication = () => useFeedbackStore(state => state.healthImplication);
export const useFeedbackLoading = () => useFeedbackStore(state => state.isLoading);
export const useFeedbackError = () => useFeedbackStore(state => state.error);

// Export the main store
export default useFeedbackStore;

// Export types for use in components
export type { NutritionRequest, FeedbackData, NutritionFeedbackState };