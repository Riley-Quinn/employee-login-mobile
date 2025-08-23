import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { reverseGeocode } from './Geocode';

const LocationDisplay = ({ latitude, longitude }) => {
  const [locationName, setLocationName] = useState('Loading location...');

  useEffect(() => {
    let isMounted = true;

    if (latitude != null && longitude != null) {
      reverseGeocode(parseFloat(latitude), parseFloat(longitude))
        .then(name => {
          if (isMounted) setLocationName(name);
        })
        .catch(() => {
          if (isMounted) setLocationName(' unknown');
        });
    } else {
      setLocationName('Location data not available');
    }

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);

  // return (
  //   <View>
  //     <Text style={styles.locationText}>{locationName}</Text>
  //   </View>
  // );
};

// const styles = StyleSheet.create({
//   locationText: {
//     fontSize: 14,
//     color: '#fff',
//     marginBottom: 20,
//     fontWeight: 'bold',
//   },
// });

export default LocationDisplay;
