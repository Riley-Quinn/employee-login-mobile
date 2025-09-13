import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import AddConversation from './Conversation';
import CommentsHistory from './CommentsHistory';
import { BASE_URL } from '@env';

const AddComments = ({ ticket, user, fetchData, fetchError, fetchSuccess }) => {
  const [commentData, setCommentData] = useState('');

  let commentsHistory = null;
  if (ticket?.comments) {
    commentsHistory = AddConversation(ticket?.comments, user);
  }

  const handleConversation = async () => {
    if (!commentData.trim()) return;

    const commentId = `conv-${Date.now()}`;
    const data = CommentsHistory(
      ticket?.comments,
      commentData,
      commentId, // Pass conversation ID
      user?.userId, // Participant ID
      user?.Role[0],
      user?.name,
    );

    const ticketData = {
      comments: data,
    };

    try {
      const response = await axios.put(
        `${BASE_URL}/api/tickets/${ticket?.ticket_id}`,
        { ticketData },
      );
      fetchData();
      fetchSuccess(response?.data?.message || 'Comment added');
      setCommentData('');
    } catch (err) {
      fetchError(err.response?.data?.error || 'Failed to add comment');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.historyText}>{commentsHistory}</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add comment..."
          value={commentData}
          onChangeText={setCommentData}
          multiline
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleConversation}
          disabled={!commentData.trim()}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddComments;

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginHorizontal: 12,
  },
  historyText: {
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  addButton: {
    marginLeft: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
