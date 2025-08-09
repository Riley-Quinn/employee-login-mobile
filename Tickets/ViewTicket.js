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
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Video from 'react-native-video';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import FormatStatusTrackerData from './FormatStatusTrackerData';
import AddConversation from './Conversation';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { BASE_URL } from '@env';
import getLocation from './getLocation';
import { launchImageLibrary } from 'react-native-image-picker';
const { width, height } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = 'AIzaSyBUusGFrajBXyPHb2yuwF_VGBjmaVRzLqY';

const ViewTickets = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const ticketId = route.params?.ticketId;
  const [emailPopup, setEmailPopup] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const customerMedia = ticket?.customer_media || [];

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
  async function getAddressFromCoords(lat, lng) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`,
      );
      const data = await response.json();
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return null;
    } catch (error) {
      console.error('Reverse geocode failed:', error);
      return null;
    }
  }

  const handleEmployeeMediaUpload = async mediaStage => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        quality: 1,
      });

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];

      const { latitude, longitude } = await getLocation();
      const address = await getAddressFromCoords(latitude, longitude);

      const isImage = file.type?.startsWith('image/');
      const mediaType = isImage ? 'Photo' : 'Video';

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.fileName || `upload.${isImage ? 'jpg' : 'mp4'}`,
      });
      formData.append('ticket', ticketId);
      formData.append('media_type', mediaType);
      formData.append('media_stage', mediaStage);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('location_name', address || '');
      formData.append('uploaded_by', userId);

      for (let [key, value] of formData._parts) {
        console.log(`${key}:`, value);
      }

      const uploadUrl = `${BASE_URL}/api/employee-uploads`;

      const response = await axios.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      fetchTicket();
    } catch (err) {
      console.error(
        '❌ Upload failed:',
        err?.response?.status,
        err?.response?.data || err.message,
      );
      Alert.alert('Error', 'Upload failed. Try again.');
    }
  };

  const openMediaModal = media => {
    setSelectedMedia(media);
  };

  const closeModal = () => {
    setSelectedMedia(null);
  };

  const fetchTicket = useCallback(async () => {
    if (!userId || !ticketId) {
      console.warn('Missing userId or ticketId');
      return;
    }

    try {
      const res = await axios.get(
        `http://10.0.2.2:5000/api/tickets/${ticketId}`,
        { params: { userId } },
      );

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

  const preMedia = ticket?.multimedia?.filter(m => m.media_stage === 'pre');
  const postMedia = ticket?.multimedia?.filter(m => m.media_stage === 'post');

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
              Category :{' '}
              <Text style={styles.valueText}> {ticket.category_name}</Text>
            </Text>

            <Text style={styles.labelText}>
              Address :{' '}
              <Text style={styles.valueText}>
                {`${ticket.state_name},${ticket.city_name},${ticket.region_name}, ${ticket.address_type}, ${ticket.address}`}
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
              Phone :{' '}
              <Text style={styles.valueText}> {ticket.customer_phone}</Text>
            </Text>

            <Text style={styles.labelText}>
              Email :{' '}
              <Text style={styles.valueText}> {ticket.customer_email}</Text>
            </Text>
          </View>

          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <MaterialIcons name="calendar-month" size={24} color="#fff" />
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

        {ticket.status_name === 'In-Progress' && (
          <View style={styles.cards}>
            <AddConversation
              user={{ userId }}
              data={ticket}
              customerComments={ticket?.customer_comments}
              fetchData={fetchTicket}
            />
          </View>
        )}
        <View style={styles.section}>
          <Text style={styles.label}>Customer Media</Text>
          {customerMedia.length > 0 ? (
            <View style={styles.imageContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                {customerMedia.map((media, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => openMediaModal(media)}
                  >
                    <Image
                      source={{
                        uri: `https://da5uskjymuj4t.cloudfront.net/${media.file_name}`,
                      }}
                      style={styles.image}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <Text
              style={{
                color: '#888',
                fontSize: 14,
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              No media from customer
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Pre Upload</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleEmployeeMediaUpload('pre')}
          >
            <Text style={styles.buttonText}>Upload Pre Media</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          {preMedia?.length > 0 && (
            <View style={styles.imageContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                {/* REPLACE THIS: */}
                {preMedia.map((media, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => openMediaModal(media)}
                    style={{ marginRight: 10, width: width * 0.8 }}
                  >
                    <View
                      style={{
                        width: '100%',
                        height: height * 0.4,
                        marginBottom: 4,
                        borderRadius: 8,
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        source={{
                          uri: `https://da5uskjymuj4t.cloudfront.net/${media.file_name}`,
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 8,
                          resizeMode: 'cover',
                        }}
                      />
                    </View>

                    {media.location_name && (
                      <View
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                          maxWidth: width * 0.7,
                          zIndex: 999,
                        }}
                      >
                        <Text
                          style={{
                            color: 'white',
                            fontWeight: '600',
                            fontSize: 14,
                          }}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {media.location_name}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Post Upload</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleEmployeeMediaUpload('post')}
          >
            <Text style={styles.buttonText}>Upload Post Media</Text>
          </TouchableOpacity>

          {postMedia?.length > 0 && (
            <View style={styles.imageContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                {postMedia.map((media, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => openMediaModal(media)}
                  >
                    {media.file_type === 'Photo' ? (
                      <Image
                        source={{
                          uri: `https://da5uskjymuj4t.cloudfront.net/${media.file_name}`,
                        }}
                        style={styles.image}
                      />
                    ) : (
                      <View style={styles.videoContainer}>
                        <Text style={styles.videoText}>{media.file_name}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <Modal
          visible={selectedMedia !== null}
          transparent={true}
          onRequestClose={closeModal}
        >
          <View style={styles.modalBackground}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeModal}
            >
              <FontAwesome name="close" size={30} color="#fff" />
            </TouchableOpacity>

            {selectedMedia?.file_type === 'Photo' ? (
              <Image
                source={{
                  uri: `https://da5uskjymuj4t.cloudfront.net/${selectedMedia.file_name}`,
                }}
                style={styles.modalImage}
              />
            ) : selectedMedia?.file_type === 'Video' ? (
              <Video
                source={{
                  uri: `https://da5uskjymuj4t.cloudfront.net/${selectedMedia.file_name}`,
                }}
                style={styles.modalVideo}
                controls
                resizeMode="cover"
              />
            ) : null}
          </View>
        </Modal>
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
    fontSize: 20,
    fontWeight: '600',
    color: '#008080',
  },

  labelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
    marginTop: 6,
  },
  locationOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // a bit transparent black
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: width * 0.75,
    zIndex: 9999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  locationText: {
    color: 'white', // instead of red
    fontSize: 14,
    fontWeight: '600',
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
    marginTop: -12,
    marginLeft: 40,
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
  section: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  button: {
    backgroundColor: '#1976d2',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16 },
  cards: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    elevation: 2,
  },
  Media: {
    backgroundColor: 'red',
    borderRadius: 12,
    padding: 16,
    marginTop: 25,
    elevation: 2,
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  images: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },

  image: {
    width: width * 1,
    height: height * 0.4,
    resizeMode: 'cover',
    alignSelf: 'center',
  },

  videoContainer: {
    width: width * 1,
    height: height * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ccc',
    resizeMode: 'center',
  },
  videoText: {
    color: '#000',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalImage: {
    width: '90%',
    height: '80%',
    resizeMode: 'contain',
  },
  modalVideo: {
    width: '90%',
    height: '80%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
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
    width: 120, // a bit bigger to match Android density
    height: 120,
    marginRight: 10,
    borderRadius: 10,
    backgroundColor: '#f0f0f0', // fallback color so empty space is visible while loading
    resizeMode: 'cover', // ensures image fills without distortion
    overflow: 'hidden', // prevents corners from showing background
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
