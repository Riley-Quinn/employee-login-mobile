import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useRoute } from '@react-navigation/native';

const COLORS = {
  birthdays: '#FF6B81',
  events: '#1ABC9C',
  notes: '#F8C471',
  tasks: '#5DADE2',
};

const MonthView = () => {
  const route = useRoute();
  const {
    selectedDate = '2025-07-21',
    events = [
      {
        id: '1',
        title: "John's Birthday",
        time: '10',
        date: '2025-07-21',
        category: 'birthdays',
      },
      {
        id: '2',
        title: 'Team Meeting',
        time: '11',
        date: '2025-07-21',
        category: 'events',
      },
      {
        id: '3',
        title: 'Lunch with Alex',
        time: '13',
        date: '2025-07-21',
        category: 'events',
      },
      {
        id: '4',
        title: 'Call plumber',
        time: '16',
        date: '2025-07-21',
        category: 'notes',
      },
      {
        id: '5',
        title: 'Submit Report',
        time: '9',
        date: '2025-07-21',
        category: 'tasks',
      },
    ],
  } = route.params || {};

  const [currentDate, setCurrentDate] = useState(() => selectedDate);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    selectedDate.slice(0, 7),
  );

  const markedDates = useMemo(() => {
    const marks = {};

    events
      .filter(e => e.date.startsWith(visibleMonth))
      .forEach(event => {
        if (!marks[event.date]) {
          marks[event.date] = {
            marked: true,
            dots: [{ color: COLORS[event.category], selectedDotColor: '#fff' }],
          };
        }
      });

    marks[currentDate] = {
      ...(marks[currentDate] || {}),
      selected: true,
      selectedColor: '#008080',
      selectedTextColor: '#ffffff',
    };

    return marks;
  }, [events, currentDate, visibleMonth]);
  useEffect(() => {
    const matched = events.filter(
      e => e.date === currentDate && e.date.startsWith(visibleMonth),
    );

    const isEqual =
      matched.length === filteredEvents.length &&
      matched.every((e, i) => e.id === filteredEvents[i]?.id);

    if (!isEqual) {
      setFilteredEvents(matched);
    }
  }, [currentDate, events, visibleMonth, filteredEvents]);

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate}
        onDayPress={day => {
          if (day.dateString !== currentDate) {
            setCurrentDate(day.dateString);
          }
        }}
        onMonthChange={month => {
          setVisibleMonth(
            `${month.year}-${String(month.month).padStart(2, '0')}`,
          );
        }}
        monthFormat={'MMMM yyyy'}
        markedDates={markedDates}
        hideExtraDays={true}
        theme={{
          calendarBackground: '#ffffff',
          selectedDayBackgroundColor: '#008080',
          selectedDayTextColor: '#ffffff',
          todayTextColor: 'black',
          dayTextColor: '#000000',
          monthTextColor: '#000000',
          arrowColor: '#008080',
          textDayFontWeight: '',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: 'bold',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
          textSectionTitleColor: '#000000',
        }}
        markingType={'multi-dot'}
      />
      {currentDate.startsWith(visibleMonth) && (
        <View style={styles.eventList}>
          <Text style={styles.heading}>Events on {currentDate}</Text>
          <FlatList
            data={filteredEvents}
            keyExtractor={(item, index) => index.toString()}
            ListEmptyComponent={<Text style={styles.noEvent}>No events</Text>}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.eventCard,
                  { backgroundColor: COLORS[item.category] || '#f1f2f6' },
                ]}
              >
                <Text style={styles.eventText}>{item.title}</Text>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
};

export default MonthView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  eventList: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginHorizontal: 8,
    marginBottom: 6,
  },
  noEvent: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  eventCard: {
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  eventText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
});
