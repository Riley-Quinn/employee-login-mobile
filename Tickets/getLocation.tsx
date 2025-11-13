import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';
import { AxiosError } from 'axios';

const getLocation = async () => {
  return new Promise(async resolve => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return resolve(null); // return null instead of reject
        }
      }

      Geolocation.getCurrentPosition(
        position => {
          resolve(position.coords);
        },
        error => {
          console.log('Geolocation error:', error.message);
          resolve(null); // return null on error
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    } catch (error) {
      const err = error as AxiosError<any>;
      console.log('Unexpected location error:', err.message);
      resolve(null);
    }
  });
};

export default getLocation;
