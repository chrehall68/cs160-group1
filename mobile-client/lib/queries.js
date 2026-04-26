import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "./api";

export async function login(username, password) {
  const data = await apiRequest("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (data.role === "admin") {
    const err = new Error("Admin accounts must sign in on the web client.");
    err.code = "ADMIN_NOT_ALLOWED";
    throw err;
  }
  if (data.access_token) {
    await AsyncStorage.setItem("auth.jwt", data.access_token);
  }
  return data;
}

export async function logout() {
  await AsyncStorage.removeItem("auth.jwt");
}

export async function signup(body) {
  const data = apiRequest("/user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (data.access_token) {
    await AsyncStorage.setItem("auth.jwt", data.access_token);
  }
  return data;
}

export async function fetchAccounts() {
  const data = await apiRequest("/accounts");
  return Array.isArray(data) ? data : (data.accounts ?? []);
}

export async function fetchAccount(accountId) {
  return apiRequest(`/accounts/${accountId}`);
}

export async function fetchTransactions(accountId, page = 1, limit = 10) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return apiRequest(`/transactions/${accountId}?${params.toString()}`);
}

export async function fetchTransactionDetail(accountId, transactionId) {
  return apiRequest(`/transactions/${accountId}/${transactionId}`);
}

export async function fetchRecurringPayments(accountId, page = 1, limit = 10) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return apiRequest(`/recurring/${accountId}?${params.toString()}`);
}

export async function fetchRecurringPaymentTransactions(
  recurringPaymentId,
  page = 1,
  limit = 5,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return apiRequest(
    `/recurring/${recurringPaymentId}/transactions?${params.toString()}`,
  );
}

export async function cancelRecurringPayment(recurringPaymentId) {
  return apiRequest(`/recurring/${recurringPaymentId}/cancel`, {
    method: "POST",
  });
}

export async function closeAccount(accountId) {
  return apiRequest(`/accounts/${accountId}`, { method: "DELETE" });
}
