import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function PageLayout({ title, subtitle, children }) {
  return (
    <ScrollView style={styles.page}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>

        {subtitle && (
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        )}

        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#e8f1ef",
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#556",
    marginBottom: 20,
  },
});