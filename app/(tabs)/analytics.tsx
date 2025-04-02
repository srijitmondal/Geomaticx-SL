import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button, Modal, TouchableOpacity, View, Text, StyleSheet, ScrollView, Pressable, ViewStyle, Dimensions } from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';
import { Calendar, Clock as ClockIcon, Timer, UserCheck, UserX, TrendingUp } from 'lucide-react-native';
import { format } from 'date-fns';
import DropDownPicker from 'react-native-dropdown-picker';
import { ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorBoundary } from 'react-error-boundary';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;

const fetchAttendanceData = async (userId: number, startDate: string, endDate: string) => {
  try {
    const response = await fetch('http://localhost/fetch_analytics.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        startDate,
        endDate
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', data);

    if (data?.status !== "success") {
      throw new Error(data.message || 'Invalid API response: status not "success"');
    }

    return {
      status: data.status,
      data: {
        hours: {
          total: data.totalHoursWorked,
          daily_average: data.dailyAvgWorkHours
        },
        attendance: {
          present: data.attendedDays,
          absent: data.absentDays,
          rate: data.attendanceRate,
          trend: "+0%"
        },
        timings: {
          average_checkin: data.avgCheckInTime,
          average_checkout: data.avgCheckOutTime
        }
      },
      debug_info: data.debug_info
    };
  } catch (error) {
    console.error('Error fetching attendance data:', {
      error,
      userId,
      dateRange: { startDate, endDate }
    });
    throw error;
  }
};

function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Something went wrong:</Text>
      <Text style={styles.errorDetails}>{error.message}</Text>
      <Button title="Try again" onPress={resetErrorBoundary} />
    </View>
  );
}

interface StatCardProps {
  icon: React.ReactElement;
  title: string;
  value: string | number;
  subValue?: string | null;
  color: string;
}

interface AnalyticsProps {
  selectedPeriod: string;
  userId: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subValue, color }) => (
  <View style={[styles.card, { backgroundColor: color }]}>
    <View style={styles.cardHeader}>
      {icon}
      {subValue && (
        <View style={styles.trendContainer}>
          <TrendingUp size={14} color="#059669" />
          <Text style={styles.trendText}>{subValue}</Text>
        </View>
      )}
    </View>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardValue}>{value}</Text>
  </View>
);

const Analytics = ({ selectedPeriod, userId , startDate, endDate }: AnalyticsProps) => {
  const [workHours, setWorkHours] = useState<number | null>(null);
  const [averageWorkHours, setAverageWorkHours] = useState<number | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      setAnalyticsError(null);
      setWorkHours(null);
      setAverageWorkHours(null);
      setHasData(false);

      try {
        const today = new Date();
        let rangeStartDate = new Date();
        let rangeEndDate = new Date(today);

        if (selectedPeriod === 'Custom' && startDate && endDate) {
          // Use custom dates when period is Custom
          rangeStartDate = new Date(startDate);
          rangeEndDate = new Date(endDate);
        } else {
          // Existing period logic
          switch (selectedPeriod) {
            case 'Last Week':
              rangeStartDate.setDate(today.getDate() - 7);
              break;
            case 'Last Month':
              rangeStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
              rangeEndDate = new Date(today.getFullYear(), today.getMonth(), 0);
              break;
            case 'Last Year':
              rangeStartDate = new Date(today.getFullYear() - 1, 0, 1);
              rangeEndDate = new Date(today.getFullYear() - 1, 11, 31);
              break;
          }
        }

        const data = await fetchAttendanceData(
          userId,
          format(rangeStartDate, 'yyyy-MM-dd'),
          format(rangeEndDate, 'yyyy-MM-dd')
        );

        // Check if we have valid hours data
        const hasValidHours = data.data?.hours && 
        (data.data.hours.total !== null && 
         data.data.hours.total !== undefined && 
         data.data.hours.daily_average !== null && 
         data.data.hours.daily_average !== undefined);

          if (!hasValidHours) {
          throw new Error('No work hours data available for selected period');
          }

          setWorkHours(data.data.hours.total);
          setAverageWorkHours(data.data.hours.daily_average);
          setHasData(true);
          } catch (error) {
          console.error('Error loading analytics data:', error);
          setAnalyticsError('No work hours data available');
          setHasData(false);
          } finally {
          setIsLoading(false);
          }
          };
    loadAnalyticsData();
  }, [selectedPeriod, userId, startDate, endDate]);

  if (isLoading) {
    return (
      <View style={styles.workHoursGrid}>
        <ActivityIndicator size="small" color="#3b82f6" />
      </View>
    );
  }
  if (analyticsError) {
    return (
      <View style={styles.workHoursGrid}>
        <Text style={styles.errorText}>{analyticsError}</Text>
      </View>
    );
  }

  if (!hasData && !isLoading) {
    return (
      <View style={styles.workHoursGrid}>
        <View style={styles.noDataCard}>
          <ClockIcon size={32} color="#64748b" />
          <Text style={styles.noDataText}>No work hours data available</Text>
          {analyticsError && (
            <Text style={styles.noDataSubText}>{analyticsError}</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.workHoursGrid}>
      <View style={styles.workHoursCard}>
        <View style={styles.iconContainer}>
          <ClockIcon size={32} color="#0891b2" />
        </View>
        <Text style={styles.cardLabel}>Total Hours</Text>
        <Text style={styles.cardValuee}>
          {workHours !== null ? workHours.toFixed(1) : '--'}
        </Text>
        <Text style={styles.cardUnit}>hours</Text>
      </View>

      <View style={styles.workHoursCard}>
        <View style={styles.iconContainer}>
          <Timer size={32} color="#059669" />
        </View>
        <Text style={styles.cardLabel}>Daily Average</Text>
        <Text style={styles.cardValuee}>
          {averageWorkHours !== null ? averageWorkHours.toFixed(1) : '--'}
        </Text>
        <Text style={styles.cardUnit}>hours/day</Text>
      </View>
    </View>
  );
};

export default function StatsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('Last Week');
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    averageCheckIn: '--:--',
    averageCheckOut: '--:--',
    attendanceRate: '0%',
    trend: '+0%',
  });
  const [userId, setUserId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('Last Week');
  const [items, setItems] = useState([
    { label: 'Last Week', value: 'Last Week' },
    { label: 'Last Month', value: 'Last Month' },
    { label: 'Last Year', value: 'Last Year' },
  ]);

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
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserId();
  }, []);

  const loadData = useCallback(async (period: string, customStart?: Date | null, customEnd?: Date | null) => {
    if (!userId || !period) return;
    setLoading(true);
    setError(null);
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date(today);
  
    try {
      if (period === 'Custom' && customStart && customEnd) {
        // Handle custom date range selection
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
        
        // Ensure end date is at the end of the day (23:59:59)
        endDate.setHours(23, 59, 59, 999);
      } else {
        switch (period) {
          case 'Last Week':
            startDate.setDate(today.getDate() - 7);
            break;
          case 'Last Month':
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            endDate = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
          case 'Last Year':
            startDate = new Date(today.getFullYear() - 1, 0, 1);
            endDate = new Date(today.getFullYear() - 1, 11, 31);
            break;
          default:
            startDate.setDate(today.getDate() - 7);
        }
      }
  
      const data = await fetchAttendanceData(
        userId,
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
  
      if (!data.data) {
        throw new Error('Invalid data structure in API response');
      }
  
      setStats({
        totalDays: data.data.attendance.present + data.data.attendance.absent,
        presentDays: data.data.attendance.present,
        absentDays: data.data.attendance.absent,
        averageCheckIn: data.data.timings.average_checkin || '--:--',
        averageCheckOut: data.data.timings.average_checkout || '--:--',
        attendanceRate: `${data.data.attendance.rate}%`,
        trend: data.data.attendance.trend || '+0%',
      });
    } catch (err) {
      console.error('Load data error:', {
        error: err,
        userId,
        period,
        dates: { startDate, endDate }
      });
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadData(selectedPeriod);
    }
  }, [selectedPeriod, userId, loadData]);

  const handleDateSelect = useCallback((date: Date) => {
    // If no start date is selected or if both dates are selected, start a new selection
    if (!startDate || (startDate && endDate)) {
      const newStart = new Date(date);
      newStart.setHours(0, 0, 0, 0);
      setStartDate(newStart);
      setEndDate(null);
      setValue('Custom');
      setSelectedPeriod('Custom');
    } 
    // If start date is selected but no end date, set the end date
    else if (startDate && !endDate) {
      const newEnd = new Date(date);
      newEnd.setHours(23, 59, 59, 999);
      
      // Ensure end date is after start date
      if (newEnd >= startDate) {
        setEndDate(newEnd);
        setCalendarVisible(false);
        loadData('Custom', startDate, newEnd);
      } else {
        // If end date is before start date, swap them
        setEndDate(startDate);
        setStartDate(newEnd);
        setCalendarVisible(false);
        loadData('Custom', newEnd, startDate);
      }
    }
  }, [startDate, endDate, loadData]);

  const onBackdropPress = () => {
    setCalendarVisible(false);
  };

  if (isLoadingUser) {
    return <ActivityIndicator />;
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => console.error('Error caught:', error, info)}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>User Overview</Text>

        <View style={styles.filterContainer}>
          <View style={styles.dropdownContainer}>
            <DropDownPicker
              zIndex={1000}
              open={open}
              value={value}
              items={items}
              setOpen={setOpen}
              setValue={setValue}
              setItems={setItems}
              placeholder="Last Week"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownList}
              onChangeValue={(value) => {
                if (value) setSelectedPeriod(value);
              }}
            />
          </View>
          <TouchableOpacity onPress={() => setCalendarVisible(true)}>
            <Text style={styles.dateButtonText}>
              {startDate && endDate
                ? `${format(startDate, 'MM.dd.yyyy')} - ${format(endDate, 'MM.dd.yyyy')}`
                : startDate
                ? `${format(startDate, 'MM.dd.yyyy')} - Select end date`
                : 'Select date range'}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
  visible={isCalendarVisible}
  transparent={true}
  animationType="fade"
  onRequestClose={() => setCalendarVisible(false)}
>
  <Pressable style={styles.modalBackdrop} onPress={onBackdropPress}>
    <View style={styles.calendarContent}>
      <View style={styles.calendarModal} onStartShouldSetResponder={() => true}>
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionText}>
            {startDate && !endDate 
              ? `Selected start: ${format(startDate, 'MMM dd, yyyy')}`
              : startDate && endDate
              ? `Selected range: ${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`
              : 'Select start date'}
          </Text>
        </View>
                <CalendarPicker
                  startFromMonday={true}
                  allowRangeSelection={true}
                  onDateChange={handleDateSelect}
                  selectedStartDate={startDate || undefined}
                  selectedEndDate={endDate || undefined}
                  width={300}
                  height={350}
                  minDate={new Date(2000, 0, 1)}
                  maxDate={new Date()}
                  scaleFactor={375}
                  dayShape="square"
                  selectedDayColor="#3b82f6"
                  selectedDayTextColor="#ffffff"
                  todayBackgroundColor="#e6ffe6"
                  selectedDayStyle={{
                    borderRadius: 4,
                    height: 36,
                    width: 36,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  selectedRangeStartStyle={{
                    borderRadius: 4,
                    height: 36,
                    width: 36,
                  }}
                  selectedRangeEndStyle={{
                    borderRadius: 4,
                    height: 36,
                    width: 36,
                  }}
                  selectedRangeStyle={{
                    backgroundColor: '#3b82f6',
                    borderRadius: 0,
                  }}
                />
                <View style={styles.calendarButtons}>
                  <TouchableOpacity
                    style={[styles.calendarButton, styles.clearButton]}
                    onPress={() => {
                      if (startDate || endDate) {
                        setStartDate(null);
                        setEndDate(null);
                      }
                    }}>
                    <Text style={styles.calendarButtonText}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.calendarButton, styles.cancelButton]}
                    onPress={() => {
                      setStartDate(null);
                      setEndDate(null);
                      setCalendarVisible(false);
                    }}
                  >
                    <Text style={styles.calendarButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Pressable>
        </Modal>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.statsGrid}>
          <StatCard
            icon={<Calendar size={24} color="#0891b2" />}
            title="Total Working Days"
            value={stats.totalDays}
            subValue={stats.trend}
            color="#f0f9ff"
          />
          <StatCard
            icon={<UserCheck size={24} color="#059669" />}
            title="Present Days"
            value={stats.presentDays}
            subValue={null}
            color="#f0fdf4"
          />
          <StatCard
            icon={<UserX size={24} color="#dc2626" />}
            title="Absent Days"
            value={stats.absentDays}
            subValue={null}
            color="#fef2f2"
          />
          <StatCard
            icon={<ClockIcon size={24} color="#0891b2" />}
            title="Attendance Rate"
            value={stats.attendanceRate}
            subValue={null}
            color="#f0f9ff"
          />
        </View>

        <Text style={styles.sectionTitle}>Time Analysis</Text>
        <View style={styles.timeStats}>
          <View style={styles.timeCard}>
            <Text style={styles.timeLabel}>Average Check-in</Text>
            <Text style={styles.timeValue}>{stats.averageCheckIn}</Text>
          </View>
          <View style={styles.timeCard}>
            <Text style={styles.timeLabel}>Average Check-out</Text>
            <Text style={styles.timeValue}>{stats.averageCheckOut}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Work Hours</Text>
        <Analytics 
  selectedPeriod={selectedPeriod} 
  userId={userId}
  startDate={startDate}
  endDate={endDate}
/>
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    color: '#0f172a',
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    zIndex: 1000,
  },
  dropdownContainer: {
    flex: 1,
    minHeight: 40,
    zIndex: 1000,
  },
  dropdown: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 40,
  },
  dropdownList: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginTop: 4,
    zIndex: 2000,
  },
  dateButtonText: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 34,
  },
  card: {
    width: width >= 768 ? (width / 4 - CARD_GAP - 10) : (width - CARD_GAP * 3) / 2,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginVertical: 6,
    minHeight: width >= 768 ? 150 : 120,
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    color: '#059669',
    marginLeft: 4,
  },
  cardTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    color: '#0f172a',
  },
  sectionTitle: {
    fontSize: 20,
    color: '#0f172a',
    marginBottom: 16,
  },
  timeStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  timeCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  timeValue: {
    fontSize: 20,
    color: '#0f172a',
  },
  workHoursGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    minHeight: 150, // Ensure consistent height
    alignItems: 'center',
    justifyContent: 'center',
  },
  workHoursCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  cardValuee: {
    fontSize: 28,
    color: '#0f172a',
  },
  cardUnit: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorDetails: {
    color: 'red',
    marginVertical: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calendarButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  calendarButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButton: {
    backgroundColor: '#3b82f6',
  },
  calendarButtonText: {
    fontSize: 14,
  },
  calendarContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataCard: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  noDataText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  noDataSubText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  selectionInfo: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  selectionText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});