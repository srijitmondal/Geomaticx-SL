import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import CalendarPicker from 'react-native-calendar-picker';
import Modal from 'react-native-modal';
import { MapPin, MapPinOff } from 'lucide-react-native';
import { format } from 'date-fns';

// Mock data - replace with actual API calls
const mockRoles = [
  { label: 'Admin', value: 'admin' },
  { label: 'Manager', value: 'manager' },
  { label: 'Employee', value: 'employee' },
];

const mockUsers = [
  { label: 'John Doe', value: 'john' },
  { label: 'Jane Smith', value: 'jane' },
  { label: 'Bob Johnson', value: 'bob' },
];

const mockAttendanceData = [
  {
    id: 1,
    userName: 'John Doe',
    role: 'Admin',
    checkIn: '2024-02-20T09:00:00',
    checkOut: '2024-02-20T17:00:00',
    hasLocation: true,
    location: { lat: 40.7128, lng: -74.0060 },
  },
  // Add more mock data as needed
];

export default function AttendancePage() {
  const [loading, setLoading] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [attendanceData, setAttendanceData] = useState(mockAttendanceData);

  const [roles] = useState(mockRoles);
  const [users] = useState(mockUsers);

  useEffect(() => {
    // Fetch initial data
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAttendanceData(mockAttendanceData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

interface DateSelectHandler {
    (date: Date, type: 'START_DATE' | 'END_DATE'): void;
}

const handleDateSelect: DateSelectHandler = (date, type) => {
    if (type === 'START_DATE') {
        setStartDate(date);
    } else {
        setEndDate(date);
        if (date) {
            setCalendarVisible(false);
        }
    }
};

  const handleFilter = () => {
    // Implement filter logic
    fetchAttendanceData();
  };

  const handleReset = () => {
    setSelectedRole(null);
    setSelectedUser(null);
    setStartDate(null);
    setEndDate(null);
    fetchAttendanceData();
  };

interface LocationIconProps {
    hasLocation: boolean;
}

const renderLocationIcon: React.FC<LocationIconProps> = ({ hasLocation }) => {
    if (hasLocation) {
        return (
            <TouchableOpacity onPress={() => console.log('Show location details')}>
                <MapPin size={24} color="#4CAF50" />
            </TouchableOpacity>
        );
    }
    return <MapPinOff size={24} color="#999" />;
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Tracker</Text>

      <View style={styles.filterContainer}>
        <DropDownPicker
          open={roleOpen}
          value={selectedRole}
          items={roles}
          setOpen={setRoleOpen}
          setValue={setSelectedRole}
          placeholder="Select Role"
          style={styles.dropdown}
          containerStyle={styles.dropdownContainer}
          zIndex={3000}
        />

        <DropDownPicker
          open={userOpen}
          value={selectedUser}
          items={users}
          setOpen={setUserOpen}
          setValue={setSelectedUser}
          placeholder="Select User"
          style={styles.dropdown}
          containerStyle={styles.dropdownContainer}
          zIndex={2000}
        />

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setCalendarVisible(true)}
        >
          <Text style={styles.dateButtonText}>
            {startDate && endDate
              ? `${format(startDate, 'MM/dd/yyyy')} - ${format(
                  endDate,
                  'MM/dd/yyyy'
                )}`
              : 'Select Date Range'}
          </Text>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.filterButton} onPress={handleFilter}>
            <Text style={styles.buttonText}>Apply Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, styles.resetButton]}
            onPress={handleReset}
          >
            <Text style={[styles.buttonText, styles.resetButtonText]}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        isVisible={isCalendarVisible}
        onBackdropPress={() => setCalendarVisible(false)}
        style={styles.modal}
      >
        <View style={styles.calendarContainer}>
          <CalendarPicker
            startFromMonday={true}
            allowRangeSelection={true}
            onDateChange={handleDateSelect}
            selectedStartDate={startDate || undefined}
            selectedEndDate={endDate || undefined}
            width={300}
          />
        </View>
      </Modal>

      {loading ? (
        <ActivityIndicator size="large" color="#6200EE" style={styles.loader} />
      ) : (
        <ScrollView style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 2 }]}>User</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>Role</Text>
            <Text style={[styles.headerCell, { flex: 2 }]}>Check In</Text>
            <Text style={[styles.headerCell, { flex: 2 }]}>Check Out</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>Location</Text>
          </View>

          {attendanceData.map((record, index) => (
            <View key={record.id} style={styles.tableRow}>
              <Text style={[styles.cell, { flex: 2 }]}>{record.userName}</Text>
              <Text style={[styles.cell, { flex: 1 }]}>{record.role}</Text>
              <Text style={[styles.cell, { flex: 2 }]}>
                {format(new Date(record.checkIn), 'MM/dd HH:mm')}
              </Text>
              <Text style={[styles.cell, { flex: 2 }]}>
                {format(new Date(record.checkOut), 'MM/dd HH:mm')}
              </Text>
              <View style={[styles.cell, { flex: 1 }]}>
                {renderLocationIcon({ hasLocation: record.hasLocation })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1a1a1a',
  },
  filterContainer: {
    marginBottom: 20,
    zIndex: 1000,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
  },
  dropdownContainer: {
    marginBottom: 10,
  },
  dateButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  dateButtonText: {
    color: '#1a1a1a',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  filterButton: {
    backgroundColor: '#6200EE',
    padding: 12,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6200EE',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  resetButtonText: {
    color: '#6200EE',
  },
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '90%',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cell: {},
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});