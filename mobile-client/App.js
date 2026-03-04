import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'

import AccountsScreen from './screens/AccountsScreen'
import ATMScreen from './screens/ATMScreen'
import DashboardScreen from './screens/DashboardScreen'
import TransferScreen from './screens/TransferScreen'

const Tab = createBottomTabNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
  screenOptions={({ route }) => ({
    headerTitle: "Online Bank",
    tabBarActiveTintColor: '#0f766e',
    tabBarInactiveTintColor: '#6b7280',
    tabBarStyle: {
      backgroundColor: 'white',
      borderTopWidth: 0,
      elevation: 8,
      height: 60,
    },
    headerStyle: {
      backgroundColor: '#0f766e',
    },
    headerTintColor: 'white',
    tabBarIcon: ({ color, size }) => {
      let iconName

      if (route.name === 'Dashboard') {
        iconName = 'home'
      } else if (route.name === 'Accounts') {
        iconName = 'card'
      } else if (route.name === 'Transfer') {
        iconName = 'swap-horizontal'
      } else if (route.name === 'ATM') {
        iconName = 'location'
      }

      return <Ionicons name={iconName} size={size} color={color} />
    },
  })}
>
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Accounts" component={AccountsScreen} />
        <Tab.Screen name="Transfer" component={TransferScreen} />
        <Tab.Screen name="ATM" component={ATMScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}