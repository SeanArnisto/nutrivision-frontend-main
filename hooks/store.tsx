import { create } from "zustand";

type Nutrients = {
  carbs: number;
  protein: number;
  sodium: number;
};

type store = {
  setCarbs: (nutrients: Nutrients["carbs"]) => void;
  setProtein: (nutrients: Nutrients["protein"]) => void;
  setSodium: (nutrients: Nutrients["sodium"]) => void;
  reset: () => void;
};

export const useNutrientsStore = create<Nutrients & store>((set) => ({
  carbs: 0,
  protein: 0,
  sodium: 0,
  setCarbs: (carbs) => set(() => ({ carbs })),
  setProtein: (protein) => set(() => ({ protein })),
  setSodium: (sodium) => set(() => ({ sodium })),
  reset: () => set({ carbs: 0, protein: 0, sodium: 0 }),
}));

type Recommendation = {
    minCarb: number;
    maxCarb: number;
    minProtein: number;
    maxProtein: number;
    minSodium: number;
    maxSodium: number;
};

type RecommStore = {
  setRecomMinCarb: (carbs: Recommendation["minCarb"]) => void;
  setRecomMaxCarb: (carbs: Recommendation["maxCarb"]) => void;
  setRecomMinProtein: (protein: Recommendation["minProtein"]) => void;
  setRecomMaxProtein: (protein: Recommendation["minProtein"]) => void;
  setRecomMinSodium: (sodium: Recommendation["minSodium"]) => void;
  setRecomMaxSodium: (sodium: Recommendation["maxSodium"]) => void;
};

export const useRecommStore = create<Recommendation & RecommStore>((set) => ({
    minCarb: 0,
    maxCarb: 0,
    minProtein: 0,
    maxProtein: 0,
    minSodium: 0,
    maxSodium: 0,
    setRecomMinCarb: (minCarb) => set(() => ({ minCarb })),
    setRecomMinProtein: (minProtein) => set(() => ({ minProtein })),
    setRecomMinSodium: (minSodium) => set(() => ({ minSodium })),
    setRecomMaxCarb: (maxCarb) => set(() => ({ maxCarb })),
    setRecomMaxProtein: (maxProtein) => set(() => ({ maxProtein })),
    setRecomMaxSodium: (maxSodium) => set(() => ({ maxSodium })),
}))
