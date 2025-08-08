import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '@env';
import { SafeAreaView } from 'react-native-safe-area-context';
const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState({});
  const [userId, setUserId] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(-250))[0];

  useEffect(() => {
    const getUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (id) {
          setUserId(id);
        } else {
          console.warn('No user ID found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error reading userId from AsyncStorage:', error.message);
      }
    };

    getUserId();
  }, []);
  useEffect(() => {
    if (userId) {
      const fetchProfile = async () => {
        try {
          const clientId = await AsyncStorage.getItem('clientId');
          const res = await axios.get(`${BASE_URL}/api/employee/${userId}`, {
            headers: {
              'x-client-id': clientId,
            },
          });
          setProfile(res.data);
        } catch (error) {
          console.error('Failed to fetch profile:', error.message);
        }
      };

      fetchProfile();
    }
  }, [userId]);
  const handleLogout = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/logout`);

      if (response.status === 200) {
        await AsyncStorage.removeItem('userId');
        await AsyncStorage.removeItem('userName');

        navigation.navigate('Login');
      } else {
        Alert.alert('Error', response.data.error || 'Error logging out');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Error logging out');
    }
  };

  const openMenu = () => {
    setMenuVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -250,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setMenuVisible(false));
  };

  const handleNavigation = screen => {
    closeMenu();
    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ backgroundColor: '#008080', padding: 0 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
      </SafeAreaView>

      <ScrollView>
        <View style={styles.body}>
          <View style={styles.profilecircle}>
            <Text style={styles.profileInitial}>{profile.name}</Text>
            <Text style={styles.profileInitial}>{profile.phone}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Icon name="person" size={24} color="#008080" />
            <Text style={styles.itemText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('Password')}
          >
            <Icon name="lock-closed" size={24} color="#008080" />
            <Text style={styles.itemText}>Change Password</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('EditAddress')}
          >
            <Icon name="location-outline" size={24} color="#008080" />
            <Text style={styles.itemText}>Edit Address</Text>
          </TouchableOpacity> */}

          <TouchableOpacity style={styles.item} onPress={handleLogout}>
            <Icon name="log-out-outline" size={24} color="#008080" />
            <Text style={styles.itemText}>Logout</Text>
          </TouchableOpacity>
        </View>
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  menuButton: {
    marginRight: 20,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 30,
  },

  body: {
    alignItems: 'center',
    marginTop: 20,
  },

  profilecircle: {
    marginTop: 30,
    width: 150,
    height: 150,
    borderRadius: 100,
    backgroundColor: '#008080',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    marginHorizontal: 70,
    borderColor: '#fff',
  },

  card: {
    backgroundColor: '#e0f7f5',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    width: 300,
  },

  profileInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 5,
    color: '#fff',
  },

  content: {
    marginTop: 80,
    paddingHorizontal: 50,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 30,

    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  itemText: {
    fontSize: 18,
    marginLeft: 20,
    color: 'black',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
