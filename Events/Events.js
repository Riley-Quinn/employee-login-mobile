import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from 'react-native-modal';

const EventsOverview = () => {
  const [eventType, setEventType] = useState('Scheduled');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false); // modal state
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
        `http://10.0.2.2:5000/api/tickets/employee/${userId}`,
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

  const renderItem = ({ item }) => {
    const address = `${item.address}, ${item.state_name}`;

    return (
      <View style={styles.ticketCard}>
        <View style={styles.card}>
          <View style={styles.cards}>
            <View style={styles.avatars}>
              <FontAwesome name="ticket" size={24} color="#fff" />
            </View>
            <Text style={styles.serviceId}>#{item.ticket_service_id}</Text>
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
              <Text style={styles.emptyText}>No tickets found.</Text>
            </View>
          ) : (
            <FlatList
              data={rows}
              keyExtractor={item => item.ticket_id.toString()}
              renderItem={renderItem}
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
    marginVertical: 8,
    marginHorizontal: 10,
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
    width: 100,
    marginHorizontal: 40,
  },

  colon: {
    marginHorizontal: 2,
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
  picker: {
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: 8,
  },
  dropdownContainer: {
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    paddingHorizontal: 8,
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
