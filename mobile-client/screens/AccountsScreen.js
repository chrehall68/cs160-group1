import { StyleSheet, Text, View } from 'react-native';

export default function AccountsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Accounts</Text>

      <View style={styles.card}>
        <Text style={styles.accountTitle}>Checking Account</Text>
        <Text>••••1234</Text>
        <Text>Balance: $2,100.20</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.accountTitle}>Savings Account</Text>
        <Text>••••8832</Text>
        <Text>Balance: $2,130.34</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
  },
  accountTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
});