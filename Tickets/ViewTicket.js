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
import StatusTracker from './StatusTracker';
import moment from 'moment';
import { Dropdown } from 'react-native-element-dropdown';
import dayjs from 'dayjs';

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
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = 'AIzaSyBUusGFrajBXyPHb2yuwF_VGBjmaVRzLqY';

const ViewTickets = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const ticketId = route.params?.ticketId;
  const [emailPopup, setEmailPopup] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  // const [showDropdown, setShowDropdown] = useState(true);
  const [showDropdownPost, setShowDropdownPost] = useState(true);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [visible, setVisible] = useState(false);
  const [locationName, setLocationName] = useState('Loading location...');
  const [ticket, setTicket] = useState(null);
  // const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [serviceVisible, setServiceVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [arrivalDate, setArrivalDate] = useState(new Date());
  const [arrivalTime, setArrivalTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reasonForDelay, setReasonForDelay] = useState('');
  const [serviceReason, setServiceReason] = useState('');
  const [customServiceReason, setCustomServiceReason] = useState('');
  const [userId, setUserId] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [weeklyData, setWeeklyData] = useState([]);
  const [editStatus, setEditStatus] = useState('');
  const [editReason, setEditReason] = useState('');
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupData, setPopupData] = useState(null);
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

      if (result.didCancel || !result.assets?.length) return;

      const file = result.assets[0];

      const { latitude, longitude } = await getLocation();

      const isImage = file.type?.startsWith('image/');
      const mediaType = isImage ? 'Photo' : 'Video';
      const fileType = file.type || (isImage ? 'image/jpeg' : 'video/mp4');
      const fileUri = file.uri.startsWith('file://')
        ? file.uri
        : `file://${file.uri}`;

      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: fileType,
        name: file.fileName || `upload.${isImage ? 'jpg' : 'mp4'}`,
      });
      formData.append('ticket', ticketId);
      formData.append('media_type', mediaType);
      formData.append('media_stage', mediaStage);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('uploaded_by', userId);

      const response = await axios.post(
        `${BASE_URL}/api/employee-uploads`,
        formData,
      );
      console.log('Upload successful:', response.data);

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

  const serviceReasons = [
    'Power Supply Issues',
    'Electrical Components Failure',
    'Overheating',
    'Loose or Damaged Wiring',
    'Software/Firmware Issues',
    'Physical Damage',
    'Remote Control or Interface Issues',
    'Voltage Fluctuations',
    'Spare Parts Replacement',
    'Other',
  ];

  const openMediaModal = media => {
    setSelectedMedia(media);
  };

  const closeModal = () => {
    setSelectedMedia(null);
  };
  const handleStartWork = async item => {
    const userStr = await AsyncStorage.getItem('userId');
    const user = JSON.parse(userStr);
    const trackerData = StatusTracker(
      item.status_tracker,
      'Work started',
      'In-Progress',
      3,
      user.name,
      item.employee_name,
      item.employee_phone,
    );

    try {
      await axios.put(`${BASE_URL}/api/tickets/${item.ticket_id}`, {
        ticketData: { status_id: 3, status_tracker: trackerData },
      });
      fetchTickets();
      Alert.alert('Success', 'Work started');
    } catch {
      Alert.alert('Error', 'Failed to start work');
    }
  };

  const handleSaveArrival = async () => {
    const userStr = await AsyncStorage.getItem('userId');
    const user = JSON.parse(userStr);
    const formattedDate = `${arrivalDate.toISOString().split('T')[0]}T${
      arrivalTime.toTimeString().split(' ')[0]
    }`;
    const msg = reasonForDelay
      ? `Engineer will arrive on ${arrivalDate.toDateString()} at ${
          arrivalTime.toTimeString().split(' ')[0]
        } due to ${reasonForDelay}`
      : `Engineer will arrive on ${arrivalDate.toDateString()} at ${
          arrivalTime.toTimeString().split(' ')[0]
        }`;

    const trackerData = StatusTracker(
      selectedTicket.status_tracker,
      msg,
      'Todo',
      3,
      user.name,
      selectedTicket.employee_name,
      selectedTicket.employee_phone,
    );
    try {
      await axios.put(`${BASE_URL}/api/tickets/${selectedTicket.ticket_id}`, {
        ticketData: {
          employee_arrival_date: formattedDate,
          status_tracker: trackerData,
        },
      });
      fetchTickets();
      setModalVisible(false);
      Alert.alert('Success', 'Arrival date updated');
    } catch {
      Alert.alert('Error', 'Failed to update arrival');
    }
  };
  const fetchTickets = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await axios.get(
        `${BASE_URL}/api/tickets/employee/${userId}`,
      );

      const allTickets = response?.data?.list || [];

      const today = moment().format('YYYY-MM-DD');

      // Sort today tickets by employee_arrival_time ascending

      // Weekly summary logic
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyCounts = days.map(day => ({ label: day, done: 0, todo: 0 }));

      allTickets.forEach(ticket => {
        const createdDate = moment(ticket.created_at);
        const dayIndex = createdDate.day();

        if (
          ticket.status_id === 2 ||
          ticket.status_name?.toLowerCase() === 'todo'
        ) {
          weeklyCounts[dayIndex].todo += 1;
        }

        if (
          ticket.status_id === 6 ||
          ticket.status_name?.toLowerCase() === 'done'
        ) {
          let doneDate = createdDate;

          if (Array.isArray(ticket.status_tracker)) {
            const doneEntry = ticket.status_tracker.find(
              entry =>
                entry.status?.toLowerCase() === 'done' &&
                (entry.Date || entry.updatedDate),
            );
            if (doneEntry)
              doneDate = moment(doneEntry.Date || doneEntry.updatedDate);
          }

          const dayIndexDone = doneDate.day();
          weeklyCounts[dayIndexDone].done += 1;
        }
      });

      setWeeklyData(weeklyCounts);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
      setWeeklyData([]);
    }
  }, [userId]);
  const handleServiceUpdate = async () => {
    const userStr = await AsyncStorage.getItem('userId');
    const user = JSON.parse(userStr);
    const reason =
      serviceReason === 'Other'
        ? customServiceReason
        : serviceReason || 'Service Update';
    const trackerData = StatusTracker(
      selectedTicket.status_tracker,
      reason,
      'In Progress',
      3,
      user.name,
      selectedTicket.employee_name,
      selectedTicket.employee_phone || '',
    );

    try {
      await axios.put(`${BASE_URL}/api/tickets/${selectedTicket.ticket_id}`, {
        ticketData: { status_tracker: trackerData, status_id: 3 },
      });
      fetchTickets();
      setServiceVisible(false);
      setServiceReason('');
      setCustomServiceReason('');
      Alert.alert('Success', 'Service updated');
    } catch {
      Alert.alert('Error', 'Failed to update service');
    }
  };

  const handleEditUpdate = async () => {
    const userStr = await AsyncStorage.getItem('userId');
    const user = JSON.parse(userStr);

    let status_id = 3;
    if (editStatus === 'Done') status_id = 6;
    else if (editStatus === 'On Hold') status_id = 4;
    else if (editStatus === 'Pending') status_id = 5;

    const reasonMsg =
      editStatus === 'Done'
        ? 'Service Completed'
        : `${editStatus} - ${editReason}`;

    const trackerData = StatusTracker(
      selectedTicket.status_tracker,
      reasonMsg,
      editStatus,
      status_id,
      user.name,
      selectedTicket.employee_name,
      selectedTicket.employee_phone || '',
    );

    const ticketData = { status_id, status_tracker: trackerData };
    if (editStatus === 'On Hold' || editStatus === 'Pending') {
      ticketData.pending_reason = editReason;
    }

    try {
      await axios.put(`${BASE_URL}/api/tickets/${selectedTicket.ticket_id}`, {
        ticketData,
      });
      fetchTickets();
      setEditVisible(false);
      setEditStatus('');
      setEditReason('');
      Alert.alert('Success', 'Ticket status updated');
    } catch {
      Alert.alert('Error', 'Failed to update status');
    }
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
        <Text style={styles.ticketId}>#{ticket.ticket_id}</Text>
        <Text style={styles.ticketDescription}>{ticket.description}</Text>

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
              {ticket.created_at
                ? dayjs(ticket.created_at).format('MMM D, YYYY')
                : ''}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="category" size={20} color="#555" />
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.infoValues}>{ticket.category_name}</Text>
          </View>
          <Modal visible={editVisible} transparent animationType="slide">
            <View style={styles.modalWrapper}>
              <View style={styles.modalContent}>
                <Text style={styles.modaltitle}>Update Status</Text>

                <Dropdown
                  data={[
                    ...(preMedia?.length > 0 && postMedia?.length > 0
                      ? [{ label: 'Done', value: 'Done' }]
                      : []),
                    { label: 'On Hold', value: 'On Hold' },
                    { label: 'Pending', value: 'Pending' },
                  ]}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Status"
                  placeholderStyle={{ color: '#000' }}
                  selectedTextStyle={{ color: '#000', fontSize: 16 }}
                  itemTextStyle={{ color: '#000', fontSize: 16 }}
                  style={styles.input}
                  value={editStatus}
                  onChange={item => setEditStatus(item.value)}
                />

                {(editStatus === 'On Hold' || editStatus === 'Pending') && (
                  <TextInput
                    placeholder="Reason"
                    placeholderTextColor="#555"
                    value={editReason}
                    onChangeText={setEditReason}
                    style={[styles.input, { color: '#000' }]}
                  />
                )}

                <View style={styles.modalButtonrow}>
                  <TouchableOpacity
                    style={styles.modalbutton}
                    onPress={handleEditUpdate}
                  >
                    <Text style={styles.modalbuttontext}>Update</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setEditVisible(false)}
                  >
                    <Text style={styles.modalbuttontext}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          <Modal visible={modalVisible} transparent animationType="slide">
            <View style={styles.modalWrapper}>
              <View style={styles.modalContent}>
                <Text style={styles.modaltitle}>Set Arrival Date</Text>

                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <TextInput
                    placeholder="Select Date"
                    editable={false}
                    value={arrivalDate.toDateString()}
                    style={styles.input}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                  <TextInput
                    placeholder="Select Time"
                    editable={false}
                    value={arrivalTime.toTimeString().split(' ')[0]}
                    style={styles.input}
                  />
                </TouchableOpacity>

                {selectedTicket?.employee_arrival_date && (
                  <TextInput
                    placeholder="Reason for Delay"
                    placeholderTextColor="#000"
                    value={reasonForDelay}
                    onChangeText={setReasonForDelay}
                    style={styles.input}
                  />
                )}

                <View style={styles.modalButtonrow}>
                  <TouchableOpacity
                    style={styles.modalbutton}
                    onPress={handleSaveArrival}
                  >
                    <Text style={styles.modalbuttontext}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalbuttontext}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          <Modal visible={serviceVisible} transparent animationType="slide">
            <View style={styles.modalWrapper}>
              <View style={styles.modalcontent}>
                <Text style={styles.modaltitle}>Update Service</Text>

                <Dropdown
                  data={serviceReasons.map(r => ({ label: r, value: r }))}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Reason"
                  placeholderStyle={{ color: '#000' }}
                  selectedTextStyle={{ color: '#000', fontSize: 16 }}
                  itemTextStyle={{ color: '#000', fontSize: 16 }}
                  style={styles.input}
                  value={serviceReason}
                  onChange={item => setServiceReason(item.value)}
                />

                {serviceReason === 'Other' && (
                  <TextInput
                    placeholder="Reason"
                    placeholderTextColor="#555"
                    value={customServiceReason}
                    onChangeText={setCustomServiceReason}
                    style={[styles.input, { color: '#000' }]}
                  />
                )}

                <View style={styles.modalButtonrow}>
                  <TouchableOpacity
                    style={styles.modalbutton}
                    onPress={handleServiceUpdate}
                  >
                    <Text style={styles.modalbuttontext}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setServiceVisible(false)}
                  >
                    <Text style={styles.modalbuttontext}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          {showDatePicker && (
            <DateTimePicker
              value={arrivalDate}
              mode="date"
              display="default"
              onChange={(e, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setArrivalDate(selectedDate);
              }}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={arrivalTime}
              mode="time"
              display="default"
              onChange={(e, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) setArrivalTime(selectedTime);
              }}
            />
          )}
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
              Location: <Text style={styles.labels}>{ticket.region_name}</Text>
            </Text>
          </TouchableOpacity>

          {ticket.status_id === 3 && (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                <TouchableOpacity
                  style={styles.serviceButton}
                  onPress={() => {
                    setSelectedTicket(ticket);
                    setServiceVisible(true);
                  }}
                >
                  <Text style={styles.whiteButton}>Service Update</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.editButton, { marginLeft: 12 }]}
                  onPress={() => {
                    setSelectedTicket(ticket);
                    setEditVisible(true);
                  }}
                >
                  <Text style={styles.whiteButton}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {ticket.status_id === 2 && (
            <View
              style={{
                width: '100%',
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                <TouchableOpacity
                  style={styles.arrivalButton}
                  onPress={() => {
                    setSelectedTicket(ticket);
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.buttonText}>Arrival Date</Text>
                </TouchableOpacity>

                {ticket.employee_arrival_date && (
                  <TouchableOpacity
                    style={[styles.startButton, { marginLeft: 12 }]} // add gap
                    onPress={() => handleStartWork(ticket)}
                  >
                    <Text style={styles.buttonText}>Start</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
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

        <View style={styles.cardWrapper}>
          <View style={styles.uploadHeaders}>
            <Text style={styles.uploadTitles}>Customer Media</Text>
          </View>

          <View style={styles.cardBody}>
            {ticket?.multimedia?.some(m => m.uploaded_by === null) ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {ticket.multimedia
                  .filter(m => m.uploaded_by === null)
                  .map((media, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.mediaWrapper}
                      onPress={() => openMediaModal(media)}
                    >
                      {media.file_type === 'Photo' ? (
                        <Image
                          source={{
                            uri: `https://d2plv0g319oam3.cloudfront.net/${encodeURIComponent(
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
                            uri: `https://d2plv0g319oam3.cloudfront.net/${encodeURIComponent(
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
          </View>
        </View>

        <View style={styles.cardWrapper}>
          <View style={styles.uploadHeaders}>
            <Text style={styles.uploadTitles}>Issue Evidence</Text>
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
                  color="#555"
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.cardBody}>
            {showDropdown && (
              <>
                {preMedia?.length > 0 ? (
                  <>
                    <View style={styles.mediaGrid}>
                      {preMedia.map((media, index) => (
                        <View key={index} style={styles.mediaItem}>
                          <TouchableOpacity
                            onPress={() => openMediaModal(media)}
                            style={styles.mediaWrapper}
                          >
                            <Image
                              source={{
                                uri: `https://d2plv0g319oam3.cloudfront.net/${media.file_name}`,
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
                    </View>

                    {preMedia?.some(m => m.latitude && m.longitude) && (
                      <>
                        <Text style={styles.mapText}>Google Maps</Text>
                        <TouchableOpacity
                          onPress={() => {
                            const mediaWithCoords = preMedia.find(
                              m => m.latitude && m.longitude,
                            );
                            if (mediaWithCoords) {
                              openMap(
                                mediaWithCoords.address,
                                mediaWithCoords.city,
                                mediaWithCoords.state,
                              );
                            }
                          }}
                          style={styles.mapRow}
                        />
                      </>
                    )}
                  </>
                ) : (
                  <Text style={styles.noMediaText}>No Preupload media</Text>
                )}
              </>
            )}
          </View>
        </View>

        {preMedia?.length > 0 && (
          <View style={styles.cardWrapper}>
            <View style={styles.uploadHeaders}>
              <Text style={styles.uploadTitles}>Resolution Evidence</Text>
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
                    name={
                      showDropdownPost ? 'arrow-drop-up' : 'arrow-drop-down'
                    }
                    size={30}
                    color="#555"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.cardBody}>
              {showDropdownPost && (
                <>
                  {postMedia?.length > 0 ? (
                    <>
                      <View style={styles.mediaGrids}>
                        {postMedia.map((media, index) => (
                          <View key={index} style={styles.mediaItems}>
                            <TouchableOpacity
                              onPress={() => openMediaModal(media)}
                              style={styles.mediaWrapper}
                            >
                              {media.file_type === 'Photo' ? (
                                <Image
                                  source={{
                                    uri: `https://d2plv0g319oam3.cloudfront.net/${media.file_name}`,
                                  }}
                                  style={styles.mediaImages}
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
                      </View>

                      {postMedia?.some(m => m.latitude && m.longitude) && (
                        <>
                          <Text style={styles.mapText}>Google Maps</Text>
                          <TouchableOpacity
                            onPress={() => {
                              const mediaWithCoords = postMedia.find(
                                m => m.latitude && m.longitude,
                              );
                              if (mediaWithCoords) {
                                openMap(
                                  mediaWithCoords.address,
                                  mediaWithCoords.city,
                                  mediaWithCoords.state,
                                );
                              }
                            }}
                            style={styles.mapRow}
                          />
                        </>
                      )}
                    </>
                  ) : (
                    <Text style={styles.noMediaText}>No Post Upload media</Text>
                  )}
                </>
              )}
            </View>
          </View>
        )}

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
                  uri: `https://d2plv0g319oam3.cloudfront.net/${selectedMedia.file_name}`,
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
                  uri: `https://d2plv0g319oam3.cloudfront.net/${selectedMedia.file_name}`,
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
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>State</Text>
                    <Text style={styles.colons}>:</Text>
                    <Text style={styles.detailValue}>{ticket.state_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>City</Text>
                    <Text style={styles.colons}>:</Text>
                    <Text style={styles.detailValue}>{ticket.city_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Region</Text>
                    <Text style={styles.colons}>:</Text>
                    <Text style={styles.detailValue}>{ticket.region_name}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address</Text>
                    <Text style={styles.colons}>:</Text>
                    <Text style={styles.detailValue}>{ticket.address}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address</Text>
                    <Text style={styles.colons}>:</Text>
                    <Text style={styles.detailValue}>
                      {ticket.address_type}
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
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>State</Text>
                    <Text style={styles.colons}>:</Text>
                    <Text style={styles.detailValue}>{ticket.state_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>City</Text>
                    <Text style={styles.colons}>:</Text>
                    <Text style={styles.detailValue}>{ticket.city_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Region</Text>
                    <Text style={styles.colons}>:</Text>
                    <Text style={styles.detailValue}>{ticket.region_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>AddressType</Text>
                    <Text style={styles.colons}>:</Text>
                    <Text style={styles.detailValue}>{ticket.address}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address</Text>
                    <Text style={styles.colons}>:</Text>
                    <Text style={styles.detailValue}>
                      {ticket.address_type}
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
          <View style={styles.wrapper}>
            <View style={styles.customerHeader}>
              <Text style={styles.customerHeaderText}>Chat with Customer</Text>
            </View>

            <View style={styles.cards}>
              <AddConversation
                user={{ userId }}
                data={ticket}
                customerComments={ticket?.customer_comments}
                fetchData={fetchTicket}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  dropdownWrapper: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
  },
  mapText: {
    marginHorizontal: 30,
    color: '#007bff',
    fontSize: 14,
    marginTop: -30,
  },

  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },

  mediaItem: {
    width: '48%',
    margin: '1%',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  mediaImage: {
    width: '48%',
    height: 100,
    borderRadius: 8,
  },
  mediaGrids: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },

  mediaItems: {
    width: '48%',
    margin: '1%',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  mediaImages: {
    width: '48%',
    height: 100,
    borderRadius: 8,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  modalButtonrow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  modalbutton: {
    flex: 1,
    backgroundColor: '#008080',
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    alignItems: 'center',
  },

  modalButtontext: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  buttonRows: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    gap: 10,
  },

  actionButton: {
    flex: 1,
    backgroundColor: '#008080',
    paddingVertical: 10,
    marginHorizontal: 5,

    borderRadius: 8,
    alignItems: 'center',
  },

  pickerWrapper: {
    borderColor: '#000',
    borderWidth: 0.5,
    borderRadius: 8,
    overflow: 'hidden',
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 10,
  },

  arrivalButton: {
    backgroundColor: '#008080',
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 5,

    textAlign: 'center',
    marginLeft: 10,
    marginRight: 10,
  },

  startButton: {
    backgroundColor: '#008080',
    paddingVertical: 3,
    marginTop: 5,

    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 5,
  },

  serviceButton: {
    backgroundColor: '#008080',
    paddingVertical: 3,
    marginTop: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
    textAlign: 'center',
    marginLeft: 10,
    marginRight: 10,
  },

  editButton: {
    backgroundColor: '#008080',
    paddingVertical: 3,
    marginTop: 5,

    paddingHorizontal: 12,
    borderRadius: 6,
  },

  arrivalDateAlone: {
    marginLeft: 'auto',
    backgroundColor: '#008080',
    paddingVertical: 3,
    marginTop: 5,

    paddingHorizontal: 12,
    borderRadius: 8,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },

  whiteButton: {
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    fontSize: 14,
  },

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
    paddingVertical: 1,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  noMediaText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    marginTop: 40,
    textAlign: 'center',
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
  cardWrapper: {
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
  },

  uploadHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#008080',
  },

  cardBody: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 120,
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
    paddingHorizontal: 14,
    paddingBottom: 10,
    paddingTop: -5,
    marginVertical: 5,
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    marginHorizontal: 6,
    marginTop: 10,
  },

  ticketDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginHorizontal: 6,

    marginTop: 5,
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
    fontSize: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#555',
    fontWeight: '600',
  },
  colon2: {
    marginLeft: -28,
    textAlign: 'center',
    width: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  infoLabel: {
    flex: 0.8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  colon: {
    width: 10,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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

  uploadTitles: { fontSize: 16, fontWeight: 'bold', color: '#fff' },

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

  mapRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },

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
  wrapper: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  customerHeader: {
    backgroundColor: '#008080',
    padding: 8,
  },
  customerHeaderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginHorizontal: 6,
  },
  cards: {
    backgroundColor: '#fff',
    padding: 16,
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

  modalcontent: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },

  modaltitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },

  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    color: '#000',
  },

  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  modalCancelButton: {
    flex: 1,
    backgroundColor: '#bbb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  whiteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    fontSize: 14,
  },
});

export default ViewTickets;
