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
import { Formik, FormikState } from 'formik';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import { io, Socket } from 'socket.io-client';
import DateFormat from './DateFormat';
import { BASE_URL } from '../config';
import { DefaultEventsMap } from '@socket.io/component-emitter';

type AddConversationProps = {
  data: any;
  customerComments: any;
  fetchData: () => void;
};
interface User {
  userId: any;
  name: any;
  Role: any;
}
interface Conversation {
  sender_id: string;
  sender_name: string;
  text: string;
  date: string;
  id: any;
}

const AddConversation = ({
  data,
  customerComments,
  fetchData,
}: AddConversationProps) => {
  const [conversationData, setConversationData] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  // const socket = useRef(null);
  const socket = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(
    null,
  );

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

      const allMessages = parsed.flatMap(
        (item: {
          message: { filter: (arg0: (m: any) => any) => any; text: any };
        }) => {
          if (Array.isArray(item.message)) {
            return item.message.filter((m: { text: any }) => m && m.text);
          } else if (item.message && item.message.text) {
            return [item.message];
          }
          return [];
        },
      );

      setConversationData(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMessages = allMessages.filter(
          (m: { id: any }) => !existingIds.has(m.id),
        );
        return [...prev, ...newMessages];
      });
    } catch (err) {
      console.log('Failed to parse conversation', err);
    }
  }, [customerComments]);

  const ticketId = data?.ticket_id ?? data?.id;

  const setupSocketIO = useCallback(() => {
    if (ticketId == null || ticketId === '') return () => {};
    const socketUrl = `${BASE_URL}`;
    socket.current = io(socketUrl, {
      transports: ['websocket'],
    });

    socket.current.on('connect', () => {
      console.log('Socket connected');
      socket.current?.emit('join_ticket', ticketId);
    });

    socket.current.on('message', (msg: Conversation) => {
      setConversationData(prev => {
        const hasId = msg.id && prev.some(m => m.id === msg.id);
        if (hasId) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.current?.disconnect();
      socket.current = null;
    };
  }, [ticketId]);

  useEffect(() => {
    const cleanup = setupSocketIO();
    return cleanup;
  }, [setupSocketIO]);
  const handleConversation = async (
    values: { customer_comments: any },
    resetForm: {
      (
        nextState?:
          | Partial<FormikState<{ customer_comments: string }>>
          | undefined,
      ): void;
      (): void;
    },
  ) => {
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
      ticket_id: ticketId,
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
      const error = err as AxiosError<any>;
      Alert.alert('Error', error?.response?.data?.error || 'Failed to send');
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
        {conversationData.length === 0 ? (
          <Text style={styles.noData}>No conversation yet.</Text>
        ) : (
          conversationData.map((msg, index) => {
            const isMe = String(msg.sender_id) === String(userInfo.userId);
            return (
              <View
                key={msg.id || index}
                style={[
                  styles.messageBubble,
                  isMe ? styles.myMessage : styles.theirMessage,
                ]}
              >
                <Text style={styles.sender}>{msg.sender_name}</Text>
                <Text style={styles.messageText}>{msg.text}</Text>
                <Text style={styles.dateText}>{msg.date}</Text>
              </View>
            );
          })
        )}
      </View>

      <Formik
        initialValues={{ customer_comments: '' }}
        onSubmit={(values, { resetForm }) =>
          handleConversation(values, resetForm)
        }
      >
        {({ values, handleChange, handleSubmit }) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View style={[styles.formContainer, { flex: 1 }]}>
              <TextInput
                placeholder="Type a message"
                placeholderTextColor="#888"
                style={styles.input}
                value={values.customer_comments}
                onChangeText={handleChange('customer_comments')}
                multiline
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!values.customer_comments}
              style={{
                marginLeft: 8,
                backgroundColor: !values.customer_comments ? '#ccc' : '#007AFF',
                paddingHorizontal: 8,
                paddingVertical: 8,
                borderRadius: 15,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
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
  myMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-end',

    marginHorizontal: 12,
    marginBottom: 6,
    padding: 10,
  },
  theirMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',

    marginHorizontal: 12,
    marginBottom: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dateText: {
    fontSize: 10,
    color: '#999',
    alignSelf: 'flex-end',
    marginTop: 4,
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
    borderRadius: 10,

    elevation: 2,
  },

  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 2,
    paddingHorizontal: 2,
    color: '#888',
    marginHorizontal: 10,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#008080',
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
