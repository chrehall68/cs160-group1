import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AccountsScreen() {
  return (
    <ScrollView style={styles.page}>
      <View style={styles.container}>
        <Text style={styles.title}>Your Accounts</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Checking Account</Text>
          <Text>Account Number: ••••1234</Text>
          <Text>Balance: $2,100.20</Text>
          <Text>Status: Active</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Savings Account</Text>
          <Text>Account Number: ••••8832</Text>
          <Text>Balance: $2,130.34</Text>
          <Text>Status: Active</Text>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#e8f1ef',
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
});