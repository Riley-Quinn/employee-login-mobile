const DateFormat = (dateInput?: string | number | Date): string => {
  const date = dateInput ? new Date(dateInput) : new Date();

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // 24-hour format
    timeZone: 'Asia/Kolkata', // set to your local zone if needed
  };

  return date.toLocaleString('en-IN', options);
};
export default DateFormat;
