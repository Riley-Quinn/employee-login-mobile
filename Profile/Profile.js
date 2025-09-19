import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import { BASE_URL } from '@env';
import { launchImageLibrary } from 'react-native-image-picker';

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState({});
  const [userId, setUserId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        console.log('🔑 Retrieved userId:', id);

        if (id) setUserId(id);
      } catch (error) {
        console.error(error);
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      const fetchProfile = async () => {
        try {
          const clientId = await AsyncStorage.getItem('clientId');
          const res = await axios.get(`{BASE_URL}/api/employee/${userId}`, {
            headers: {
              'x-client-id': clientId,
            },
          });

          setProfile(res.data);
        } catch (error) {
          console.error(' Error fetching profile:', error.message);
        }
      };
      fetchProfile();
    }
  }, [userId]);

  const handleChoosePhoto = () => {
    console.log('📸 Opening image library...');
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, response => {
      if (response.didCancel) {
        console.log('❌ User cancelled image picker');
      } else if (response.errorCode) {
        console.error('❌ ImagePicker Error: ', response.errorMessage);
      } else {
        const asset = response.assets[0];
        console.log('✅ Selected image:', asset);
        setSelectedImage(asset.uri);
        handleUploadPhoto(asset);
      }
    });
  };

  const handleUploadPhoto = async photo => {
    try {
      console.log('🚀 Uploading photo...', photo);
      const clientId = await AsyncStorage.getItem('clientId');
      const formData = new FormData();
      formData.append('profile_image', {
        uri: photo.uri,
        type: photo.type,
        name: photo.fileName,
      });

      const res = await axios.put(
        `{BASE_URL}/api/employee/${userId}/upload-profile`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-client-id': clientId,
          },
        },
      );

      console.log('✅ Profile image uploaded successfully:', res.data);
      Alert.alert('Success', 'Profile image updated!');
      setProfile(res.data);
    } catch (error) {
      console.error(
        '❌ Error uploading profile image:',
        error.response?.data || error.message,
      );
      Alert.alert('Error', 'Failed to upload profile image.');
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🔒 Logging out...');
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('userName');
      navigation.navigate('Login');
    } catch (error) {
      console.error('❌ Error logging out:', error);
      Alert.alert('Error', 'Error logging out');
    }
  };
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>

        <View style={styles.profileCircle}>
          {selectedImage || profile?.profile_image ? (
            <View style={{ position: 'relative', alignItems: 'center' }}>
              <Image
                source={{
                  uri: selectedImage
                    ? selectedImage
                    : `https://d3shribgms6bz4.cloudfront.net/${profile.profile_image}`,
                }}
                style={{ width: 100, height: 100, borderRadius: 55 }}
              />
              <TouchableOpacity
                style={styles.editIconWrapper}
                onPress={handleChoosePhoto}
              >
                <Feather name="edit-2" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.iconBackground}>
              <Feather name="user" size={50} color="#fff" />
              <TouchableOpacity
                style={styles.editIconWrapper}
                onPress={handleChoosePhoto}
              >
                <Feather name="edit-2" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.profileEmail}>{profile.name}</Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>
          <Text style={styles.profilePhone}>{profile.phone}</Text>
        </View>
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
          onPress={handleLogout}
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
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 55,
    backgroundColor: '#4ac7b7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  profileCircle: { marginTop: 20, alignItems: 'center' },
  profileName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  profileEmail: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 7,
  },
  profilePhone: {
    color: '#fff',
    fontSize: 16,
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
