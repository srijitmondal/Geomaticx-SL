import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar as RNCalendar, LocaleConfig } from 'react-native-calendars';
import CalendarPicker from 'react-native-calendar-picker';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';

const API_URL = 'http://localhost/attendance_in_range.php';

interface AttendanceData {
  date: string;
  status: string;
  reason: string;
}

interface ApiResponse {
  success: boolean;
  attendance: {
    date: string;
    hasLogin: boolean;
    is_logged_out: boolean;
    isHoliday: boolean;
    isSunday: boolean;
  }[];
  message?: string;
}

LocaleConfig.locales['en'] = {
  monthNames: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  monthNamesShort: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ],
  dayNames: [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};
LocaleConfig.defaultLocale = 'en';

export default function AttendanceTracker() {
  const { width } = useWindowDimensions();
  const containerWidth = Math.min(Math.max(width * 0.9, 345), 800);

  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [attendanceDetails, setAttendanceDetails] = useState<AttendanceData[]>(
    []
  );
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userid');
        if (storedUserId) {
          setUserId(parseInt(storedUserId, 10));
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
        Alert.alert('Error', 'Failed to load user information');
      }
    };

    fetchUserId();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setStartDate(null);
    setEndDate(null);
    setAttendanceDetails([]);
    setFilterStatus(null);
    setDataLoaded(false);
    setRefreshing(false);
  };

  const handleDateSelect = (date: string, type: 'START_DATE' | 'END_DATE') => {
    const formattedDate = format(new Date(date), 'yyyy-MM-dd');

    if (startDate && endDate) {
      setStartDate(formattedDate);
      setEndDate(null);
      return;
    }

    if (type === 'START_DATE') {
      setStartDate(formattedDate);
    } else {
      if (startDate && new Date(formattedDate) >= new Date(startDate)) {
        setEndDate(formattedDate);
        setCalendarVisible(false);
      } else {
        setStartDate(formattedDate);
        setEndDate(null);
      }
    }
  };

  const fetchAttendanceData = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not available');
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please select a start and end date');
      return;
    }

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data && data.success) {
        const processedData = processApiResponse(data.attendance);
        setAttendanceDetails(processedData);
        setDataLoaded(true);
      } else {
        Alert.alert(
          'Error',
          data?.message || 'Failed to fetch attendance data'
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to connect to server. Please try again later.'
      );
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processApiResponse = (
    apiData: ApiResponse['attendance']
  ): AttendanceData[] => {
    return apiData
      .map((item) => {
        if (item.isSunday) {
          return { date: item.date, status: 'Sunday', reason: 'Sunday' };
        }

        if (item.isHoliday) {
          return { date: item.date, status: 'Holiday', reason: 'Holiday' };
        }

        if (!item.hasLogin) {
          return {
            date: item.date,
            status: 'Absent',
            reason: 'No login recorded',
          };
        }

        if (!item.is_logged_out) {
          return {
            date: item.date,
            status: 'Not Logged Out',
            reason: 'Did not log out',
          };
        }

        return { date: item.date, status: 'Present', reason: '' };
      })
      .filter((item) => item.status !== 'Sunday');
  };

  const handleViewAttendance = () => {
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please select a start and end date');
      return;
    }

    setCurrentMonth(startDate);
    fetchAttendanceData();
  };

  const getMarkedDates = () => {
    const markedDates: {
      [key: string]: { selected: boolean; selectedColor: string };
    } = {};

    attendanceDetails.forEach((attendance) => {
      let color = '#f59e0b';
      if (attendance.status === 'Present') {
        color = '#10b981';
      } else if (attendance.status === 'Absent') {
        color = '#ef4444';
      } else if (attendance.status === 'Holiday') {
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
      holidayCount: 0,
    };

    attendanceDetails.forEach((attendance) => {
      if (attendance.status === 'Present') counts.presentCount++;
      else if (attendance.status === 'Absent') counts.absentCount++;
      else if (attendance.status === 'Not Logged Out')
        counts.notLoggedOutCount++;
      else if (attendance.status === 'Holiday') counts.holidayCount++;
    });

    return counts;
  };

  const CountBox = ({
    value,
    label,
    color,
  }: {
    value: number;
    label: string;
    color: string;
  }) => (
    <View style={[styles.countBox, { backgroundColor: color }]}>
      <Text style={styles.countBoxValue}>{value}</Text>
      <Text style={styles.countBoxLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { width: containerWidth },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366f1']}
            tintColor={'#6366f1'}
          />
        }
      >
        <View style={styles.formContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Select Date Range</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
              <Icon name="refresh" size={24} color="#6366f1" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setCalendarVisible(true)}
            >
              <Text style={styles.dateButtonText}>
                {startDate && endDate
                  ? `${format(new Date(startDate), 'MM.dd.yyyy')} - ${format(
                      new Date(endDate),
                      'MM.dd.yyyy'
                    )}`
                  : startDate
                  ? `${format(
                      new Date(startDate),
                      'MM.dd.yyyy'
                    )} - Select end date`
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
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View
                  style={[
                    styles.calendarModal,
                    { width: containerWidth * 0.9 },
                  ]}
                >
                  <CalendarPicker
                    startFromMonday={true}
                    allowRangeSelection={true}
                    onDateChange={(date, type) => {
                      if (date) {
                        handleDateSelect(date.toString(), type);
                      }
                    }}
                    selectedStartDate={
                      startDate ? new Date(startDate) : undefined
                    }
                    selectedEndDate={endDate ? new Date(endDate) : undefined}
                    width={containerWidth * 0.85}
                    height={400}
                    minDate={new Date(2000, 0, 1)}
                    maxDate={new Date()}
                    dayLabelsWrapper={{
                      borderTopWidth: 0,
                      borderBottomWidth: 0,
                    }}
                    textStyle={{
                      fontSize: 16,
                    }}
                    selectedDayTextColor="#FFFFFF"
                    selectedDayStyle={{
                      backgroundColor: '#b82828',
                      borderRadius: 10,
                      // Make it more circular
                    }}
                    selectedRangeStartStyle={{
                      backgroundColor: '#19355e',
                      borderTopLeftRadius: 10,
                      borderBottomLeftRadius: 10,
                    }}
                    selectedRangeEndStyle={{
                      backgroundColor: '#19355e',
                      borderTopRightRadius: 10,
                      borderBottomRightRadius: 10,
                    }}
                    selectedRangeStyle={{
                      backgroundColor: '#19355e',
                    }}
                  />
                </View>
                <View style={styles.calendarButtonsContainer}>
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => {
                      setStartDate(null);
                      setEndDate(null);
                    }}
                  >
                    <Text style={styles.clearButtonText}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setCalendarVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Pressable>
          </Modal>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleViewAttendance}
          >
            <Text style={styles.submitText}>View Attendance</Text>
          </TouchableOpacity>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          )}

          {dataLoaded && (
            <View style={styles.markAttendanceContainer}>
              <Text style={styles.label}>Filter Attendance :-</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: '#10b981' }]}
                  onPress={() => handleFilterStatus('Present')}
                >
                  <Text style={styles.statusButtonText}>Present</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: '#ef4444' }]}
                  onPress={() => handleFilterStatus('Absent')}
                >
                  <Text style={styles.statusButtonText}>Absent</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: '#6b7280' }]}
                  onPress={() => handleFilterStatus('Holiday')}
                >
                  <Text style={styles.statusButtonText}>Holiday</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: '#f59e0b' }]}
                  onPress={() => handleFilterStatus('Not Logged Out')}
                >
                  <Text style={styles.statusButtonText}>Not Logged Out</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: '#6366f1' }]}
                  onPress={() => handleFilterStatus(null)}
                >
                  <Text style={styles.statusButtonText}>Show All</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {attendanceDetails.length > 0 && (
            <View style={styles.calendarView}>
              <RNCalendar
                current={currentMonth}
                markedDates={getMarkedDates()}
                disableMonthChange={false}
                hideArrows={false}
                disableArrowLeft={false}
                disableArrowRight={false}
                style={{ width: containerWidth - 32 }}
                theme={{
                  calendarBackground: 'white',
                  selectedDayBackgroundColor: '#6366f1',
                  selectedDayTextColor: 'white',
                  todayTextColor: '#6366f1',
                  arrowColor: '#6366f1',
                  textDayFontSize: containerWidth < 500 ? 16 : 18,
                  textMonthFontSize: containerWidth < 500 ? 18 : 20,
                  textDayHeaderFontSize: containerWidth < 500 ? 16 : 18,
                  textDayFontWeight: 'bold',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: 'bold',
                  'stylesheet.day.basic': {
                    base: {
                      width: 32,
                      height: 32,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    text: {
                      fontSize: containerWidth < 500 ? 16 : 18,
                      fontWeight: 'bold',
                      color: 'black',
                      marginTop: Platform.OS === 'android' ? 4 : 6,
                    },
                  },
                  'stylesheet.calendar.header': {
                    header: {
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingLeft: 10,
                      paddingRight: 10,
                      marginTop: 6,
                      marginBottom: 6,
                    },
                    monthText: {
                      fontSize: containerWidth < 500 ? 18 : 20,
                      fontWeight: 'bold',
                      color: 'black',
                    },
                    week: {
                      marginTop: 7,
                      flexDirection: 'row',
                      justifyContent: 'space-around',
                    },
                    dayHeader: {
                      fontWeight: 'bold',
                    },
                  },
                }}
              />
              <View style={styles.countContainer}>
                <View style={styles.countInnerContainer}>
                  {filterStatus === 'Present' && (
                    <CountBox
                      value={calculateTotalCounts().presentCount}
                      label="Present"
                      color="#10b981"
                    />
                  )}
                  {filterStatus === 'Absent' && (
                    <CountBox
                      value={calculateTotalCounts().absentCount}
                      label="Absent"
                      color="#ef4444"
                    />
                  )}
                  {filterStatus === 'Holiday' && (
                    <CountBox
                      value={calculateTotalCounts().holidayCount}
                      label="Holiday"
                      color="#6b7280"
                    />
                  )}
                  {filterStatus === 'Not Logged Out' && (
                    <CountBox
                      value={calculateTotalCounts().notLoggedOutCount}
                      label="Not Logged Out"
                      color="#f59e0b"
                    />
                  )}
                  {!filterStatus && (
                    <>
                      <CountBox
                        value={calculateTotalCounts().presentCount}
                        label="Present"
                        color="#10b981"
                      />
                      <CountBox
                        value={calculateTotalCounts().absentCount}
                        label="Absent"
                        color="#ef4444"
                      />
                      <CountBox
                        value={calculateTotalCounts().holidayCount}
                        label="Holiday"
                        color="#6b7280"
                      />
                      <CountBox
                        value={calculateTotalCounts().notLoggedOutCount}
                        label="Not Logged Out"
                        color="#f59e0b"
                      />
                    </>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    paddingVertical: 16,
  },
  formContainer: {
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'left',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  filterContainer: {
    marginBottom: 11,
  },
  dateButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
  },
  dateButtonText: {
    color: '#1e293b',
    textAlign: 'center',
    fontSize: 20,
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
    fontSize: 19,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  calendarButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  clearButton: {
    backgroundColor: '#e2e8f0',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
  },
  markAttendanceContainer: {
    marginBottom: 24,
    fontSize: 16,
  },
  label: {
    fontSize: 19,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'left',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 0,
  },
  statusButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
    margin: 2,
  },
  statusButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  calendarView: {
    marginTop: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  countContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    width: '100%',
  },
  countInnerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 12,
  },
  countBox: {
    width: 100,
    height: 80,
    borderRadius: 10,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  countBoxValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  countBoxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: '100%',
  },
  calendarModal: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: 800,
    width: '90%',
    maxHeight: 600,
    height: 'auto',
    alignItems: 'center',
  },
  loadingContainer: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
});
