import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Dimensions } from 'react-native';
import { Animated } from 'react-native';

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import dayjs from 'dayjs';

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StatusTracker from './StatusTracker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { BASE_URL } from '@env';
import { SafeAreaView } from 'react-native-safe-area-context';
const screenWidth = Dimensions.get('window').width;
const isTablet = screenWidth >= 768;

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

const TicketPage = ({ navigation }) => {
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

  const [editStatus, setEditStatus] = useState('');
  const [editReason, setEditReason] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [ticketStatuses, setTicketStatuses] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    todo: 0,
    inProgress: 0,
    pending: 0,
    done: 0,
  });
  const totalTickets =
    statusCounts.todo +
    statusCounts.inProgress +
    statusCounts.pending +
    statusCounts.done;

  useEffect(() => {
    const init = async () => {
      try {
        console.log('🔄 Initializing useEffect...');

        const id = await AsyncStorage.getItem('userId');
        console.log('📦 Retrieved userId from AsyncStorage:', id);
        setUserId(id);

        console.log(
          '🌐 Fetching ticket statuses from:',
          `${BASE_URL}/api/ticket-statuses`,
        );
        const res = await axios.get(`${BASE_URL}/api/ticket-statuses`);
        console.log('✅ Ticket statuses API response:', res?.data);

        setTicketStatuses(res?.data || []);
      } catch (err) {
        console.error('❌ Failed to initialize or fetch statuses:', err);
      }
    };

    init();
  }, []);
  const fetchTickets = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await axios.get(
        `${BASE_URL}/api/tickets/employee/${userId}`,
      );
      let list = response?.data?.list || [];

      if (statusFilter && statusFilter !== 'all') {
        list = list.filter(
          ticket => ticket.status_id.toString() === statusFilter,
        );
      }

      setTickets(list);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    }
  }, [userId, statusFilter]);

  useEffect(() => {
    if (!userId) return;

    fetchTickets();

    const fetchTicketCounts = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/api/tickets/employee/ticket-counts/${userId}`,
        );

        console.log('📊 Ticket counts response:', response.data);

        const counts = response.data.list;

        setStatusCounts({
          todo: counts.ToDo?.total_count || 0,
          inProgress: counts['In-Progress']?.total_count || 0,
          pending: counts.Pending?.total_count || 0,
          done: counts.Done?.total_count || 0,
        });
      } catch (error) {
        console.error('❌ Error fetching ticket counts:', error);
      }
    };

    fetchTicketCounts();
  }, [userId, fetchTickets, statusFilter]);
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
  const handleAssignToMe = async item => {
    const userStr = await AsyncStorage.getItem('userId');
    const user = JSON.parse(userStr);
    const trackerData = StatusTracker(
      item.status_tracker,
      'Engineer is Assigned',
      'In-Progress',
      2,
      user.name,
      user.name,
      user.phone || '',
    );
    const ticketData = {
      assigned_employee_id: userId,
      status_id: 2,
      priority_rank: 'High',
      status_tracker: trackerData,
      employee_arrival_date: null,
    };
    try {
      await axios.put(`${BASE_URL}/api/tickets/${item.ticket_id}`, {
        ticketData,
      });
      fetchTickets();
      Alert.alert('Success', 'Ticket assigned successfully');
    } catch {
      Alert.alert('Error', 'Failed to assign ticket');
    }
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

  const getStatusChipStyle = status => {
    switch (status?.toLowerCase()) {
      case 'open':
        return {
          backgroundColor: '#008080',
          color: '#000000',
        };
      case 'todo':
        return {
          backgroundColor: '#FF6B6B',
          color: '#FFFFFF',
        };
      case 'in-progress':
        return {
          backgroundColor: '#ff954d',
          color: '#FFFFFF',
        };
      case 'pending':
        return {
          backgroundColor: '#6C63FF',
          color: '#FFFFFF',
        };

      case 'done':
        return {
          backgroundColor: '#22C55E',
          color: '#FFFFFF',
        };
      default:
        return {
          backgroundColor: '#008080',
          color: '#FFFFFF',
        };
    }
  };
  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.ticketCard}
        onPress={() => {
          if (item.status_id !== 1) {
            navigation.navigate('ViewTickets', { ticketId: item.ticket_id });
          }
        }}
      >
        <View style={styles.cardWrapper}>
          <View style={styles.cardHeader}>
            <Text style={styles.ticketId}>#{item.ticket_id}</Text>
            <Text style={styles.employee}>
              {item.employee_arrival_date
                ? dayjs(item.employee_arrival_date).format('MMM D, YYYY')
                : ''}
            </Text>

            <BlinkingText style={styles.employeee}>
              {item.employee_arrival_time
                ? dayjs(`1970-01-01T${item.employee_arrival_time}`).format(
                    'h:mm A',
                  )
                : ''}
            </BlinkingText>
            <View style={{ marginLeft: 'auto' }}>
              {(() => {
                const chipStyle = getStatusChipStyle(item.status_name);
                return (
                  <View
                    style={[
                      styles.statusChip,
                      { backgroundColor: chipStyle.backgroundColor },
                    ]}
                  >
                    <Text
                      style={[styles.statusText, { color: chipStyle.color }]}
                    >
                      {item.status_name}
                    </Text>
                  </View>
                );
              })()}
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoSection}>
              <View style={styles.infoRows}>
                <Text
                  style={styles.title}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.title ? item.title : '-'}
                </Text>
                <Text
                  style={styles.label}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.description}
                </Text>
              </View>
              <View
                style={[styles.infoRow, { justifyContent: 'space-between' }]}
              >
                <Text style={styles.boldLabels}>
                  Category:{' '}
                  <Text style={styles.labels}>{item.category_name}</Text>
                </Text>
                <Text style={styles.boldLabels}>
                  Region:{' '}
                  <Text style={styles.labels}>{` ${item.region_name}`}</Text>
                </Text>
              </View>
              {item.status_id !== 6 && <View style={styles.divider} />}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {item.status_id === 2 && item.employee_arrival_date && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => handleStartWork(item)}
                  >
                    <Text style={styles.buttonText}>Start</Text>
                  </TouchableOpacity>
                </View>
              )}

              {item.status_id === 3 && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  <TouchableOpacity
                    style={styles.serviceButton}
                    onPress={() => {
                      setSelectedTicket(item);
                      setServiceVisible(true);
                    }}
                  >
                    <Text style={styles.whiteButtonText}>Service Update</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setSelectedTicket(item);
                      setEditVisible(true);
                    }}
                  >
                    <Text style={styles.whiteButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#008080" />

      <SafeAreaView style={{ backgroundColor: '#008080', padding: 0 }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Tickets</Text>
        </View>
      </SafeAreaView>

      <View style={styles.filterRow}>
        <TouchableOpacity
          onPress={() => setShowDropdown(!showDropdown)}
          style={styles.filterButton}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginHorizontal: 6,
              marginTop: isTablet ? 5 : 0,
              marginBottom: isTablet ? -20 : 0,

              alignItems: 'center',
            }}
          >
            <Text style={styles.Tickets}>Tickets</Text>
            <MaterialIcons name="filter-list" size={20} color="#000" />
          </View>
        </TouchableOpacity>
      </View>

      <Modal visible={showDropdown} transparent animationType="slide">
        <View style={styles.modalWrapper}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={{ alignSelf: 'flex-end' }}
              onPress={() => setShowDropdown(false)}
            >
              <MaterialIcons name="close" size={20} color="#000" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Filter by Status</Text>

            <Dropdown
              data={[
                { label: 'All', value: 'all' },
                ...ticketStatuses.map(s => ({
                  label: s.status_name,
                  value: s.status_id.toString(),
                })),
              ]}
              labelField="label"
              valueField="value"
              placeholder="Select Status"
              placeholderTextColor="#000"
              placeholderStyle={{ color: '#000' }}
              selectedTextStyle={{ color: '#000', fontSize: 16 }}
              itemTextStyle={{ color: '#000', fontSize: 16 }}
              style={styles.input}
              value={statusFilter}
              onChange={item => {
                setStatusFilter(item.value);
                setShowDropdown(false);
              }}
            />

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowDropdown(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.container}>
        {/* <FlatList
          data={tickets}
          keyExtractor={item => item.ticket_id.toString()}
          renderItem={renderItem}
        /> */}
        <FlatList
          data={tickets}
          key={isTablet ? 'tablet' : 'mobile'}
          keyExtractor={(item, index) => `${item.ticket_id}-${index}`}
          renderItem={renderItem}
          numColumns={isTablet ? 2 : 1}
        />

        <Modal visible={editVisible} transparent animationType="slide">
          <View style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Update Status</Text>

              <Dropdown
                data={[
                  { label: 'Done', value: 'Done' },
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

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleEditUpdate}
                >
                  <Text style={styles.modalButtonText}>Update</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setEditVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* Edit Modal */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set Arrival Date</Text>

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

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleSaveArrival}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* Service Update Modal */}
        <Modal visible={serviceVisible} transparent animationType="slide">
          <View style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Update Service</Text>

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

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleServiceUpdate}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setServiceVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
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
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginTop: -5,
    marginBottom: isTablet ? -20 : 20,
    marginHoriZontal: isTablet ? -2 : 0,

    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    minHeight: isTablet ? 150 : 0,

    flex: isTablet ? 1 : 0,

    backgroundColor: '#fff',
  },
  employee: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#fff',
    marginLeft: screenWidth < 768 ? 110 : 550,
  },
  employeee: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#fff',
    marginLeft: screenWidth < 768 ? 13 : 50,
  },
  ticketCard: {
    margin: isTablet ? 8 : 0,
    width: isTablet ? screenWidth / 2 - 20 : '100%',
  },

  cardHeader: {
    backgroundColor: '#008080',
    padding: 6,

    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    // height: 1,
    backgroundColor: '#008080',
  },
  cardBody: {
    backgroundColor: '#fff',
    padding: 10,
  },
  infoRows: {
    flexDirection: 'column',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#000',
    marginTop: -18,
  },
  label: {
    fontWeight: 'bold',
    color: '#555',
    fontSize: 14,
  },
  ticketId: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
    marginLeft: 10,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 1,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoSection: {
    padding: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: -3,
  },
  boldLabel: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#555',
  },
  boldLabels: {
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 5,
    color: '#555',
  },
  labels: {
    fontWeight: 'bold',
    color: '#008080',
    fontsize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginTop: 6,
  },
  Ticket: {
    fontWeight: '600',
    color: '#222',
    fontSize: 14,
  },
  filterButton: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  Tickets: {
    fontWeight: '600',
    color: '#000',
    fontSize: 14,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  tickets: {
    fontSize: 14,
    color: '#000',
    paddingVertical: 2,
    paddingHorizontal: 4,
    textAlignVertical: 'center',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
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
  modalTitle: {
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
  ticketNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#fff',
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#008080',
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#bbb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  arrivalButton: {
    backgroundColor: '#008080',
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: -2,

    textAlign: 'center',
    marginLeft: 10,
    marginRight: 10,
  },
  startButton: {
    backgroundColor: '#008080',
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: -2,
    marginLeft: 5,
  },
  serviceButton: {
    backgroundColor: '#008080',
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: -2,
    textAlign: 'center',
    marginLeft: 10,
    marginRight: 10,
  },
  editButton: {
    backgroundColor: '#008080',
    paddingVertical: 3,
    marginTop: -2,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  whiteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    fontSize: 14,
  },
});

export default TicketPage;
