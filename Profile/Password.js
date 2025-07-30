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
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { BASE_URL } from '@env';
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Password </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
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
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Current Password"
                    placeholderTextColor="#000"
                    secureTextEntry={!showCurrent}
                    value={values.currentPassword}
                    onChangeText={handleChange('currentPassword')}
                    onBlur={handleBlur('currentPassword')}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
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
                  <Text style={styles.errorText}>{errors.currentPassword}</Text>
                )}

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter New Password"
                    placeholderTextColor="#000"
                    secureTextEntry={!showNew}
                    value={values.newPassword}
                    onChangeText={handleChange('newPassword')}
                    onBlur={handleBlur('newPassword')}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
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

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm New Password"
                    placeholderTextColor="#000"
                    secureTextEntry={!showConfirm}
                    value={values.confirmPassword}
                    onChangeText={handleChange('confirmPassword')}
                    onBlur={handleBlur('confirmPassword')}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
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
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSubmit}
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

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 30,
  },

  input: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 15,
    color: '#000',
    fontSize: 16,
    borderColor: 'black',
    borderWidth: 1,
  },

  eyeIcon: {
    position: 'absolute',
    right: 15,
  },

  inputContainer: {
    width: '100%',
  },

  saveButton: {
    backgroundColor: '#069b7C',
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 30,
    width: '100%',
    padding: 10,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },

  errorText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 40,
  },
});

export default Password;
