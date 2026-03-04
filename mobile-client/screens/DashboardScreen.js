import { StyleSheet, Text, View } from "react-native";
import PageLayout from "../components/PageLayout";

export default function DashboardScreen() {
  return (
    <PageLayout
      title="Welcome back!"
      subtitle="Here's a quick overview of your accounts and recent activity."
    >
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
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },
});