// Login.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { Formik } from 'formik';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import messaging from '@react-native-firebase/messaging';
import { BASE_URL } from '@env';

const Login = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  };

  const getFcmToken = async () => {
    const token = await messaging().getToken();
    console.log('📱 FCM token:', token);
    return token;
  };

  const storeFcmToken = async (userId, role) => {
    try {
      const fcmToken = await getFcmToken();
      const clientId = await AsyncStorage.getItem('clientId');

      await axios.post(`${BASE_URL}/fcm-tokens/store-token`, {
        employee_id: role === 'employee' ? userId : null,
        customer_id: role === 'customer' ? userId : null,
        fcm_token: fcmToken,
      });

      await AsyncStorage.setItem('fcmToken', fcmToken);

      messaging().onTokenRefresh(async newToken => {
        await axios.post(`${BASE_URL}/fcm-tokens/store-token`, {
          employee_id: role === 'employee' ? userId : null,
          customer_id: role === 'customer' ? userId : null,
          fcm_token: newToken,
        });
        await AsyncStorage.setItem('fcmToken', newToken);
      });

      return fcmToken;
    } catch (err) {
      console.error('❌ Error storing FCM token:', err.message);
    }
  };

  const listenForNotifications = () => {
    messaging().onMessage(async remoteMessage => {
      console.log('📩 Foreground notification:', remoteMessage);
    });

    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('🌙 Background notification:', remoteMessage);
    });
  };

  const handleLogin = async (values, { setSubmitting }) => {
    try {
      setLoading(true);
      const response = await axios.post(`${BASE_URL}/api/auth/admin/login`, {
        email: values.email,
        password: values.password,
        rememberMe: true,
      });

      const userData = response.data.user;
      await AsyncStorage.setItem('userId', userData.userId.toString());
      await AsyncStorage.setItem('userName', userData.name);
      await AsyncStorage.setItem('roleId', userData.roleId.toString());
      await AsyncStorage.setItem('clientId', userData.client_id.toString());

      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });

      const granted = await requestNotificationPermission();
      if (granted) {
        const fcmToken = await storeFcmToken(userData.userId, 'employee');
        console.log('✅ FCM token stored:', fcmToken);
      } else {
        console.log('❌ Notification permission denied');
      }

      listenForNotifications();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Login failed';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const Validation = Yup.object().shape({
    email: Yup.string()
      .email('Please enter a valid email')
      .required('Email is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
  });

  return (
    <ImageBackground
      source={require('../Assets/black-bg.png')}
      style={styles.background}
    >
      <ScrollView>
        <View style={styles.container}>
          <Image
            source={require('../Assets/Pastedimage.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.welcome}>WELCOME BACK</Text>

          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={Validation}
            onSubmit={handleLogin}
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
                <View style={[styles.inputWrapper, { marginTop: 50 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email ID"
                    placeholderTextColor="#000"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    value={values.email}
                  />
                </View>
                {touched.email && errors.email && (
                  <Text style={styles.error}>{errors.email}</Text>
                )}
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#000"
                    secureTextEntry={secureText}
                    autoCapitalize="none"
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    value={values.password}
                  />
                  <TouchableOpacity
                    style={styles.iconContainer}
                    onPress={() => setSecureText(!secureText)}
                  >
                    <Icon
                      name={secureText ? 'eye-off' : 'eye'}
                      size={24}
                      color="#009688"
                    />
                  </TouchableOpacity>
                </View>
                {touched.password && errors.password && (
                  <Text style={styles.error}>{errors.password}</Text>
                )}

                {loading ? (
                  <ActivityIndicator size="large" color="#f97316" />
                ) : (
                  <TouchableOpacity
                    style={styles.loginBtn}
                    onPress={handleSubmit}
                  >
                    <Text style={styles.loginText}>LOGIN</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </Formik>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default Login;

const styles = StyleSheet.create({
  background: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  container: { justifyContent: 'flex-start', flex: 1, paddingTop: 170 },
  logo: { width: 180, height: 180, alignSelf: 'center', marginBottom: 10 },
  welcome: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputWrapper: {
    backgroundColor: '#d4f3ef',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 40,
    height: 50,
    width: '100%',
    alignSelf: 'center',
  },
  input: { flex: 1, fontSize: 16, color: '#000', fontWeight: '600' },
  iconContainer: { paddingLeft: 10 },
  loginBtn: {
    backgroundColor: '#f97316',
    borderRadius: 40,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
    alignSelf: 'center',
  },
  loginText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  error: {
    color: 'red',
    fontSize: 12,
    marginLeft: 5,
    marginTop: -30,
    marginBottom: 2,
  },
});
