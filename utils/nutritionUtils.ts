/**
 * Utility functions for nutrition-related formatting and validation
 */

/**
 * Format nutrient value for display
 * @param value - The nutrient value
 * @param unit - The unit of measurement
 * @returns Formatted string
 */
export const formatNutrientValue = (
  value: number | string | undefined,
  unit: string
): string => {
  if (value === undefined || value === null || value === '') {
    return 'Not set';
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return 'Not set';
  }
  
  return `${numValue.toFixed(1)} ${unit}`;
};

/**
 * Validate nutrient input value
 * @param value - The value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Boolean indicating if valid
 */
export const validateNutrientValue = (
  value: string,
  min: number = 0,
  max: number = 10000
): boolean => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Get nutrition intake validation ranges
 */
export const NUTRITION_RANGES = {
  carbs: {
    min: 0,
    max: 500,
    unit: 'g',
    label: 'Carbohydrates',
  },
  protein: {
    min: 0,
    max: 300,
    unit: 'g',
    label: 'Protein',
  },
  sodium: {
    min: 0,
    max: 5000,
    unit: 'mg',
    label: 'Sodium',
  },
  calories: {
    min: 0,
    max: 5000,
    unit: 'kcal',
    label: 'Calories',
  },
};

/**
 * Check if user has set custom nutrition intake
 * @param values - Nutrient values object
 * @returns Boolean indicating if values are set
 */
export const hasCustomNutritionIntake = (values: {
  avgCarbs?: string;
  avgProtein?: string;
  avgSodium?: string;
  avgCalories?: string;
}): boolean => {
  return !!(
    values.avgCarbs &&
    values.avgProtein &&
    values.avgSodium &&
    values.avgCalories
  );
};

/**
 * Parse nutrition intake values from database
 * @param data - Database response data
 * @returns Formatted nutrient values
 */
export const parseNutritionIntake = (data: any): {
  avgCarbs: string;
  avgProtein: string;
  avgSodium: string;
  avgCalories: string;
} => {
  return {
    avgCarbs: data?.avg_carbs?.toString() || '',
    avgProtein: data?.avg_protein?.toString() || '',
    avgSodium: data?.avg_sodium?.toString() || '',
    avgCalories: data?.avg_calories?.toString() || '',
  };
};