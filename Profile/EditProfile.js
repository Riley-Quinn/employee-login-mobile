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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { BASE_URL } from '@env';
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
        const userId = await AsyncStorage.getItem('userId'); // ensure correct key

        const res = await axios.get(`${BASE_URL}/api/employee/${userId}`);
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
      await axios.put(`${BASE_URL}/api/employee/${userId}`, values);
      navigation.navigate('ProfileScreen');
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Something went wrong while updating.');
    }
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileCircle}>
          <Text style={styles.initials}>
            {initialValues.name
              ? initialValues.name.charAt(0).toUpperCase()
              : 'N'}
          </Text>
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
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={values.name}
                  onChangeText={handleChange('name')}
                  onBlur={handleBlur('name')}
                  placeholder="Enter Name"
                  placeholderTextColor={'#000'}
                />
                {touched.name && errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}

                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={values.phone}
                  onChangeText={handleChange('phone')}
                  onBlur={handleBlur('phone')}
                  placeholder="Enter Phone"
                  placeholderTextColor={'#000'}
                  keyboardType="phone-pad"
                />
                {touched.phone && errors.phone && (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                )}

                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  placeholder="Enter Email"
                  placeholderTextColor={'#000'}
                  keyboardType="email-address"
                />
                {touched.email && errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  handleSubmit();
                }}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </>
          )}
        </Formik>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,

    paddingHorizontal: 20,
  },

  Ionicons: {
    marginRight: 30,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#069b7c',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 20,
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 15,
    color: '#000',
    fontSize: 14,
    borderColor: 'black',
    borderWidth: 1,
  },

  profileCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#069b7C',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  initials: {
    fontSize: 40,
    color: 'white',
    fontWeight: 'bold',
  },
  inputContainer: {
    width: '100%',

    marginBottom: 10,
  },

  saveButton: {
    backgroundColor: '#069b7C',
    width: '100%',
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 40,
    padding: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontsize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 5,
  },
});

export default EditProfile;
