import { create } from "zustand";

type Nutrients = {
    carbs: number;
    protein: number;
    sodium: number;
}

type store = {
    setCarbs: (nutrients: Nutrients['carbs']) => void;
    setProtein: (nutrients: Nutrients['protein']) => void;
    setSodium: (nutrients: Nutrients['sodium']) => void;
}

const useNutrientsStore = create<Nutrients & store>((set) => ({
    carbs: 0,
    protein: 0,
    sodium: 0,
    setCarbs: (carbs) => set(() => ({carbs: carbs})),
    setProtein: (protein) => set(() => ({protein: protein})),
    setSodium: (sodium) => set(() => ({ sodium })),
}));