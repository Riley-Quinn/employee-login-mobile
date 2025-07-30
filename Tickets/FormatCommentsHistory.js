import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FormatCommentsHistory = (commentsData, user) => {
  let data = [];

  try {
    data =
      typeof commentsData === 'string'
        ? JSON.parse(commentsData)
        : commentsData;
  } catch (e) {
    console.error('Invalid comment data', e);
    return null;
  }

  const role = user?.Role?.[0] || 'admin';

  return data?.map((comment, index) => {
    const isOwnMessage = comment?.message?.sender_role === role;

    return (
      <View key={index} style={styles.messageContainer}>
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessage : styles.otherMessage,
          ]}
        >
          <Text style={styles.sender}>
            <Text style={{ color: 'black' }}>
              {comment?.message?.sender_name}
            </Text>{' '}
            {comment?.message?.date}
          </Text>
          <Text style={styles.messageText}>{comment?.message?.text}</Text>
        </View>
      </View>
    );
  });
};

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#e3f2fd',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fbfbfb',
  },
  sender: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#000',
  },
});

export default FormatCommentsHistory;
