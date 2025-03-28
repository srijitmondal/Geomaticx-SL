import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  Image,
  Modal,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronLeft, ChevronRight, Clock, Calendar, User, CheckCircle, XCircle } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import moment from "moment";
import DropDownPicker from "react-native-dropdown-picker";

interface AttendanceRecord {
  attn_id: string;
  user_id: string;
  user_name: string;
  role_name: string;
  attendance_date: string;
  check_in: string;
  check_out: string;
  attn_status: string;
  attn_location: string;
}

interface AttendanceSummary {
  user_id: string;
  user_name: string;
  role_name: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  last_attendance: string;
}

export default function UserAttendanceScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [summaryData, setSummaryData] = useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));
  const [open, setOpen] = useState(false);

  const ITEMS_PER_PAGE = 10;

  const fetchAttendanceData = async () => {
    try {
      const baseUrl = Platform.select({
        web: 'http://localhost:80',
        default: 'http://192.168.1.148:80',
      });

      const response = await fetch(`${baseUrl}/user_attendance.php`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Origin: Platform.OS === 'web' ? window.location.origin : 'http://localhost',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.attendance || !data.summary) {
        throw new Error('Data is not in the expected format');
      }

      setAttendanceData(data.attendance);
      setSummaryData(data.summary);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      if (err instanceof Error) {
        setError(`Error: ${err.message}`);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const filteredUsers = summaryData.filter(user =>
    user.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userAttendance = selectedUser
    ? attendanceData
        .filter(record => record.user_id === selectedUser)
        .filter(record => moment(record.attendance_date).format('YYYY-MM') === selectedMonth)
    : [];

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const renderUserItem = ({ item }: { item: AttendanceSummary }) => (
    <TouchableOpacity onPress={() => {
      setSelectedUser(item.user_id);
      setShowDetails(true);
    }}>
      <Animated.View
        entering={FadeIn}
        style={[
          styles.row,
          { backgroundColor: filteredUsers.indexOf(item) % 2 === 0 ? '#f9fafb' : '#ffffff' }
        ]}
      >
        <View style={[styles.userCell, { flex: isDesktop ? 2 : 1.5 }]}>
          <Text style={styles.userName}>{item.user_name}</Text>
          <Text style={styles.userRole}>{item.role_name}</Text>
        </View>
        <Text style={[styles.cell, { flex: 1 }]}>{item.present_days}</Text>
        <Text style={[styles.cell, { flex: 1 }]}>{item.absent_days}</Text>
        <Text style={[styles.cell, { flex: 1 }]}>
          {item.last_attendance ? moment(item.last_attendance).format('MMM D, YYYY') : 'Never'}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );

  const renderAttendanceItem = ({ item }: { item: AttendanceRecord }) => (
    <Animated.View
      entering={FadeIn}
      style={[
        styles.attendanceRow,
        { backgroundColor: userAttendance.indexOf(item) % 2 === 0 ? '#f9fafb' : '#ffffff' }
      ]}
    >
      <Text style={[styles.attendanceCell, { flex: 1.5 }]}>
        {moment(item.attendance_date).format('MMM D, YYYY')}
      </Text>
      <View style={[styles.statusCell, { flex: 1 }]}>
        {item.attn_status === 'present' ? (
          <CheckCircle size={16} color="#10b981" />
        ) : (
          <XCircle size={16} color="#ef4444" />
        )}
        <Text style={[
          styles.statusText,
          item.attn_status === 'present' ? styles.presentText : styles.absentText
        ]}>
          {item.attn_status}
        </Text>
      </View>
      <Text style={[styles.attendanceCell, { flex: 1 }]}>{item.check_in || '--:--'}</Text>
      <Text style={[styles.attendanceCell, { flex: 1 }]}>{item.check_out || '--:--'}</Text>
      <Text style={[styles.attendanceCell, { flex: 1.5 }]} numberOfLines={1}>
        {item.attn_location || 'Unknown'}
      </Text>
    </Animated.View>
  );

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = moment().subtract(i, 'months');
    return {
      label: date.format('MMMM YYYY'),
      value: date.format('YYYY-MM')
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      {showDetails && selectedUser ? (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowDetails(false)} style={styles.backButton}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={[styles.title, { fontSize: isDesktop ? 28 : 20 }]}>
              {summaryData.find(u => u.user_id === selectedUser)?.user_name}'s Attendance
            </Text>
          </View>

          <View style={styles.monthSelector}>
            <Text style={styles.label}>Select Month:</Text>
            <DropDownPicker
              open={open}
              value={selectedMonth}
              items={monthOptions}
              setOpen={setOpen}
              setValue={setSelectedMonth}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              zIndex={3000}
            />
          </View>

          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Days</Text>
              <Text style={styles.summaryValue}>
                {summaryData.find(u => u.user_id === selectedUser)?.total_days || 0}
              </Text>
            </View>
            <View style={[styles.summaryCard, styles.presentCard]}>
              <Text style={styles.summaryLabel}>Present</Text>
              <Text style={styles.summaryValue}>
                {summaryData.find(u => u.user_id === selectedUser)?.present_days || 0}
              </Text>
            </View>
            <View style={[styles.summaryCard, styles.absentCard]}>
              <Text style={styles.summaryLabel}>Absent</Text>
              <Text style={styles.summaryValue}>
                {summaryData.find(u => u.user_id === selectedUser)?.absent_days || 0}
              </Text>
            </View>
          </View>

          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>DATE</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>STATUS</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>CHECK IN</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>CHECK OUT</Text>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>LOCATION</Text>
          </View>

          <FlatList
            data={userAttendance}
            keyExtractor={(item) => item.attn_id}
            renderItem={renderAttendanceItem}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Calendar size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No attendance records found</Text>
              </View>
            }
          />
        </>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={[styles.title, { fontSize: isDesktop ? 28 : 20 }]}>User Attendance</Text>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { fontSize: isDesktop ? 16 : 14 }]}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: isDesktop ? 2 : 1.5 }]}>USER</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>PRESENT</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>ABSENT</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>LAST ACTIVE</Text>
          </View>

          <FlatList
            data={paginatedUsers}
            keyExtractor={(item) => item.user_id}
            renderItem={renderUserItem}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <User size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            }
          />

          <View style={styles.pagination}>
            <Text style={styles.paginationText}>
              Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} of{' '}
              {filteredUsers.length} entries
            </Text>
            <View style={styles.paginationControls}>
              <TouchableOpacity
                style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={20} color={currentPage === 1 ? '#9ca3af' : '#6366f1'} />
              </TouchableOpacity>
              <View style={styles.pageNumbers}>
                <Text style={[styles.pageNumber, styles.currentPage]}>{currentPage}</Text>
                <Text style={styles.pageNumber}>of {totalPages}</Text>
              </View>
              <TouchableOpacity
                style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={20} color={currentPage === totalPages ? '#9ca3af' : '#6366f1'} />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    flex: 1,
    fontWeight: '600',
    color: '#111827',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    margin: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#374151',
  },
  searchIcon: {
    marginRight: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  headerCell: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  userCell: {
    paddingHorizontal: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  userRole: {
    fontSize: 14,
    color: '#6b7280',
  },
  cell: {
    paddingHorizontal: 8,
    color: '#374151',
  },
  attendanceCell: {
    paddingHorizontal: 8,
    color: '#374151',
    fontSize: 14,
  },
  statusCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  presentText: {
    color: '#10b981',
  },
  absentText: {
    color: '#ef4444',
  },
  pagination: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  paginationText: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 12,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  pageNumber: {
    color: '#374151',
    fontSize: 14,
    marginHorizontal: 4,
  },
  currentPage: {
    color: '#6366f1',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 16,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginRight: 16,
  },
  dropdown: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    minHeight: 40,
    width: 200,
  },
  dropdownContainer: {
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  summaryCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 100,
  },
  presentCard: {
    backgroundColor: '#ecfdf5',
  },
  absentCard: {
    backgroundColor: '#fef2f2',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
});