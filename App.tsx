import * as React from 'react';
import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
// @ts-ignore
import PushNotification from 'react-native-push-notification';
import messaging from '@react-native-firebase/messaging';
import Login from './Authentication/Login';
import Dashboard from './Tickets/Dashboard';
import ViewTickets from './Tickets/ViewTicket';
import EventsOverview from './Events/Events';
import ProfileScreen from './Profile/Profile';
import OTPScreen from './Authentication/Otp';
import ForgotPassword from './Authentication/ForgotPassword';
import EventsCalendar from './Calendar/Calendar';
import EditProfile from './Profile/EditProfile';
import TicketPage from './Tickets/TicketPage';
import Password from './Profile/Password';
import EditAddress from './Profile/EditAddress';

const Stack = createStackNavigator();

const App = () => {
  const [initialRoute, setInitialRoute] = useState<
    'Dashboard' | 'Login' | null
  >(null);

  useEffect(() => {
    const checkRememberMe = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        setInitialRoute(userId ? 'Dashboard' : 'Login');
      } catch (error) {
        console.log('Error checking storage:', error);
        setInitialRoute('Login');
      }
    };
    checkRememberMe();
    PushNotification.configure({
      onRegister: function (token: any) {
        console.log('PushNotification token:', token);
      },
      onNotification: function (notification: { finish: (arg0: any) => void }) {
        console.log('LOCAL NOTIFICATION:', notification);
        notification.finish(PushNotification.FetchResult.NoData);
      },
      popInitialNotification: true,
      requestPermissions: false,
    });
    PushNotification.createChannel(
      {
        channelId: 'default-channel-id',
        channelName: 'Default Channel',
        importance: 4,
        vibrate: true,
      },
      (created: any) =>
        console.log(`Channel '${created ? 'created' : 'already exists'}'`),
    );
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('Foreground FCM:', remoteMessage);
      PushNotification.localNotification({
        channelId: 'default-channel-id',
        title: remoteMessage.notification?.title || 'Notification',
        message: remoteMessage.notification?.body || 'You have a new message',
      });
    });

    const unsubscribeBackgroundOpened = messaging().onNotificationOpenedApp(
      remoteMessage => {
        console.log('Opened from background:', remoteMessage);
      },
    );

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Opened from quit state:', remoteMessage);
        }
      });

    return () => {
      unsubscribeForeground();
      unsubscribeBackgroundOpened();
    };
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="TicketPage" component={TicketPage} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="EventsOverview" component={EventsOverview} />
        <Stack.Screen name="EventsCalendar" component={EventsCalendar} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        {/* @ts-ignore */}
        <Stack.Screen name="ViewTickets" component={ViewTickets} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="OTPScreen" component={OTPScreen} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="Password" component={Password} />
        <Stack.Screen name="EditAddress" component={EditAddress} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
