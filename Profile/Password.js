import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import { BASE_URL } from '@env';

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { SafeAreaView } from 'react-native-safe-area-context';

const validationSchema = Yup.object().shape({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must be at least 8 chars with uppercase, lowercase, number & special character',
    )
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password'),
});

const Password = ({ navigation }) => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSave = async values => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'User not found. Please log in again.');
        return;
      }

      const res = await axios.put(
        `${BASE_URL}/api/employee/password/${userId}`,
        {
          password: values.currentPassword,
          newPassword: values.newPassword,
        },
      );

      if (res.status === 200) {
        Alert.alert('Success', 'Password updated successfully');
        navigation.navigate('ProfileScreen');
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.error || 'Something went wrong. Please try again.',
      );
    }
  };

  return (
    <>
      <SafeAreaView style={{ backgroundColor: '#008080', padding: 0 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileCircle}>
          <EvilIcons name="lock" size={70} color="#fff" />
        </View>

        <Formik
          initialValues={{
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          }}
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
                    <Text style={styles.labelText}>Current Password</Text>
                  </View>
                  <View style={{ position: 'relative' }}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter Current Password"
                      placeholderTextColor="#888"
                      secureTextEntry={!showCurrent}
                      value={values.currentPassword}
                      onChangeText={handleChange('currentPassword')}
                      onBlur={handleBlur('currentPassword')}
                    />
                    <TouchableOpacity
                      style={styles.eyeIconRight}
                      onPress={() => setShowCurrent(!showCurrent)}
                    >
                      <Ionicons
                        name={showCurrent ? 'eye' : 'eye-off'}
                        size={22}
                        color="#000"
                      />
                    </TouchableOpacity>
                  </View>
                  {touched.currentPassword && errors.currentPassword && (
                    <Text style={styles.errorText}>
                      {errors.currentPassword}
                    </Text>
                  )}
                </View>
                <View style={styles.Card}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.labelText}>New Password</Text>
                  </View>
                  <View style={{ position: 'relative' }}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter New Password"
                      placeholderTextColor="#888"
                      secureTextEntry={!showNew}
                      value={values.newPassword}
                      onChangeText={handleChange('newPassword')}
                      onBlur={handleBlur('newPassword')}
                    />
                    <TouchableOpacity
                      style={styles.eyeIconRight}
                      onPress={() => setShowNew(!showNew)}
                    >
                      <Ionicons
                        name={showNew ? 'eye' : 'eye-off'}
                        size={22}
                        color="#000"
                      />
                    </TouchableOpacity>
                  </View>
                  {touched.newPassword && errors.newPassword && (
                    <Text style={styles.errorText}>{errors.newPassword}</Text>
                  )}
                </View>
                <View style={styles.Card}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.labelText}>Confirm Password</Text>
                  </View>
                  <View style={{ position: 'relative' }}>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm New Password"
                      placeholderTextColor="#888"
                      secureTextEntry={!showConfirm}
                      value={values.confirmPassword}
                      onChangeText={handleChange('confirmPassword')}
                      onBlur={handleBlur('confirmPassword')}
                    />
                    <TouchableOpacity
                      style={styles.eyeIconRight}
                      onPress={() => setShowConfirm(!showConfirm)}
                    >
                      <Ionicons
                        name={showConfirm ? 'eye' : 'eye-off'}
                        size={22}
                        color="#000"
                      />
                    </TouchableOpacity>
                  </View>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <Text style={styles.errorText}>
                      {errors.confirmPassword}
                    </Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSubmit}
              >
                <MaterialIcons
                  name="system-update-alt"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.saveButtonText}> Password update</Text>
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

  inputContainer: {
    width: '100%',
  },
  Card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingTop: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    width: '110%',
    alignSelf: 'center',
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 30,
  },

  eyeIcon: {
    position: 'absolute',
    right: 15,
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
    marginBottom: 20,
    marginLeft: 5,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#008080',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 15,
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
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
    marginLeft: 10,
    marginTop: 10,
  },
  input: {
    width: '100%',
    backgroundColor: '#E6F2F1',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 14,
    color: '#008080',
    fontWeight: 'bold',
    marginBottom: 45,
  },
  eyeIconRight: {
    position: 'absolute',
    right: 15,
    top: 12,
  },
});

export default Password;
