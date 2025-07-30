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
      {parsed.map((item, index) => (
        <View key={index} style={styles.entry}>
          <View style={styles.line}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.message}>{item.message}</Text>
          </View>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // marginHorizontal: 12,
    marginVertical: 10,
    backgroundColor: '#fdfdfd',
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  entry: {
    marginBottom: 14,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  bullet: {
    fontSize: 20,
    color: '#069b7c',
    marginRight: 6,
    marginTop: -1,
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    flexShrink: 1,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    marginLeft: 20,
  },
});

export default FormatStatusTrackerData;
