import { SafeAreaView, Text, View, StyleSheet, ScrollView } from "react-native";

const bids = [
  { id: 1, job: "Fix Kitchen Sink", price: "LKR 4,500", status: "Pending" },
  { id: 2, job: "Paint Bedroom Wall", price: "LKR 7,500", status: "Accepted" },
  { id: 3, job: "Repair Ceiling Fan", price: "LKR 3,000", status: "Rejected" },
];

const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return { color: "orange" };
      case "Accepted":
        return { color: "green" };
      case "Rejected":
        return { color: "red" };
      default:
        return { color: "#000" };
    }
  };
  

export default function MyBidsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.list}>
        {bids.map((bid) => (
          <View key={bid.id} style={styles.card}>
            <Text style={styles.title}>{bid.job}</Text>
            <Text style={styles.text}>Bid Price: {bid.price}</Text>
            <Text style={[styles.status, getStatusStyle(bid.status)]}>
              Status: {bid.status}
            </Text>
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
  status: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
  },
});