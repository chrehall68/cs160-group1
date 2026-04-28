import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  cancelRecurringPayment,
  closeAccount,
  fetchAccount,
  fetchRecurringPaymentTransactions,
  fetchRecurringPayments,
  fetchTransactionDetail,
  fetchTransactions,
} from "../lib/queries";

const transactionTypeLabels = {
  atm_deposit: "ATM Deposit",
  online_deposit: "Online Deposit",
  withdrawal: "Withdrawal",
  transfer: "Transfer",
};

const frequencyLabels = {
  once: "One-time",
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
};

const statusBadgeStyles = {
  active: { backgroundColor: "#DCFCE7", color: "#166534" },
  canceled: { backgroundColor: "#E5E7EB", color: "#374151" },
  completed: { backgroundColor: "#DBEAFE", color: "#1E40AF" },
};

// ─── PAGER ───────────────────────────────────────────────────────────────────
function Pager({ page, numPages, onChange, fetching }) {
  if (numPages <= 1) return null;
  return (
    <View style={styles.pagerRow}>
      <TouchableOpacity
        style={[
          styles.pagerBtn,
          (page === 1 || fetching) && styles.pagerBtnDisabled,
        ]}
        onPress={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1 || fetching}
        activeOpacity={0.75}
      >
        <Text style={styles.pagerBtnText}>Previous</Text>
      </TouchableOpacity>
      <Text style={styles.pagerLabel}>
        Page {page} of {numPages}
      </Text>
      <TouchableOpacity
        style={[
          styles.pagerBtn,
          (page === numPages || fetching) && styles.pagerBtnDisabled,
        ]}
        onPress={() => onChange(Math.min(numPages, page + 1))}
        disabled={page === numPages || fetching}
        activeOpacity={0.75}
      >
        <Text style={styles.pagerBtnText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── TRANSACTION DETAIL MODAL ────────────────────────────────────────────────
function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function TransactionDetailModal({ accountId, transactionId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      setError("");
      fetchTransactionDetail(accountId, transactionId)
        .then((data) => {
          if (!cancelled) setDetail(data);
        })
        .catch((e) => {
          if (!cancelled) setError(e.message || "Unable to load details.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [accountId, transactionId]),
  );

  const txn = detail?.transaction;
  const heading = txn
    ? `${transactionTypeLabels[txn.transaction_type] ?? txn.transaction_type} — $${txn.amount}`
    : "Loading...";

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <Text style={styles.modalDescription}>{heading}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Text style={styles.modalClose}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            {loading && (
              <Text style={styles.mutedText}>Loading details...</Text>
            )}
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            {detail && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      txn?.status === "failed" && styles.detailValueFailed,
                    ]}
                  >
                    {txn?.status}
                  </Text>
                </View>
                <DetailRow label="Date" value={txn?.created_at} />
                {!!txn?.description && (
                  <View style={styles.detailStack}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailStackValue}>
                      {txn.description}
                    </Text>
                  </View>
                )}

                {detail.atm_deposit && (
                  <>
                    <View style={styles.divider} />
                    <DetailRow
                      label="Deposit Type"
                      value={detail.atm_deposit.type}
                    />
                    {!!detail.atm_address && (
                      <DetailRow
                        label="ATM Location"
                        value={detail.atm_address}
                      />
                    )}
                  </>
                )}

                {detail.online_deposit && (
                  <>
                    <View style={styles.divider} />
                    <DetailRow
                      label="From Routing #"
                      value={detail.online_deposit.check_from_routing_number}
                    />
                    <DetailRow
                      label="From Account #"
                      value={detail.online_deposit.check_from_account_number}
                    />
                    {!!detail.check_image_url && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={styles.detailLabel}>Check Image</Text>
                        <Image
                          source={{ uri: detail.check_image_url }}
                          style={styles.checkImage}
                          resizeMode="contain"
                        />
                      </View>
                    )}
                  </>
                )}

                {detail.withdrawal && !!detail.atm_address && (
                  <>
                    <View style={styles.divider} />
                    <DetailRow
                      label="ATM Location"
                      value={detail.atm_address}
                    />
                  </>
                )}

                {detail.transfer && (
                  <>
                    <View style={styles.divider} />
                    <DetailRow
                      label="From Routing #"
                      value={detail.transfer.from_routing_number}
                    />
                    <DetailRow
                      label="From Account #"
                      value={detail.transfer.from_account_number}
                    />
                    <DetailRow
                      label="To Routing #"
                      value={detail.transfer.to_routing_number}
                    />
                    <DetailRow
                      label="To Account #"
                      value={detail.transfer.to_account_number}
                    />
                  </>
                )}
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── TRANSACTIONS LIST ───────────────────────────────────────────────────────
function Transactions({ accountId }) {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setFetching(true);
      if (data === null) setLoading(true);
      setError("");
      fetchTransactions(accountId, page, limit)
        .then((res) => {
          if (!cancelled) setData(res);
        })
        .catch((e) => {
          if (!cancelled) setError(e.message || "Unable to load transactions.");
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
            setFetching(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }, [accountId, page]),
  );

  const transactions = data?.transactions ?? [];
  const numPages = data?.total_pages ?? 1;

  if (loading) {
    return <ActivityIndicator color="#007AFF" style={{ marginTop: 12 }} />;
  }
  if (error) return <Text style={styles.errorText}>{error}</Text>;
  if (transactions.length === 0) {
    return <Text style={styles.mutedText}>No transactions.</Text>;
  }

  return (
    <View style={{ gap: 12 }}>
      {selectedId !== null && (
        <TransactionDetailModal
          accountId={accountId}
          transactionId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}

      {transactions.map((t) => {
        const isFailed = t.status === "failed";
        return (
          <TouchableOpacity
            key={t.transaction_id}
            style={styles.txnRow}
            onPress={() => setSelectedId(t.transaction_id)}
            activeOpacity={0.75}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.txnHeaderRow}>
                <Text style={styles.txnType}>
                  {transactionTypeLabels[t.transaction_type] ?? t.transaction_type}
                </Text>
                {isFailed && (
                  <View style={styles.failedPill}>
                    <Text style={styles.failedPillText}>Failed</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.txnAmount,
                  isFailed
                    ? styles.amountFailed
                    : t.ledger_type === "credit"
                      ? styles.amountCredit
                      : styles.amountDebit,
                ]}
              >
                {isFailed ? "" : t.ledger_type === "credit" ? "+" : "-"}${t.amount}
              </Text>
            </View>
            <Text style={styles.txnDate}>Created at {t.created_at}</Text>
          </TouchableOpacity>
        );
      })}

      <Pager
        page={page}
        numPages={numPages}
        onChange={setPage}
        fetching={fetching}
      />
    </View>
  );
}

// ─── RECURRING TRANSACTIONS (nested) ─────────────────────────────────────────
function RecurringTransactions({ recurringPaymentId }) {
  const [page, setPage] = useState(1);
  const limit = 5;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setFetching(true);
      if (data === null) setLoading(true);
      setError("");
      fetchRecurringPaymentTransactions(recurringPaymentId, page, limit)
        .then((res) => {
          if (!cancelled) setData(res);
        })
        .catch((e) => {
          if (!cancelled) setError(e.message || "Unable to load transactions.");
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
            setFetching(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }, [recurringPaymentId, page]),
  );

  if (loading) return <Text style={styles.mutedText}>Loading transactions...</Text>;
  if (error) return <Text style={styles.errorText}>{error}</Text>;
  const txns = data?.transactions ?? [];
  if (txns.length === 0) {
    return (
      <Text style={styles.mutedText}>
        No transactions yet for this recurring transfer.
      </Text>
    );
  }
  const numPages = data?.total_pages ?? 1;

  return (
    <View style={{ gap: 8 }}>
      {txns.map((t) => {
        const isFailed = t.status === "failed";
        return (
          <View key={t.transaction_id} style={styles.recurringTxnRow}>
            <Text style={styles.txnDate}>{t.created_at}</Text>
            <View style={styles.recurringTxnRight}>
              {isFailed && (
                <View style={styles.failedPill}>
                  <Text style={styles.failedPillText}>Failed</Text>
                </View>
              )}
              <Text
                style={
                  isFailed
                    ? styles.amountFailed
                    : t.ledger_type === "credit"
                      ? styles.amountCredit
                      : styles.amountDebit
                }
              >
                {isFailed ? "" : t.ledger_type === "credit" ? "+" : "-"}${t.amount}
              </Text>
            </View>
          </View>
        );
      })}
      <Pager
        page={page}
        numPages={numPages}
        onChange={setPage}
        fetching={fetching}
      />
    </View>
  );
}

// ─── RECURRING PAYMENT ROW ───────────────────────────────────────────────────
function RecurringPaymentRow({ payment, expanded, onToggle, onCancelled }) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError("");
    try {
      await cancelRecurringPayment(payment.recurring_payment_id);
      onCancelled();
    } catch (e) {
      setCancelError(e.message || "Unable to cancel.");
    } finally {
      setCancelling(false);
    }
  };

  const badge = statusBadgeStyles[payment.status] ?? statusBadgeStyles.canceled;

  return (
    <View style={styles.recurringCard}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.75}
        style={styles.recurringHeader}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.recurringTitle}>
            To {payment.payee_account_number} ·{" "}
            {frequencyLabels[payment.frequency] ?? payment.frequency}
          </Text>
          <Text style={styles.mutedText}>
            {payment.status === "active"
              ? `Next: ${payment.next_payment_date}`
              : payment.status === "completed"
                ? `Completed ${payment.completed_at ?? ""}`
                : `Canceled ${payment.canceled_at ?? ""}`}
          </Text>
        </View>
        <View style={styles.recurringHeaderRight}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: badge.backgroundColor },
            ]}
          >
            <Text style={[styles.statusPillText, { color: badge.color }]}>
              {payment.status}
            </Text>
          </View>
          <Text style={styles.amountDebit}>-${payment.amount}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.recurringBody}>
          <DetailRow
            label="Payee Routing #"
            value={payment.payee_routing_number}
          />
          <DetailRow
            label="Payee Account #"
            value={payment.payee_account_number}
          />
          <DetailRow label="Amount" value={`$${payment.amount}`} />
          <DetailRow
            label="Frequency"
            value={frequencyLabels[payment.frequency] ?? payment.frequency}
          />
          <DetailRow label="Created" value={payment.created_at} />

          <Text style={styles.recurringSectionHeader}>Transactions</Text>
          <RecurringTransactions
            recurringPaymentId={payment.recurring_payment_id}
          />

          {payment.status === "active" && (
            <View style={styles.cancelRow}>
              {!!cancelError && (
                <Text style={styles.errorText}>{cancelError}</Text>
              )}
              <TouchableOpacity
                style={[
                  styles.dangerBtn,
                  cancelling && styles.dangerBtnDisabled,
                ]}
                onPress={handleCancel}
                disabled={cancelling}
                activeOpacity={0.75}
              >
                <Text style={styles.dangerBtnText}>
                  {cancelling ? "Canceling..." : "Cancel"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── RECURRING PAYMENTS LIST ─────────────────────────────────────────────────
function RecurringPayments({ accountId }) {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setFetching(true);
      if (data === null) setLoading(true);
      setError("");
      fetchRecurringPayments(accountId, page, limit)
        .then((res) => {
          if (!cancelled) setData(res);
        })
        .catch((e) => {
          if (!cancelled)
            setError(e.message || "Unable to load scheduled transfers.");
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
            setFetching(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }, [accountId, page, reloadKey]),
  );

  const payments = data?.recurring_payments ?? [];
  const numPages = data?.total_pages ?? 1;

  if (loading) {
    return <ActivityIndicator color="#007AFF" style={{ marginTop: 12 }} />;
  }
  if (error) return <Text style={styles.errorText}>{error}</Text>;
  if (payments.length === 0) {
    return <Text style={styles.mutedText}>No scheduled or recurring transfers.</Text>;
  }

  return (
    <View style={{ gap: 12 }}>
      {payments.map((p) => (
        <RecurringPaymentRow
          key={p.recurring_payment_id}
          payment={p}
          expanded={expandedId === p.recurring_payment_id}
          onToggle={() =>
            setExpandedId((curr) =>
              curr === p.recurring_payment_id ? null : p.recurring_payment_id,
            )
          }
          onCancelled={() => setReloadKey((k) => k + 1)}
        />
      ))}
      <Pager
        page={page}
        numPages={numPages}
        onChange={setPage}
        fetching={fetching}
      />
    </View>
  );
}

// ─── HISTORY TABS ────────────────────────────────────────────────────────────
function HistoryTabs({ accountId }) {
  const [showRecurring, setShowRecurring] = useState(false);
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.sectionTitle}>Transaction History</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            styles.toggleBtnLeft,
            !showRecurring && styles.toggleBtnActive,
          ]}
          onPress={() => setShowRecurring(false)}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.toggleText,
              !showRecurring && styles.toggleTextActive,
            ]}
          >
            All Transactions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            styles.toggleBtnRight,
            showRecurring && styles.toggleBtnActive,
          ]}
          onPress={() => setShowRecurring(true)}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.toggleText,
              showRecurring && styles.toggleTextActive,
            ]}
          >
            Scheduled & Recurring
          </Text>
        </TouchableOpacity>
      </View>
      {showRecurring ? (
        <RecurringPayments accountId={accountId} />
      ) : (
        <Transactions accountId={accountId} />
      )}
    </View>
  );
}

// ─── CLOSE ACCOUNT MODAL ─────────────────────────────────────────────────────
function CloseAccountModal({ accountId, onClose, onClosed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      await closeAccount(accountId);
      onClosed();
    } catch (e) {
      setError(e.message || "Unable to close account.");
      setLoading(false);
    }
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Close this account?</Text>
              <Text style={styles.modalDescription}>
                Confirm that you want to close this account. The request will
                fail if the balance is not zero.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Text style={styles.modalClose}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onClose}
                disabled={loading}
                activeOpacity={0.75}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dangerBtn, loading && styles.dangerBtnDisabled]}
                onPress={handleConfirm}
                disabled={loading}
                activeOpacity={0.75}
              >
                <Text style={styles.dangerBtnText}>
                  {loading ? "Closing..." : "Yes, Close Account"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── ACCOUNT DETAIL SCREEN ───────────────────────────────────────────────────
function toTitleCase(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export default function AccountDetailScreen({ navigation, route }) {
  const { accountId } = route.params;
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCloseModal, setShowCloseModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      setError("");
      fetchAccount(accountId)
        .then((data) => {
          if (!cancelled) setAccount(data);
        })
        .catch((e) => {
          if (!cancelled) setError(e.message || "Unable to load account.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [accountId]),
  );

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backLink}
        activeOpacity={0.6}
      >
        <Text style={styles.backLinkText}>‹ Back to Accounts</Text>
      </TouchableOpacity>

      <Text style={styles.pageTitle}>Account {accountId}</Text>

      {loading && (
        <View style={styles.card}>
          <Text style={styles.mutedText}>Loading account...</Text>
        </View>
      )}
      {!!error && !loading && (
        <View style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {account && (
        <View style={styles.card}>
          <View style={styles.accountHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.accountName}>
                {toTitleCase(account.account_type)} Account
              </Text>
              <Text style={styles.mutedText}>
                Account Number: {account.account_number}
              </Text>
              <Text style={styles.mutedText}>
                Routing Number: {account.routing_number}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.dangerBtn}
              onPress={() => setShowCloseModal(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.dangerBtnText}>Close Account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.mutedText}>Available Balance</Text>
              <Text style={styles.statValue}>${account.balance}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.mutedText}>Account Type</Text>
              <Text style={styles.statValue}>
                {toTitleCase(account.account_type)}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={{ height: 24 }} />

      <HistoryTabs accountId={accountId} />

      {showCloseModal && (
        <CloseAccountModal
          accountId={accountId}
          onClose={() => setShowCloseModal(false)}
          onClosed={() => {
            setShowCloseModal(false);
            navigation.goBack();
          }}
        />
      )}
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
    paddingBottom: 40,
  },
  backLink: {
    marginBottom: 8,
  },
  backLinkText: {
    color: "#0f766e",
    fontSize: 14,
    fontWeight: "600",
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 8,
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#F4F7FB",
    borderRadius: 8,
    padding: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },

  // toggle (matches TransferScreen)
  toggleRow: {
    flexDirection: "row",
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
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7A99",
  },
  toggleTextActive: {
    color: "#007AFF",
  },

  // transactions
  txnRow: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  txnType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  txnDate: {
    fontSize: 12,
    color: "#6B7A99",
    textAlign: "right",
  },
  amountCredit: {
    color: "#15803D",
  },
  amountDebit: {
    color: "#B91C1C",
    fontWeight: "600",
  },
  amountFailed: {
    color: "#6B7A99",
    textDecorationLine: "line-through",
  },
  txnHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  failedPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
  },
  failedPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#991B1B",
    textTransform: "uppercase",
  },
  recurringTxnRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // recurring
  recurringCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  recurringHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  recurringHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recurringTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  recurringBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 8,
  },
  recurringSectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 6,
  },
  recurringTxnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F4F7FB",
    borderRadius: 6,
    padding: 10,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  cancelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
    flexWrap: "wrap",
  },

  // pager
  pagerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  pagerBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "white",
  },
  pagerBtnDisabled: {
    opacity: 0.5,
  },
  pagerBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
  },
  pagerLabel: {
    fontSize: 12,
    color: "#6B7A99",
  },

  // detail
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: "#6B7A99",
    flexShrink: 0,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    flexShrink: 1,
    textAlign: "right",
  },
  detailValueFailed: {
    color: "#B91C1C",
    textTransform: "capitalize",
  },
  detailStack: {
    flexDirection: "column",
    gap: 4,
  },
  detailStackValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 4,
  },
  checkImage: {
    width: "100%",
    height: 200,
    marginTop: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  // modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalSheet: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "90%",
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 18,
    paddingBottom: 6,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalDescription: {
    fontSize: 13,
    color: "#6B7A99",
    marginTop: 4,
  },
  modalClose: {
    fontSize: 24,
    color: "#6B7A99",
    paddingHorizontal: 4,
  },
  modalBody: {
    padding: 18,
    gap: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },

  // buttons
  dangerBtn: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  dangerBtnDisabled: {
    opacity: 0.7,
  },
  dangerBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
  },
  secondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "white",
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#1F2937",
    fontWeight: "700",
    fontSize: 13,
  },

  // text helpers
  mutedText: {
    fontSize: 13,
    color: "#6B7A99",
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
  },
});
