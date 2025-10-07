import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
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
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

const screenWidth = Dimensions.get('window').width;
const isTablet = screenWidth > 600;

const ITEM_WIDTH = isTablet ? screenWidth / 7 : 63;
const AGENDA_ITEM_HEIGHT = 74;

const EventsCalendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format('YYYY-MM-DD'),
  );
  const [activeTab, setActiveTab] = useState('agenda');
  const [loading, setLoading] = useState(false);
  const [allDates, setAllDates] = useState([]);
  const [allDatesWithMonth, setAllDatesWithMonth] = useState([]);
  const [visibleMonth, setVisibleMonth] = useState(dayjs().format('MMMM YYYY'));
  const [showFullAgenda, setShowFullAgenda] = useState(false); // <-- new state

  const navigation = useNavigation();
  const flatListRef = useRef();
  const agendaRef = useRef();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const userId = await AsyncStorage.getItem('userId');
        const res = await axios.get(
          `${BASE_URL}/api/tickets/employee/${userId}`,
        );
        const tickets = res.data?.list || [];
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
    const startOfYear = dayjs().startOf('year');
    const endOfYear = dayjs().endOf('year');
    const tempDatesWithMonth = [];
    let curr = startOfYear.clone();
    while (curr.isBefore(endOfYear) || curr.isSame(endOfYear, 'day')) {
      tempDatesWithMonth.push({
        date: curr.format('YYYY-MM-DD'),
        monthHeader: curr.date() === 1,
      });
      curr = curr.add(1, 'day');
    }
    setAllDatesWithMonth(tempDatesWithMonth);

    const tempDates = [];
    let currDate = startOfYear.clone();
    while (currDate.isBefore(endOfYear) || currDate.isSame(endOfYear, 'day')) {
      tempDates.push(currDate.format('YYYY-MM-DD'));
      currDate = currDate.add(1, 'day');
    }
    setAllDates(tempDates);
  }, []);

  useEffect(() => {
    if (allDatesWithMonth.length > 0 && flatListRef.current) {
      const startOfWeek = dayjs().startOf('week');
      const weekStartIndex = allDatesWithMonth.findIndex(item =>
        dayjs(item.date).isSame(startOfWeek, 'day'),
      );
      if (weekStartIndex >= 0) {
        flatListRef.current.scrollToIndex({
          index: weekStartIndex,
          animated: true,
        });
      }
    }
  }, [allDatesWithMonth]);

  const handleEventPress = evt => {
    navigation.navigate('ViewTickets', { ticketId: evt.ticket.ticket_id });
  };

  const onAgendaViewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const firstDate = viewableItems[0].item;
      setVisibleMonth(dayjs(firstDate).format('MMMM YYYY'));
    }
  };

  const agendaViewabilityConfig = { itemVisiblePercentThreshold: 50 };

  const today = dayjs().format('YYYY-MM-DD');
  const filteredDatesFromToday = allDates.filter(
    date => dayjs(date).isSame(today) || dayjs(date).isAfter(today),
  );

  useEffect(() => {
    if (showFullAgenda && agendaRef.current) {
      const todayIndex = allDates.findIndex(d =>
        dayjs(d).isSame(dayjs(), 'day'),
      );
      if (todayIndex >= 0) {
        agendaRef.current.scrollToIndex({ index: todayIndex, animated: true });
      }
    }
  }, [showFullAgenda]);

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
          data={allDatesWithMonth}
          keyExtractor={item => item.date}
          getItemLayout={(data, index) => ({
            length: ITEM_WIDTH,
            offset: ITEM_WIDTH * index,
            index,
          })}
          renderItem={({ item }) => {
            const isToday = item.date === today;
            return (
              <View style={{ alignItems: 'center', width: ITEM_WIDTH }}>
                <TouchableOpacity
                  style={{ alignItems: 'center', paddingVertical: 6 }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#000',
                      fontWeight: 'bold',
                      marginBottom: 4,
                    }}
                  >
                    {dayjs(item.date).format('ddd')}
                  </Text>

                  {item.monthHeader && (
                    <View
                      style={{
                        marginVertical: 2,
                        backgroundColor: '#008080',
                        paddingHorizontal: 4,
                        paddingVertical: 1,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 'bold',
                          textAlign: 'center',
                        }}
                      >
                        {dayjs(item.date).format('MMM')}
                      </Text>
                    </View>
                  )}

                  <View
                    style={{
                      marginTop: 4,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: isToday ? '#008080' : 'transparent',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: isToday ? '#fff' : '#555',
                      }}
                    >
                      {dayjs(item.date).format('D')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'agenda' ? (
          <FlatList
            ref={agendaRef}
            data={showFullAgenda ? allDates : filteredDatesFromToday}
            keyExtractor={item => item}
            contentContainerStyle={{ paddingBottom: 10 }}
            getItemLayout={(data, index) => ({
              length: AGENDA_ITEM_HEIGHT,
              offset: AGENDA_ITEM_HEIGHT * index,
              index,
            })}
            initialScrollIndex={0}
            renderItem={({ item }) => (
              <View style={styles.agendaSection}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.agendaDate}>
                    {dayjs(item).isSame(dayjs(), 'day')
                      ? `${dayjs(item).format('MMM D')} Today`
                      : dayjs(item).format('ddd, MMM D')}
                  </Text>
                  {dayjs(item).isSame(dayjs(), 'day') && !showFullAgenda && (
                    <TouchableOpacity
                      style={{ marginLeft: 6 }}
                      onPress={() => setShowFullAgenda(true)}
                    >
                      <Ionicons
                        name="arrow-down-circle"
                        size={20}
                        color="#008080"
                      />
                    </TouchableOpacity>
                  )}
                </View>

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
                            marginTop: 10,
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
                              fontSize: 14,
                              marginBottom: 3,
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
            onViewableItemsChanged={onAgendaViewableItemsChanged}
            viewabilityConfig={agendaViewabilityConfig}
          />
        ) : (
          <View style={{ flex: 1 }}></View>
        )}
      </View>

      {activeTab === 'day' && (
        <ScrollView
          style={{ flex: 1, marginTop: -550 }}
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
          <FontAwesome name="home" size={26} color="#888" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('EventsCalendar')}
        >
          <Ionicons name="calendar" size={26} color="#008080" />
          <Text style={styles.navText}>Calendar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('EventsOverview')}
        >
          <MaterialIcons name="event" size={26} color="#888" />
          <Text style={styles.navText}>Events</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('ProfileScreen')}
        >
          <FontAwesome name="user" size={26} color="#888" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#008080',
    paddingVertical: 30,
    paddingHorizontal: 16,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 14, color: '#888', fontWeight: 'bold', marginTop: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
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
  activeTab: { backgroundColor: '#008080' },
  tabText: { fontSize: 14, color: '#555', fontWeight: '600' },
  activeText: { color: '#fff' },
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
