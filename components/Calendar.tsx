import React, { useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import Calendar from '@/components/Calendar'; // Your calendar component
import useCalendar from '@/hooks/useCalendar'; // Fixed hook

const CalendarScreen: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const userId = "your-user-id"; // Replace with actual user ID
  
  // Use the fixed hook
  const { data: sessionsData, loading, error } = useCalendar({
    userId,
    month: currentDate.getMonth(), // 0-based month
    year: currentDate.getFullYear(),
  });

  const handleDateSelect = (date: Date) => {
    console.log('Selected date:', date);
    // Handle date selection logic here
  };

  // Handle month navigation - need to refetch data when month changes
  const handleMonthChange = (newDate: Date) => {
    setCurrentDate(newDate);
    // The useCalendar hook will automatically refetch due to dependency changes
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Loading calendar...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error loading calendar: {error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Calendar
        onDateSelect={handleDateSelect}
        sessionsData={sessionsData || {}}
        accountCreationDate={new Date('2024-01-01')} // Replace with actual account creation date
      />
    </View>
  );
};

export default CalendarScreen;