import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PageLayout from "../components/PageLayout";
import { fetchAccounts } from "../lib/queries";

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:8000";

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

export default function DepositCheckScreen() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [amount, setAmount] = useState("");
  const [fromAccountNumber, setFromAccountNumber] = useState("");
  const [fromRoutingNumber, setFromRoutingNumber] = useState("");
  const [checkImage, setCheckImage] = useState(null);

  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchAccounts()
      .then((data) => {
        if (data.length === 0) {
          setError("You need an account to deposit a check.");
        } else {
          setAccounts(data);
          setSelectedAccountId(data[0].account_id);
        }
      })
      .catch(() => setError("Could not load your accounts."))
      .finally(() => setAccountsLoading(false));
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setCheckImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setError("Camera permission is required to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setCheckImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!selectedAccountId) return setError("Please select an account.");
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0)
      return setError("Please enter a valid amount.");
    if (!fromAccountNumber)
      return setError("Please enter the check account number.");
    if (!fromRoutingNumber)
      return setError("Please enter the check routing number.");
    if (!checkImage) return setError("Please upload a check image.");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("account_id", String(selectedAccountId));
      formData.append("check_amount", amount);
      formData.append("from_account_number", fromAccountNumber);
      formData.append("from_routing_number", fromRoutingNumber);

      const uri = checkImage.uri;
      const filename = uri.split("/").pop() || "check.jpg";
      const ext = filename.split(".").pop()?.toLowerCase();
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";
      formData.append("check_img", { uri, name: filename, type: mimeType });

      const token = (await AsyncStorage.getItem("auth.jwt")) ?? "";
      const response = await fetch(`${BASE_URL}/deposit/check`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      let data = null;
      try {
        data = await response.json();
      } catch {}

      if (!response.ok) {
        throw new Error(data?.detail || "Request failed");
      }

      setSuccess("Check deposit submitted successfully!");
      setAmount("");
      setFromAccountNumber("");
      setFromRoutingNumber("");
      setCheckImage(null);
      fetchAccounts().then((data) => setAccounts(data));
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout title="Deposit Check">
      <View style={styles.card}>
        {/* Account picker */}
        <Text style={styles.label}>Deposit To</Text>
        {accountsLoading ? (
          <ActivityIndicator color="#007AFF" style={{ marginBottom: 15 }} />
        ) : (
          <View style={styles.pickerRow}>
            {accounts.map((acc) => {
              const selected = acc.account_id === selectedAccountId;
              return (
                <TouchableOpacity
                  key={acc.account_id}
                  style={[
                    styles.accountCard,
                    selected && styles.accountCardSelected,
                  ]}
                  onPress={() => setSelectedAccountId(acc.account_id)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.accountType,
                      selected && styles.accountTypeSelected,
                    ]}
                  >
                    {acc.account_type}
                  </Text>
                  <Text
                    style={[
                      styles.accountNumber,
                      selected && styles.accountNumberSelected,
                    ]}
                  >
                    ••••{acc.account_number.slice(-4)}
                  </Text>
                  <Text
                    style={[
                      styles.accountBalance,
                      selected && styles.accountBalanceSelected,
                    ]}
                  >
                    ${parseFloat(acc.balance).toFixed(2)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Amount */}
        <Text style={styles.label}>Check Amount</Text>
        <TextInput
          placeholder="0.00"
          value={amount}
          onChangeText={(v) => setAmount(decimalOnly(v))}
          style={styles.input}
          keyboardType="decimal-pad"
        />

        {/* From account number */}
        <Text style={styles.label}>From Account Number</Text>
        <TextInput
          placeholder="Enter account number"
          value={fromAccountNumber}
          onChangeText={(v) => setFromAccountNumber(digitsOnly(v))}
          style={styles.input}
          keyboardType="number-pad"
        />

        {/* From routing number */}
        <Text style={styles.label}>From Routing Number</Text>
        <TextInput
          placeholder="Enter routing number"
          value={fromRoutingNumber}
          onChangeText={(v) => setFromRoutingNumber(digitsOnly(v))}
          style={styles.input}
          keyboardType="number-pad"
          maxLength={9}
        />

        {/* Check image */}
        <Text style={styles.label}>Check Image</Text>
        <View style={styles.imageButtons}>
          <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
            <Text style={styles.imageButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>Choose from Library</Text>
          </TouchableOpacity>
        </View>
        {checkImage && (
          <Image
            source={{ uri: checkImage.uri }}
            style={styles.preview}
            resizeMode="contain"
          />
        )}

        {!!error && <Text style={styles.errorText}>{error}</Text>}
        {!!success && <Text style={styles.successText}>{success}</Text>}

        {loading ? (
          <ActivityIndicator color="#007AFF" />
        ) : (
          <Button title="Deposit Check" onPress={handleSubmit} />
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
  accountTypeSelected: { color: "#007AFF" },
  accountNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginTop: 2,
  },
  accountNumberSelected: { color: "#007AFF" },
  accountBalance: {
    fontSize: 13,
    color: "#999",
    marginTop: 4,
  },
  accountBalanceSelected: { color: "#0052CC" },
  imageButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  imageButton: {
    flex: 1,
    backgroundColor: "#0f766e",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  imageButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#f0f0f0",
  },
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
