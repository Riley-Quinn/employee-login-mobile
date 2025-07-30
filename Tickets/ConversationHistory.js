import DateFormat from './DateFormat'; // Ensure the import path is correct

const ConversationHistory = (
  previousData,
  messageText,
  conversationId,
  participantId,
  role,
  userName,
) => {
  const currentTime = DateFormat();

  // Create a new message entry
  const newMessage = {
    id: `${conversationId}-${Date.now()}`, // Generate a unique message ID
    sender_id: participantId,
    sender_role: role,
    sender_name: userName,
    text: messageText,
    date: currentTime,
  };

  // If there is no previous data, create a new conversation structure
  if (!previousData) {
    const newConversation = {
      message: newMessage,
    };
    return JSON.stringify([newConversation]); // Wrap in an array
  }

  // Parse previous data (assuming it's an array of conversations)
  let parsedData = JSON.parse(previousData);

  // Check if conversation exists
  const existingConversationIndex = parsedData.findIndex(
    conv => conv.conversation_id === conversationId,
  );

  if (existingConversationIndex !== -1) {
    // Update existing conversation
    const existingConversation = parsedData[existingConversationIndex];

    // Update messages
    existingConversation.message.push(newMessage);

    // Update the conversation in the array
    parsedData[existingConversationIndex] = existingConversation;
  } else {
    // Add new conversation to array
    const newConversation = {
      message: newMessage,
    };
    parsedData.push(newConversation);
  }

  // Return the updated array as a JSON string
  return JSON.stringify(parsedData);
};

export default ConversationHistory;
