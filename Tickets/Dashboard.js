import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
// import { Picker } from '@react-native-picker/picker';

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StatusTracker from './StatusTracker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { BASE_URL } from '@env';

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

const Dashboard = ({ navigation }) => {
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

  const [editStatus, setEditStatus] = useState('');
  const [editReason, setEditReason] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [ticketStatuses, setTicketStatuses] = useState([]);

  // ticketStatuses is your array from API
  // Example: [{ status_id: 1, status_name: "Open" }, ...]

  useEffect(() => {
    const init = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        setUserId(id);

        const res = await axios.get(`${BASE_URL}/api/ticket-statuses`, {});

        setTicketStatuses(res?.data || []);
      } catch (err) {
        console.error('Failed to initialize or fetch statuses:', err);
      }
    };

    init();
  }, []);

  const fetchTickets = useCallback(async () => {
    if (!userId) return;
    try {
      const endpoint =
        statusFilter === '1' || statusFilter === null
          ? `${BASE_URL}/api/tickets`
          : `${BASE_URL}/api/tickets/employee/${userId}`;

      const response = await axios.get(
        `${BASE_URL}/api/tickets/employee/${userId}`,
        // {
        //   params: { status_id: statusFilter },
        // },
      );
      setTickets(response?.data?.list || []);
    } catch (error) {
      console.error(error);
      setTickets([]);
    }
  }, [userId, statusFilter]);

  useEffect(() => {
    if (userId) {
      fetchTickets();
    }
  }, [userId, statusFilter, fetchTickets]);

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
    } catch (err) {
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
    const ticketData = {
      status_id: 3,
      status_tracker: trackerData,
    };
    try {
      await axios.put(`${BASE_URL}/api/tickets/${item.ticket_id}`, {
        ticketData,
      });
      fetchTickets();
      Alert.alert('Success', 'Work started');
    } catch (err) {
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
        } 
          // due to ${reasonForDelay}`
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

    const ticketData = {
      employee_arrival_date: formattedDate,
      status_tracker: trackerData,
    };
    try {
      await axios.put(`${BASE_URL}/api/tickets/${selectedTicket.ticket_id}`, {
        ticketData,
      });
      fetchTickets();
      setModalVisible(false);
      Alert.alert('Success', 'Arrival date updated');
    } catch (err) {
      Alert.alert('Error', 'Failed to update arrival');
    }
  };

  const handleServiceUpdate = async () => {
    const userStr = await AsyncStorage.getItem('userId');
    const user = JSON.parse(userStr);
    const reason =
      serviceReason === 'Other'
        ? customServiceReason
        : serviceReason || 'Service Update from Employee';
    const trackerData = StatusTracker(
      selectedTicket.status_tracker,
      reason,
      'In Progress',
      3,
      user.name,
      selectedTicket.employee_name,
      selectedTicket.employee_phone || '',
    );

    const ticketData = {
      status_tracker: trackerData,
      status_id: 3,
    };
    try {
      await axios.put(`${BASE_URL}/api/tickets/${selectedTicket.ticket_id}`, {
        ticketData,
      });
      fetchTickets();
      setServiceVisible(false);
      setServiceReason('');
      setCustomServiceReason('');
      Alert.alert('Success', 'Service updated');
    } catch (err) {
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

    const ticketData = {
      status_id,
      status_tracker: trackerData,
    };

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
    } catch (err) {
      Alert.alert('Error', 'Failed to update status');
    }
  };
  const getStatusChipStyle = status => {
    switch (status?.toLowerCase()) {
      case 'open':
        return {
          backgroundColor: '#FFC107',
          color: '#000000',
        };
      case 'todo':
        return {
          backgroundColor: '#FF6B6B',
          color: '#FFFFFF',
        };
      case 'in-progress':
        return {
          backgroundColor: '#4D96FF',
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
          backgroundColor: '#9CA3AF',
          color: '#FFFFFF',
        };
    }
  };

  const renderItem = ({ item }) => {
    const hasButtons =
      item.status_id === 1 || item.status_id === 2 || item.status_id === 3;

    return (
      <>
        <TouchableOpacity
          style={styles.ticketCard}
          onPress={() => {
            if (item.status_id !== 1) {
              navigation.navigate('ViewTickets', { ticketId: item.ticket_id });
            }
          }}
        >
          <View style={styles.ticketHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.customer_name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.ticketDate}>#{item.ticket_service_id}</Text>
              <Text style={styles.ticketTitle}>{item.customer_name}</Text>
              <Text style={styles.ticketTitle}>
                <Text style={styles.categoryLabel}>Category : </Text>
                <Text style={styles.categoryName}>{item.category_name}</Text>
              </Text>

              <View style={styles.dateRow}>
                <MaterialIcons
                  name="access-time"
                  size={18}
                  color="#069b7c"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.ticketDates}>
                  {item.created_at?.split('T')[0]}
                </Text>
              </View>

              <View style={styles.dateRow}>
                <MaterialIcons
                  name="location-on"
                  size={18}
                  color="#069b7c"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.ticketDates}>
                  {item.state_name},{item.city_name},{item.region_name},
                  {item.address_type},{item.address}
                </Text>
              </View>
            </View>
            {(() => {
              const chipStyle = getStatusChipStyle(item.status_name);
              return (
                <View
                  style={[
                    styles.statusChip,
                    { backgroundColor: chipStyle.backgroundColor },
                  ]}
                >
                  <Text style={[styles.statusText, { color: chipStyle.color }]}>
                    {item.status_name}
                  </Text>
                </View>
              );
            })()}
          </View>

          {hasButtons && <View style={styles.divider} />}
          <View style={styles.buttonRow}>
            {item.status_id === 1 && (
              <View style={{ alignItems: 'flex-end', width: '100%' }}>
                <TouchableOpacity
                  style={styles.Assign}
                  onPress={() => handleAssignToMe(item)}
                >
                  <Text style={styles.buttonText}>Assign to Me</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {item.status_id === 2 && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={
                  item.employee_arrival_date
                    ? styles.arrivalButton
                    : styles.arrivalDateAlone
                }
                onPress={() => {
                  setSelectedTicket(item);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.buttonText}>Arrival Date</Text>
              </TouchableOpacity>

              {item.employee_arrival_date && (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => handleStartWork(item)}
                >
                  <Text style={styles.buttonText}>Start</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {item.status_id === 3 && (
            <View style={styles.inProgressActionRow}>
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
        </TouchableOpacity>
      </>
    );
  };

  return (
    <>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>

        <View style={{ marginTop: 10, paddingHorizontal: 20 }}>
          <Text style={styles.filterLabel}> Status</Text>
          <View style={styles.pickerWrapper}>
            {/* <Picker
              selectedValue={statusFilter}
              onValueChange={value => setStatusFilter(value)}
              style={styles.picker}
              dropdownIconColor="#069b7c"
            >
              <Picker.Item label="All" value={null} />
              {ticketStatuses.map(status => (
                <Picker.Item
                  key={status.status_id}
                  label={status.status_name}
                  value={status.status_id.toString()}
                />
              ))}
            </Picker> */}
          </View>
        </View>
      </View>

      <View style={styles.container}>
        <FlatList
          data={tickets}
          keyExtractor={item => item.ticket_id.toString()}
          renderItem={renderItem}
        />

        <Modal visible={editVisible} transparent animationType="slide">
          <View style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Update Status</Text>

              {/* <Picker
                selectedValue={editStatus}
                onValueChange={val => setEditStatus(val)}
                style={styles.input}
              >
                <Picker.Item label="Select Status" value="" />
                <Picker.Item label="Done" value="Done" />
                <Picker.Item label="On Hold" value="On Hold" />
                <Picker.Item label="Pending" value="Pending" />
              </Picker> */}

              {(editStatus === 'On Hold' || editStatus === 'Pending') && (
                <TextInput
                  placeholder="Reason"
                  value={editReason}
                  onChangeText={setEditReason}
                  style={styles.input}
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

        <Modal visible={serviceVisible} transparent animationType="slide">
          <View style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Update Service</Text>

              {/* <Picker
                selectedValue={serviceReason}
                onValueChange={itemValue => setServiceReason(itemValue)}
                style={styles.input}
              >
                {serviceReasons.map((reason, idx) => (
                  <Picker.Item key={idx} label={reason} value={reason} />
                ))}
              </Picker> */}

              {serviceReason === 'Other' && (
                <TextInput
                  placeholder=" Reason"
                  value={customServiceReason}
                  onChangeText={setCustomServiceReason}
                  style={styles.input}
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
            onChange={(event, selectedDate) => {
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
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) setArrivalTime(selectedTime);
            }}
          />
        )}
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <FontAwesome name="home" size={30} color="#069b7c" />
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
          <MaterialIcons name="event" size={30} color="#888" />
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

const styles = StyleSheet.create({
  ticketCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 0.1,
    borderColor: '#000',
  },

  divider: {
    backgroundColor: '#bbb',
    marginTop: 10,
    height: 1.5,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 30,
    height: 30,
    backgroundColor: '#069b7c',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: -50,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerInfo: {
    flex: 1,
  },
  ticketTitle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 3,
    color: '#000',
  },

  categoryLabel: {
    fontSize: 14,
    color: '#000',
    fontWeight: '400',
  },

  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000', // Tailwind gray-900
  },

  ticketDate: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
    marginBottom: 3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  ticketDates: {
    fontSize: 14,
    color: '#000', // Tailwind gray-500
  },

  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,

    fontWeight: 'bold',
  },

  priorityText: {
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#eee',
    borderRadius: 8,
    color: '#222',
    fontWeight: 'bold',
  },
  subText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#888',
  },
  buttonFilled: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#069b7c',

    borderRadius: 8,
    marginTop: 8,
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
    backgroundColor: '#069b7c',
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

  buttonRows: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    gap: 10,
  },

  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
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
  container: {
    flex: 1,
    padding: 20,
  },

  actionButton: {
    flex: 1,
    backgroundColor: '#069b7c',
    paddingVertical: 10,
    marginHorizontal: 5,

    borderRadius: 8,
    alignItems: 'center',
  },

  header: {
    backgroundColor: '#069b7c',
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 16,
    elevation: 4,
    // paddingTop: 40,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },

  filterSection: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 3,
  },

  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 6,
  },

  pickerWrapper: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },

  picker: {
    height: 50,
    width: '100%',

    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 10,
  },

  Assign: {
    marginLeft: 'auto',
    backgroundColor: '#069b7c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

  arrivalDateAlone: {
    marginLeft: 'auto',
    backgroundColor: '#069b7c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  arrivalButton: {
    flex: 1,
    backgroundColor: '#ff9800',
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  startButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  inProgressActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 10,
  },

  serviceButton: {
    flex: 1,
    backgroundColor: '#FFA726',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  editButton: {
    flex: 1,
    backgroundColor: '#4DB6AC',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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

export default Dashboard;
