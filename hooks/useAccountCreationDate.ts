
// hooks/useAccountCreationDate.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { useAuthStore } from '@/stores/authStore';

export const useAccountCreationDate = () => {
  const [accountCreationDate, setAccountCreationDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuthStore();

  const fetchAccountCreationDate = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.created_at) {
        setAccountCreationDate(new Date(data.created_at));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching account creation date:', err);
      // Fallback to a reasonable default date if error occurs
      setAccountCreationDate(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAccountCreationDate();
    } else {
      setAccountCreationDate(null);
      setIsLoading(false);
    }
  }, [user]);

  return {
    accountCreationDate,
    isLoading,
    error,
  };
};