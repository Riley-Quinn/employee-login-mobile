import * as React from 'react';
import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

import Login from './Authentication/Login';
import Dashboard from './Tickets/Dashboard';
import ViewTickets from './Tickets/ViewTicket';
import EditTicket from './Tickets/EditTicket';
import EventsOverview from './Events/Events';
import ProfileScreen from './Profile/Profile';
import OTPScreen from './Authentication/Otp';
import ForgotPassword from './Authentication/ForgotPassword';
import EventsCalendar from './Calendar/Calendar';
import MonthView from './Calendar/Monthview';
import WeekView from './Calendar/WeekScreen';
import EditProfile from './Profile/EditProfile';
import TicketPage from './Tickets/TicketPage';
import Password from './Profile/Password';
import EditAddress from './Profile/EditAddress';

const Stack = createStackNavigator();

const App = () => {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkRememberMe = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          setInitialRoute('Dashboard');
        } else {
          setInitialRoute('Login');
        }
      } catch (error) {
        console.log('Error checking storage:', error);
        setInitialRoute('Login');
      }
    };

    checkRememberMe();
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
        <Stack.Screen name="EditTicket" component={EditTicket} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="ViewTickets" component={ViewTickets} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="OTPScreen" component={OTPScreen} />
        <Stack.Screen name="MonthView" component={MonthView} />
        <Stack.Screen name="WeekView" component={WeekView} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="Password" component={Password} />
        <Stack.Screen name="EditAddress" component={EditAddress} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
