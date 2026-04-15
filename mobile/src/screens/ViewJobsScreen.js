import { SafeAreaView, Text, View, StyleSheet, ScrollView } from "react-native";

const jobs = [
  { id: 1, title: "Fix Kitchen Sink", budget: "LKR 5,000", distance: "2.1 km" },
  { id: 2, title: "Paint Bedroom Wall", budget: "LKR 8,000", distance: "4.3 km" },
  { id: 3, title: "Repair Ceiling Fan", budget: "LKR 3,500", distance: "1.5 km" },
];

export default function ViewJobsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.list}>
        {jobs.map((job) => (
          <View key={job.id} style={styles.card}>
            <Text style={styles.title}>{job.title}</Text>
            <Text style={styles.text}>Budget: {job.budget}</Text>
            <Text style={styles.text}>Distance: {job.distance}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  list: {
    gap: 15,
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: "#555",
  },
});