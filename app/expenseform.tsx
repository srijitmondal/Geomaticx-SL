import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { Calendar, DollarSign, FileText, MapPin, User, Trash2 } from 'lucide-react-native';
import { Alert } from 'react-native';

const ExpenseForm = () => {
  // Mock user data - replace with actual API call
  const mockUserData = {
    userId: "GSTS-321",
    userType: "Jr. GIS Surveyor",
    firstName: "John",
    middleName: "",
    lastName: "Doe",
    location: "22.486425, 88.3746501"
  };

  // Mock submitted to reference data with corresponding names
  const mockSubmittedToData = {
    manager: {
      role: "Manager",
      people: [
        { label: "Michael Scott", value: "michael_scott" },
        { label: "David Wallace", value: "david_wallace" }
      ]
    },
    supervisor: {
      role: "Supervisor",
      people: [
        { label: "Jim Halpert", value: "jim_halpert" },
        { label: "Toby Flenderson", value: "toby_flenderson" }
      ]
    },
    teamlead: {
      role: "Team Lead",
      people: [
        { label: "Dwight Schrute", value: "dwight_schrute" },
        { label: "Andy Bernard", value: "andy_bernard" }
      ]
    }
  };

  const [userData, setUserData] = useState(mockUserData);
  const [firstName, setFirstName] = useState(userData.firstName);
  const [middleName, setMiddleName] = useState(userData.middleName);
  const [lastName, setLastName] = useState(userData.lastName);
  const [date, setDate] = useState("");
  const [expenseHead, setExpenseHead] = useState(null);
  const [expenseBillTitle, setExpenseBillTitle] = useState("");
  const [expenseType, setExpenseType] = useState(null);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [remark, setRemark] = useState("");
  const [billDate, setBillDate] = useState("");
  const [amount, setAmount] = useState("");
  const [submittedTo, setSubmittedTo] = useState(null);
  const [name, setName] = useState(null);
  const [nameOptions, setNameOptions] = useState<{ label: string; value: string }[]>([]);
  const [expenseEntries, setExpenseEntries] = useState([1]);

  // Effect to fetch user data
  useEffect(() => {
    // Replace with actual API call
    const fetchUserData = async () => {
      try {
        // const response = await fetch('your-api-endpoint');
        // const data = await response.json();
        setUserData(mockUserData);
        setFirstName(mockUserData.firstName);
        setMiddleName(mockUserData.middleName);
        setLastName(mockUserData.lastName);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  // Effect to update name options based on submittedTo selection
  useEffect(() => {
    if (submittedTo && mockSubmittedToData[submittedTo]) {
      setNameOptions((mockSubmittedToData[submittedTo] as { people: { label: string; value: string }[] }).people);
      setName(null); // Reset name when submittedTo changes
    } else {
      setNameOptions([]);
      setName(null);
    }
  }, [submittedTo]);

  const handleAddMore = () => {
    setExpenseEntries([...expenseEntries, expenseEntries.length + 1]);
  };

  const handleDeleteEntry = (indexToDelete: number) => {
    if (expenseEntries.length > 1) {
      setExpenseEntries(expenseEntries.filter((_, index) => index !== indexToDelete));
    }
  };

  const handleSubmit = async () => {
    if (!expenseBillTitle || !expenseType || !amount || !submittedTo || !name) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    const expenseData = {
      title: expenseBillTitle,
      type: expenseType,
      amount: amount,
      location: userData.location,
      createdBy: `${firstName} ${middleName || ''} ${lastName}`.trim(),
      dateSubmitted: billDate || new Date().toISOString().split('T')[0],
      submittedTo,
      submittedToName: nameOptions.find(option => option.value === name)?.label
    };

    console.log("Submitting data:", expenseData);

    try {
      const response = await fetch('http://localhost/server/server.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      const result = await response.json();
      if (response.ok) {
        Alert.alert("Success", result.message);
      } else {
        Alert.alert("Error", result.error || "Failed to submit expense");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  const renderExpenseEntry = (index: number) => (
    <View key={index} style={styles.formSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <DollarSign size={20} color="#374151" />
          <Text style={styles.sectionTitle}>Expense Details {index > 0 ? `#${index + 1}` : ''}</Text>
        </View>
        {expenseEntries.length > 1 && (
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={() => handleDeleteEntry(index)}
          >
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Expense Head *</Text>
        <Dropdown
          data={[
            { label: "Transport", value: "transport" }, 
            { label: "Food", value: "food" }
          ]}
          labelField="label"
          valueField="value"
          value={expenseHead}
          onChange={(item) => setExpenseHead(item.value)}
          style={styles.dropdown}
          placeholderStyle={styles.dropdownPlaceholder}
          selectedTextStyle={styles.dropdownSelected}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Expense Bill Title *</Text>
        <TextInput 
          style={styles.input} 
          value={expenseBillTitle} 
          onChangeText={setExpenseBillTitle} 
          placeholder="Enter Expense Bill Title" 
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Expense Type *</Text>
        <Dropdown
          data={[
            { label: "Personal", value: "personal" }, 
            { label: "Company", value: "company" }
          ]}
          labelField="label"
          valueField="value"
          value={expenseType}
          onChange={(item) => setExpenseType(item.value)}
          style={styles.dropdown}
          placeholderStyle={styles.dropdownPlaceholder}
          selectedTextStyle={styles.dropdownSelected}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Expense Description</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          value={expenseDesc} 
          onChangeText={setExpenseDesc} 
          placeholder="Enter Expense Description"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Remark</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          value={remark} 
          onChangeText={setRemark} 
          placeholder="Enter Remark"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Bill Date *</Text>
        <TextInput 
          style={styles.input} 
          value={billDate} 
          onChangeText={setBillDate} 
          placeholder="YYYY-MM-DD" 
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Amount *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeBanner}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeText}>Add New</Text>
          <Text style={styles.nameText}>Expense Entry</Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <User size={20} color="#374151" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput 
              style={[styles.input, styles.disabledInput]} 
              value={firstName} 
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Middle Name</Text>
            <TextInput 
              style={[styles.input, styles.disabledInput]} 
              value={middleName} 
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput 
              style={[styles.input, styles.disabledInput]} 
              value={lastName} 
              editable={false}
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color="#374151" />
            <Text style={styles.sectionTitle}>Location Details</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>User ID</Text>
            <TextInput 
              style={[styles.input, styles.disabledInput]} 
              value={userData.userId} 
              editable={false} 
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>User Type</Text>
            <TextInput 
              style={[styles.input, styles.disabledInput]} 
              value={userData.userType} 
              editable={false} 
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput 
              style={[styles.input, styles.disabledInput]} 
              value={userData.location} 
              editable={false} 
            />
          </View>
        </View>

        {expenseEntries.map((_, index) => renderExpenseEntry(index))}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.addMoreButton} onPress={handleAddMore}>
            <Text style={styles.addMoreButtonText}>Add More</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Submitted To *</Text>
          <Dropdown
            data={Object.entries(mockSubmittedToData).map(([key, value]) => ({
              label: value.role,
              value: key
            }))}
            labelField="label"
            valueField="value"
            value={submittedTo}
            onChange={(item) => setSubmittedTo(item.value)}
            style={styles.dropdown}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelected}
            placeholder="Select Role"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name *</Text>
          <Dropdown
            data={nameOptions}
            labelField="label"
            valueField="value"
            value={name}
            onChange={(item) => setName(item.value)}
            style={styles.dropdown}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelected}
            placeholder="Select Name"
            disable={!submittedTo}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Save Expense</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  welcomeBanner: {
    backgroundColor: "#ffffff",
    margin: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: "#6b7280",
  },
  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 4,
  },
  formCard: {
    backgroundColor: "#ffffff",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    justifyContent: "space-between",
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  deleteButton: {
    padding: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  disabledInput: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
  },
  dropdownPlaceholder: {
    color: "#9ca3af",
  },
  dropdownSelected: {
    color: "#111827",
  },
  buttonContainer: {
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: "#6366f1",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  addMoreButton: {
    backgroundColor: "#4f46e5",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addMoreButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default ExpenseForm;