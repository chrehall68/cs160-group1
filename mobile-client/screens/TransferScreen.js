import { useState } from "react";
import { Button, StyleSheet, TextInput, View } from "react-native";
import PageLayout from "../components/PageLayout";

export default function TransferScreen() {
  const [account, setAccount] = useState("");
  const [routing, setRouting] = useState("");
  const [amount, setAmount] = useState("");

  return (
    <PageLayout title="Transfer Money">
      <View style={styles.card}>
        <TextInput
          placeholder="To Account Number"
          value={account}
          onChangeText={setAccount}
          style={styles.input}
        />

        <TextInput
          placeholder="Routing Number"
          value={routing}
          onChangeText={setRouting}
          style={styles.input}
        />

        <TextInput
          placeholder="Amount"
          value={amount}
          onChangeText={setAmount}
          style={styles.input}
          keyboardType="numeric"
        />

        <Button title="Submit Transfer" onPress={() => alert("Transfer Submitted")} />
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 6,
  },
});