import React, { useState } from 'react';
// import { Text } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Pressable,
  ActivityIndicator
} from 'react-native';
import { Calendar as CalendarIcon } from 'lucide-react-native';
import { Calendar as RNCalendar, LocaleConfig } from 'react-native-calendars';
import CalendarPicker from 'react-native-calendar-picker';
// import DropDownPicker from 'react-native-dropdown-picker';
import { format } from 'date-fns';

const API_URL = "http://192.168.1.100/Backend/fetchAttendance.php";

interface AttendanceData {
  date: string;
  status: string;
  reason: string;
}

interface AttendanceRecord {
  attn_id: number;
  user_id: number;
  login_timestamp: string;
  logout_timestamp: string | null;
  is_login_out: boolean;
}

{
  // State declarations
  const [loading, setLoading] = useState(false);
  const [userId] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // ... other state declarations

  // API function
  const fetchAttendanceData = async () => {
    // ... implementation
  };

  // Process function
  const processAttendanceData = (records: AttendanceRecord[]): AttendanceData[] => {
    const attendanceData: AttendanceData[] = [];
    // ... implementation
    return attendanceData;
  };

  // Handler functions
  const handleViewAttendance = () => {
    fetchAttendanceData();
    setFilterStatus(null);
  };

  // ... rest of your component code
}

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

export default function AttendanceTracker() {
  const [loading, setLoading] = useState(false);
  const [userId] = useState(1);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [attendanceDetails, setAttendanceDetails] = useState<AttendanceData[]>([]);
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    {label: 'This Week', value: 'week'},
    {label: 'This Month', value: 'month'},
    {label: 'Last Month', value: 'last_month'},
    {label: 'Custom', value: 'custom'}
  ]);

  const holidays = [
    { date: '2023-12-25', status: 'Holyday', reason: 'Christmas' },
    { date: '2023-11-23', status: 'Holyday', reason: 'Thanksgiving' },
  ];

  const handleDateSelect = (date: string, type: 'START_DATE' | 'END_DATE') => {
    const formattedDate = format(new Date(date), 'yyyy-MM-dd');
    if (type === 'START_DATE') {
      setStartDate(formattedDate);
    } else {
      setEndDate(formattedDate);
      setCalendarVisible(false);
    }
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          start_date: startDate,
          end_date: endDate,
        }),
      });
      const data = await response.json();
      if (data.success) {
        const processedData = processAttendanceData(data.records);
        setAttendanceDetails(processedData);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch attendance data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const processAttendanceData = (records: AttendanceRecord[]): AttendanceData[] => {
    if (!startDate || !endDate) return [];
    
    const allDates = getDatesBetween(startDate, endDate);
    
    return allDates.map(date => {
      const holiday = holidays.find(h => h.date === date);
      if (holiday) return holiday;

      const record = records.find(r => r.login_timestamp.startsWith(date));
      
      if (!record) {
        return { date, status: 'Not Logged Out', reason: '' };
      }

      if (record.is_login_out && record.logout_timestamp) {
        return { date, status: 'Present', reason: '' };
      } else if (record.is_login_out === false) {
        return { date, status: 'Absent', reason: 'Did not log out' };
      } else {
        return { date, status: 'Not Logged Out', reason: '' };
      }
    });
  };

  const handleViewAttendance = () => {
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please select a start and end date');
      return;
    }

    const allDates = getDatesBetween(startDate, endDate);
    const filteredAttendance = allDates.map((date) => {
      const existingAttendance = attendanceDetails.find((attendance) => attendance.date === date);
      const holiday = holidays.find((h) => h.date === date);
      return existingAttendance || holiday || { date, status: 'Not Logged Out', reason: '' };
    });

    setAttendanceDetails(filteredAttendance);
    setFilterStatus(null);
    setCurrentMonth(startDate);
    fetchAttendanceData();
  };

  const getDatesBetween = (start: string, end: string): string[] => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const dates: string[] = [];

    while (startDate <= endDate) {
      dates.push(format(startDate, 'yyyy-MM-dd'));
      startDate.setDate(startDate.getDate() + 1);
    }

    return dates;
  };

  const getMarkedDates = () => {
    const markedDates: { [key: string]: { selected: boolean; selectedColor: string } } = {};

    attendanceDetails.forEach((attendance) => {
      const date = new Date(attendance.date);
      if (date.getDay() === 0) return;

      let color = '#f59e0b';
      if (attendance.status === 'Present') {
        color = '#10b981';
      } else if (attendance.status === 'Absent') {
        color = '#ef4444';
      } else if (attendance.status === 'Holyday') {
        color = '#6b7280';
      }

      if (!filterStatus || attendance.status === filterStatus) {
        markedDates[attendance.date] = {
          selected: true,
          selectedColor: color,
        };
      }
    });

    return markedDates;
  };

  const handleFilterStatus = (status: string | null) => {
    setFilterStatus(status);
  };

  const calculateTotalCounts = () => {
    const counts = {
      presentCount: 0,
      absentCount: 0,
      notLoggedOutCount: 0,
      holydayCount: 0
    };

    attendanceDetails.forEach((attendance) => {
      if (attendance.status === 'Present') counts.presentCount++;
      else if (attendance.status === 'Absent') counts.absentCount++;
      else if (attendance.status === 'Not Logged Out') counts.notLoggedOutCount++;
      else if (attendance.status === 'Holyday') counts.holydayCount++;
    });

    return counts;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>View Attendance for a Date Range</Text>
        <View style={styles.filterContainer}>
          
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setCalendarVisible(true)}
          >
            <Text style={styles.dateButtonText}>
              {startDate && endDate
                ? `${format(new Date(startDate!), 'MM.dd.yyyy')} - ${format(new Date(endDate!), 'MM.dd.yyyy')}`
                : 'Select Date Range'}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={isCalendarVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setCalendarVisible(false)}
        >
          <Pressable 
            style={styles.modalBackdrop}
            onPress={() => setCalendarVisible(false)}
          >
            <View style={styles.calendarModal}>
              <CalendarPicker
                startFromMonday={true}
                allowRangeSelection={true}
                onDateChange={(date, type) => handleDateSelect(date.toString(), type)}
                selectedStartDate={startDate ? new Date(startDate) : undefined}
                selectedEndDate={endDate ? new Date(endDate) : undefined}
                width={350}
                height={400}
                minDate={new Date(2000, 0, 1)}
                maxDate={new Date()}
              />
            </View>
          </Pressable>
        </Modal>

        <TouchableOpacity style={styles.submitButton} onPress={handleViewAttendance}>
          <Text style={styles.submitText}>View Attendance</Text>
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        )}

        <View style={styles.colorIndicatorContainer}>
          <View style={styles.colorIndicatorItem}>
            <View style={[styles.colorBox, { backgroundColor: '#10b981' }]} />
            <Text style={styles.colorIndicatorText}>Present</Text>
          </View>
          <View style={styles.colorIndicatorItem}>
            <View style={[styles.colorBox, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.colorIndicatorText}>Absent</Text>
          </View>
          <View style={styles.colorIndicatorItem}>
            <View style={[styles.colorBox, { backgroundColor: '#6b7280' }]} />
            <Text style={styles.colorIndicatorText}>Holyday</Text>
          </View>
          <View style={styles.colorIndicatorItem}>
            <View style={[styles.colorBox, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.colorIndicatorText}>Not Logged Out</Text>
          </View>
        </View>

        <View style={styles.markAttendanceContainer}>
          <Text style={styles.label}>Filter Attendance</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: '#10b981' }]}
              onPress={() => handleFilterStatus('Present')}>
              <Text style={styles.statusButtonText}>Present</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: '#ef4444' }]}
              onPress={() => handleFilterStatus('Absent')}>
              <Text style={styles.statusButtonText}>Absent</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: '#6b7280' }]}
              onPress={() => handleFilterStatus('Holyday')}>
              <Text style={styles.statusButtonText}>Holyday</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: '#f59e0b' }]}
              onPress={() => handleFilterStatus('Not Logged Out')}>
              <Text style={styles.statusButtonText}>Not Logged Out</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: '#6366f1' }]}
              onPress={() => handleFilterStatus(null)}>
              <Text style={styles.statusButtonText}>Show All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {attendanceDetails.length > 0 && (
          <View style={styles.calendarView}>
            <RNCalendar
              current={currentMonth}
              markedDates={getMarkedDates()}
              disableMonthChange={false}
              hideArrows={false}
              disableArrowLeft={false}
              disableArrowRight={false}
              theme={{
                calendarBackground: 'white',
                selectedDayBackgroundColor: '#6366f1',
                selectedDayTextColor: 'white',
                todayTextColor: '#6366f1',
                arrowColor: '#6366f1',
              }}
            />
            <View style={styles.countContainer}>
              {filterStatus === 'Present' && (
                <Text style={styles.countText}>
                  Total Present: {calculateTotalCounts().presentCount}
                </Text>
              )}
              {filterStatus === 'Absent' && (
                <Text style={styles.countText}>
                  Total Absent: {calculateTotalCounts().absentCount}
                </Text>
              )}
              {filterStatus === 'Holyday' && (
                <Text style={styles.countText}>
                  Total Holyday: {calculateTotalCounts().holydayCount}
                </Text>
              )}
              {filterStatus === 'Not Logged Out' && (
                <Text style={styles.countText}>
                  Total Not Logged Out: {calculateTotalCounts().notLoggedOutCount}
                </Text>
              )}
              {!filterStatus && (
                <>
                  <Text style={styles.countText}>
                    Present: {calculateTotalCounts().presentCount}
                  </Text>
                  <Text style={styles.countText}>
                    Absent: {calculateTotalCounts().absentCount}
                  </Text>
                  <Text style={styles.countText}>
                    Holyday: {calculateTotalCounts().holydayCount}
                  </Text>
                  <Text style={styles.countText}>
                    Not Logged Out: {calculateTotalCounts().notLoggedOutCount}
                  </Text>
                </>
              )}
            </View>
          </View>
        )}
      </View>
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
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dropdownContainer: {
    flex: 1,
    marginRight: 8,
    zIndex: 1000,
  },
  dropdown: {
    borderColor: '#e2e8f0',
    borderRadius: 8,
  },
  dropdownList: {
    borderColor: '#e2e8f0',
    marginTop: 2,
  },
  dateButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
  },
  dateButtonText: {
    color: '#1e293b',
  },
  submitButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  colorIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 2,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  colorIndicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 4,
  },
  colorBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  colorIndicatorText: {
    fontSize: 14,
    color: '#64748b',
  },
  markAttendanceContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: '30%',
    flexGrow: 1,
  },
  statusButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  calendarView: {
    marginTop: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  countContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 16,
    gap: 8,
  },
  countText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarModal: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '90%',
  },
  loadingContainer: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function setFilterStatus(arg0: null) {
  throw new Error('Function not implemented.');
}
