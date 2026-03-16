import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PageLayout from "../components/PageLayout";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:8000";

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) / 1609.344;
}

export default function ATMScreen() {
  const [address, setAddress] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    setSearched(false);

    try {
      // 1. Geocode address
      const geoRes = await fetch(
        `${BACKEND_URL}/atm/geocode?address=${encodeURIComponent(address)}`
      );
      const geoData = await geoRes.json();
      if (!geoData.results?.length)
        throw new Error("Location not found. Try a full address, city, or zip code.");
      const { lat, lng } = geoData.results[0].geometry.location;

      // 2. Nearby Chase ATMs
      const placesRes = await fetch(
        `${BACKEND_URL}/atm/nearby?lat=${lat}&lng=${lng}`
      );
      const placesData = await placesRes.json();

      const atms = (placesData.results || [])
        .filter(
          (p) =>
            p.name.toLowerCase().includes("chase") ||
            p.international_phone_number === "+1 800-935-9935"
        )
        .map((p) => ({
          address: p.vicinity,
          distance: haversine(lat, lng, p.geometry.location.lat, p.geometry.location.lng).toFixed(1),
          open: p.opening_hours?.open_now ?? null,
          lat: p.geometry.location.lat,
          lng: p.geometry.location.lng,
        }))
        .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
        .filter((atm, index, self) =>
          index === self.findIndex((a) => a.address === atm.address)
        );

      setResults(atms);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openMaps = (atmAddress) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(atmAddress)}`;
    Linking.openURL(url);
  };

  return (
    <PageLayout title="Find Nearby ATM">
      <View style={styles.card}>
        <TextInput
          placeholder="Enter address, city, or zip code"
          value={address}
          onChangeText={setAddress}
          style={styles.input}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}

      {searched && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.resultsHeader}>
            {results.length > 0
              ? `${results.length} Chase ATM${results.length !== 1 ? "s" : ""} found near "${address}"`
              : `No Chase ATMs found near "${address}". Try a nearby city.`}
          </Text>
          {results.map((atm, i) => (
            <View key={i} style={styles.result}>
              <View style={styles.resultLeft}>
                <Text style={styles.resultAddress}>{atm.address}</Text>
                <View style={styles.resultMeta}>
                  <Text style={styles.distance}>{atm.distance} mi away</Text>
                  {atm.open === true && (
                    <Text style={styles.open}>Open now</Text>
                  )}
                  {atm.open === false && (
                    <Text style={styles.closed}>Closed</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => openMaps(atm.address)}>
                <Text style={styles.mapsLink}>Maps ↗</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 6,
    fontSize: 14,
  },
  button: {
    backgroundColor: "#0f766e",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
  error: {
    color: "#dc2626",
    marginTop: 12,
    fontSize: 13,
  },
  resultsHeader: {
    fontWeight: "bold",
    marginBottom: 10,
    fontSize: 14,
  },
  result: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  resultLeft: {
    flex: 1,
    marginRight: 8,
  },
  resultAddress: {
    fontSize: 13,
    marginBottom: 4,
  },
  resultMeta: {
    flexDirection: "row",
    gap: 8,
  },
  distance: {
    fontSize: 12,
    color: "#2563eb",
  },
  open: {
    fontSize: 12,
    color: "#16a34a",
  },
  closed: {
    fontSize: 12,
    color: "#dc2626",
  },
  mapsLink: {
    fontSize: 12,
    color: "#2563eb",
    marginTop: 2,
  },
});