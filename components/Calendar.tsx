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

  const getSessionCount = (day: number): number => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = formatDateKey(date);
    return sessionsData[dateKey] || 0;
  };

  const renderSessionIndicator = (day: number) => {
    const sessionCount = getSessionCount(day);
    if (sessionCount === 0) return null;

    // If more than 3 sessions, show a solid line
    if (sessionCount > 3) {
      return (
        <View style={styles.sessionIndicatorContainer}>
          <View style={styles.sessionLine} />
        </View>
      );
    }

    // Otherwise show dots (1-3)
    const dots = [];
    for (let i = 0; i < sessionCount; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.sessionDot,
            i > 0 && { marginLeft: 2 } // Add spacing between dots
          ]}
        />
      );
    }

    return <View style={styles.sessionIndicatorContainer}>{dots}</View>;
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
      const isDisabled = isDateDisabled(day);

      days.push(
        <TouchableOpacity
          key={day}
          style={styles.dayContainer}
          onPress={() => handleDatePress(day)}
          disabled={isDisabled}
        >
          {/* Background circle for current/selected day */}
          {isCurrentDay && <View style={styles.currentDay} />}
          {isSelectedDay && <View style={styles.selectedDay} />}
          
          {/* Day text */}
          <Text style={[
            styles.dayText,
            isCurrentDay && styles.currentDayText,
            isSelectedDay && styles.selectedDayText,
            isDisabled && styles.disabledDayText,
          ]}>
            {day}
          </Text>
          
          {/* Session indicator (dots or line) */}
          {!isDisabled && renderSessionIndicator(day)}
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
    borderRadius: 8,
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
  },
  dayText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  currentDay: {
    position: 'absolute',
    backgroundColor: '#FFD700', // Yellow/gold color as shown in the image
    borderRadius: 18, // Make it perfectly circular (half of width/height)
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentDayText: {
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedDay: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 18, // Make it perfectly circular (half of width/height)
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayText: {
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledDay: {
    opacity: 0.3,
  },
  disabledDayText: {
    color: '#ccc',
  },
  sessionIndicatorContainer: {
    position: 'absolute',
    bottom: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#AA7B09', // Changed to the requested color
  },
  sessionLine: {
    width: 20, // Width of the solid line
    height: 2,  // Height of the solid line
    borderRadius: 1,
    backgroundColor: '#AA7B09', // Same color as dots
  },
});

export default Calendar;