import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
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
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
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
