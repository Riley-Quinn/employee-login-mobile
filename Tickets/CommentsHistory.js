const CommentsHistory = (
  previousData,
  messageText,
  commentId,
  participantId,
  role,
  userName,
) => {
  // Create a new message entry
  const newMessage = {
    id: `${commentId}-${Date.now()}`, // Generate a unique message ID
    sender_id: participantId,
    sender_role: role,
    sender_name: userName,
    text: messageText,
  };

  // If there is no previous data, create a new conversation structure
  if (!previousData) {
    const newComments = {
      message: newMessage,
    };
    return JSON.stringify([newComments]); // Wrap in an array
  }

  // Parse previous data (assuming it's an array of conversations)
  let parsedData = JSON.parse(previousData);

  // Check if conversation exists
  const existingCommentsIndex = parsedData.findIndex(
    conv => conv.comments_id === commentId,
  );

  if (existingCommentsIndex !== -1) {
    // Update existing conversation
    const existingComments = parsedData[existingCommentsIndex];

    // Update messages
    existingComments.message.push(newMessage);

    // Update the conversation in the array
    parsedData[existingCommentsIndex] = existingComments;
  } else {
    // Add new conversation to array
    const newComments = {
      message: newMessage,
    };
    parsedData.push(newComments);
  }

  // Return the updated array as a JSON string
  return JSON.stringify(parsedData);
};

export default CommentsHistory;
