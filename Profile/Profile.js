import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { SafeAreaView } from 'react-native-safe-area-context';

import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import { BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('token');
      const clientId = await AsyncStorage.getItem('clientId');

      console.log('Fetching user data with userId:', userId);

      const res = await axios.get(`${BASE_URL}/api/employee/${userId}`, {
        headers: { Authorization: `Bearer ${token}`, 'x-client-id': clientId },
      });

      console.log('Fetched user data:', res.data);

      setUserData(res.data);
      setName(res.data.name);
      setEmail(res.data.email);
      setPhone(res.data.phone);
    } catch (err) {
      console.log('Fetch user error:', err);
      Alert.alert('Error', 'Failed to fetch user data');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const CardButton = ({ icon, title, subtitle, onPress }) => (
    <TouchableOpacity style={styles.cardButton} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Icon name={icon} size={24} color="#fff" />
      </View>
      <View style={{ marginLeft: 15 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
      </View>
      <Icon
        name="chevron-forward"
        size={24}
        color="#888"
        style={{ marginLeft: 'auto' }}
      />
    </TouchableOpacity>
  );

  if (loading || !userData) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.profileCircle}>
          {selectedImage ? (
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : userData?.profile_image &&
            userData.profile_image.trim() !== '' ? (
            <Image
              source={{
                uri: `https://innovative-lifts.blr1.cdn.digitaloceanspaces.com/${userData.profile_image}`,
              }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <Feather name="user" size={40} color="#fff" />
          )}
        </View>

        <Text style={styles.profileName}>{userData.name}</Text>
        <Text style={styles.profileEmail}>{userData.email}</Text>
        <Text style={styles.profilePhone}>{userData.phone}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <CardButton
          icon="pencil"
          title="Edit Profile"
          subtitle="Update your personal information"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <CardButton
          icon="lock-closed"
          title="Change Password"
          subtitle="Update your account security"
          onPress={() => navigation.navigate('Password')}
        />
        <CardButton
          icon="log-out-outline"
          title="Logout"
          subtitle="Sign out of your account"
          onPress={async () => {
            await AsyncStorage.removeItem('userId');
            await AsyncStorage.removeItem('token');
            navigation.navigate('Login');
          }}
        />
      </ScrollView>
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <FontAwesome name="home" size={30} color="#888" />
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
          <FontAwesome name="user" size={30} color="#008080" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  header: {
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: '#008080',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginLeft: 20,
  },
  profileCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#00BFA6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },

  profileName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  profileEmail: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  profilePhone: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },

  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#008080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#008080',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
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
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  cardSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 3,
    fontWeight: 'bold',
  },
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

export default ProfileScreen;
