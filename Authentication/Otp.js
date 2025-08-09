import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '@env';

const OTPScreen = ({ route, navigation }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const handleChange = (text, index) => {
    if (/^\d?$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      if (text && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleBackspace = (text, index) => {
    if (text === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');

    if (otpValue.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    console.log('Verifying OTP:', { email, otp: otpValue });

    try {
      const response = await axios.post(
        `http://10.0.2.2:5000/api/send-otp`,
        {
          email: email,
          otp: otpValue,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status === 200) {
        Alert.alert('Success', response.data.message);
        navigation.navigate('ResetPassword', { email });
      }
    } catch (error) {
      Alert.alert('Verification Failed', error.response?.data?.error);
    }
  };

  return (
    <>
      <Text style={styles.headerTitle}>250*250</Text>
      <Text style={styles.title}>OTP Verification</Text>

      <Text style={styles.Title}>A 6 digit code sent to {email}</Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={ref => (inputRefs.current[index] = ref)}
            style={styles.otpInput}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={text => handleChange(text, index)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace') {
                handleBackspace(digit, index);
              }
            }}
          />
        ))}
      </View>

      <View style={styles.otp}>
        <Text style={styles.resendText}>
          Didn't receive OTP? <Text style={styles.resendLink}>Resend</Text>
        </Text>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleVerify}>
        <Text style={styles.saveButtonText}>Verify</Text>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#888',
    textAlign: 'center',

    marginTop: 150,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',

    marginTop: 100,
  },

  Title: {
    fontSize: 18,
    color: '#888',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 30,
  },
  otpInput: {
    width: 40,
    height: 50,
    borderWidth: 1,
    borderColor: '#008080',
    textAlign: 'center',
    fontSize: 20,
    borderRadius: 10,
  },
  otp: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    color: '#888',
    fontSize: 20,
    marginTop: 20,
    fontWeight: 'bold',
  },
  resendLink: {
    color: 'blue',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#008080',
    paddingHorizontal: 80,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 20,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
});

export default OTPScreen;
