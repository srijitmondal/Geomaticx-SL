import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { Calendar, ChevronDown } from 'lucide-react-native';
import { Calendar as RNCalendar, LocaleConfig } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNPickerSelect from 'react-native-picker-select';

LocaleConfig.locales['en'] = {
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
  ],
  monthNamesShort: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};
LocaleConfig.defaultLocale = 'en';

const leaveGroundOptions = [
  { label: 'Half-day Leave', value: 'Half-day Leave' },
  { label: 'Casual Leave (CL)', value: 'Casual Leave (CL)' },
  { label: 'Medical Leave', value: 'Medical Leave' },
];

export default function ApplyLeave() {
  const [userId, setUserId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [leaveGround, setLeaveGround] = useState('');
  const [leaveTitle, setLeaveTitle] = useState('');
  const [leaveDescription, setLeaveDescription] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [submittedTo, setSubmittedTo] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCalendar, setShowCalendar] = useState<'from' | 'to' | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userid');
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error('Failed to fetch user ID from AsyncStorage:', error);
      }
    };

    fetchUserId();
  }, []);

  const handleSubmit = async () => {
    if (!leaveTitle || !leaveGround || !fromDate || !toDate || !leaveDescription || !submittedTo) {
      setResponseMessage('Error: Please fill in all required fields');
      setIsSubmitted(true);
      setIsSuccess(false);
      return;
    }

    const leaveData = {
      leave_title: leaveTitle,
      leave_ground: leaveGround,
      leave_from_date: fromDate,
      leave_to_date: toDate,
      leave_comment: leaveDescription,
      leave_track_submitted_to: submittedTo,
      leave_track_created_by: userId,
    };

    try {
      const response = await fetch('http://localhost/add_leaves.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leaveData),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        setResponseMessage(result.message);
        setFirstName(result.user.first_name);
        setMiddleName(result.user.middle_name);
        setLastName(result.user.last_name);
        setIsSubmitted(true);
        setIsSuccess(true);
      } else {
        setResponseMessage(result.message || 'Failed to submit leave request');
        setIsSubmitted(true);
        setIsSuccess(false);
      }
    } catch (error) {
      setResponseMessage('Error: Network error. Please try again.');
      setIsSubmitted(true);
      setIsSuccess(false);
    }
  };

  const handleDateSelect = (date: string) => {
    if (showCalendar === 'from') {
      setFromDate(date);
    } else if (showCalendar === 'to') {
      setToDate(date);
    }
    setShowCalendar(null);
  };

  const handleBackToForm = () => {
    setIsSubmitted(false);
    setResponseMessage('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      {isSubmitted ? (
        <View style={styles.resultContainer}>
          <Text
            style={[
              styles.responseMessage,
              isSuccess ? styles.successMessage : styles.errorMessage,
            ]}
          >
            {responseMessage}
          </Text>
          {isSuccess && (
            <View style={styles.userDetails}>
              <Text style={styles.userDetailText}>First Name: {firstName}</Text>
              <Text style={styles.userDetailText}>Middle Name: {middleName || 'N/A'}</Text>
              <Text style={styles.userDetailText}>Last Name: {lastName}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.backButton} onPress={handleBackToForm}>
            <Text style={styles.backButtonText}>Back to Form</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.formContainer}>
          <Text style={styles.title}>Apply for Leave</Text>

          {/* User Info Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>User ID</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter User ID"
                value={userId}
                onChangeText={setUserId}
                editable={false}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Middle Name</Text>
                <TextInput
                  style={styles.input}
                  value={middleName}
                  onChangeText={setMiddleName}
                  placeholder="Middle name"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                />
              </View>
            </View>
          </View>

          {/* Leave Details Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Leave Details</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Leave Ground *</Text>
              <View style={styles.pickerContainer}>
                <RNPickerSelect
                  onValueChange={(value) => setLeaveGround(value)}
                  items={leaveGroundOptions}
                  value={leaveGround}
                  placeholder={{ label: 'Select Leave Ground', value: null }}
                  style={pickerSelectStyles}
                  Icon={() => <ChevronDown size={20} color="#64748b" style={styles.dropdownIcon} />}
                  useNativeAndroidPickerStyle={false}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Leave Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Leave Title"
                value={leaveTitle}
                onChangeText={setLeaveTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Leave Description *</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="Enter Leave Description"
                value={leaveDescription}
                onChangeText={setLeaveDescription}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>From Date *</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowCalendar('from')}
                >
                  <Calendar size={20} color="#64748b" />
                  <Text style={[styles.dateText, !fromDate && styles.placeholderText]}>
                    {fromDate || 'Select date'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>To Date *</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowCalendar('to')}
                >
                  <Calendar size={20} color="#64748b" />
                  <Text style={[styles.dateText, !toDate && styles.placeholderText]}>
                    {toDate || 'Select date'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Document Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Document name (optional)"
                value={documentName}
                onChangeText={setDocumentName}
              />
            </View>
          </View>

          {/* Submission Details */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Submission Details</Text>
            
            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Submitted To *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Select Category"
                  value={submittedTo}
                  onChangeText={setSubmittedTo}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>Request Leave</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Calendar Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!showCalendar}
        onRequestClose={() => setShowCalendar(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.calendarContainer}>
              <RNCalendar
                onDayPress={(day: { dateString: string }) => handleDateSelect(day.dateString)}
                markedDates={{
                  [fromDate]: { selected: showCalendar === 'from', selectedColor: '#6366f1' },
                  [toDate]: { selected: showCalendar === 'to', selectedColor: '#6366f1' },
                }}
                theme={{
                  calendarBackground: '#ffffff',
                  textSectionTitleColor: '#64748b',
                  selectedDayBackgroundColor: '#6366f1',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#6366f1',
                  dayTextColor: '#1e293b',
                  textDisabledColor: '#d1d5db',
                  dotColor: '#6366f1',
                  selectedDotColor: '#ffffff',
                  arrowColor: '#6366f1',
                  monthTextColor: '#1e293b',
                  indicatorColor: '#6366f1',
                  textDayFontWeight: '400',
                  textMonthFontWeight: '600',
                  textDayHeaderFontWeight: '600',
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14,
                }}
              />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCalendar(null)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    color: '#1e293b',
    paddingRight: 30,
    backgroundColor: 'white',
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    color: '#1e293b',
    paddingRight: 30,
    backgroundColor: 'white',
  },
  iconContainer: {
    top: Platform.OS === 'ios' ? 14 : 12,
    right: 12,
  },
  placeholder: {
    color: '#94a3b8',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  formContainer: {
    padding: 20,
  },
  sectionContainer: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#1e293b',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  dropdownIcon: {
    marginRight: 10,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateText: {
    marginLeft: 8,
    color: '#1e293b',
    fontSize: 16,
  },
  placeholderText: {
    color: '#94a3b8',
  },
  submitButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  responseMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  successMessage: {
    color: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  errorMessage: {
    color: '#ef4444',
    backgroundColor: '#fee2e2',
  },
  userDetails: {
    marginTop: 8,
    width: '100%',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  userDetailText: {
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calendarContainer: {
    padding: 16,
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    marginTop: 24,
    backgroundColor: '#6366f1',
    padding: 14,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});