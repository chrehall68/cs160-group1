import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiRequest } from "../lib/api";
import { fetchAccounts } from "../lib/queries";

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState("checking");

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await fetchAccounts();
      setAccounts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, []),
  );

  const createAccount = async () => {
    try {
      await apiRequest("/accounts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_type: accountType,
        }),
      });

      loadAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ScrollView style={styles.page}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome back!</Text>
        <Text style={styles.subtitle}>
          Here&apos;s a quick overview of your accounts.
        </Text>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              accountType === "checking" && styles.activeToggle,
            ]}
            onPress={() => setAccountType("checking")}
          >
            <Text
              style={[
                styles.toggleText,
                accountType === "checking" && styles.activeToggleText,
              ]}
            >
              Checking
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              accountType === "savings" && styles.activeToggle,
            ]}
            onPress={() => setAccountType("savings")}
          >
            <Text
              style={[
                styles.toggleText,
                accountType === "savings" && styles.activeToggleText,
              ]}
            >
              Savings
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={createAccount}>
          <Text style={styles.buttonText}>+ Create {accountType} Account</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : accounts.length === 0 ? (
          <Text style={styles.empty}>No accounts yet</Text>
        ) : (
          accounts.map((acc) => (
            <View key={acc.account_id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {acc.type?.toUpperCase()} ACCOUNT
              </Text>

              <Text>
                Account Number: ••••
                {acc.account_number?.slice(-4)}
              </Text>

              <Text style={styles.balance}>Balance: ${acc.balance}</Text>

              <Text>Status: {acc.status}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#e8f1ef",
    flex: 1,
  },

  container: {
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 5,
  },

  subtitle: {
    color: "#555",
    marginBottom: 20,
  },

  toggleContainer: {
    flexDirection: "row",
    marginBottom: 15,
    gap: 10,
  },

  toggleButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#ddd",
    alignItems: "center",
  },

  activeToggle: {
    backgroundColor: "#1f7a6b",
  },

  toggleText: {
    fontWeight: "bold",
    color: "#333",
  },

  activeToggleText: {
    color: "white",
  },

  button: {
    backgroundColor: "#1f7a6b",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
  },

  empty: {
    marginTop: 20,
    color: "#666",
  },

  card: {
    backgroundColor: "white",
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  cardTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },

  balance: {
    marginTop: 5,
    marginBottom: 5,
    fontWeight: "bold",
  },
});
