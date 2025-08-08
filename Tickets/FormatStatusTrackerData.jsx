import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FormatStatusTrackerData = ({ trackingData }) => {
  let parsed = [];
  try {
    parsed =
      typeof trackingData === 'string'
        ? JSON.parse(trackingData)
        : trackingData;
  } catch (e) {
    parsed = [];
  }

  return (
    <View style={styles.container}>
      {parsed.map((item, index) => {
        const rawTimestamp =
          item.timestamp ||
          item.Date ||
          item.updatedDate ||
          item.created_at ||
          item.updated_at;

        const timestamp = new Date(rawTimestamp);
        const isValidDate = !isNaN(timestamp.getTime());

        return (
          <View key={index} style={styles.entry}>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>{'\u2022'}</Text>
              <View style={styles.messageBlock}>
                <Text style={styles.message}>{item.message}</Text>
                {item.changedBy && (
                  <Text style={styles.subText}>
                    {item.changedBy} {item.employeePhone}
                  </Text>
                )}

                {item.statusName === 'Engineer Assigned' &&
                  console.log(
                    ' Data:',
                    item,
                  )(item.employeeName || item.employeePhone) && (
                    <Text style={styles.subText}>
                      {item.employeeName} {item.employeePhone}
                    </Text>
                  )}

                {item.arrivalDate && (
                  <Text style={styles.subText}>
                    Arrival:{' '}
                    {new Date(item.arrivalDate).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </Text>
                )}

                {/* {rawTimestamp && (
                  <Text style={styles.timestamp}>
                    {isValidDate
                      ? `${timestamp.toLocaleString('en-US', {
                          month: 'short',
                        })} ${timestamp.getDate()} ${timestamp.getFullYear()} ${timestamp.toLocaleTimeString(
                          'en-US',
                          {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          },
                        )}`
                      : String(rawTimestamp)}
                  </Text>
                )} */}
                {item.message !== 'Ticket created' && rawTimestamp && (
                  <Text style={styles.timestamp}>
                    {isValidDate
                      ? `${timestamp.toLocaleString('en-US', {
                          month: 'short',
                        })} ${timestamp.getDate()} ${timestamp.getFullYear()} ${timestamp.toLocaleTimeString(
                          'en-US',
                          {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          },
                        )}`
                      : String(rawTimestamp)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  entry: {
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 25,
    lineHeight: 22,
    color: '#008080',

    marginRight: 15,
  },
  messageBlock: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
  },
  subText: {
    fontSize: 14,
    color: '#888',
    fontWeight: 'bold',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 4,
  },
});

export default FormatStatusTrackerData;
