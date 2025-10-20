// hooks/useUserProfile.ts
import { useEffect } from 'react';
import { useUserProfileStore } from '@/stores/userProfileStore';

export const useUserProfile = () => {
  const {
    profile,
    isLoading,
    error,
    fetchUserProfile,
    calculateBMI,
    getBMICategory,
  } = useUserProfileStore();

  // Auto-fetch profile when hook is used
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  return {
    profile,
    isLoading,
    error,
    weight: profile?.weight ?? 0,
    height: profile?.height ?? 0,
    age: profile?.age ?? 0,
    name: profile?.name ?? '',
    gender: profile?.gender ?? '',
    bmi: calculateBMI(),
    bmiCategory: getBMICategory(),
    refetch: fetchUserProfile,
  };
};