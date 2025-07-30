const DateFormat = dateInput => {
  const date = dateInput ? new Date(dateInput) : new Date();

  const options = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true, // optional: change to false if you want 24-hour format
  };

  return date.toLocaleString('en-US', options);
};

export default DateFormat;
