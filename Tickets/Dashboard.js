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
  StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import { Dimensions } from 'react-native';
import moment from 'moment';

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StatusTracker from './StatusTracker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { BarChart } from 'react-native-gifted-charts';
const screenWidth = Dimensions.get('window').width;

import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { BASE_URL } from '@env';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [weeklyData, setWeeklyData] = useState([]);

  const [editStatus, setEditStatus] = useState('');
  const [editReason, setEditReason] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [ticketStatuses, setTicketStatuses] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    todo: 0,
    inProgress: 0,
    pending: 0,
    onHold: 0,
  });
  const totalTickets =
    statusCounts.todo +
    statusCounts.inProgress +
    statusCounts.pending +
    statusCounts.onHold;
  const getPriorityTicket = ticketsArray => {
    const high = ticketsArray.find(t => t.priority_rank === 'High');
    if (high) return high;

    const medium = ticketsArray.find(t => t.priority_rank === 'Medium');
    if (medium) return medium;

    const low = ticketsArray.find(t => t.priority_rank === 'Low');
    if (low) return low;

    return null;
  };

  const ticketToDisplay = getPriorityTicket(tickets);

  useEffect(() => {
    const init = async () => {
      try {
        console.log('🔄 Initializing useEffect...');

        const id = await AsyncStorage.getItem('userId');
        console.log('📦 Retrieved userId from AsyncStorage:', id);
        setUserId(id);

        console.log(
          '🌐 Fetching ticket statuses from:',
          `http://10.0.2.2:5000/api/ticket-statuses`,
        );
        const res = await axios.get(`http://10.0.2.2:5000/api/ticket-statuses`);
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
        `http://10.0.2.2:5000/api/tickets/employee/${userId}`,
      );
      let list = response?.data?.list || [];

      if (statusFilter && statusFilter !== 'all') {
        list = list.filter(
          ticket => ticket.status_id.toString() === statusFilter,
        );
      }

      const highPriorityTickets = list.filter(
        ticket => ticket.priority_rank === 'High',
      );

      const topTickets = highPriorityTickets
        .sort((a, b) => b.urgency - a.urgency)
        .slice(0, 3);

      setTickets(topTickets);

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyCounts = days.map(day => ({ label: day, done: 0, todo: 0 }));

      const startOfWeek = moment().startOf('week');
      const endOfWeek = moment().endOf('week');

      list.forEach(ticket => {
        const createdDate = moment(ticket.created_at);
        const dayIndex = createdDate.day();

        if (
          ticket.status_id === 1 ||
          ticket.status_name?.toLowerCase() === 'todo'
        ) {
          if (createdDate.isBetween(startOfWeek, endOfWeek, 'day', '[]')) {
            weeklyCounts[dayIndex].todo += 1;
          }
        }

        if (
          ticket.status_id === 6 ||
          ticket.status_name?.toLowerCase() === 'done'
        ) {
          let doneDate = null;
          if (Array.isArray(ticket.status_tracker)) {
            const doneEntry = ticket.status_tracker.find(
              entry =>
                entry.status?.toLowerCase() === 'done' &&
                (entry.Date || entry.updatedDate),
            );
            if (doneEntry)
              doneDate = moment(doneEntry.Date || doneEntry.updatedDate);
          }
          if (!doneDate) doneDate = createdDate;

          if (doneDate.isBetween(startOfWeek, endOfWeek, 'day', '[]')) {
            const dayIndexDone = doneDate.day();
            weeklyCounts[dayIndexDone].done += 1;
          }
        }
      });

      setWeeklyData(weeklyCounts);
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
          `http://10.0.2.2:5000/api/tickets/employee/ticket-counts/${userId}`,
        );

        console.log('📊 Ticket counts response:', response.data);

        const counts = response.data.list;

        setStatusCounts({
          todo: counts.ToDo?.total_count || 0,
          inProgress: counts['In-Progress']?.total_count || 0,
          pending: counts.Pending?.total_count || 0,
          done: counts.Done?.total_count || 0,
          open: counts.Open?.total_count || 0,

          onHold: counts['On-Hold']?.total_count || 0,
        });
      } catch (error) {
        console.error('❌ Error fetching ticket counts:', error);
      }
    };

    fetchTicketCounts();
  }, [userId, fetchTickets, statusFilter]);
  const groupedBarData = [];
  weeklyData.forEach(day => {
    groupedBarData.push({
      value: day.done || 0,
      label: day.label,
      spacing: 2,
      labelWidth: 30,
      labelTextStyle: { color: 'gray' },
      frontColor: '#008080',
    });
    groupedBarData.push({
      value: day.todo || 0,
      frontColor: '#377df7',
    });
  });
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
      await axios.put(`http://10.0.2.2:5000/api/tickets/${item.ticket_id}`, {
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
      await axios.put(`http://10.0.2.2:5000/api/tickets/${item.ticket_id}`, {
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
      await axios.put(
        `http://10.0.2.2:5000/api/tickets/${selectedTicket.ticket_id}`,
        {
          ticketData: {
            employee_arrival_date: formattedDate,
            status_tracker: trackerData,
          },
        },
      );
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
      await axios.put(
        `http://10.0.2.2:5000/api/tickets/${selectedTicket.ticket_id}`,
        {
          ticketData: { status_tracker: trackerData, status_id: 3 },
        },
      );
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
      await axios.put(
        `http://10.0.2.2:5000/api/tickets/${selectedTicket.ticket_id}`,
        {
          ticketData,
        },
      );
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
          backgroundColor: '#d8b487',
          color: '#FFFFFF',
        };
      case 'in-progress':
        return {
          backgroundColor: '#A6C8FF',
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
          backgroundColor: '#cf82ac',
          color: '#FFFFFF',
        };
    }
  };

  const renderItem = ({ item }) => {
    const isPriority = ticketToDisplay?.ticket_id === item.ticket_id;

    return (
      <TouchableOpacity
        onPress={() => {
          if (item.status_id !== 1) {
            navigation.navigate('ViewTickets', { ticketId: item.ticket_id });
          }
        }}
      >
        <View style={styles.cardContents}>
          <View
            style={[
              styles.headerRow,
              {
                backgroundColor: '#008080',
                padding: 10,
                borderRadius: 8,
                alignItems: 'center',
              },
            ]}
          >
            <Text style={styles.ticketId}>#{item.ticket_service_id}</Text>

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

          <View style={styles.infoSection}>
            <View style={styles.infoRows}>
              <Text style={styles.title}>{item.title ? item.title : '-'}</Text>
              <Text style={styles.label}>{item.description}</Text>
            </View>

            <View style={[styles.infoRow, { justifyContent: 'space-between' }]}>
              <Text style={styles.boldLabels}>
                Category:{' '}
                <Text style={styles.labels}>{item.category_name}</Text>
              </Text>
              <Text style={styles.boldLabels}>
                Region:{' '}
                <Text style={styles.labels}>{` ${item.region_name}`}</Text>
              </Text>
            </View>
            <View style={styles.divider} />
          </View>
          <View
            style={[
              styles.infoRow,
              {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {item.status_id === 1 && (
                <TouchableOpacity
                  style={styles.assignButton}
                  onPress={() => handleAssignToMe(item)}
                >
                  <Text style={styles.buttonText}>Assign to Me</Text>
                </TouchableOpacity>
              )}

              {item.status_id === 2 && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: item.employee_arrival_date
                      ? 'space-between'
                      : 'flex-end',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  <TouchableOpacity
                    style={styles.arrivalButton}
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

      <SafeAreaView style={{ backgroundColor: '#008080', flex: 0 }}>
        <Text style={styles.ticketNumber}>Dashboard</Text>
      </SafeAreaView>

      <View style={styles.statusGrid}>
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: '#ffdcaf',
              borderColor: '#ffdcaf',
              borderWidth: 2,
            },
          ]}
        >
          <View
            style={[
              styles.cardContent,
              {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              },
            ]}
          >
            <View style={styles.textBlock}>
              <Text style={styles.statusTitle}>ToDo</Text>
              <Text style={styles.statusNumber}>{statusCounts.todo}</Text>
            </View>

            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 10,
                backgroundColor: '#d8b487',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <FontAwesome6
                name="triangle-exclamation"
                size={24}
                color="#fff"
              />
            </View>
          </View>
        </View>

        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: '#A6C8FF',
              borderColor: '#A6C8FF',
              borderWidth: 2,
            },
          ]}
        >
          <View
            style={[
              styles.cardContent,
              {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              },
            ]}
          >
            <View style={styles.textBlock}>
              <Text style={styles.statusTitle}>In Progress</Text>
              <Text style={styles.statusNumber}>{statusCounts.inProgress}</Text>
            </View>

            <View
              style={{
                backgroundColor: '#81b4f5',
                width: 50,
                height: 50,
                borderRadius: 10,
                justifyContent: 'center',

                alignItems: 'center',
              }}
            >
              <Ionicons name="shield-outline" size={24} color="#fff" />
            </View>
          </View>
        </View>

        <View
          style={[
            styles.row,
            { justifyContent: 'space-between', marginTop: 10 },
          ]}
        >
          <View
            style={[
              styles.statusCard,
              {
                backgroundColor: '#dbbeff',
                borderColor: '#dbbeff',
                borderWidth: 2,
              },
            ]}
          >
            <View
              style={[
                styles.cardContent,
                {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                },
              ]}
            >
              <View style={styles.textBlock}>
                <Text style={styles.statusTitle}>Pending</Text>
                <Text style={styles.statusNumber}>{statusCounts.pending}</Text>
              </View>

              <View
                style={{
                  backgroundColor: '#9d76cd',
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="time-outline" size={24} color="#fff" />
              </View>
            </View>
          </View>

          <View
            style={[
              styles.statusCard,
              {
                backgroundColor: '#ffc5e5',
                borderColor: '#ffc5e5',
                borderWidth: 2,
              },
            ]}
          >
            <View
              style={[
                styles.cardContent,
                {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                },
              ]}
            >
              <View style={styles.textBlock}>
                <Text style={styles.statusTitle}>On-hold</Text>
                <Text style={styles.statusNumber}>{statusCounts.onHold}</Text>
              </View>

              <View
                style={{
                  backgroundColor: '#cf82ac',
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="time-outline" size={24} color="#fff" />
              </View>
            </View>
          </View>
        </View>
      </View>

      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 15,
          marginVertical: 20,
          marginHorizontal: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: '#000',
            fontWeight: '600',
            marginBottom: 10,
            marginHorizontal: 10,
          }}
        >
          Weekly Progress
        </Text>

        {/* <View
          style={{
            flexDirection: 'row',
            marginBottom: 10,
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 15,
            }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: '#22c55e',
                marginRight: 5,
              }}
            />
            <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>
              Done
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: '#f87171',
                marginRight: 5,
              }}
            />
            <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>
              ToDo
            </Text>
          </View>
        </View> */}

        <BarChart
          data={groupedBarData}
          barWidth={12}
          spacing={15}
          // hideRules
          // yAxisThickness={1}
          // roundedTop
          // roundedBottom
          noOfSections={5}
          maxValue={Math.max(
            ...weeklyData.map(d => (d.done || 0) + (d.todo || 0)),
            10,
          )}
        />
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.Tickets}>TodayTickets</Text>

        <View style={{ flex: 1 }} />

        <TouchableOpacity onPress={() => navigation.navigate('TicketPage')}>
          <Text style={styles.Ticket}>ViewAll</Text>
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
        <FlatList
          data={tickets}
          keyExtractor={item => item.ticket_id.toString()}
          renderItem={renderItem}
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

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <FontAwesome name="home" size={30} color="#008080" />
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
  headerContainer: {
    backgroundColor: '#008080',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  textBlock: {
    alignItems: 'flex-start',
  },

  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    margin: 12,
  },
  statusCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,

    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  statusNumber: {
    fontSize: 22,
    fontWeight: '500',
    marginVertical: 12,
    color: '#222',
    marginLeft: 10,
  },
  cardContents: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 6,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    top: -5,
  },
  headerRow: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  ticketId: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
    marginVertical: 4,
  },
  infoRows: {
    flexDirection: 'column',
  },
  boldLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#555',
  },
  boldLabels: {
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 5,
    color: '#555',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#000',
  },

  label: {
    fontWeight: 'bold',
    color: '#555',
    fontSize: 14,
    marginTop: 10,
  },
  labels: {
    fontWeight: 'bold',
    color: '#008080',
    fontsize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
    borderRadius: 1,
  },

  infoIcon: {
    marginRight: 6,
  },

  Tickets: {
    fontWeight: '600',
    color: '#222',
    marginHorizontal: 30,
    fontSize: 14,
  },
  Ticket: {
    fontWeight: '600',
    color: '#222',
    marginRight: 20,
    fontSize: 14,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#efedf4',
    flex: 1,
    marginLeft: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    // marginVertical: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },

  dropdownWrapper: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
  },

  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
  },

  cardLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },

  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 30,
    height: 30,
    backgroundColor: '#008080',
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
    color: '#000',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },

  iconBox: {
    width: 10,
    height: 10,
    backgroundColor: '#008080',
    marginRight: 8,
    marginTop: 6,
    borderRadius: 2,
  },

  emptyBox: {
    width: 10,
    height: 10,
    marginRight: 8,
    marginTop: 6,
  },

  ticketDate: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
    marginBottom: 3,
  },
  dateRow: {
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

  ticketDates: {
    fontSize: 14,
    color: '#000',
  },
  tickets: {
    fontSize: 14,
    color: '#000',
    paddingVertical: 2,
    paddingHorizontal: 4,
    textAlignVertical: 'center',
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
    backgroundColor: '#008080',

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
    backgroundColor: '#008080',
    paddingVertical: 10,
    marginHorizontal: 5,

    borderRadius: 8,
    alignItems: 'center',
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
  assignButton: {
    backgroundColor: '#008080',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginLeft: 5,
  },

  arrivalButton: {
    backgroundColor: '#ff6f00',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    textAlign: 'center',
  },

  startButton: {
    backgroundColor: '#ff6f00',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginLeft: 5,
  },

  serviceButton: {
    backgroundColor: '#28a745',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },

  editButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  Assign: {
    marginLeft: 'auto',
    backgroundColor: '#008080',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

  arrivalDateAlone: {
    marginLeft: 'auto',
    backgroundColor: '#008080',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

  inProgressActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 10,
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
