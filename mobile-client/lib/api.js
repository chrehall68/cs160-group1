import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:8000";

const UPPERCASE_WORDS = new Set(["ssn", "id", "dob", "zip"]);

function humanizeFieldSegment(segment) {
  if (UPPERCASE_WORDS.has(segment.toLowerCase())) {
    return segment.toUpperCase();
  }
  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
}

function formatValidationLocation(loc) {
  if (!Array.isArray(loc)) {
    return null;
  }
  // drop the leading "body"/"query"/"path" segment that FastAPI prepends
  const parts = loc
    .slice(1)
    .filter((p) => typeof p === "string" || typeof p === "number")
    .flatMap((p) => String(p).split("_"))
    .map(humanizeFieldSegment);
  return parts.length > 0 ? parts.join(" ") : null;
}

function cleanValidationMessage(msg) {
  // Pydantic prefixes custom-validator messages with "Value error, "
  return msg.replace(/^Value error,\s*/i, "");
}

function getMessageFromData(data, fallback) {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

  // FastAPI validation errors: detail is an array of { loc, msg, type }
  if (Array.isArray(data.detail) && data.detail.length > 0) {
    const messages = data.detail
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const msg =
          typeof item.msg === "string" ? cleanValidationMessage(item.msg) : null;
        if (!msg) return null;
        const field = formatValidationLocation(item.loc);
        return field ? `${field}: ${msg}` : msg;
      })
      .filter((m) => m !== null);
    if (messages.length > 0) {
      return messages.join("\n");
    }
  }

  if (typeof data.reason === "string") {
    return data.reason;
  }

  if (typeof data.message === "string") {
    return data.message;
  }

  return fallback;
}

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
    throw new Error(
      getMessageFromData(data, `Request failed with status ${response.status}.`)
    );
  }

  return data;
}
