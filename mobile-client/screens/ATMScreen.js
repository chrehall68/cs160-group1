import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import PageLayout from "../components/PageLayout";

export default function ATMScreen() {
  const [city, setCity] = useState("");
  const [searched, setSearched] = useState(false);

  const results = [
    "123 MLK Library, San Jose, CA",
    "456 Market St, San Jose, CA",
  ];

  return (
    <PageLayout title="Find Nearby ATM">
      <View style={styles.card}>
        <TextInput
          placeholder="Enter City or Zip Code"
          value={city}
          onChangeText={setCity}
          style={styles.input}
        />

        <Button title="Search" onPress={() => setSearched(true)} />
      </View>

      {searched && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Results:</Text>

          {results.map((atm, i) => (
            <View key={i} style={styles.result}>
              <Text>{atm}</Text>
            </View>
          ))}
        </View>
      )}
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
  result: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
});