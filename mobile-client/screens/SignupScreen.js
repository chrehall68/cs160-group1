import { useState } from 'react'
import {
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { signup } from '../lib/queries'

export default function SignupScreen({ goToLogin, onLogin }) {
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dob: '',
    email: '',
    phone: '',
    ssn: '',
    street: '',
    unit: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const digitsOnly = (value) => value.replace(/\D/g, '')

  const formatDOB = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 8)

    if (digits.length >= 5) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
    } else if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`
    }

    return digits
  }

  const formatDOBForAPI = (dob) => {
    const [m, d, y] = dob.split('/')
    if (!m || !d || !y) return ''
    return `${y}-${m}-${d}`
  }

  const handleSignup = async () => {
    try {
      setError('')

      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match')
        return
      }

      setLoading(true)

      await signup({
        username: form.username,
        password: form.password,
        first_name: form.firstName,
        last_name: form.lastName,
        date_of_birth: formatDOBForAPI(form.dob), 
        email: form.email,
        phone: form.phone,
        ssn: form.ssn,
        address: {
          street: form.street,
          unit: form.unit,
          city: form.city,
          state: form.state,
          zipcode: form.zip,
          country: form.country,
        },
      })
      // success, so call onLogin
      onLogin()

    } catch (err) {
      console.log(err)
      setError(err?.message || 'Signup failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const errorLines = error
    ? error.split('\n').filter((l) => l.trim().length > 0)
    : []

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.page}
          contentContainerStyle={styles.pageContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>Create Account</Text>

            {errorLines.length > 0 ? (
              <View style={styles.errorBox}>
                {errorLines.length > 1 ? (
                  errorLines.map((line, i) => (
                    <View key={i} style={styles.errorBullet}>
                      <Text style={styles.errorText}>{'•  '}</Text>
                      <Text style={[styles.errorText, { flex: 1 }]}>{line}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.errorText}>{error}</Text>
                )}
              </View>
            ) : null}

            <Section title="Login Information">
              <Input label="Username" value={form.username} onChange={(v) => update('username', v)} />
              <Input label="Password" secure value={form.password} onChange={(v) => update('password', v)} />
              <Input label="Confirm Password" secure value={form.confirmPassword} onChange={(v) => update('confirmPassword', v)} />
            </Section>

            <Section title="Personal Information">
              <Row>
                <Input half label="First Name" value={form.firstName} onChange={(v) => update('firstName', v)} />
                <Input half label="Last Name" value={form.lastName} onChange={(v) => update('lastName', v)} />
              </Row>

              <Input
                label="Date of Birth (MM/DD/YYYY)"
                value={form.dob}
                onChange={(v) => update('dob', formatDOB(v))}
                keyboardType="number-pad"
                maxLength={10}
              />

              <Input
                label="Email"
                value={form.email}
                onChange={(v) => update('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(v) => update('phone', digitsOnly(v).slice(0, 10))}
                keyboardType="number-pad"
                maxLength={10}
              />
              <Input
                label="SSN"
                value={form.ssn}
                onChange={(v) => update('ssn', digitsOnly(v).slice(0, 9))}
                keyboardType="number-pad"
                maxLength={9}
              />
            </Section>

            <Section title="Address">
              <Input label="Street" value={form.street} onChange={(v) => update('street', v)} />
              <Input label="Unit" value={form.unit} onChange={(v) => update('unit', v)} />

              <Row>
                <Input half label="City" value={form.city} onChange={(v) => update('city', v)} />
                <Input half label="State" value={form.state} onChange={(v) => update('state', v)} />
              </Row>

              <Row>
                <Input
                  half
                  label="Zip"
                  value={form.zip}
                  onChange={(v) => update('zip', digitsOnly(v).slice(0, 5))}
                  keyboardType="number-pad"
                  maxLength={5}
                />
                <Input half label="Country" value={form.country} onChange={(v) => update('country', v)} />
              </Row>
            </Section>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.loginText} onPress={goToLogin}>
              Already have an account? <Text style={styles.loginLink}>Sign in</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}


function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function Row({ children }) {
  return <View style={styles.row}>{children}</View>
}

function Input({
  label,
  value,
  onChange,
  secure,
  half,
  keyboardType,
  maxLength,
  autoCapitalize,
}) {
  return (
    <View style={[styles.field, half && { flex: 1 }]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        placeholderTextColor="#999"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#e8f1ef',
  },
  pageContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 24,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  section: {
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  field: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    color: '#000',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#1f7a6b',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loginText: {
    marginTop: 20,
    textAlign: 'center',
  },
  loginLink: {
    color: '#1f7a6b',
    fontWeight: 'bold',
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    color: '#b42318',
  },
  errorBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
})