import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Calendar, Upload, CircleAlert as AlertCircle } from 'lucide-react-native';
import { Calendar as RNCalendar, LocaleConfig } from 'react-native-calendars';

// Configure locale (optional)
LocaleConfig.locales['en'] = {
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
  ],
  monthNamesShort: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};
LocaleConfig.defaultLocale = 'en';

const leaveTypes = [
  'Casual Leave',
  'Sick Leave',
  'Vacation',
  'Personal Leave',
  'Half Day',
];

type LeaveData = {
  type: string;
  fromDate: string;
  toDate: string;
  reason: string;
  days: number;
};

type ApplyLeaveProps = {
  onSubmit: (leave: LeaveData) => void;
};

export default function ApplyLeave({ onSubmit }: ApplyLeaveProps) {
  const [selectedType, setSelectedType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [showCalendar, setShowCalendar] = useState<'from' | 'to' | null>(null);

  const handleSubmit = () => {
    if (!selectedType || !fromDate || !toDate || !reason) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Calculate the number of days
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const timeDiff = end.getTime() - start.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // Include both start and end dates

    // Prepare leave data
    const leaveData: LeaveData = {
      type: selectedType,
      fromDate,
      toDate,
      reason,
      days,
    };

    // Call the onSubmit prop to pass data to the parent component
    onSubmit(leaveData);

    // Reset the form
    resetForm();
  };

  const resetForm = () => {
    setSelectedType('');
    setFromDate('');
    setToDate('');
    setReason('');
    setAttachmentName('');
  };

  const handleDateSelect = (date: string) => {
    if (showCalendar === 'from') {
      setFromDate(date);
    } else if (showCalendar === 'to') {
      setToDate(date);
    }
    setShowCalendar(null); // Close the calendar
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Leave Type</Text>

        {/* <View style={styles.balanceWarning}>
          <AlertCircle size={20} color="#f59e0b" />
          <Text style={styles.balanceText}>
            You have 5 casual leaves remaining
          </Text>
        </View> */}

        <View style={styles.formGroup}>
          
          <View style={styles.typeContainer}>
            {leaveTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  selectedType === type && styles.selectedType,
                ]}
                onPress={() => setSelectedType(type)}>
                <Text
                  style={[
                    styles.typeText,
                    selectedType === type && styles.selectedTypeText,
                  ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.dateContainer}>
          <View style={styles.dateInput}>
            <Text style={styles.label}>From Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowCalendar('from')}>
              <Calendar size={20} color="#64748b" />
              <Text style={styles.dateText}>
                {fromDate || 'Select date'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateInput}>
            <Text style={styles.label}>To Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowCalendar('to')}>
              <Calendar size={20} color="#64748b" />
              <Text style={styles.dateText}>
                {toDate || 'Select date'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Reason</Text>
          <TextInput
            style={styles.reasonInput}
            multiline
            numberOfLines={4}
            placeholder="Enter your reason for leave"
            value={reason}
            onChangeText={setReason}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Attachment (Optional)</Text>
          <TouchableOpacity style={styles.uploadButton}>
            <Upload size={20} color="#6366f1" />
            <Text style={styles.uploadText}>
              {attachmentName || 'Upload Document'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit Request</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Modal */}
      <Modal
        transparent={true}
        visible={!!showCalendar}
        onRequestClose={() => setShowCalendar(null)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <RNCalendar
              onDayPress={(day: { dateString: string }) => handleDateSelect(day.dateString)}
              markedDates={{
                [fromDate]: { selected: true, selectedColor: '#6366f1' },
                [toDate]: { selected: true, selectedColor: '#6366f1' },
              }}
              theme={{
                calendarBackground: 'white',
                selectedDayBackgroundColor: '#6366f1',
                selectedDayTextColor: 'white',
                todayTextColor: '#6366f1',
                arrowColor: '#6366f1',
              }}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCalendar(null)}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  formContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 24,
  },
  balanceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  balanceText: {
    marginLeft: 8,
    color: '#92400e',
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  selectedType: {
    backgroundColor: '#6366f1',
  },
  typeText: {
    color: '#64748b',
    fontSize: 14,
  },
  selectedTypeText: {
    color: 'white',
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  dateInput: {
    flex: 1,
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
    flex: 1,
    color: '#1e293b',
  },
  reasonInput: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 100,
    textAlignVertical: 'top',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  uploadText: {
    marginLeft: 8,
    color: '#6366f1',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '90%',
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});