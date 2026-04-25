import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PageLayout from "../components/PageLayout";
import { apiRequest } from "../lib/api";
import { create, open } from "../lib/plaidLink";
import { fetchAccounts } from "../lib/queries";

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

// ─── ACCOUNT PICKER ──────────────────────────────────────────────────────────
function AccountPicker({ accounts, selectedId, onSelect }) {
  return (
    <View style={styles.pickerRow}>
      {accounts.map((acc) => {
        const selected = acc.account_id === selectedId;
        return (
          <TouchableOpacity
            key={acc.account_id}
            style={[styles.accountCard, selected && styles.accountCardSelected]}
            onPress={() => onSelect(acc.account_id)}
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
              ${Number(acc.balance).toFixed(2)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const FREQUENCIES = [
  { value: "once", label: "Once" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
];

const MMDDYYYY_RE = /^\d{2}\/\d{2}\/\d{4}$/;

function formatMMDDYYYY(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length >= 5) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  } else if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

function mmddyyyyToISO(value) {
  const [m, d, y] = value.split("/");
  if (!m || !d || !y) return "";
  return `${y}-${m}-${d}`;
}

function Select({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <>
      <TouchableOpacity
        style={styles.selectInput}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
      >
        <Text style={styles.selectValue}>{current?.label ?? ""}</Text>
        <Text style={styles.selectChevron}>▾</Text>
      </TouchableOpacity>
      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.selectBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.selectSheet}>
            {options.map((o) => {
              const selected = o.value === value;
              return (
                <TouchableOpacity
                  key={o.value}
                  style={[
                    styles.selectOption,
                    selected && styles.selectOptionActive,
                  ]}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      selected && styles.selectOptionTextActive,
                    ]}
                  >
                    {o.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ─── INTERNAL TRANSFER ───────────────────────────────────────────────────────
function InternalTransfer({ accounts, accountsLoading, reloadAccounts }) {
  const [fromAccountId, setFromAccountId] = useState(null);
  const [account, setAccount] = useState("");
  const [routing, setRouting] = useState("");
  const [amount, setAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("weekly");
  const [startDate, setStartDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!fromAccountId && accounts.length) {
      setFromAccountId(accounts[0].account_id);
    }
  }, [accounts, fromAccountId]);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!fromAccountId)
      return setError("Please select an account to transfer from.");
    if (!account) return setError("Please enter a destination account number.");
    if (!routing) return setError("Please enter a routing number.");
    const amountNum = Number(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0)
      return setError("Please enter a valid amount.");
    if (isRecurring && !MMDDYYYY_RE.test(startDate))
      return setError("Please enter a start date in MM/DD/YYYY format.");

    setLoading(true);
    try {
      if (isRecurring) {
        await apiRequest(`/recurring`, {
          method: "POST",
          body: JSON.stringify({
            from_account_id: fromAccountId,
            payee_account_number: account,
            payee_routing_number: routing,
            amount: amount,
            frequency,
            next_payment_date: mmddyyyyToISO(startDate),
          }),
        });
        setSuccess("Scheduled transfer created!");
      } else {
        await apiRequest(`/transfer/internal`, {
          method: "POST",
          body: JSON.stringify({
            from_account_id: fromAccountId,
            to_account_number: account,
            to_routing_number: routing,
            amount: amount,
          }),
        });
        setSuccess("Transfer submitted successfully!");
      }
      setAccount("");
      setRouting("");
      setAmount("");
      setStartDate("");
      setFrequency("weekly");
      setIsRecurring(false);
      reloadAccounts();
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text style={styles.label}>From Account</Text>
      {accountsLoading ? (
        <ActivityIndicator color="#007AFF" style={{ marginBottom: 15 }} />
      ) : (
        <AccountPicker
          accounts={accounts}
          selectedId={fromAccountId}
          onSelect={setFromAccountId}
        />
      )}

      <Text style={styles.label}>To Account Number</Text>
      <TextInput
        placeholder="Enter account number"
        placeholderTextColor="#999"
        value={account}
        onChangeText={(v) => setAccount(digitsOnly(v))}
        style={styles.input}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Routing Number</Text>
      <TextInput
        placeholder="9-digit routing number"
        placeholderTextColor="#999"
        value={routing}
        onChangeText={(v) => setRouting(digitsOnly(v))}
        style={styles.input}
        keyboardType="number-pad"
        maxLength={9}
      />

      <Text style={styles.label}>Amount</Text>
      <TextInput
        placeholder="0.00"
        placeholderTextColor="#999"
        value={amount}
        onChangeText={(v) => setAmount(decimalOnly(v))}
        style={styles.input}
        keyboardType="decimal-pad"
      />

      <TouchableOpacity
        style={styles.scheduleToggleRow}
        onPress={() => setIsRecurring((v) => !v)}
        activeOpacity={0.75}
      >
        <View style={[styles.checkbox, isRecurring && styles.checkboxChecked]}>
          {isRecurring && <Text style={styles.checkboxMark}>✓</Text>}
        </View>
        <Text style={styles.scheduleToggleText}>Schedule for later</Text>
      </TouchableOpacity>

      {isRecurring && (
        <View style={styles.scheduleBox}>
          <Text style={styles.label}>Frequency</Text>
          <Select
            value={frequency}
            options={FREQUENCIES}
            onChange={setFrequency}
          />

          <Text style={styles.label}>Start Date (MM/DD/YYYY)</Text>
          <TextInput
            placeholder="MM/DD/YYYY"
            placeholderTextColor="#999"
            value={startDate}
            onChangeText={(v) => setStartDate(formatMMDDYYYY(v))}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>
      )}

      {!!error && <Text style={styles.errorText}>{error}</Text>}
      {!!success && <Text style={styles.successText}>{success}</Text>}

      {loading ? (
        <ActivityIndicator color="#007AFF" />
      ) : (
        <Button
          title={isRecurring ? "Schedule Transfer" : "Submit Transfer"}
          onPress={handleSubmit}
        />
      )}
    </>
  );
}

// ─── EXTERNAL TRANSFER ───────────────────────────────────────────────────────
function ExternalTransfer({ accounts, accountsLoading, reloadAccounts }) {
  const [destAccountId, setDestAccountId] = useState(null);
  const [amount, setAmount] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!destAccountId && accounts.length) {
      setDestAccountId(accounts[0].account_id);
    }
  }, [accounts, destAccountId]);

  const completeTransfer = async (transferIntentId, publicToken) => {
    try {
      const data = await apiRequest(`/transfer/external/complete`, {
        method: "POST",
        body: JSON.stringify({
          transfer_intent_id: transferIntentId,
          public_token: publicToken,
        }),
      });
      setSuccess(data?.message || "Transfer submitted successfully!");
      setAmount("");
      reloadAccounts();
    } catch (e) {
      setError(e.message || "Error completing transfer.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!destAccountId) return setError("Please select a destination account.");
    const amountNum = Number(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0)
      return setError("Please enter a valid amount.");

    setLoading(true);
    let initResponse;
    try {
      initResponse = await apiRequest(`/transfer/external/initiate`, {
        method: "POST",
        body: JSON.stringify({
          amount: amount,
          account_id: destAccountId,
          android_package_name:
            Platform.OS === "android"
              ? "com.cs160.group1.mobileclient"
              : undefined,
        }),
      });
    } catch (e) {
      setError(e.message || "Error initiating transfer.");
      setLoading(false);
      return;
    }

    const { link_token, transfer_intent_id } = initResponse;
    create({ token: link_token });
    open({
      onSuccess: (success) => {
        completeTransfer(transfer_intent_id, success.publicToken);
      },
      onExit: (exit) => {
        setLoading(false);
        if (exit?.error?.displayMessage || exit?.error?.errorMessage) {
          setError(exit.error.displayMessage || exit.error.errorMessage);
        }
      },
    });
  };

  return (
    <>
      <Text style={styles.label}>Destination Account</Text>
      {accountsLoading ? (
        <ActivityIndicator color="#007AFF" style={{ marginBottom: 15 }} />
      ) : (
        <AccountPicker
          accounts={accounts}
          selectedId={destAccountId}
          onSelect={setDestAccountId}
        />
      )}

      <Text style={styles.label}>Amount</Text>
      <TextInput
        placeholder="0.00"
        placeholderTextColor="#999"
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
        <Button title="Begin External Transfer" onPress={handleSubmit} />
      )}
    </>
  );
}

// ─── SCREEN ──────────────────────────────────────────────────────────────────
export default function TransferScreen() {
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState("");
  const [internal, setInternal] = useState(true);

  const loadAccounts = () => {
    setAccountsLoading(true);
    fetchAccounts()
      .then((data) => {
        if (data.length === 0) {
          setAccountsError("You need an account to make a transfer.");
        } else {
          setAccounts(data);
          setAccountsError("");
        }
      })
      .catch((err) => {
        console.log("accounts error:", err.message);
        setAccountsError("Could not load your accounts.");
      })
      .finally(() => setAccountsLoading(false));
  };

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, []),
  );

  return (
    <PageLayout title="Transfer Money">
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              styles.toggleBtnLeft,
              internal && styles.toggleBtnActive,
            ]}
            onPress={() => setInternal(true)}
            activeOpacity={0.75}
          >
            <Text
              style={[styles.toggleText, internal && styles.toggleTextActive]}
            >
              Internal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              styles.toggleBtnRight,
              !internal && styles.toggleBtnActive,
            ]}
            onPress={() => setInternal(false)}
            activeOpacity={0.75}
          >
            <Text
              style={[styles.toggleText, !internal && styles.toggleTextActive]}
            >
              External
            </Text>
          </TouchableOpacity>
        </View>

        {!!accountsError && (
          <Text style={styles.errorText}>{accountsError}</Text>
        )}

        {internal ? (
          <InternalTransfer
            accounts={accounts}
            accountsLoading={accountsLoading}
            reloadAccounts={loadAccounts}
          />
        ) : Platform.OS === "web" ? (
          <Text style={styles.errorText}>
            External transfer isn&apos;t supported on web. Please use the mobile
            app.
          </Text>
        ) : (
          <ExternalTransfer
            accounts={accounts}
            accountsLoading={accountsLoading}
            reloadAccounts={loadAccounts}
          />
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
    backgroundColor: "white",
    color: "#000",
  },

  // toggle
  toggleRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  toggleBtn: {
    flex: 1,
    padding: 10,
    borderWidth: 1.5,
    borderColor: "#ccc",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  toggleBtnLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  toggleBtnRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderLeftWidth: 0,
  },
  toggleBtnActive: {
    borderColor: "#007AFF",
    backgroundColor: "#EEF4FF",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7A99",
  },
  toggleTextActive: {
    color: "#007AFF",
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

  // schedule toggle + box
  scheduleToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  checkboxChecked: {
    borderColor: "#007AFF",
    backgroundColor: "#007AFF",
  },
  checkboxMark: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
  scheduleToggleText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  scheduleBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F5F8FF",
  },
  // select
  selectInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 4,
    borderRadius: 6,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectValue: {
    fontSize: 16,
    color: "#000",
  },
  selectChevron: {
    fontSize: 14,
    color: "#6B7A99",
    marginLeft: 8,
  },
  selectBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  selectSheet: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  selectOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectOptionActive: {
    backgroundColor: "#EEF4FF",
  },
  selectOptionText: {
    fontSize: 16,
    color: "#333",
  },
  selectOptionTextActive: {
    color: "#007AFF",
    fontWeight: "600",
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
