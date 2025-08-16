import { supabase } from "@/config/supabase";
import { useEffect, useState } from "react";

interface CalendarData {
  [key: string]: number; // Format: 'YYYY-MM-DD': sessionCount
}

interface UseCalendarReturn {
  data: CalendarData | null;
  loading: boolean;
  error: string | null;
}

export default function useCalendar({
  userId,
  month,
  year,
}: {
  userId: string;
  month: number; // 0-based month (0 = January)
  year: number;
}): UseCalendarReturn {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCalendarData() {
      try {
        setLoading(true);
        setError(null);

        // Get first and last day of the month
        // Note: month parameter should be 0-based to match JavaScript Date
        const startDate = new Date(year, month, 1).toISOString();
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();

        const { data: records, error: queryError } = await supabase
          .from("nutritional_records")
          .select("created_at")
          .eq("user_id", userId) // Fixed: uncommented user filtering
          .gte("created_at", startDate)
          .lte("created_at", endDate);

        if (queryError) {
          throw new Error(queryError.message);
        }

        // Group records by date and count sessions per day
        const groupedData: CalendarData = {};
        
        records?.forEach((record) => {
          const date = new Date(record.created_at);
          const dateKey = date.toISOString().split('T')[0]; // Format: 'YYYY-MM-DD'
          
          groupedData[dateKey] = (groupedData[dateKey] || 0) + 1;
        });

        setData(groupedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchCalendarData();
    }
  }, [userId, month, year]);

  return { data, loading, error };
}