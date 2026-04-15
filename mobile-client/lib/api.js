import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:8000";
export async function apiRequest(urlSuffix, options = {}) {
  const token = (await AsyncStorage.getItem("auth.jwt")) ?? "";
  const response = await fetch(`${BASE_URL}${urlSuffix}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(data?.detail || "Request failed");
  }

  return data;
}
