import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FormatConversationHistory = (conversationData, user) => {
  let data = [];

  try {
    data = JSON.parse(conversationData);
  } catch (err) {
    console.error('Invalid JSON:', err);
    return <Text style={styles.errorText}>Invalid conversation data</Text>;
  }

  const role = user?.Role?.[0] || 'customer';

  if (!data || data.length === 0) {
    return <Text style={styles.noDataText}>No conversations available</Text>;
  }

  return data.map((conversation, index) => {
    const message = conversation.message || conversation;

    if (!message || !message.id) {
      console.error('Invalid message data', message);
      return null;
    }

    const isOwnMessage = message.sender_role === role;

    return (
      <View
        key={message.id}
        style={[
          styles.chatBox,
          { alignItems: isOwnMessage ? 'flex-end' : 'flex-start' },
        ]}
      >
        <View
          style={[
            styles.messageContainer,
            {
              backgroundColor: isOwnMessage ? '#e3f2fd' : '#fff',
              borderColor: '#ddd',
              alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
            },
          ]}
        >
          <Text style={styles.senderName}>
            {message.sender_name || 'Unknown'}
          </Text>
          <Text style={styles.messageText}>{message.text || 'No message'}</Text>
          <Text style={styles.messageDate}>
            {message.date || 'Unknown date'}
          </Text>
        </View>
      </View>
    );
  });
};

const styles = StyleSheet.create({
  chatBox: {
    marginBottom: 12,
    width: '100%',
  },
  messageContainer: {
    maxWidth: '70%',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  senderName: {
    fontSize: 12,
    color: '#000',
    marginBottom: 4,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  messageDate: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
    marginTop: 6,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    padding: 10,
  },
  noDataText: {
    fontSize: 14,
    color: '#777',
    padding: 10,
  },
});

export default FormatConversationHistory;
