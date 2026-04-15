import { SafeAreaView, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useState } from "react";

export default function PlaceBidScreen() {
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");

  const handleSubmit = () => {
    Alert.alert("Success", "Bid submitted successfully");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>Bid Price</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your price"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Proposal Message</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Write your proposal"
          value={message}
          onChangeText={setMessage}
          multiline
        />

        <Text style={styles.label}>Estimated Completion Time</Text>
        <TextInput
          style={styles.input}
          placeholder="E.g. 2 days"
          value={estimatedTime}
          onChangeText={setEstimatedTime}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit Bid</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});