import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Formik } from 'formik';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import io from 'socket.io-client';
import DateFormat from './DateFormat';
import { BASE_URL } from '@env';

const AddConversation = ({ data, customerComments, fetchData }) => {
  const [conversationData, setConversationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const socket = useRef(null);
  const scrollViewRef = useRef(null);

  const currentTime = DateFormat();

  // Load logged-in user info
  useEffect(() => {
    const loadUser = async () => {
      try {
        const name = await AsyncStorage.getItem('name');
        const role = await AsyncStorage.getItem('Role');
        const userId = await AsyncStorage.getItem('userId');

        setUserInfo({
          userId,
          name: name || 'Employee',
          Role: role ? [role] : ['Employee'],
        });
      } catch (err) {
        console.log('Failed to load user', err);
      }
    };
    loadUser();
  }, []);

  // Parse old messages and normalize
  useEffect(() => {
    try {
      const parsed = JSON.parse(customerComments || '[]');

      const allMessages = parsed.flatMap(item => {
        if (Array.isArray(item.message)) {
          return item.message
            .filter(m => m && m.text)
            .map(m => ({
              id: m.id || `old-${Math.random().toString(36).substr(2, 9)}`,
              text: m.text,
              date:
                m.date ||
                new Date().toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                }),
              sender_name:
                m.sender_name ||
                (m.sender_role === 'Employee' ? 'Employee' : 'Customer'),
              sender_role: m.sender_role || 'Customer',
            }));
        } else if (item.message && item.message.text) {
          const m = item.message;
          return [
            {
              id: m.id || `old-${Math.random().toString(36).substr(2, 9)}`,
              text: m.text,
              date:
                m.date ||
                new Date().toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                }),
              sender_name:
                m.sender_name ||
                (m.sender_role === 'Employee' ? 'Employee' : 'Customer'),
              sender_role: m.sender_role || 'Customer',
            },
          ];
        }
        return [];
      });

      setConversationData(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMessages = allMessages.filter(m => !existingIds.has(m.id));
        return [...prev, ...newMessages];
      });
    } catch (err) {
      console.log('Failed to parse conversation', err);
    }
  }, [customerComments]);

  // Setup Socket.IO
  const setupSocketIO = useCallback(() => {
    socket.current = io(BASE_URL, { transports: ['websocket'] });

    socket.current.on('connect', () => {
      console.log('Socket connected');
    });

    socket.current.on('message', msg => {
      setConversationData(prev => [...prev, msg]);
      // Scroll to bottom
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  useEffect(() => {
    const cleanup = setupSocketIO();
    return cleanup;
  }, [setupSocketIO]);

  const handleConversation = async (values, resetForm) => {
    if (!userInfo) {
      Alert.alert('Error', 'User not loaded');
      return;
    }

    const conversationId = `conv-${Date.now()}`;
    const newMessage = {
      id: conversationId,
      text: values.customer_comments,
      sender_id: userInfo.userId,
      sender_role: userInfo.Role[0],
      sender_name: userInfo.name,
      date: currentTime,
    };

    // Optimistic UI update
    setConversationData(prev => [...prev, newMessage]);
    scrollViewRef.current?.scrollToEnd({ animated: true });

    try {
      const ticketData = {
        customer_comments: JSON.stringify([...conversationData, newMessage]),
      };

      // Update backend
      await axios.put(`${BASE_URL}/api/tickets/${data?.ticket_id}`, {
        ticketData,
      });

      // Broadcast to socket
      if (socket.current?.connected) {
        socket.current.emit('message', newMessage);
      }

      resetForm();
      fetchData();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to send');

      // Remove message if failed
      setConversationData(prev => prev.filter(m => m.id !== conversationId));
    }
  };

  if (loading || !userInfo) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {conversationData.length === 0 ? (
          <Text style={styles.noData}>No conversation yet.</Text>
        ) : (
          conversationData.map((msg, index) => (
            <View key={msg.id || index} style={styles.messageBubble}>
              <Text style={styles.sender}>
                {msg.sender_name} - {msg.date}
              </Text>
              <Text style={styles.messageText}>{msg.text}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <Formik
        initialValues={{ customer_comments: '' }}
        onSubmit={(values, { resetForm }) =>
          handleConversation(values, resetForm)
        }
      >
        {({ values, handleChange, handleSubmit }) => (
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Type a message"
              placeholderTextColor="#888"
              style={styles.input}
              value={values.customer_comments}
              onChangeText={handleChange('customer_comments')}
              multiline
            />
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!values.customer_comments}
              style={[
                styles.sendButton,
                {
                  backgroundColor: values.customer_comments
                    ? '#007AFF'
                    : '#ccc',
                },
              ]}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesContainer: { flex: 1, paddingBottom: 10, paddingHorizontal: 10 },
  messageBubble: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    elevation: 1,
  },
  sender: { fontWeight: '600', fontSize: 14, color: 'black', marginBottom: 4 },
  messageText: { fontSize: 14, color: '#888', fontWeight: 'bold' },
  noData: {
    fontSize: 14,
    color: '#999',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  input: { flex: 1, fontSize: 14, paddingHorizontal: 10, color: '#000' },
  sendButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AddConversation;
