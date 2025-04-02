import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Calendar, Clock, CircleCheck as CheckCircle2, Circle as XCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LeaveRequest {
  leave_id: string;
  leave_ground_text: string;
  leave_from_date: string;
  leave_to_date: string;
  leave_track_status_text: 'Unattained' | 'Approved' | 'Rejected' | 'Suspended';
  leave_comment: string;
}

export default function MyLeaves() {
  const [activeTab, setActiveTab] = useState<'Unattained' | 'Approved' | 'Rejected' | 'Suspended'>('Unattained');
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [noRecords, setNoRecords] = useState(false); // Add a state for no records

  useEffect(() => {
    const fetchLeaves = async () => {
      const userid = await AsyncStorage.getItem('userid');
      console.log('User ID:', userid);
      if (!userid) {
        console.error('User ID not found in AsyncStorage');
        setLoading(false);
        return;
      }
    
      try {
        console.log('User ID223:', userid);
        const response = await fetch(`http://localhost/my-leaves.php?userId=${userid}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json(); // Parse the response as JSON
        console.log('Fetched leaves:', data);

        if (data.status === 'error') {
          console.error('API Error:', data.message);
          setLeaves([]); // Clear the leaves if there's an error
          setNoRecords(true); // Set no records state
        } else if (Array.isArray(data)) {
          const mappedData = data.map((leave: any) => ({
            leave_id: leave.leave_id,
            leave_ground_text: leave.leave_ground_text,
            leave_from_date: leave.leave_from_date,
            leave_to_date: leave.leave_to_date,
            leave_track_status_text: mapStatusToText(leave.leave_track_status),
            leave_comment: leave.leave_comment,
          }));
          setLeaves(mappedData as LeaveRequest[]);
          setNoRecords(false); // Reset no records state
        } else {
          console.error('Unexpected response format:', data);
        }
      } catch (error) {
        console.error('Error fetching leaves:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, []);

  const mapStatusToText = (status: number | null): 'Unattained' | 'Approved' | 'Rejected' | 'Suspended' => {
    switch (status) {
      case null:
        return 'Unattained';
      case 0:
        return 'Rejected';
      case 1:
        return 'Approved';
      case 2:
        return 'Suspended';
      default:
        return 'Unattained';
    }
  };

  const stats = {
    total: leaves.length,
    approved: leaves.filter(leave => leave.leave_track_status_text === 'Approved').length,
    unattained: leaves.filter(leave => leave.leave_track_status_text === 'Unattained').length,
    rejected: leaves.filter(leave => leave.leave_track_status_text === 'Rejected').length,
    suspended: leaves.filter(leave => leave.leave_track_status_text === 'Suspended').length,
  };

  const filteredLeaves = leaves.filter(leave => leave.leave_track_status_text === activeTab);

  const handleCancelRequest = (id: string) => {
    Alert.alert(
      'Cancel Leave Request',
      'Are you sure you want to cancel this leave request?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => console.log('Cancelled leave:', id) },
      ]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle2 size={20} color="#10b981" />;
      case 'Unattained':
        return <Clock size={20} color="#f59e0b" />;
      case 'Rejected':
        return <XCircle size={20} color="#ef4444" />;
      case 'Suspended':
        return <AlertCircle size={20} color="#f59e0b" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (noRecords) {
    return (
      <View style={styles.noRecordsContainer}>
        <Text style={styles.noRecordsText}>No leave records found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}> My Leave Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Calendar size={24} color="#6366f1" />
            <Text style={styles.statCount}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <CheckCircle2 size={24} color="#10b981" />
            <Text style={styles.statCount}>{stats.approved}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statItem}>
            <AlertCircle size={24} color="#f59e0b" />
            <Text style={styles.statCount}>{stats.unattained}</Text>
            <Text style={styles.statLabel}>Unattained</Text>
          </View>
          <View style={styles.statItem}>
            <XCircle size={24} color="#ef4444" />
            <Text style={styles.statCount}>{stats.rejected}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
          <View style={styles.statItem}>
            <AlertCircle size={24} color="#f59e0b" />
            <Text style={styles.statCount}>{stats.suspended}</Text>
            <Text style={styles.statLabel}>Suspended</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabContainer}>
        {(['Unattained', 'Approved', 'Rejected', 'Suspended'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}>
            <Text
              style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.leavesList}>
        {filteredLeaves.map((leave) => (
          <View key={leave.leave_id} style={styles.leaveCard}>
            <View style={styles.leaveHeader}>
              <Text style={styles.leaveType}>{leave.leave_ground_text}</Text>
              {getStatusIcon(leave.leave_track_status_text)}
            </View>
            <View style={styles.leaveDates}>
              <Text style={styles.dateLabel}>From:</Text>
              <Text style={styles.dateText}>{leave.leave_from_date}</Text>
              <Text style={styles.dateLabel}>To:</Text>
              <Text style={styles.dateText}>{leave.leave_to_date}</Text>
            </View>
            <Text style={styles.reason}>{leave.leave_comment}</Text>
            {leave.leave_track_status_text === 'Unattained' && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelRequest(leave.leave_id)}>
                <Text style={styles.cancelText}>Cancel Request</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
} // Add closing brace for the MyLeaves component

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#6366f1',
  },
  tabText: {
    color: '#64748b',
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
  },
  leavesList: {
    gap: 12,
  },
  leaveCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leaveType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  leaveDates: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#1e293b',
    marginRight: 12,
  },
  reason: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelText: {
    color: '#ef4444',
    fontWeight: '500',
  },
  noRecordsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  noRecordsText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});