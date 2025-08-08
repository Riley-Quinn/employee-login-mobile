/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  FlatList,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FormatStatusTrackerData from './FormatStatusTrackerData';
import AddConversation from './Conversation';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { BASE_URL } from '@env';

const ViewTickets = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const ticketId = route.params?.ticketId;
  const [emailPopup, setEmailPopup] = useState(null);

  const [ticket, setTicket] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const storedId = await AsyncStorage.getItem('userId');
        if (storedId) {
          setUserId(storedId);
        }
      } catch (err) {
        console.error('Error getting userId from AsyncStorage:', err);
      }
    };
    init();
  }, []);

  const fetchTicket = useCallback(async () => {
    if (!userId || !ticketId) {
      console.warn('Missing userId or ticketId');
      return;
    }

    try {
      const res = await axios.get(`${BASE_URL}/api/tickets/${ticketId}`, {
        params: {
          userId,
        },
      });

      if (res.status === 200) {
        setTicket(res.data.list);
      } else {
        Alert.alert('Error', 'Unexpected response from server');
      }
    } catch (err) {
      console.error(
        'Error fetching ticket:',
        err?.response?.status || err.message,
      );

      if (err?.response?.status === 401) {
        Alert.alert('Unauthorized', 'You are not allowed to view this ticket');
      } else {
        Alert.alert('Error', 'Unable to load ticket');
      }

      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [ticketId, userId, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (userId) fetchTicket();
    }, [userId, fetchTicket]),
  );

  const handleMediaOpen = fileName => {
    const url = `https://your-cdn-domain.com/${fileName}`;
    Linking.openURL(url);
  };

  if (loading || !ticket) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }
  const openMap = (address, city, state) => {
    const query = encodeURIComponent(`${address}, ${city}, ${state}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {ticket.status_tracker && (
          <View style={styles.card}>
            <FormatStatusTrackerData trackingData={ticket.status_tracker} />
          </View>
        )}
        <View style={styles.ticketCard}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={24} color="#fff" />
            </View>
            <Text style={styles.customerNameText}>{ticket.customer_name}</Text>
            <View style={styles.badgeNew}>
              <Text style={styles.badgeText}>{ticket.priority_rank}</Text>
            </View>
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.labelText}>
              Customer:{' '}
              <Text style={styles.valueText}>{ticket.customer_name}</Text>
            </Text>

            <Text style={styles.labelText}>
              Address:{' '}
              <Text style={styles.valueText}>
                {`, ${ticket.city_name}, ${ticket.region_name},`}
              </Text>
            </Text>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 6,
              }}
              onPress={() =>
                openMap(ticket.address, ticket.city_name, ticket.state_name)
              }
            >
              <Text style={styles.viewMapText}>
                View Location on Google Maps
              </Text>
            </TouchableOpacity>

            <Text style={styles.labelText}>
              Phone:{' '}
              <Text style={styles.valueText}>{ticket.customer_phone}</Text>
            </Text>

            <Text style={styles.labelText}>
              Email:{' '}
              <Text style={styles.valueText}>{ticket.customer_email}</Text>
            </Text>
          </View>

          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={24} color="#fff" />
            </View>
            <Text style={styles.createdLabel}>Created on</Text>

            <View style={styles.badgeNew}>
              <Text style={styles.badgeText}>{ticket.status_name}</Text>
            </View>
          </View>
          <Text style={styles.dateOnlyText}>
            {ticket.created_at?.split('T')[0]}
          </Text>
        </View>

        {(ticket.feedback || ticket.rating) && (
          <View style={styles.ticketCard}>
            {ticket.feedback && (
              <Text style={styles.subText}>Feedback: {ticket.feedback}</Text>
            )}
            {ticket.rating && (
              <Text style={styles.subText}>Rating: {ticket.rating}/5</Text>
            )}
          </View>
        )}

        <View style={styles.cards}>
          <AddConversation
            user={{ userId }}
            data={ticket}
            customerComments={ticket?.customer_comments}
            fetchData={fetchTicket}
          />
        </View>

        {ticket?.multimedia?.length > 0 && (
          <View style={styles.Media}>
            <Text style={styles.sectionTitle}>Media</Text>
            <FlatList
              data={ticket.multimedia}
              horizontal
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleMediaOpen(item.file_name)}
                >
                  {item.file_type === 'Photo' ? (
                    <Image
                      source={{
                        uri: `https://your-cdn-domain.com/${item.file_name}`,
                      }}
                      style={styles.media}
                    />
                  ) : (
                    <Text style={styles.video}>[Video] {item.file_name}</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#f2f2f2' },
  header: {
    backgroundColor: '#008080',
    height: 50,
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    flexDirection: 'row',
    elevation: 4,
    paddingTop: 20,
  },
  infoSection: {
    marginHorizontal: 40,
  },
  headerTitle: {
    color: '#efedf4',
    fontSize: 18,
    marginLeft: 10,
    fontWeight: 'bold',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  avatar: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#008080',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  customerNameText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  labelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
    marginTop: 6,
  },

  valueText: {
    color: '#008080',
    fontSize: 14,
    fontWeight: '500',
  },
  badgeText: {
    color: '#efedf4',
    fontSize: 14,
    fontWeight: '500',
  },
  viewMapText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },

  dateOnlyText: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 30,
    color: '#333',
  },

  createdLabel: {
    fontSize: 16,
    flex: 1,
    color: '#008080',
    fontWeight: '500',
  },

  Text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
    marginHorizontal: 10,
  },
  scrollContent: { padding: 12, paddingBottom: 30 },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
    marginHorizontal: 10,
  },
  badgeNew: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#000',
    paddingVertical: 2,
    paddingHorizontal: 4,
    flexShrink: 1,
    textAlignVertical: 'center',
  },

  Texts: {
    fontSize: 13,
    color: '#444',
    fontWeight: 'bold',
    padding: 10,
    borderRadius: 8,
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 10,
    lineHeight: 10,
  },
  cards: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    elevation: 2,
  },
  Media: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 25,
    elevation: 2,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginHorizontal: 20,
    color: 'black',
  },
  info: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
    marginHorizontal: 20,
    fontWeight: 'bold',
  },
  media: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 10,
  },
  video: {
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginRight: 10,
    fontSize: 13,
    fontWeight: '500',
  },
  subText: {
    fontSize: 14,
    color: '#333',
    backgroundColor: '#e0f7fa',
    padding: 10,
    borderRadius: 10,
    marginVertical: 6,
    fontWeight: '500',
    lineHeight: 20,
  },
  viewMapButton: {
    marginTop: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
    marginHorizontal: 10,
  },
});

export default ViewTickets;
