import { useState } from 'react'
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
} from 'react-native'
import { login } from '../lib/queries'

export default function LoginScreen({ onLogin, goToSignup }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    try {
      setError('')
      await login(username, password)
      onLogin() // switches to tabs
    } catch (err) {
      if (err?.code === 'ADMIN_NOT_ALLOWED') {
        setError(err.message)
      } else {
        setError('Invalid username or password')
      }
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Username"
        placeholderTextColor="#999"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Login" onPress={handleLogin} />

      {/* Signup link */}
      <Text
        style={styles.signupText}
        onPress={goToSignup}
      >
        Don’t have an account? Sign up
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#e8f1ef',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },

  input: {
    backgroundColor: 'white',
    color: '#000',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },

  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },

  signupText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#0f766e',
    fontWeight: '600',
    fontSize: 16,
  },
})