import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location"; // Import Expo Location for GPS functionality

const ExpenseForm = () => {
  const [userId, setUserId] = useState(""); // Dynamically fetched user ID
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseType, setExpenseType] = useState(null);
  const [totalAmount, setTotalAmount] = useState("");
  const [submittedTo, setSubmittedTo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [responseMessage, setResponseMessage] = useState(""); // For success/error messages
  const [isSubmitted, setIsSubmitted] = useState(false); // To track submission status

  useEffect(() => {
    // Fetch user ID from AsyncStorage
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userid");
        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          console.error("User ID not found in AsyncStorage");
        }
      } catch (error) {
        console.error("Failed to fetch user ID from AsyncStorage:", error);
      }
    };

    // Fetch GPS location
    const fetchLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location permission is required.");
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setLatitude(location.coords.latitude.toString());
        setLongitude(location.coords.longitude.toString());
      } catch (error) {
        console.error("Failed to fetch location:", error);
      }
    };

    fetchUserId();
    fetchLocation();
  }, []);

  const handleSubmit = async () => {
    if (!expenseTitle || !expenseType || !totalAmount || !submittedTo) {
      setResponseMessage("Error: Please fill in all required fields.");
      setIsSubmitted(true);
      return;
    }

    const expenseData = {
      expense_track_title: expenseTitle,
      expense_type_id: expenseType,
      expense_total_amount: totalAmount,
      expense_track_submitted_to: submittedTo,
      expense_track_created_by: userId,
      expense_track_create_lat: latitude,
      expense_track_create_long: longitude,
      expense_track_app_rej_remarks: remarks,
    };

    try {
      const response = await fetch("http://localhost/add_expense.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        setResponseMessage(result.message);
        setIsSubmitted(true);

        // Reset all fields to refresh the form
        setExpenseTitle("");
        setExpenseType(null);
        setTotalAmount("");
        setSubmittedTo("");
        setRemarks("");
        setLatitude("");
        setLongitude("");
      } else {
        setResponseMessage(result.message || "Failed to submit expense");
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error("Error:", error);
      setResponseMessage("Error: Network error. Please try again.");
      setIsSubmitted(true);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>New Expense</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Expense Title *</Text>
          <TextInput
            style={styles.input}
            value={expenseTitle}
            onChangeText={setExpenseTitle}
            placeholder="Enter Expense Title"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Expense Type *</Text>
          <Dropdown
            data={[
              { label: "Transport", value: 1 },
              { label: "Food", value: 2 },
              { label: "Accommodation", value: 3 },
            ]}
            labelField="label"
            valueField="value"
            value={expenseType}
            onChange={(item) => setExpenseType(item.value)}
            style={styles.dropdown}
            placeholder="Select Expense Type"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Total Amount *</Text>
          <TextInput
            style={styles.input}
            value={totalAmount}
            onChangeText={setTotalAmount}
            placeholder="Enter Total Amount"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Submitted To *</Text>
          <TextInput
            style={styles.input}
            value={submittedTo}
            onChangeText={setSubmittedTo}
            placeholder="Enter Submitted To"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Remarks</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Enter Remarks"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            style={styles.input}
            value={latitude}
            editable={false} // Make it read-only
            placeholder="Latitude will be fetched automatically"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput
            style={styles.input}
            value={longitude}
            editable={false} // Make it read-only
            placeholder="Longitude will be fetched automatically"
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Expense</Text>
        </TouchableOpacity>

        {isSubmitted && (
          <Text style={styles.responseMessage}>{responseMessage}</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#333",
    textAlign: "center", // Center the title
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#666",
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  responseMessage: {
    marginTop: 20,
    fontSize: 16,
    textAlign: "center",
    color: "#333",
  },
});

export default ExpenseForm;