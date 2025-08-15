import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  sessionsData?: { [key: string]: number }; // Format: 'YYYY-MM-DD': sessionCount
  accountCreationDate?: Date; // Limit how far back user can go
}

const Calendar: React.FC<CalendarProps> = ({ onDateSelect, sessionsData = {}, accountCreationDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // Get today's date for highlighting
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get first day of current month and number of days
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  // Convert to Monday = 0 format
  const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Check if we can navigate to this month based on account creation date
    if (accountCreationDate && direction === 'prev') {
      const firstDayOfNewMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      const accountMonth = new Date(accountCreationDate.getFullYear(), accountCreationDate.getMonth(), 1);
      
      // Don't allow going before the account creation month
      if (firstDayOfNewMonth < accountMonth) {
        return;
      }
    }
    
    setCurrentDate(newDate);
  };

  const canNavigateToPrevMonth = (): boolean => {
    if (!accountCreationDate) return true;
    
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(currentDate.getMonth() - 1);
    const firstDayOfPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
    const accountMonth = new Date(accountCreationDate.getFullYear(), accountCreationDate.getMonth(), 1);
    
    return firstDayOfPrevMonth >= accountMonth;
  };

  const isDateDisabled = (day: number): boolean => {
    if (!accountCreationDate) return false;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date < accountCreationDate;
  };

  const handleDatePress = (day: number) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(selected);
    onDateSelect?.(selected);
  };

  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (day: number): boolean => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date.getTime() === today.getTime();
  };

  const isSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date.getTime() === selectedDate.getTime();
  };

  const hasMultipleSessions = (day: number): boolean => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = formatDateKey(date);
    return (sessionsData[dateKey] || 0) >= 3;
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isCurrentDay = isToday(day);
      const isSelectedDay = isSelected(day);
      const hasLine = hasMultipleSessions(day);
      const isDisabled = isDateDisabled(day);

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayContainer,
            isCurrentDay && styles.currentDay,
            isSelectedDay && styles.selectedDay,
            isDisabled && styles.disabledDay,
          ]}
          onPress={() => handleDatePress(day)}
          disabled={isDisabled}
        >
          <Text style={[
            styles.dayText,
            isCurrentDay && styles.currentDayText,
            isSelectedDay && styles.selectedDayText,
            isDisabled && styles.disabledDayText,
          ]}>
            {day}
          </Text>
          {hasLine && !isDisabled && <View style={styles.sessionLine} />}
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={styles.calendarContainer}>
      {/* Header with month navigation */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigateMonth('prev')}
          disabled={!canNavigateToPrevMonth()}
          style={[
            styles.navButtonContainer,
            !canNavigateToPrevMonth() && styles.disabledNavButton
          ]}
        >
          <Text style={[
            styles.navButton,
            !canNavigateToPrevMonth() && styles.disabledNavButtonText
          ]}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.monthYear}>
          {months[currentDate.getMonth()]}
        </Text>
        
        <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButtonContainer}>
          <Text style={styles.navButton}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Week day headers */}
      <View style={styles.weekDaysContainer}>
        {weekDays.map((day) => (
          <Text key={day} style={styles.weekDayText}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {renderCalendarDays()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navButtonContainer: {
    padding: 5,
    borderRadius: 4,
  },
  navButton: {
    fontSize: 24,
    color: '#666',
    paddingHorizontal: 10,
  },
  disabledNavButton: {
    opacity: 0.3,
  },
  disabledNavButtonText: {
    color: '#ccc',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDayText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: '14.28%',
    height: 40,
  },
  dayContainer: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 100,
  },
  dayText: {
    fontSize: 16,
    color: '#333',
  },
  currentDay: {
    backgroundColor: '#FFD700', // Yellow/gold color as shown in the image
    borderRadius: 30,
  },
  currentDayText: {
    color: '#333',
    fontWeight: '600',
  },
  selectedDay: {
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 20,
  },
  selectedDayText: {
    color: '#333',
    fontWeight: '600',
  },
  disabledDay: {
    opacity: 0.3,
  },
  disabledDayText: {
    color: '#ccc',
  },
  sessionLine: {
    position: 'absolute',
    bottom: 4,
    width: 12,
    height: 2,
    backgroundColor: '#666',
    borderRadius: 1,
  },
});

export default Calendar;