import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { Calendar as BigCalendar } from 'react-native-big-calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import dayjs from 'dayjs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { BASE_URL } from '@env';

const EventsCalendar = () => {
  const [events, setEvents] = useState([]);
  const [mode, setMode] = useState('month');
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

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
            const start = new Date(
              dayjs(ticket.employee_arrival_date).startOf('day').toISOString(),
            );
            const end = new Date(
              dayjs(ticket.employee_arrival_date).endOf('day').toISOString(),
            );
            return {
              start,
              end,
              title: `Ticket #${ticket.ticket_id}`,
              ticket,
              ticket_id: ticket.ticket_id,
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
  }, [mode]);

  const handleEventPress = event => {
    navigation.navigate('ViewTickets', { ticketId: event.ticket_id });
  };

  const goToToday = () => setDate(new Date());

  const goToPrevious = () => {
    const newDate =
      mode === 'month'
        ? dayjs(date).subtract(1, 'month')
        : mode === 'week'
        ? dayjs(date).subtract(1, 'week')
        : dayjs(date).subtract(1, 'day');
    setDate(newDate.toDate());
  };

  const goToNext = () => {
    const newDate =
      mode === 'month'
        ? dayjs(date).add(1, 'month')
        : mode === 'week'
        ? dayjs(date).add(1, 'week')
        : dayjs(date).add(1, 'day');
    setDate(newDate.toDate());
  };

  const formatDateHeader = () => {
    if (mode === 'month') return dayjs(date).format('MMMM YYYY');
    if (mode === 'week') {
      const start = dayjs(date).startOf('week');
      const end = dayjs(date).endOf('week');
      return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
    }
    return dayjs(date).format('dddd, MMMM D, YYYY');
  };

  const groupedEvents = events.reduce((acc, evt) => {
    const dateKey = dayjs(evt.start).format('YYYY-MM-DD');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(evt);
    return acc;
  }, {});

  return (
    <>
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}> Calendar</Text>
      </View>

      <GestureHandlerRootView style={styles.wrapper}>
        <View style={styles.header}>
          <View style={styles.navRow}>
            <TouchableOpacity onPress={goToPrevious} style={styles.navButton}>
              <Text style={styles.navText}>◀</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
              <Text style={styles.todayText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goToNext} style={styles.navButton}>
              <Text style={styles.navText}>▶</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.dateText}>{formatDateHeader()}</Text>
          </View>

          <View style={styles.modeRow}>
            {['month', 'week', 'day', 'agenda'].map(view => (
              <TouchableOpacity
                key={view}
                style={[
                  styles.viewButton,
                  mode === view && styles.viewButtonActive,
                ]}
                onPress={() => setMode(view)}
              >
                <Text
                  style={[
                    styles.viewText,
                    mode === view && styles.viewTextActive,
                  ]}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#069b7c" />
          </View>
        ) : mode === 'agenda' ? (
          <ScrollView>
            {Object.keys(groupedEvents)
              .sort()
              .map(date => (
                <View key={date} style={styles.agendaSection}>
                  <Text style={styles.agendaDate}>
                    {dayjs(date).format('dddd, MMMM D, YYYY')}
                  </Text>
                  {groupedEvents[date].map((evt, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.agendaCard}
                      onPress={() => handleEventPress(evt)}
                    >
                      <Text style={styles.agendaTime}>
                        {dayjs(evt.start).format('h:mm A')}
                      </Text>
                      <Text style={styles.agendaTitle}>
                        Ticket #{evt.ticket.ticket_id}
                      </Text>
                      <Text style={styles.agendaLocation}>
                        {evt.ticket.address}, {evt.ticket.city_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
          </ScrollView>
        ) : (
          <BigCalendar
            events={events}
            height={680}
            mode={mode}
            date={date}
            onPressEvent={handleEventPress}
            swipeEnabled
            maxVisibleEventCount={9999}
            eventCellStyle={{
              backgroundColor: '#069b7c',
              borderRadius: 6,
              padding: 2,
              minHeight: 22,
              justifyContent: 'center',
            }}
            calendarCellStyle={{
              borderWidth: 0.1,
              borderColor: '#ccc',
              backgroundColor: '#f8f9fa',
            }}
            calendarCellTextStyle={{
              color: '#000',
              marginTop: 10,
              fontSize: 14,
              fontWeight: 'bold',
            }}
            headerContentStyle={{
              backgroundColor: '#fff',
              paddingVertical: 6,
              borderBottomColor: '#CCC',
              borderBottomWidth: 1,
            }}
            hourStyle={{
              fontSize: 14,
              color: '#000',
              fontWeight: '600',
            }}
            weekDayLabelStyle={{
              fontSize: 14,
              color: 'black',
              fontWeight: 'bold',
            }}
            weekDayHeaderHighlightColor="#000"
          />
        )}
      </GestureHandlerRootView>

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
          <Ionicons name="calendar" size={30} color="#069b7c" />
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
    </>
  );
};
export default EventsCalendar;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f2f4f7',
    marginBottom: 80,
  },

  topHeader: {
    backgroundColor: '#069b7c',
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 16,
    elevation: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#e0f2f1',
  },
  navText: {
    fontSize: 18,
    color: '#069b7c',
    fontWeight: 'bold',
  },
  todayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#069b7c',
    borderRadius: 6,
  },
  todayText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  titleRow: {
    marginTop: 10,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  modeRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  viewButtonActive: {
    backgroundColor: '#069b7c',
  },
  viewText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
  },
  viewTextActive: {
    color: '#fff',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agendaSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  agendaDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    // marginBottom: 10,
  },
  agendaCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 4,
  },
  agendaTime: {
    fontSize: 14,
    color: '#888',
    fontWeight: 'bold',
  },
  agendaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    color: '#888',
  },
  agendaLocation: {
    fontSize: 14,
    color: '#888',
    fontWeight: 'bold',
    marginTop: 2,
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
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
  },
  navTexts: {
    fontSize: 14,
    color: '#888',
    fontWeight: 'bold',
    marginTop: 4,
  },
});
