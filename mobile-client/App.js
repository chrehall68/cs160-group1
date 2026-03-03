import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AccountsScreen from './screens/AccountsScreen';
import ATMScreen from './screens/ATMScreen';
import DashboardScreen from './screens/DashboardScreen';
import LoginScreen from './screens/LoginScreen';
import TransferScreen from './screens/TransferScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Accounts" component={AccountsScreen} />
        <Stack.Screen name="Transfer" component={TransferScreen} />
        <Stack.Screen name="ATM" component={ATMScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}