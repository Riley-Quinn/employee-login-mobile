import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import dayjs from 'dayjs';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from '@env';

const screenWidth = Dimensions.get('window').width;

const EventsCalendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format('YYYY-MM-DD'),
  );
  const [activeTab, setActiveTab] = useState('agenda');
  const [loading, setLoading] = useState(false);
  const [allDates, setAllDates] = useState([]);
  const [visibleMonth, setVisibleMonth] = useState(dayjs().format('MMMM YYYY'));

  const navigation = useNavigation();
  const flatListRef = useRef();

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
            const dateObj = dayjs(ticket.employee_arrival_date);
            return {
              date: dateObj.format('YYYY-MM-DD'),
              title: `${ticket.region_name}`,
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

  const groupedEvents = events.reduce((acc, evt) => {
    if (!acc[evt.date]) acc[evt.date] = [];
    acc[evt.date].push(evt);
    return acc;
  }, {});

  useEffect(() => {
    const start = dayjs().startOf('year');
    const end = dayjs().endOf('year');
    const tempDates = [];
    let curr = start.clone();
    while (curr.isBefore(end) || curr.isSame(end, 'day')) {
      tempDates.push(curr.format('YYYY-MM-DD'));
      curr = curr.add(1, 'day');
    }
    setAllDates(tempDates);
  }, []);

  const handleEventPress = evt => {
    navigation.navigate('ViewTickets', { ticketId: evt.ticket.ticket_id });
  };

  const onViewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const firstDate = viewableItems[0].item;
      setVisibleMonth(dayjs(firstDate).format('MMMM YYYY'));
    }
  };

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

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

      <View style={{ alignItems: 'center', marginVertical: 6 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#000',
            marginTop: 10,
          }}
        >
          {visibleMonth}
        </Text>
      </View>

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

      <View style={{ paddingVertical: 10 }}>
        <FlatList
          ref={flatListRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          data={allDates}
          keyExtractor={item => item}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item }) => {
            const isSelected = item === selectedDate;
            return (
              <TouchableOpacity
                onPress={() => setSelectedDate(item)}
                style={{
                  width: 40,
                  alignItems: 'center',
                  marginHorizontal: 3,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{ fontSize: 12, color: '#000', fontWeight: 'bold' }}
                >
                  {dayjs(item).format('ddd')}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: isSelected ? '#008080' : '#555',
                  }}
                >
                  {dayjs(item).format('D')}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'agenda' ? (
          <FlatList
            data={allDates}
            keyExtractor={item => item}
            contentContainerStyle={{ paddingBottom: 10 }}
            renderItem={({ item }) => (
              <View style={styles.agendaSection}>
                <Text style={styles.agendaDate}>
                  {dayjs(item).isSame(dayjs(), 'day')
                    ? `${dayjs(item).format('MMM D')} Today`
                    : dayjs(item).format('ddd, MMM D')}
                </Text>
                {groupedEvents[item]?.length > 0 ? (
                  groupedEvents[item].map((e, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.agendaCard}
                      onPress={() => handleEventPress(e)}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: 'bold',
                            color: '#000',
                            fontSize: 12,
                            width: 60,
                          }}
                        >
                          {e.time}
                        </Text>
                        <View
                          style={{
                            width: 1,
                            backgroundColor: '#000',
                            marginHorizontal: 5,
                            height: 36,
                          }}
                        />
                        <View style={{ flexDirection: 'column' }}>
                          <Text
                            style={{
                              fontWeight: 'bold',
                              color: '#000',
                              fontSize: 12,
                            }}
                          >
                            {e.Title}
                          </Text>
                          <Text
                            style={{
                              fontWeight: 'bold',
                              color: '#555',
                              fontSize: 12,
                            }}
                          >
                            {e.title}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text
                    style={{ marginLeft: 10, color: '#888', marginBottom: 4 }}
                  >
                    No events
                  </Text>
                )}
              </View>
            )}
          />
        ) : (
          <View style={{ flex: 1 }}>
            <View
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 60, // j
                width: 1,
                backgroundColor: '#444',
              }}
            />

            <FlatList
              data={Array.from({ length: 24 })}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ _, index: hour }) => {
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

                return (
                  <View style={{ height: 60, justifyContent: 'center' }}>
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 60,
                        right: 0,
                        height: 1,
                        backgroundColor: '#444',
                      }}
                    />

                    <View style={{ flexDirection: 'row', flex: 1 }}>
                      <Text
                        style={{
                          width: 60,
                          textAlign: 'right',
                          paddingRight: 6,
                          fontSize: 12,
                          color: '#000',
                        }}
                      >
                        {hourLabel}
                      </Text>

                      <View style={{ flex: 1 }}>
                        {hourEvents.map((e, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={{
                              backgroundColor: '#008080',
                              padding: 6,
                              borderRadius: 6,
                              margin: 4,
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
                        ))}
                      </View>
                    </View>
                  </View>
                );
              }}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#008080',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
    marginLeft: 10,
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
  agendaSection: {
    padding: 12,
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

    backgroundColor: '#fff',
    elevation: 1,
  },
});

export default EventsCalendar;
