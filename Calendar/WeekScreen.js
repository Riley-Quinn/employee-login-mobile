import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

const HOURS = Array.from(
  { length: 24 },
  (_, i) => `${i % 12 === 0 ? 12 : i % 12} ${i < 12 ? 'AM' : 'PM'}`,
);

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const staticData = {
  birthdays: [
    { id: '1', title: "John's Birthday", time: '10', date: '2025-07-21' },
  ],
  events: [
    { id: '2', title: 'Team Meeting', time: '11', date: '2025-07-21' },
    { id: '3', title: 'Lunch with Alex', time: '13', date: '2025-07-21' },
  ],
  notes: [{ id: '4', title: 'Call plumber', time: '16', date: '2025-07-21' }],
  tasks: [{ id: '5', title: 'Submit Report', time: '9', date: '2025-07-21' }],
};

const COLORS = {
  birthdays: '#FF6B81',
  events: '#1ABC9C',
  notes: '#F8C471',
  tasks: '#5DADE2',
};

const WeekView = () => {
  const baseDate = new Date('2025-07-20');

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');

  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    return date;
  });

  const allItems = Object.entries(staticData).flatMap(([category, items]) =>
    items.map(item => ({ ...item, category })),
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 40 }} />

        <View style={[styles.weekHeader, { width: SCREEN_WIDTH }]}>
          {WEEK_DAYS.map((day, index) => (
            <View key={index} style={styles.dayContainer}>
              <Text style={styles.dayText}>{day}</Text>
              <Text style={styles.dateText}>{daysOfWeek[index].getDate()}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.grid}>
        {HOURS.map((hour, i) => (
          <View key={i} style={styles.timeRow}>
            <Text style={styles.timeLabel}>{hour}</Text>
            <View style={styles.gridLine} />
          </View>
        ))}

        <View style={StyleSheet.absoluteFill}>
          <View style={{ flexDirection: 'row', height: '100%' }}>
            {WEEK_DAYS.map((_, index) => (
              <View
                key={index}
                style={{
                  width: SCREEN_WIDTH / 7,
                  borderRightWidth: index !== WEEK_DAYS.length - 1 ? 1 : 0,
                  borderRightColor: '#eee',
                }}
              />
            ))}
          </View>
        </View>

        {allItems.map(item => {
          const dateObj = new Date(item.date);
          const dayIndex = daysOfWeek.findIndex(
            d => d.toDateString() === dateObj.toDateString(),
          );
          if (dayIndex === -1) return null;

          const top = parseInt(item.time) * 60;
          const left = (SCREEN_WIDTH / 7) * dayIndex + 60;

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => {
                setSelectedTitle(item.title);
                setModalVisible(true);
              }}
              style={{
                position: 'absolute',
                top,
                left,
                zIndex: 10,
                backgroundColor: COLORS[item.category] || '#888',
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 4,
                maxWidth: SCREEN_WIDTH / 7 - 20,
                overflow: 'hidden',
              }}
            >
              <Text
                style={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 12,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              padding: 10,
              borderRadius: 10,
              width: '50%',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: 'black',
                fontWeight: 'bold',
                marginBottom: 10,
              }}
            >
              Event
            </Text>
            <Text
              style={{
                fontSize: 14,
                textAlign: 'center',
                color: 'black',
                fontWeight: 'bold',
                marginBottom: 10,
              }}
            >
              {selectedTitle}
            </Text>
            <Pressable
              style={{
                backgroundColor: '#1ABC9C',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 6,
              }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  dayContainer: {
    width: SCREEN_WIDTH / 7,
  },
  dayText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: 'black',
  },
  dateText: {
    fontSize: 16,
    color: 'black',
    marginTop: 20,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'column',
    position: 'relative',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
  },
  timeLabel: {
    width: 60,
    textAlign: 'center',
    fontSize: 14,
    color: 'black',
    fontWeight: 'bold',
  },
  gridLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#bbb',
  },
});

export default WeekView;
