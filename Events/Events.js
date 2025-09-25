import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from 'react-native-modal';

import { BASE_URL } from '@env';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const EventsOverview = () => {
  const [eventType, setEventType] = useState('Scheduled');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const navigation = useNavigation();

  const eventOptions = [
    { label: 'Scheduled', value: 'Scheduled' },
    { label: 'Unscheduled', value: 'Unscheduled' },
  ];

  useEffect(() => {
    const loadUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
    };
    loadUserId();
  }, []);

  const fetchTickets = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await axios.get(
        `${BASE_URL}/api/tickets/employee/${userId}`,
        { params: { status_id: 2 } },
      );

      const tickets = response.data?.list || [];

      const scheduledTickets = tickets.filter(t => t.employee_arrival_date);
      const unscheduledTickets = tickets.filter(t => !t.employee_arrival_date);

      setRows(
        eventType === 'Scheduled' ? scheduledTickets : unscheduledTickets,
      );
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, eventType]);

  useEffect(() => {
    if (userId) fetchTickets();
  }, [fetchTickets, userId, eventType]);
  const BlinkingText = ({ children, style, duration = 500 }) => {
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      const blink = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
        ]),
      );
      blink.start();
      return () => blink.stop();
    }, [opacity, duration]);

    return (
      <Animated.Text style={[style, { opacity }]}>{children}</Animated.Text>
    );
  };
  const renderItem = ({ item }) => {
    const address = `${item.address}, ${item.state_name}`;

    return (
      <View style={[styles.ticketCard, isTablet && { flex: 0.48 }]}>
        <View style={styles.card}>
          <View style={styles.cards}>
            <View style={styles.avatars}>
              <FontAwesome name="ticket" size={24} color="#fff" />
            </View>
            <Text style={styles.serviceId}>{item.title}</Text>
          </View>
          <View style={styles.infoSection}>
            <View style={styles.row}>
              <Text style={styles.label}>Category</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{item.category_name}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>
                {item.city_name}, {item.region_name}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>ArrivalDate</Text>
              <Text style={styles.colon}>:</Text>
              <BlinkingText style={styles.value}>
                {item.employee_arrival_date
                  ? dayjs
                      .utc(item.employee_arrival_date)
                      .local()
                      .format('YYYY-MM-DD h:mm A')
                  : ''}
              </BlinkingText>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Customer</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{item.customer_name}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{item.customer_phone}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#008080" />

      <SafeAreaView style={{ backgroundColor: '#008080', flex: 0 }}>
        <Text style={styles.ticketNumber}>Events</Text>
      </SafeAreaView>

      <View style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.filterIconContainer}>
            <TouchableOpacity onPress={() => setIsFilterVisible(true)}>
              <MaterialIcons name="filter-list" size={30} color="#008080" />
            </TouchableOpacity>

            <Modal
              isVisible={isFilterVisible}
              onBackdropPress={() => setIsFilterVisible(false)}
              style={{ justifyContent: 'flex-start', margin: 0 }}
            >
              <View
                style={{
                  backgroundColor: '#fff',
                  padding: 15,
                  marginHorizontal: 20,
                  marginTop: 350,
                  borderRadius: 12,
                }}
              >
                {eventOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      setEventType(option.value);
                      setIsFilterVisible(false);
                    }}
                    style={{
                      paddingVertical: 10,
                      borderBottomWidth: 0.5,
                      borderBottomColor: '#ccc',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight:
                          eventType === option.value ? 'bold' : 'normal',
                        color: eventType === option.value ? '#008080' : '#000',
                      }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Modal>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#00bdaa"
              style={{ marginTop: 40 }}
            />
          ) : rows.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No tickets are Scheduled Today.
              </Text>
            </View>
          ) : (
            <FlatList
              data={rows}
              keyExtractor={item => item.ticket_id.toString()}
              renderItem={renderItem}
              numColumns={isTablet ? 2 : 1}
              key={isTablet ? 'tablet' : 'phone'}
              columnWrapperStyle={
                isTablet
                  ? { justifyContent: 'space-between', marginBottom: 4 }
                  : undefined
              }
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <FontAwesome name="home" size={30} color="#888" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('EventsCalendar')}
        >
          <Ionicons name="calendar" size={30} color="#888" />
          <Text style={styles.navText}>Calendar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('EventsOverview')}
        >
          <MaterialIcons name="event" size={30} color="#008080" />
          <Text style={styles.navText}>Events</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('ProfileScreen')}
        >
          <FontAwesome name="user" size={30} color="#888" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default EventsOverview;

const styles = StyleSheet.create({
  ticketNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
    color: '#fff',
  },
  filterIconContainer: {
    alignItems: 'flex-end',
    marginHorizontal: 15,
    marginVertical: 10,
  },
  avatars: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#008080',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#f2f4f7',
    padding: 18,
  },
  card: {
    marginBottom: 12,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginVertical: isTablet ? 4 : 8,

    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  cards: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#008080',
  },
  infoSection: {
    marginVertical: 10,
    marginLeft: 40,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'flex-start',
  },

  label: {
    fontWeight: 'bold',
    color: '#888',
    fontSize: 14,
    width: 90,
  },

  colon: {
    marginHorizontal: 4,
    fontWeight: 'bold',
    color: '#888',
  },

  value: {
    flex: 1,
    color: '#008080',
    fontWeight: '500',
    fontSize: 14,
    flexWrap: 'wrap',
  },

  field: {
    fontSize: 14,
    color: '#888',
    fontWeight: 'bold',
    marginTop: 2,
  },

  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    fontWeight: 'bold',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 14,
    color: '#888',
    fontWeight: 'bold',
    marginTop: 4,
  },
});
