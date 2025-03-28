import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { Calendar, Clock, FileText, CircleCheck as CheckCircle2, Circle as XCircle, CircleAlert as AlertCircle, X } from 'lucide-react-native';
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

type LeaveType = {
  title: string;
  balance: number;
  used: number;
  icon: React.ReactNode;
  color: string;
};

type LeaveData = {
  type: string;
  fromDate: string;
  toDate: string;
  reason: string;
  days: number;
};

const initialLeaveTypes: LeaveType[] = [
  {
    title: 'Casual Leave',
    balance: 12,
    used: 0,
    icon: <Calendar size={24} color="#6366f1" />,
    color: '#6366f1', // Indigo
  },
  {
    title: 'Sick Leave',
    balance: 7,
    used: 0,
    icon: <Clock size={24} color="#ec4899" />,
    color: '#ec4899', // Pink
  },
  {
    title: 'Vacation',
    balance: 15,
    used: 0,
    icon: <FileText size={24} color="#10b981" />,
    color: '#10b981', // Emerald
  },
  {
    title: 'Personal Leave',
    balance: 15,
    used: 0,
    icon: <FileText size={24} color="#f59e0b" />,
    color: '#f59e0b', // Amber
  },
  {
    title: 'Half Day',
    balance: 15,
    used: 0,
    icon: <FileText size={24} color="#3b82f6" />,
    color: '#3b82f6', // Blue
  },
];

const stats = [
  {
    title: 'Approved',
    count: 12,
    icon: <CheckCircle2 size={24} color="#10b981" />,
  },
  {
    title: 'Pending',
    count: 3,
    icon: <AlertCircle size={24} color="#f59e0b" />,
  },
  {
    title: 'Rejected',
    count: 1,
    icon: <XCircle size={24} color="#ef4444" />,
  },
];

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(initialLeaveTypes);
  const [leaves, setLeaves] = useState<LeaveData[]>([]);

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
  };

  const handleLeaveSelect = (color: string, title: string) => {
    if (selectedDate) {
      const updatedMarkedDates = {
        ...markedDates,
        [selectedDate]: { selected: true, selectedColor: color, marked: true },
      };
      setMarkedDates(updatedMarkedDates);

      const updatedLeaveTypes = leaveTypes.map((type) => {
        if (type.title === title) {
          return { ...type, used: type.used + 1 };
        }
        return type;
      });
      setLeaveTypes(updatedLeaveTypes);

      setModalVisible(false);
    }
  };

  const handleRemoveLeave = () => {
    if (selectedDate && markedDates[selectedDate]) {
      const updatedMarkedDates = { ...markedDates };
      delete updatedMarkedDates[selectedDate];
      setMarkedDates(updatedMarkedDates);

      const updatedLeaveTypes = leaveTypes.map((type) => {
        if (markedDates[selectedDate]?.selectedColor === type.color) {
          return { ...type, used: type.used - 1 };
        }
        return type;
      });
      setLeaveTypes(updatedLeaveTypes);

      setModalVisible(false);
    }
  };

  const handleLeaveSubmit = (leave: LeaveData) => {
    setLeaves([...leaves, leave]);
    const start = new Date(leave.fromDate);
    const end = new Date(leave.toDate);
    const updatedMarkedDates = { ...markedDates };

    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      updatedMarkedDates[dateStr] = { selected: true, selectedColor: leaveTypes.find((type) => type.title === leave.type)?.color || '#6366f1', marked: true };
    }

    setMarkedDates(updatedMarkedDates);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            {stat.icon}
            <Text style={styles.statCount}>{stat.count}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </View>
        ))}
      </View>

      <View style={styles.calendarContainer}>
        <Text style={styles.sectionTitle}>Leave Calendar</Text>
        <RNCalendar
          markedDates={markedDates}
          onDayPress={handleDayPress}
          markingType="multi-dot"
          theme={{
            calendarBackground: 'white',
            selectedDayBackgroundColor: '#6366f1',
            selectedDayTextColor: 'white',
            todayTextColor: '#6366f1',
            arrowColor: '#6366f1',
          }}
        />
      </View>

      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {/* Close Button */}
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}
                >
                  <X size={24} color="#000" />
                </TouchableOpacity>

                <Text style={styles.modalTitle}>Select Leave Type</Text>
                {leaveTypes.map((type) => (
                  <TouchableOpacity
                    key={type.title}
                    style={[styles.modalOption, { backgroundColor: type.color }]}
                    onPress={() => handleLeaveSelect(type.color, type.title)}
                  >
                    <Text style={styles.modalOptionText}>{type.title}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.modalOption, { backgroundColor: '#ef4444' }]}
                  onPress={handleRemoveLeave}
                >
                  <Text style={styles.modalOptionText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Text style={styles.sectionTitle}>Leave Balance</Text>
      {leaveTypes.map((type, index) => (
        <View key={index} style={styles.leaveCard}>
          <View style={styles.leaveHeader}>
            {type.icon}
            <Text style={styles.leaveTitle}>{type.title}</Text>
          </View>
          <View style={styles.leaveStats}>
            <Text style={styles.leaveBalance}>
              Balance: <Text style={styles.balanceNumber}>{type.balance - type.used}</Text>
            </Text>
            <Text style={styles.leaveUsed}>
              Used: <Text style={styles.usedNumber}>{type.used}</Text>
            </Text>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}></Text>
      {leaves.map((leave, index) => (
        <View key={index} style={styles.leaveCard}>
          <Text style={styles.leaveTitle}>{leave.type}</Text>
          <Text style={styles.leaveUsed}>From: {leave.fromDate}</Text>
          <Text style={styles.leaveUsed}>To: {leave.toDate}</Text>
          <Text style={styles.leaveUsed}>Days: {leave.days}</Text>
          <Text style={styles.leaveUsed}>Reason: {leave.reason}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statCount: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    color: '#1e293b',
  },
  statTitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  calendarContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  leaveCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  leaveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  leaveTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 12,
  },
  leaveStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leaveBalance: {
    fontSize: 14,
    color: '#64748b',
  },
  balanceNumber: {
    color: '#10b981',
    fontWeight: '600',
  },
  leaveUsed: {
    fontSize: 14,
    color: '#64748b',
  },
  usedNumber: {
    color: '#6366f1',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  modalOptionText: {
    color: 'white',
    fontWeight: '600',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
});
