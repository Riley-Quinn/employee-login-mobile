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

const AddConversation = ({ data, user, customerComments, fetchData }) => {
  const [conversationData, setConversationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const socket = useRef(null);
  const currentTime = DateFormat();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const name = await AsyncStorage.getItem('name');
        const role = await AsyncStorage.getItem('Role');
        const userId = await AsyncStorage.getItem('userId');

        setUserInfo({
          userId,
          name: name || '',
          Role: role ? [role] : [],
        });
      } catch (err) {
        console.log('Failed to load user', err);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    try {
      const parsed = JSON.parse(customerComments || '[]');
      const validMessages = parsed
        .map(item => item?.message)
        .filter(m => m && m.text);
      setConversationData(validMessages);
    } catch (err) {
      console.log('Failed to parse conversation', err);
      setConversationData([]);
    }
  }, [customerComments]);
  const setupSocketIO = useCallback(() => {
    const socketUrl = `${BASE_URL}`;
    socket.current = io(socketUrl, {
      transports: ['websocket'],
    });

    socket.current.on('connect', () => {
      console.log('Socket connected');
    });

    socket.current.on('message', msg => {
      console.log('Received via socket:', msg);
      setConversationData(prev => [...prev, msg]);
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
      sender_id: userInfo?.userId,
      sender_role: userInfo?.Role?.[0],
      sender_name: userInfo?.name,
      date: currentTime,
    };

    const updatedConversation = [...conversationData, newMessage];
    setConversationData(updatedConversation);

    try {
      const ticketData = {
        customer_comments: JSON.stringify(
          updatedConversation.map(msg => ({ message: msg })),
        ),
      };

      await axios.put(`${BASE_URL}/api/tickets/${data?.ticket_id}`, {
        ticketData,
      });

      if (socket.current?.connected) {
        socket.current.emit('message', newMessage);
      }

      resetForm();
      fetchData();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to send');
      setConversationData(prev => prev.filter(m => m.id !== newMessage.id));
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
    <ScrollView>
      <View style={styles.messagesContainer}>
        <Text style={styles.title}>Customer</Text>
        {conversationData.length === 0 ? (
          <Text style={styles.noData}>No conversation yet.</Text>
        ) : (
          conversationData.map((msg, index) => (
            <View key={msg.id || index} style={styles.messageBubble}>
              <Text style={styles.sender}>
                {msg.sender_name} ({msg.sender_role}) - {msg.date}
              </Text>
              <Text style={styles.messageText}>{msg.text}</Text>
            </View>
          ))
        )}
      </View>

      <Formik
        initialValues={{ customer_comments: '' }}
        onSubmit={(values, { resetForm }) =>
          handleConversation(values, resetForm)
        }
      >
        {({ values, handleChange, handleSubmit }) => (
          <View style={styles.formContainer}>
            <TextInput
              placeholder="Type a message"
              style={styles.input}
              value={values.customer_comments}
              onChangeText={handleChange('customer_comments')}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.button,
                !values.customer_comments && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={!values.customer_comments}
            >
              <Text style={styles.buttonText}>Send</Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    paddingBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'black',
    marginHorizontal: 22,
    marginBottom: 6,
  },
  noData: {
    fontSize: 14,
    color: '#999',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  messageBubble: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    marginHorizontal: 12,
    elevation: 1,
  },
  sender: {
    fontWeight: '600',
    fontSize: 14,
    color: 'black',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#888',
    fontWeight: 'bold',
  },
  formContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    marginHorizontal: 10,
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    color: '#888',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#069b7c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default AddConversation;
