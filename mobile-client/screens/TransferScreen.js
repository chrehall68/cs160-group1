import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

export default function TransferScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transfer Money</Text>

      <TextInput
        placeholder="To Account Number"
        style={styles.input}
      />

      <TextInput
        placeholder="Routing Number"
        style={styles.input}
      />

      <TextInput
        placeholder="Amount"
        keyboardType="numeric"
        style={styles.input}
      />

      <Button title="Submit Transfer" onPress={() => alert('Transfer Submitted')} />
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
});