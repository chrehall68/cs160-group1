import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "./api";

export async function login(username, password) {
  const data = await apiRequest("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (data.access_token) {
    await AsyncStorage.setItem("auth.jwt", data.access_token);
  }
  return data;
}

export async function logout() {
  await AsyncStorage.removeItem("auth.jwt");
}

export async function signup(body) {
  return apiRequest("/user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function fetchAccounts() {
  const data = await apiRequest("/accounts");
  return Array.isArray(data) ? data : (data.accounts ?? []);
}

export async function fetchTransactions(accountId) {
  return apiRequest(`/transactions/${accountId}?page=1&limit=5`);
}
