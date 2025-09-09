import React, { useState } from 'react';
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
} from 'react-native';
import { Formik } from 'formik';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Yup from 'yup';
import CheckBox from '@react-native-community/checkbox';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { BASE_URL } from '@env';

const Login = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  // const handleLogin = async values => {
  //   setLoading(true);
  //   try {
  //     const res = await axios.post(
  //       `${BASE_URL}/api/auth/admin/login`,
  //       {
  //         email: values.email,
  //         password: values.password,
  //         rememberMe: rememberMe,
  //       },
  //     );
  //     const userData = res.data.empData;

  //     console.log('Logged in user roleId:', userData.roleId);
  //     console.log('Full user data:', userData);

  //     if (userData.roleId !== 4) {
  //       Alert.alert(
  //         'Access Denied',
  //         "You don't have permission to access this app",
  //       );
  //       setLoading(false);
  //       return;
  //     }

  //     if (res.status === 200) {
  //       await AsyncStorage.setItem('userId', userData.userId.toString());
  //       await AsyncStorage.setItem('name', userData.name);
  //       await AsyncStorage.setItem('Role', userData.Role.toString());
  //       await AsyncStorage.setItem('clientId', userData.client_id.toString());
  //       Alert.alert('Success', res?.data?.message);
  //       navigation.navigate('Dashboard');
  //     }
  //   } catch (error) {
  //     Alert.alert('Error', error.response?.data?.error || 'Login failed');
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleLogin = async (values, { setSubmitting }) => {
    try {
      const response = await axios.post('${BASE_URL}/api/auth/admin/login', {
        email: values.email,
        password: values.password,
        rememberMe: true,
      });

      const userData = response.data.empData;

      await AsyncStorage.setItem('userId', userData.userId.toString());
      await AsyncStorage.setItem('userName', userData.name);
      await AsyncStorage.setItem('roleId', userData.roleId.toString());
      await AsyncStorage.setItem('clientId', userData.client_id.toString());

      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || error.message || 'Login failed';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
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
            initialValues={{
              email: '',
              password: '',
            }}
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

                {/* Login Button */}
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

                <View style={styles.options}>
                  <TouchableOpacity onPress={handleForgotPassword}>
                    <Text style={styles.forgotText}>Forgot Password ?</Text>
                  </TouchableOpacity>
                </View>
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
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  container: {
    justifyContent: 'flex-start',
    flex: 1,
    paddingTop: 50,
  },

  logo: {
    width: 180,
    height: 180,
    alignSelf: 'center',
    marginBottom: 10,
  },

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

  loginBtn: {
    backgroundColor: '#f97316',
    borderRadius: 40,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
    alignSelf: 'center',
  },

  input: {
    flex: 1,

    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  iconContainer: {
    paddingLeft: 10,
  },

  loginText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    width: '100%',
  },

  forgotText: {
    color: '#fff',
    fontWeight: '600',

    fontSize: 14,
  },

  error: {
    color: 'red',
    fontSize: 12,
    marginLeft: 5,
    marginTop: -30,
    marginBottom: 2,
  },
});
