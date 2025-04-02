import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

export default function AddRequisitionScreen() {
  const [userId, setUserId] = useState(''); // Dynamically fetched user ID
  const [requisitionTitle, setRequisitionTitle] = useState('');
  const [requisitionDesc, setRequisitionDesc] = useState('');
  const [requisitionAmount, setRequisitionAmount] = useState('');
  const [submittedTo, setSubmittedTo] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Fetch user ID from AsyncStorage
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userid'); // Fetch userId from AsyncStorage
        if (storedUserId) {
          setUserId(storedUserId); // Set the userId state
        } else {
          console.error('User ID not found in AsyncStorage');
        }
      } catch (error) {
        console.error('Failed to fetch user ID from AsyncStorage:', error);
      }
    };

    fetchUserId();
  }, []);

  const handleSubmit = async () => {
    if (!requisitionTitle || !requisitionDesc || !requisitionAmount || !submittedTo) {
      setResponseMessage('Error: Please fill in all required fields');
      setIsSubmitted(true);
      return;
    }

    const requisitionData = {
      requisition_title: requisitionTitle,
      requisition_desc: requisitionDesc,
      requisition_req_amount: requisitionAmount,
      requisition_submitted_to: submittedTo,
      requisition_created_by: userId, // Use the dynamically fetched userId
    };

    try {
      const response = await fetch('http://localhost/add_requisition.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requisitionData),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        setResponseMessage(result.message);
        setIsSubmitted(true);
      } else {
        setResponseMessage(result.message || 'Failed to submit requisition');
        setIsSubmitted(true);
      }
    } catch (error) {
      setResponseMessage('Error: Network error. Please try again.');
      setIsSubmitted(true);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>New Requisition</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Requisition Title *</Text>
          <TextInput
            style={styles.input}
            value={requisitionTitle}
            onChangeText={setRequisitionTitle}
            placeholder="Enter Requisition Title"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Requisition Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={requisitionDesc}
            onChangeText={setRequisitionDesc}
            placeholder="Enter Requisition Description"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Requisition Amount *</Text>
          <TextInput
            style={styles.input}
            value={requisitionAmount}
            onChangeText={setRequisitionAmount}
            placeholder="Enter Amount"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Submitted To *</Text>
          <TextInput
            style={styles.input}
            value={submittedTo}
            onChangeText={setSubmittedTo}
            placeholder="Enter Recipient"
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Requisition</Text>
        </TouchableOpacity>

        {isSubmitted && (
          <Text style={styles.responseMessage}>{responseMessage}</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  form: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center', // Center the title
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  responseMessage: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
});