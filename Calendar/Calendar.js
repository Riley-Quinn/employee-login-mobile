import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const screenWidth = Dimensions.get('window').width;

const EventsCalendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format('YYYY-MM-DD'),
  );
  const [activeTab, setActiveTab] = useState('agenda');
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('MMMM YYYY'));

  const navigation = useNavigation();

  // For FlatList month header update
  const viewabilityConfig = { itemVisiblePercentThreshold: 10 };
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      const firstVisible = viewableItems[0].item;
      const newMonth = dayjs(firstVisible).format('MMMM YYYY');
      setCurrentMonth(newMonth);
    }
  }).current;

  // Fetch tickets
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const userId = await AsyncStorage.getItem('userId');
        const response = await axios.get(
          `${BASE_URL}/api/tickets/employee/${userId}`,
        );
        const tickets = response.data?.list || [];
        const mapped = tickets
          .filter(t => t.employee_arrival_date)
          .map(ticket => {
            // Keep all dates in local timezone
            const dateObj = dayjs(ticket.employee_arrival_date);
            return {
              date: dateObj.format('YYYY-MM-DD'),
              title: `${ticket.ticket_id}`,
              Title: `${ticket.title}`,

              time: dateObj.format('h:mm A'),
              ticket,
            };
          });
        setEvents(mapped);
      } catch (err) {
        console.error('Failed to fetch events', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Generate dates for FlatList
  useEffect(() => {
    const start = dayjs().subtract(365, 'day');
    const end = dayjs().add(365, 'day');
    const temp = [];
    let curr = start.clone();
    while (curr.isBefore(end) || curr.isSame(end, 'day')) {
      temp.push(curr.clone());
      curr = curr.add(1, 'day');
    }
    setDates(temp);
  }, []);

  // Group events by date
  const groupedEvents = events.reduce((acc, evt) => {
    if (!acc[evt.date]) acc[evt.date] = [];
    acc[evt.date].push(evt);
    return acc;
  }, {});

  const handleEventPress = evt => {
    navigation.navigate('ViewTickets', { ticketId: evt.ticket.ticket_id });
  };

  const renderDayItem = ({ item }) => {
    const isSelected = item.isSame(dayjs(selectedDate), 'day');
    return (
      <TouchableOpacity
        onPress={() => setSelectedDate(item.format('YYYY-MM-DD'))}
        style={styles.dayContainer}
      >
        <Text style={styles.dayName}>{item.format('ddd')}</Text>
        <Text style={isSelected ? styles.selectedDayNumber : styles.dayNumber}>
          {item.format('D')}
        </Text>
        {events.find(e => e.date === item.format('YYYY-MM-DD')) && (
          <View style={styles.eventDot} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f2f4f7' }}>
      <StatusBar barStyle="light-content" backgroundColor="#008080" />
      <View style={styles.headerWrapper}>
        <Text style={styles.headerTitle}>Calendar</Text>
      </View>

      {loading && (
        <ActivityIndicator
          size="large"
          color="#008080"
          style={{ marginTop: 20 }}
        />
      )}

      <View style={styles.monthContainer}>
        <Text style={styles.monthText}>{currentMonth}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'agenda' && styles.activeTab]}
          onPress={() => setActiveTab('agenda')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'agenda' && styles.activeText,
            ]}
          >
            Agenda
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'day' && styles.activeTab]}
          onPress={() => setActiveTab('day')}
        >
          <Text
            style={[styles.tabText, activeTab === 'day' && styles.activeText]}
          >
            Day
          </Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal days FlatList */}
      <FlatList
        data={dates}
        renderItem={renderDayItem}
        keyExtractor={item => item.format('YYYY-MM-DD')}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 10 }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        extraData={currentMonth}
        initialScrollIndex={dates.findIndex(d => d.isSame(dayjs(), 'day'))}
        getItemLayout={(data, index) => ({
          length: 68,
          offset: 68 * index,
          index,
        })}
      />

      {activeTab === 'agenda' && (
        <ScrollView style={{ flex: 1, marginTop: -800 }}>
          {dates.map(date => {
            const dateStr = date.format('YYYY-MM-DD');
            return (
              <View key={dateStr} style={styles.agendaSection}>
                <Text style={styles.agendaDate}>
                  {date.isSame(dayjs(), 'day')
                    ? `${date.format('MMM D')} Today`
                    : date.format('ddd, MMM D')}
                </Text>

                {groupedEvents[dateStr]?.length > 0 ? (
                  groupedEvents[dateStr].map((e, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.agendaCard}
                      onPress={() => handleEventPress(e)}
                    >
                      <Text style={styles.agendaTime}>{e.time}</Text>
                      <Text style={styles.agendaTitle}>{e.title}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noEvents}>No events</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* {activeTab === 'agenda' && (
        <ScrollView style={{ flex: 1, marginTop: -600 }}>
          <View style={styles.agendaSection}>
            <Text style={styles.agendaDate}>
              {dayjs(selectedDate).isSame(dayjs(), 'day')
                ? `${dayjs(selectedDate).format('MMM D')} Today`
                : dayjs(selectedDate).format('ddd, MMM D')}
            </Text>

            {(groupedEvents[selectedDate]?.length > 0
              ? groupedEvents[selectedDate]
              : []
            ).map((e, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.agendaCard,
                  { flexDirection: 'row', alignItems: 'flex-start' },
                ]}
                onPress={() => handleEventPress(e)}
              >
                <View
                  style={{ width: 70, alignItems: 'flex-end', paddingRight: 8 }}
                >
                  <Text style={styles.agendaTime}>{e.time}</Text>
                </View>

                <View
                  style={{
                    width: 1,
                    backgroundColor: '#888',
                    marginRight: 8,
                    height: '100%',
                  }}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.agendaTitle}>{e.Title}</Text>
                  <Text style={{ fontSize: 13, color: '#000' }}>{e.title}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {(!groupedEvents[selectedDate] ||
              groupedEvents[selectedDate].length === 0) && (
              <Text style={styles.noEvents}>No events</Text>
            )}
          </View>
        </ScrollView>
      )} */}

      {activeTab === 'day' && (
        <ScrollView
          style={{ flex: 1, marginTop: -720 }}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View style={{ flex: 1, paddingLeft: 0, position: 'relative' }}>
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 60,
                width: 1,
                height: '100%',
                backgroundColor: '#bbb',
                zIndex: 0,
              }}
            />

            {Array.from({ length: 24 }).map((_, hour) => {
              const hourLabel = dayjs(selectedDate)
                .hour(hour)
                .minute(0)
                .format('h A');

              const hourEvents = (groupedEvents[selectedDate] || []).filter(
                evt => {
                  const evtHour = parseInt(
                    dayjs(evt.ticket.employee_arrival_date).format('H'),
                  );
                  return evtHour === hour;
                },
              );

              const rowHeight = 60 + hourEvents.length * 50;

              return (
                <View
                  key={hour}
                  style={{
                    flexDirection: 'row',
                    height: rowHeight,
                    alignItems: 'flex-start',
                    marginBottom: 2,
                    borderBottomWidth: 1,
                    borderBottomColor: '#ddd',
                  }}
                >
                  {/* Hour label */}
                  <Text
                    style={{
                      width: 60,
                      textAlign: 'right',
                      paddingRight: 4,
                      fontSize: 12,
                      color: '#555',
                    }}
                  >
                    {hourLabel}
                  </Text>

                  <View style={{ flex: 1, paddingLeft: 10 }}>
                    {hourEvents.length > 0 ? (
                      hourEvents.map((e, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={{
                            backgroundColor: '#008080',
                            padding: 6,
                            borderRadius: 6,
                            marginBottom: 4,
                          }}
                          onPress={() => handleEventPress(e)}
                        >
                          <Text style={{ color: '#fff', fontSize: 12 }}>
                            {e.time}
                          </Text>
                          <Text
                            style={{
                              color: '#fff',
                              fontSize: 14,
                              fontWeight: 'bold',
                            }}
                          >
                            {e.title}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={{ height: 20 }} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <FontAwesome name="home" size={30} color="#888" />
          <Text style={styles.navTexts}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('EventsCalendar')}
        >
          <Ionicons name="calendar" size={30} color="#008080" />
          <Text style={styles.navTexts}>Calendar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('EventsOverview')}
        >
          <MaterialIcons name="event" size={30} color="#888" />
          <Text style={styles.navTexts}>Events</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('ProfileScreen')}
        >
          <FontAwesome name="user" size={30} color="#888" />
          <Text style={styles.navTexts}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EventsCalendar;

// Styles
const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#008080',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  monthContainer: {
    alignItems: 'flex-start',
    marginVertical: 8,
    marginTop: 30,
    paddingLeft: 20,
  },
  monthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  tabRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginVertical: 6,
    marginLeft: 20,
  },

  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  activeTab: {
    backgroundColor: '#008080',
  },
  tabText: {
    fontSize: 14,
    color: '#555',

    fontWeight: '600',
  },
  activeText: {
    color: '#fff',
  },
  dayContainer: {
    width: 60,
    alignItems: 'center',
    marginHorizontal: 4,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dayName: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },
  dayNumber: {
    fontSize: 16,
    color: '#555',
    fontWeight: 'bold',
  },
  selectedDayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#008080',
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    color: '#008080',
    marginTop: 4,
  },
  agendaSection: {
    padding: 16,

    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  agendaDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  agendaCard: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 3,
  },
  agendaTime: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
  },
  agendaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  noEvents: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  navItem: {
    alignItems: 'center',
  },
  hourRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    alignItems: 'flex-start',
  },
  hourLabel: {
    width: 50,
    fontSize: 12,
    color: '#222',
    fontWeight: '600',
  },
  navTexts: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
});
