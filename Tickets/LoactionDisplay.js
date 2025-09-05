import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
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
          if (isMounted) setLocationName('Unknown');
        });
    } else {
      setLocationName('Location data not available');
    }

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);

  return (
    <Text
      style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
        marginHorizontal: 10,
        flexWrap: 'wrap',
        width: '60%',
      }}
    >
      {locationName}
    </Text>
  );
};

export default LocationDisplay;
