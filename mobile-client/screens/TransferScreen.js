import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PageLayout from "../components/PageLayout";
import { fetchAccounts } from "../lib/queries";
 
// ─── API CONFIG ───────────────────────────────────────────────────────────────
const API_BASE =
  Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";
 
// ─── HELPERS ─────────────────────────────────────────────────────────────────
function digitsOnly(val) {
  return val.replace(/[^0-9]/g, "");
}
 
function decimalOnly(val) {
  const cleaned = val.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) return parts[0] + "." + parts[1];
  if (parts[1]?.length > 2) return parts[0] + "." + parts[1].slice(0, 2);
  return cleaned;
}
 
// ─── SCREEN ──────────────────────────────────────────────────────────────────
export default function TransferScreen() {
  const [accounts, setAccounts] = useState([]);
  const [fromAccountId, setFromAccountId] = useState(null);
  const [account, setAccount] = useState("");
  const [routing, setRouting] = useState("");
  const [amount, setAmount] = useState("");
 
  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
 
  // fetch accounts on mount
  useEffect(() => {
    fetchAccounts()
      .then((data) => {
        console.log('accounts data:', JSON.stringify(data))
        if (data.length === 0) {
          setError("You need an account to make a transfer.");
        } else {
          setAccounts(data);
          setFromAccountId(data[0].account_id);
        }
      })
      .catch((err) => {
        console.log('accounts error:', err.message)
        setError("Could not load your accounts.")
      })
      .finally(() => setAccountsLoading(false));
  }, []);
 
  const handleSubmit = async () => {
    setError("");
    setSuccess("");
 
    if (!fromAccountId) return setError("Please select an account to transfer from.");
    if (!account) return setError("Please enter a destination account number.");
    if (!routing) return setError("Please enter a routing number.");
    if (routing.length !== 9) return setError("Routing number must be 9 digits.");
    if (!amount || parseFloat(amount) <= 0) return setError("Please enter a valid amount.");
 
    setLoading(true);
    try {
      const token = (await AsyncStorage.getItem("auth.jwt")) ?? "";
      const res = await fetch(`${API_BASE}/transfer/internal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          from_account_id: fromAccountId,
          to_account_number: account,
          to_routing_number: routing,
          amount: parseFloat(amount),
        }),
      });
 
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Transfer failed.");
 
      setSuccess("Transfer submitted successfully!");
      setAccount("");
      setRouting("");
      setAmount("");
      fetchAccounts().then((data) => {setAccounts(data);})
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <PageLayout title="Transfer Money">
      <View style={styles.card}>
 
        {/* From account picker */}
        <Text style={styles.label}>From Account</Text>
        {accountsLoading ? (
          <ActivityIndicator color="#007AFF" style={{ marginBottom: 15 }} />
        ) : (
          <View style={styles.pickerRow}>
            {accounts.map((acc) => {
              const selected = acc.account_id === fromAccountId;
              return (
                <TouchableOpacity
                  key={acc.account_id}
                  style={[styles.accountCard, selected && styles.accountCardSelected]}
                  onPress={() => setFromAccountId(acc.account_id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.accountType, selected && styles.accountTypeSelected]}>
                    {acc.account_type}
                  </Text>
                  <Text style={[styles.accountNumber, selected && styles.accountNumberSelected]}>
                    ••••{acc.account_number.slice(-4)}
                  </Text>
                  <Text style={[styles.accountBalance, selected && styles.accountBalanceSelected]}>
                    ${parseFloat(acc.balance).toFixed(2)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
 
        {/* To account number */}
        <Text style={styles.label}>To Account Number</Text>
        <TextInput
          placeholder="Enter account number"
          value={account}
          onChangeText={(v) => setAccount(digitsOnly(v))}
          style={styles.input}
          keyboardType="number-pad"
        />
 
        {/* Routing number */}
        <Text style={styles.label}>Routing Number</Text>
        <TextInput
          placeholder="9-digit routing number"
          value={routing}
          onChangeText={(v) => setRouting(digitsOnly(v))}
          style={styles.input}
          keyboardType="number-pad"
          maxLength={9}
        />
 
        {/* Amount */}
        <Text style={styles.label}>Amount</Text>
        <TextInput
          placeholder="0.00"
          value={amount}
          onChangeText={(v) => setAmount(decimalOnly(v))}
          style={styles.input}
          keyboardType="decimal-pad"
        />
 
        {!!error && <Text style={styles.errorText}>{error}</Text>}
        {!!success && <Text style={styles.successText}>{success}</Text>}
 
        {loading ? (
          <ActivityIndicator color="#007AFF" />
        ) : (
          <Button title="Submit Transfer" onPress={handleSubmit} />
        )}
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
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7A99",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 4,
    borderRadius: 6,
    fontSize: 16,
  },
 
  // account picker
  pickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  accountCard: {
    flex: 1,
    minWidth: 120,
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#f9f9f9",
  },
  accountCardSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#EEF4FF",
  },
  accountType: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7A99",
    textTransform: "uppercase",
  },
  accountTypeSelected: {
    color: "#007AFF",
  },
  accountNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginTop: 2,
  },
  accountNumberSelected: {
    color: "#007AFF",
  },
  accountBalance: {
    fontSize: 13,
    color: "#999",
    marginTop: 4,
  },
  accountBalanceSelected: {
    color: "#0052CC",
  },
 
  // feedback
  errorText: {
    color: "#CC2200",
    fontSize: 14,
    marginBottom: 12,
    marginTop: 8,
  },
  successText: {
    color: "#007A3D",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
  },
});