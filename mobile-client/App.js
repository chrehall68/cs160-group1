import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { useState } from 'react'
import { TouchableOpacity, Text } from 'react-native' 

import AccountsScreen from './screens/AccountsScreen'
import ATMScreen from './screens/ATMScreen'
import DashboardScreen from './screens/DashboardScreen'
import TransferScreen from './screens/TransferScreen'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'

const Tab = createBottomTabNavigator()


function Tabs({ onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitle: 'Online Bank',
        headerStyle: { backgroundColor: '#0f766e' },
        headerTintColor: 'white',

        
        headerRight: () => (
          <TouchableOpacity onPress={onLogout} style={{ marginRight: 15 }}>
            <Text style={{ color: 'white', fontWeight: '600' }}>
              Logout
            </Text>
          </TouchableOpacity>
        ),

        tabBarActiveTintColor: '#0f766e',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: { height: 60 },

        tabBarIcon: ({ color, size }) => {
          let iconName
          if (route.name === 'Dashboard') iconName = 'home'
          else if (route.name === 'Accounts') iconName = 'card'
          else if (route.name === 'Transfer') iconName = 'swap-horizontal'
          else if (route.name === 'ATM') iconName = 'location'

          return <Ionicons name={iconName} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Accounts" component={AccountsScreen} />
      <Tab.Screen name="Transfer" component={TransferScreen} />
      <Tab.Screen name="ATM" component={ATMScreen} />
    </Tab.Navigator>
  )
}

export default function App() {
  const [screen, setScreen] = useState('login') 

  return (
    <NavigationContainer>
      {screen === 'login' && (
        <LoginScreen
          onLogin={() => setScreen('main')}
          goToSignup={() => setScreen('signup')}
        />
      )}

      {screen === 'signup' && (
        <SignupScreen
          goToLogin={() => setScreen('login')}
        />
      )}

      {screen === 'main' && (
        <Tabs onLogout={() => setScreen('login')} />
      )}
    </NavigationContainer>
  )
}