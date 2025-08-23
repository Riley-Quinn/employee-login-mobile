import React, { useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  navigation,
  Alert,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { BASE_URL } from '@env';
import { SafeAreaView } from 'react-native-safe-area-context';
const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
    .required('Phone number is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const EditProfile = ({ navigation }) => {
  const [initialValues, setInitialValues] = React.useState({
    name: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');

        const clientId = await AsyncStorage.getItem('clientId');
        const res = await axios.get(
          `http://10.0.2.2:5000/api/employee/${userId}`,
          {
            headers: {
              'x-client-id': clientId,
            },
          },
        );
        const data = res.data;
        setInitialValues({
          name: data?.name || '',
          phone: data?.phone || '',
          email: data?.email || '',
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleSave = async values => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      await axios.put(`http://10.0.2.2:5000/api/employee/${userId}`, values);
      navigation.navigate('ProfileScreen');
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Something went wrong while updating.');
    }
  };

  return (
    <>
      <SafeAreaView style={{ backgroundColor: '#008080', padding: 0 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileCircle}>
          <Feather name="user" size={50} color="#fff" />
        </View>

        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSave}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <>
              <View style={styles.inputContainer}>
                <View style={styles.Card}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="person-outline" size={16} color="#00BFA6" />
                    <Text style={styles.labelText}>Full Name</Text>
                  </View>

                  <TextInput
                    style={styles.input}
                    value={values.name}
                    onChangeText={handleChange('name')}
                    onBlur={handleBlur('name')}
                    placeholder="Employee"
                    placeholderTextColor="#888"
                  />
                  {touched.name && errors.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}
                </View>
                <View style={styles.Card}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="call-outline" size={16} color="#00BFA6" />
                    <Text style={styles.labelText}>Phone Number</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={values.phone}
                    onChangeText={handleChange('phone')}
                    onBlur={handleBlur('phone')}
                    placeholder="9876543210"
                    placeholderTextColor="#888"
                    keyboardType="phone-pad"
                  />
                  {touched.phone && errors.phone && (
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  )}
                </View>
                <View style={styles.Card}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="mail-outline" size={16} color="#00BFA6" />
                    <Text style={styles.labelText}>Email Address</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    placeholder="employee@email.com"
                    placeholderTextColor="#888"
                    keyboardType="email-address"
                  />
                  {touched.email && errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  handleSubmit();
                }}
              >
                <MaterialIcons
                  name="system-update-alt"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.saveButtonText}> Update Profile</Text>
              </TouchableOpacity>
            </>
          )}
        </Formik>
      </ScrollView>
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <FontAwesome name="home" size={30} color="#008080" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('EventsCalendar')}
        >
          <Ionicons name="calendar" size={30} color="#888" />
          <Text style={styles.navText}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('EventsOverview')}
        >
          <MaterialIcons name="event" size={30} color="#888" />
          <Text style={styles.navText}>Events</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('ProfileScreen')}
        >
          <FontAwesome name="user" size={30} color="#888" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,

    backgroundColor: '#F0F9F8',
    paddingHorizontal: 40,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 14,
    color: '#888',
    fontWeight: 'bold',
    marginTop: 4,
  },
  profileCircle: {
    width: 120,
    height: 120,
    borderRadius: 80,
    backgroundColor: '#00BFA6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 50,
  },
  initials: {
    fontSize: 40,
    color: 'white',
    fontWeight: 'bold',
  },

  inputContainer: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },

  labelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
    marginLeft: 10,
  },
  Card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingTop: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
  },

  input: {
    width: '100%',
    backgroundColor: '#E6F2F1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
    color: '#008080',
    marginBottom: 45,

    fontWeight: 'bold',
    marginTop: 5,
  },

  saveButton: {
    backgroundColor: '#00BFA6',
    width: '100%',
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 30,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',

    marginLeft: 8,
  },

  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },

  Ionicons: {
    marginRight: 30,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingHorizontal: 16,
    backgroundColor: '#008080',
    // height: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 15,
  },
  backicon: {
    marginTop: -23,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 20,
    marginTop: 15,
    marginBottom: 5,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});

export default EditProfile;
