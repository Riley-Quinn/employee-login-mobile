import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FormatStatusTrackerData = ({ trackingData }: { trackingData: any }) => {
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
    <>
      <View style={styles.container}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyText}>History</Text>
        </View>

        {parsed.map(
          (
            item: {
              timestamp: any;
              Date: any;
              updatedDate: any;
              created_at: any;
              updated_at: any;
              message:
                | string
                | number
                | bigint
                | boolean
                | React.ReactElement<
                    unknown,
                    string | React.JSXElementConstructor<any>
                  >
                | Iterable<React.ReactNode>
                | Promise<
                    | string
                    | number
                    | bigint
                    | boolean
                    | React.ReactPortal
                    | React.ReactElement<
                        unknown,
                        string | React.JSXElementConstructor<any>
                      >
                    | Iterable<React.ReactNode>
                    | null
                    | undefined
                  >
                | null
                | undefined;
              changedBy:
                | string
                | number
                | bigint
                | boolean
                | React.ReactElement<
                    unknown,
                    string | React.JSXElementConstructor<any>
                  >
                | Iterable<React.ReactNode>
                | React.ReactPortal
                | Promise<
                    | string
                    | number
                    | bigint
                    | boolean
                    | React.ReactPortal
                    | React.ReactElement<
                        unknown,
                        string | React.JSXElementConstructor<any>
                      >
                    | Iterable<React.ReactNode>
                    | null
                    | undefined
                  >
                | null
                | undefined;
              employeePhone:
                | string
                | number
                | bigint
                | boolean
                | React.ReactElement<
                    unknown,
                    string | React.JSXElementConstructor<any>
                  >
                | Iterable<React.ReactNode>
                | Promise<
                    | string
                    | number
                    | bigint
                    | boolean
                    | React.ReactPortal
                    | React.ReactElement<
                        unknown,
                        string | React.JSXElementConstructor<any>
                      >
                    | Iterable<React.ReactNode>
                    | null
                    | undefined
                  >
                | null
                | undefined;
              statusName: string;
              employeeName:
                | string
                | number
                | bigint
                | boolean
                | React.ReactElement<
                    unknown,
                    string | React.JSXElementConstructor<any>
                  >
                | Iterable<React.ReactNode>
                | React.ReactPortal
                | Promise<
                    | string
                    | number
                    | bigint
                    | boolean
                    | React.ReactPortal
                    | React.ReactElement<
                        unknown,
                        string | React.JSXElementConstructor<any>
                      >
                    | Iterable<React.ReactNode>
                    | null
                    | undefined
                  >
                | null
                | undefined;
              arrivalDate: string | number | Date;
            },
            index: React.Key | null | undefined,
          ) => {
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
                      (item.employeeName || item.employeePhone) && (
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
          },
        )}
      </View>
    </>
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
  historyHeader: {
    backgroundColor: '#008080',
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginHorizontal: -16,
    marginTop: -38,
    marginBottom: 12,
  },

  historyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
