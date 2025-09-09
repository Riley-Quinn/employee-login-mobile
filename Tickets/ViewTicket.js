import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  FlatList,
  TextInput,
  Modal,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
import { reverseGeocode } from './Geocode';
import LocationExample from './LoactionDisplay';
import { launchImageLibrary } from 'react-native-image-picker';

const { width, height } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = 'AIzaSyBUusGFrajBXyPHb2yuwF_VGBjmaVRzLqY';

const ViewTickets = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const ticketId = route.params?.ticketId;
  const [emailPopup, setEmailPopup] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const [showDropdown, setShowDropdown] = useState(true);
  const [showDropdownPost, setShowDropdownPost] = useState(true);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [visible, setVisible] = useState(false);

  const [locationName, setLocationName] = useState('Loading location...');

  const [ticket, setTicket] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docUrl, setDocUrl] = useState('');

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

  useEffect(() => {
    if (!ticket) return;

    const preuploads = ticket.multimedia?.filter(m => m.media_stage === 'pre');

    if (preuploads && preuploads.length > 0) {
      const { latitude, longitude } = preuploads[0];

      if (latitude && longitude) {
        reverseGeocode(parseFloat(latitude), parseFloat(longitude))
          .then(name => setLocationName(name))
          .catch(() => setLocationName('Location unknown'));
      } else {
        setLocationName('Location data not available');
      }
    } else {
      setLocationName('No Preupload media');
    }
  }, [ticket]);

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
  const handleDocumentUpload = async () => {
    if (!docUrl) return Alert.alert('Error', 'Enter document URL');

    try {
      const formData = new FormData();
      formData.append('ticket', ticketId);
      formData.append('file_url', docUrl);
      formData.append('media_stage', 'pre');
      formData.append('media_type', 'Document');
      formData.append('uploaded_by', userId);

      for (let [key, value] of formData._parts) {
        console.log(`${key}:`, value);
      }

      const uploadUrl = `${BASE_URL}/api/employee-uploads`;

      const response = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Document uploaded!');
      setDocUrl('');
      fetchTicket();
    } catch (err) {
      console.error(
        '❌ Document upload failed:',
        err?.response?.status,
        err?.response?.data || err.message,
      );
      Alert.alert('Error', 'Document upload failed');
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
      const res = await axios.get(`${BASE_URL}/api/tickets/${ticketId}`, {
        params: { userId },
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

  // const handleMediaOpen = fileName => {
  //   const url = `https://your-cdn-domain.com/${fileName}`;
  //   Linking.openURL(url);
  // };

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
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{ticket.title}</Text>
        </View>

        <View style={styles.badgeNew}>
          <Text style={styles.badgeText}>{ticket.status_name}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.ticket}>
          <Text style={styles.ticketId}>#{ticket.ticket_service_id}</Text>
          <Text style={styles.ticketDescription}>{ticket.description}</Text>
        </View>
        <View style={styles.ticketCard}>
          <View style={styles.headerRow}></View>

          <View style={styles.infoRow}>
            <FontAwesome name="flag" size={20} color="#555" />
            <Text style={styles.infoLabel}>Priority</Text>
            <Text style={styles.colon}>:</Text>
            <Text
              style={[
                styles.infoValue,
                ticket.priority_rank === 'High'
                  ? styles.priorityHigh
                  : ticket.priority_rank === 'Medium'
                  ? styles.priorityMedium
                  : styles.priorityLow,
              ]}
            >
              {ticket.priority_rank}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={20} color="#555" />
            <Text style={styles.infoLabel}>Assigned</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.infoValue}>
              {ticket.employee_name || 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <FontAwesome5 name="cogs" size={20} color="#555" />
            <Text style={styles.infoLabel}>Asset</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.infoValue}>{ticket.asset_name || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="person-outline" size={20} color="#555" />

            <Text style={styles.infoLabel2}>Customer</Text>
            <Text style={styles.colon2}>:</Text>

            <Text style={styles.infoValue2}>{ticket.customer_name}</Text>
            <TouchableOpacity onPress={() => setShowCustomerModal(true)}>
              <Text style={styles.detailsBtn}>Details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="access-time" size={20} color="#555" />
            <Text style={styles.infoLabel}>Assigned On</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.infoValue}>
              {ticket.created_at?.split('T')[0]}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="category" size={20} color="#555" />
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.infoValues}>{ticket.category_name}</Text>
          </View>

          <TouchableOpacity
            style={styles.infoRow}
            onPress={() =>
              openMap(ticket.address, ticket.city_name, ticket.state_name)
            }
          >
            <View style={styles.leftRow}>
              <Feather name="map-pin" size={20} color="#555" />
              <Text style={styles.viewMapText}>View Location</Text>
            </View>

            <Text style={styles.boldLabel}>
              Region: <Text style={styles.labels}>{ticket.region_name}</Text>
            </Text>
          </TouchableOpacity>
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

        <View style={styles.upload}>
          <Text style={styles.uploadTitle}>Customer Media</Text>
        </View>

        {ticket?.multimedia?.some(m => m.uploaded_by === null) ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {ticket.multimedia
              .filter(m => m.uploaded_by === null) // Only customer media
              .map((media, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.mediaWrapper}
                  onPress={() => openMediaModal(media)}
                >
                  {media.file_type === 'Photo' ? (
                    <Image
                      source={{
                        uri: `https://d3shribgms6bz4.cloudfront.net/${encodeURIComponent(
                          media.file_name,
                        )}`,
                      }}
                      style={styles.mediaImage}
                      resizeMode="cover"
                      onError={e =>
                        console.log(
                          'Customer image load error:',
                          e.nativeEvent.error,
                          media.file_name,
                        )
                      }
                    />
                  ) : media.file_type === 'Video' ? (
                    <Video
                      source={{
                        uri: `https://d3shribgms6bz4.cloudfront.net/${encodeURIComponent(
                          media.file_name,
                        )}`,
                      }}
                      style={styles.mediaImage}
                      controls
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={{ color: 'red' }}>Unsupported type</Text>
                  )}
                </TouchableOpacity>
              ))}
          </ScrollView>
        ) : (
          <Text style={styles.noMediaText}>No customer media found</Text>
        )}

        <View style={styles.Employee}>
          <Text style={styles.EmployeeText}>Employee Upload</Text>

          <View style={styles.uploadHeaders}>
            <Text style={styles.uploadTitles}>Preupload</Text>
            <View style={styles.iconRow}>
              <TouchableOpacity
                onPress={() => handleEmployeeMediaUpload('pre')}
              >
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 20,
                    backgroundColor: '#4FB06D',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="add" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowDropdown(!showDropdown)}>
                <MaterialIcons
                  name={showDropdown ? 'arrow-drop-up' : 'arrow-drop-down'}
                  size={30}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>

          {showDropdown && (
            <>
              {preMedia?.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  style={styles.mediaScroll}
                >
                  {preMedia.map((media, index) => (
                    <View key={index} style={{ marginRight: 10 }}>
                      <TouchableOpacity
                        onPress={() => openMediaModal(media)}
                        style={styles.mediaWrapper}
                      >
                        <Image
                          source={{
                            uri: `https://d3shribgms6bz4.cloudfront.net/${media.file_name}`,
                          }}
                          style={styles.mediaImage}
                        />
                      </TouchableOpacity>

                      {media.latitude && media.longitude && (
                        <LocationExample
                          latitude={parseFloat(media.latitude)}
                          longitude={parseFloat(media.longitude)}
                        />
                      )}
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noMediaText}>No Preupload media</Text>
              )}

              {preMedia?.[0]?.latitude && preMedia?.[0]?.longitude && (
                <TouchableOpacity
                  onPress={() =>
                    openMap(
                      preMedia[0].address,
                      preMedia[0].city,
                      preMedia[0].state,
                    )
                  }
                  style={styles.mapRow}
                >
                  <Text style={styles.mapText}> Google Maps</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <View style={styles.uploadHeadersss}>
            <Text style={styles.uploadTitlesss}>Post Upload</Text>
            <View style={styles.iconRow}>
              <TouchableOpacity
                onPress={() => handleEmployeeMediaUpload('post')}
              >
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 20,
                    backgroundColor: '#4FB06D',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="add" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDropdownPost(!showDropdownPost)}
              >
                <MaterialIcons
                  name={showDropdown ? 'arrow-drop-up' : 'arrow-drop-down'}
                  size={30}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>

          {showDropdownPost && (
            <>
              {postMedia?.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  style={styles.mediaScroll}
                >
                  {postMedia.map((media, index) => (
                    <View key={index} style={{ marginRight: 10 }}>
                      <TouchableOpacity
                        onPress={() => openMediaModal(media)}
                        style={styles.mediaWrapper}
                      >
                        {media.file_type === 'Photo' ? (
                          <Image
                            source={{
                              uri: `https://d3shribgms6bz4.cloudfront.net/${media.file_name}`,
                            }}
                            style={styles.mediaImage}
                          />
                        ) : (
                          <View style={styles.videoContainer}>
                            <Text style={styles.videoText}>
                              {media.file_name}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      {media.latitude && media.longitude && (
                        <LocationExample
                          latitude={parseFloat(media.latitude)}
                          longitude={parseFloat(media.longitude)}
                        />
                      )}
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noMediaText}>No Post Upload media</Text>
              )}

              {postMedia?.[0]?.latitude && postMedia?.[0]?.longitude && (
                <TouchableOpacity
                  onPress={() =>
                    openMap(
                      postMedia[0].address,
                      postMedia[0].city,
                      postMedia[0].state,
                    )
                  }
                  style={styles.mapRow}
                >
                  <Text style={styles.mapText}> Google Maps</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <Modal
          visible={!!selectedMedia}
          transparent={true}
          animationType="fade"
          onRequestClose={closeModal}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.9)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {selectedMedia && selectedMedia.file_type === 'Photo' && (
              <Image
                source={{
                  uri: `https://d3shribgms6bz4.cloudfront.net/${selectedMedia.file_name}`,
                }}
                style={{
                  width: '90%',
                  height: '80%',
                  resizeMode: 'contain',
                }}
              />
            )}

            {selectedMedia && selectedMedia.file_type === 'Video' && (
              <Video
                source={{
                  uri: `https://d3shribgms6bz4.cloudfront.net/${selectedMedia.file_name}`,
                }}
                style={{ width: '90%', height: '80%' }}
                controls
                resizeMode="contain"
              />
            )}

            <TouchableOpacity
              onPress={closeModal}
              style={{
                position: 'absolute',
                top: 40,
                right: 20,
                backgroundColor: '#000',
                padding: 10,
                borderRadius: 20,
              }}
            >
              <MaterialIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </Modal>

        <Modal
          visible={showCustomerModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCustomerModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeIcon}
                onPress={() => setShowCustomerModal(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>
                {ticket.customer_type === 'company'
                  ? 'Company Details'
                  : 'Customer Details'}
              </Text>

              {ticket.customer_type === 'company' ? (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Company</Text>
                    <Text style={styles.colons}>:</Text>
                    <Text style={styles.detailValue}>
                      {ticket.customer_name}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Division</Text>
                    <Text style={styles.colons}>:</Text>
                    <Text style={styles.detailValue}>
                      {ticket.customer_division}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={styles.colons}>:</Text>
                    <Text style={styles.detailValue}>
                      {ticket.customer_phone}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.colons}>:</Text>
                    <Text style={styles.detailValue}>
                      {ticket.customer_email}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name</Text>
                    <Text style={styles.colons}>:</Text>
                    <Text style={styles.detailValue}>
                      {ticket.customer_name}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={styles.colons}>:</Text>
                    <Text style={styles.detailValue}>
                      {ticket.customer_phone}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.colons}>:</Text>
                    <Text style={styles.detailValue}>
                      {ticket.customer_email}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        {ticket.status_tracker && (
          <View style={styles.card}>
            <FormatStatusTrackerData trackingData={ticket.status_tracker} />
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#f2f2f2' },

  infoSection: {
    marginHorizontal: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#008080',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },

  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },

  badgeNew: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  noMediaText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
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

  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  viewMapText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: 'bold',
  },

  boldLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    marginLeft: 15,
  },

  labels: {
    fontWeight: '600',
    color: '#008080',
    fontSize: 12,
  },
  ticket: {
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
  Employee: {
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
  EmployeeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#008080',
    textAlign: 'center',
    marginBottom: 6,
  },
  ticketId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#008080',
    marginBottom: 6,
  },

  ticketDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  infoLabel: {
    flex: 1.2,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  infoLabel2: {
    flex: 1.6,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  infoValue2: {
    flex: 2,
    marginLeft: 5,
    fontSize: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#555',
    fontWeight: '600',
  },
  colon2: {
    marginLeft: 40,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  colon: {
    width: 12,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoValue: {
    flex: 2,
    fontSize: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#555',
    fontWeight: '600',
  },
  detailsBtn: {
    color: '#007BFF',
    fontWeight: '600',
    marginRight: 40,
  },
  infoValues: {
    flex: 2,
    fontSize: 14,
    color: '#008080',
    fontWeight: '600',
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
    marginTop: 6,
  },
  colonss: {
    width: 200,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  uploadCard: {
    backgroundColor: '#008080',
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 30,
    elevation: 3,
  },
  uploadHeadersss: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    padding: 8,
    marginVertical: 8,
    marginHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#008080',
  },
  uploadTitlesss: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  uploadHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    padding: 8,
    marginVertical: 8,
    marginHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#008080',
  },
  uploadTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },

  uploadTitles: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  upload: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    marginVertical: 8,
    marginHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#008080',
  },
  uploadddddd: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  iconRow: { flexDirection: 'row', alignItems: 'center' },
  mediaScroll: { marginVertical: 6 },
  mediaWrapper: {
    marginRight: 10,
    width: width * 0.8,
    height: height * 0.2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
  },

  addressText: {
    marginTop: 6,
    fontSize: 14,
    color: '#888',
    fontWeight: 'bold,',
  },
  mapRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  mapText: { marginHorizontal: 30, color: '#007bff', fontSize: 14 },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    marginHorizontal: 20,
  },

  detailLabel: {
    fontWeight: '600',
    color: '#000',
    fontSize: 16,
    width: 110,
  },

  colons: {
    fontSize: 16,
    color: '#000',
    marginRight: 6,
  },

  detailValue: {
    fontWeight: '600',
    color: '#888',
    fontSize: 16,
    flexShrink: 1,
  },

  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  priorityHigh: {
    color: 'red',
    fontWeight: '700',
  },
  priorityMedium: {
    color: 'orange',
    fontWeight: '700',
  },
  priorityLow: {
    color: 'pink',
    fontWeight: '700',
  },

  locationText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  valueText: {
    color: '#008080',
    fontSize: 14,
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
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  labelss: { fontSize: 16, fontWeight: 'bold', color: '#888' },
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
    backgroundColor: '#008000',
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
    width: '60%',
    height: '86%',
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
  // ticketCard: {
  //   backgroundColor: '#fff',
  //   borderRadius: 12,
  //   padding: 16,
  //   marginBottom: 15,
  //   elevation: 3,
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 1 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 3,
  // },
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
    width: 120,
    height: 120,
    marginRight: 10,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover',
    overflow: 'hidden',
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
