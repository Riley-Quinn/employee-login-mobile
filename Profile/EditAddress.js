import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BASE_URL } from '@env';

const addressValidationSchema = Yup.object({
  state_id: Yup.string().required('State is required'),
  city_id: Yup.string().required('City is required'),
  region_id: Yup.string().required('Region is required'),
  address: Yup.string().required('Address is required'),
});

export default function EditAddress() {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [userData, setUserData] = useState(null);

  const navigation = useNavigation();

  // Fetch user and states on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return Alert.alert('Error', 'User ID not found');

        const [userRes, stateRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/employee/${JSON.parse(userId)}`),
          axios.get(`${BASE_URL}/api/states`),
        ]);

        const user = userRes.data;
        setUserData(user);
        setStates(Array.isArray(stateRes.data) ? stateRes.data : []);

        if (user.state_id) {
          fetchCities(user.state_id);
        }
        if (user.city_id) {
          fetchRegions(user.city_id);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load data');
      }
    };

    fetchInitialData();
  }, []);

  const fetchCities = async stateId => {
    try {
      const res = await axios.get(`${BASE_URL}/api/cities/${stateId}`);
      console.log('resssssssssss1', res);
      setCities(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchRegions = async cityId => {
    try {
      const res = await axios.get(`${BASE_URL}/api/regions/${cityId}`);
      console.log('resssssssssss2', res);
      setRegions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const handleUpdate = async values => {
    try {
      await axios.put(`${BASE_URL}/api/employee/${userData.employee_id}`, {
        state_id: values.state_id,
        city_id: values.city_id,
        region_id: values.region_id,
        address: values.address,
        email: userData.email,
      });
      Alert.alert('Success', 'Address updated successfully');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Edit Address</Text>
      </View>

      {userData && (
        <Formik
          enableReinitialize
          initialValues={{
            state_id: userData?.state_id || '',
            city_id: userData?.city_id || '',
            region_id: userData?.region_id || '',
            address: userData?.address || '',
          }}
          validationSchema={addressValidationSchema}
          onSubmit={handleUpdate}
        >
          {({ values, setFieldValue, handleSubmit, errors, touched }) => (
            <ScrollView style={styles.container}>
              {/* State Dropdown */}
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() =>
                  Alert.alert('Select State', '', [
                    ...states.map(state => ({
                      text: state.state_name,
                      onPress: () => {
                        setFieldValue('state_id', state.state_id);
                        setFieldValue('city_id', '');
                        setFieldValue('region_id', '');
                        fetchCities(state.state_id);
                        setCities([]);
                        setRegions([]);
                      },
                    })),
                    { text: 'Cancel', style: 'cancel' },
                  ])
                }
              >
                <Text style={styles.text}>
                  {states.find(s => s.state_id === values.state_id)
                    ?.state_name || 'Select State'}
                </Text>
              </TouchableOpacity>
              {touched.state_id && errors.state_id && (
                <Text style={styles.error}>{errors.state_id}</Text>
              )}

              {/* City Dropdown */}
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() =>
                  Alert.alert('Select City', '', [
                    ...cities.map(city => ({
                      text: city.city_name,
                      onPress: () => {
                        setFieldValue('city_id', city.city_id);
                        setFieldValue('region_id', '');
                        fetchRegions(city.city_id);
                        setRegions([]);
                      },
                    })),
                    { text: 'Cancel', style: 'cancel' },
                  ])
                }
              >
                <Text style={styles.text}>
                  {cities.find(c => c.city_id === values.city_id)?.city_name ||
                    'Select City'}
                </Text>
              </TouchableOpacity>
              {touched.city_id && errors.city_id && (
                <Text style={styles.error}>{errors.city_id}</Text>
              )}

              {/* Region Dropdown */}
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() =>
                  Alert.alert('Select Region', '', [
                    ...regions.map(region => ({
                      text: region.region_name,
                      onPress: () =>
                        setFieldValue('region_id', region.region_id),
                    })),
                    { text: 'Cancel', style: 'cancel' },
                  ])
                }
              >
                <Text style={styles.text}>
                  {regions.find(r => r.region_id === values.region_id)
                    ?.region_name || 'Select Region'}
                </Text>
              </TouchableOpacity>
              {touched.region_id && errors.region_id && (
                <Text style={styles.error}>{errors.region_id}</Text>
              )}

              {/* Address Input */}
              <TextInput
                style={styles.input}
                placeholder="Address"
                value={values.address}
                onChangeText={text => setFieldValue('address', text)}
              />
              {touched.address && errors.address && (
                <Text style={styles.error}>{errors.address}</Text>
              )}

              <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
                <Text style={styles.btnText}>Update</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </Formik>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  dropdown: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    marginTop: 20,
  },
  text: { fontSize: 16, color: '#000' },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    color: '#000',
  },
  btn: {
    backgroundColor: '#069b7C',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  error: { color: 'red', marginBottom: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#069b7C',
  },
  headerText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
