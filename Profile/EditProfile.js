import React, { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { BASE_URL } from '@env';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
    .required('Phone number is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const EditProfile = ({ navigation }) => {
  const [initialValues, setInitialValues] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [profileImageName, setProfileImageName] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const clientId = await AsyncStorage.getItem('clientId');
        const res = await axios.get(`${BASE_URL}/api/employee/${userId}`, {
          headers: { 'x-client-id': clientId },
        });
        const data = res.data;
        setInitialValues({
          name: data?.name || '',
          phone: data?.phone || '',
          email: data?.email || '',
        });
        setProfileImageName(data?.profile_image || '');
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

  const handleChooseImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, response => {
      if (!response.didCancel && !response.errorCode) {
        setSelectedImage(response.assets[0]);
      }
    });
  };

  const handleSave = async values => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('token');
      const clientId = await AsyncStorage.getItem('clientId');

      let uploadedImageName = profileImageName;
      if (selectedImage) {
        const fileName = `${Date.now()}-${
          selectedImage.fileName || 'profile.jpg'
        }`;
        const formData = new FormData();
        formData.append('file', {
          uri: selectedImage.uri,
          type: selectedImage.type,
          name: fileName,
        });

        const uploadRes = await axios.post(`${BASE_URL}/api/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedImageName = uploadRes.data.uniqueFilename;
      }

      const payload = { ...values, profile_image: uploadedImageName };

      await axios.put(`${BASE_URL}/api/employee/${userId}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-client-id': clientId,
        },
      });

      Alert.alert('Success', 'Profile updated successfully!');
      setSelectedImage(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Something went wrong while updating.');
    }
  };

  return (
    <>
      <SafeAreaView style={{ backgroundColor: '#008080', padding: 0 }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileCircle}>
          {selectedImage || profileImageName ? (
            <Image
              source={{
                uri: selectedImage
                  ? selectedImage.uri
                  : `https://innovative-lifts.blr1.cdn.digitaloceanspaces.com/${profileImageName}`,
              }}
              style={{ width: 100, height: 100, borderRadius: 50 }}
            />
          ) : (
            <Feather name="user" size={50} color="#fff" />
          )}

          <TouchableOpacity
            style={styles.editIconWrapper}
            onPress={handleChooseImage}
          >
            <Feather name="edit-2" size={20} color="#fff" />
          </TouchableOpacity>
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
                onPress={handleSubmit}
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
    </>
  );
};

const styles = StyleSheet.create({
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
  inputContainer: { width: '100%' },
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
  container: {
    alignItems: 'center',
    paddingVertical: 125,
    backgroundColor: '#F0F9F8',
    paddingHorizontal: isTablet ? 30 : 40,
  },
  input: {
    width: '100%',
    backgroundColor: '#E6F2F1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
    color: '#008080',
    marginBottom: 15,
    fontWeight: 'bold',
    marginTop: 5,
  },
  Card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingTop: 8,
    paddingBottom: -1,
    paddingHorizontal: 12,
    marginBottom: 15,
    width: isTablet ? '100%' : '110%',
    alignSelf: 'center',
  },
  saveButton: {
    backgroundColor: '#008080',
    width: isTablet ? '100%' : '110%',
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 30,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    alignSelf: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorText: { color: 'red', fontSize: 12, marginBottom: 10, marginLeft: 5 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#008080',
  },
  backButton: { marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  editIconWrapper: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#008080',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default EditProfile;
