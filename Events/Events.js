import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
// import { Picker } from '@react-native-picker/picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { BASE_URL } from '@env';

const EventsOverview = () => {
  const [eventType, setEventType] = useState('Scheduled');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const navigation = useNavigation();

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

  const renderItem = ({ item }) => {
    const address = `${item.address}, ${item.state_name}`;

    return (
      <View style={styles.card}>
        <View style={styles.cards}>
          <Text style={styles.serviceId}>#{item.ticket_service_id}</Text>
          <Text style={styles.field}>{address}</Text>
          <Text style={styles.field}>
            {item.customer_name}
            {'   '}
            {item.customer_phone}
          </Text>

          <Text style={styles.field}>
            {item.category_name}
            {'   '}
            {item.description}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <View View style={styles.title}>
        <Text style={styles.ticketNumber}>Events</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.dropdownContainer}>
            {/* <Picker
              selectedValue={eventType}
              onValueChange={value => setEventType(value)}
              style={styles.picker}
            >
              <Picker.Item label="Scheduled" value="Scheduled" />
              <Picker.Item label="Unscheduled" value="Unscheduled" />
            </Picker> */}
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
          <MaterialIcons name="event" size={30} color="#069b7c" />
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
  title: {
    backgroundColor: '#069b7c',
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 16,
    elevation: 4,
    // paddingTop: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#f2f4f7',
    padding: 18,
  },

  card: {
    backgroundColor: '#fff',
    marginBottom: 30,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    borderWidth: 1,
    borderColor: '#bbb',
  },
  cards: {
    gap: 6,
  },
  serviceId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
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
