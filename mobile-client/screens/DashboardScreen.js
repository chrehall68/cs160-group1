import { Button, StyleSheet, Text, View } from 'react-native';

export default function DashboardScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customer Dashboard</Text>

      <Text style={styles.balance}>Total Balance: $4,230.54</Text>

      <Button
        title="View Accounts"
        onPress={() => navigation.navigate('Accounts')}
      />

      <View style={{ height: 10 }} />

      <Button
        title="Transfer Money"
        onPress={() => navigation.navigate('Transfer')}
      />

      <View style={{ height: 10 }} />

      <Button
        title="Find ATM"
        onPress={() => navigation.navigate('ATM')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  balance: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
  },
});