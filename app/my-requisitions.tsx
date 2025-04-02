import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// Update the Requisition interface
interface Requisition {
  requisition_id: string;
  requisition_title: string;
  requisition_date: string;
  requisition_status: number | null;
  requisition_desc: string; // Changed from requisition_description
  user_email: string;
  user_first_name: string;
  user_last_name: string;
}

export default function MyRequisitions() {
  // Update the activeTab state type
  const [activeTab, setActiveTab] = useState<
    'Unattained' | 'Approved' | 'Rejected' | 'Suspended'
  >('Unattained');
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch requisitions from the API
  const fetchRequisitions = async () => {
    try {
      const userId = await AsyncStorage.getItem('userid'); // Get user ID from AsyncStorage
      if (!userId) {
        Alert.alert('Error', 'User ID not found');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost/my-requisitions.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: parseInt(userId, 10) }),
      });

      const data = await response.json();
      console.log('Fetched requisitions:', data); // Log the fetched data
      if (Array.isArray(data)) {
        setRequisitions(data);
      } else {
        Alert.alert('Error', data.error || 'Failed to fetch requisitions');
      }
    } catch (error) {
      console.error('Error fetching requisitions:', error);
      Alert.alert(
        'Error',
        'Unable to fetch requisitions. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Refresh data when the screen is focused
  useFocusEffect(
    useCallback(() => {
      setLoading(true); // Show loading indicator while fetching data
      fetchRequisitions();
    }, [])
  );

  // Update the stats calculations
  const stats = {
    total: requisitions.length,
    approved: requisitions.filter((req) => req.requisition_status === 1).length,
    unattained: requisitions.filter((req) => req.requisition_status === null)
      .length,
    rejected: requisitions.filter((req) => req.requisition_status === 0).length,
    suspended: requisitions.filter((req) => req.requisition_status === 2)
      .length,
  };

  // Update the filtering logic
  const getStatusFromTab = (tab: string): number | null => {
    switch (tab) {
      case 'Approved':
        return 1;
      case 'Rejected':
        return 0;
      case 'Suspended':
        return 2;
      case 'Unattained':
        return null;
      default:
        return null;
    }
  };

  const filteredRequisitions = requisitions.filter(
    (req) => req.requisition_status === getStatusFromTab(activeTab)
  );

  // Update the getStatusIcon function to work with numeric status
  const getStatusIcon = (status: number | null) => {
    switch (status) {
      case 1:
        return <CheckCircle size={20} color="#10b981" />;
      case null:
        return <Clock size={20} color="#f59e0b" />;
      case 0:
        return <XCircle size={20} color="#ef4444" />;
      case 2:
        return <AlertCircle size={20} color="#f59e0b" />;
      default:
        return null;
    }
  };

  const handleCancelRequest = (id: string) => {
    Alert.alert(
      'Cancel Requisition',
      'Are you sure you want to cancel this requisition?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => console.log('Cancelled requisition:', id),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text>Loading requisitions...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>My Requisition Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <ClipboardList size={24} color="#6366f1" />
            <Text style={styles.statCount}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <CheckCircle size={24} color="#10b981" />
            <Text style={styles.statCount}>{stats.approved}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statItem}>
            <Clock size={24} color="#f59e0b" />
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
        {(['Unattained', 'Approved', 'Rejected', 'Suspended'] as const).map(
          (tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <View style={styles.requisitionsList}>
        {filteredRequisitions.map((req) => (
          <View key={req.requisition_id} style={styles.requisitionCard}>
            <View style={styles.requisitionHeader}>
              <Text style={styles.requisitionTitle}>
                {req.requisition_title}
              </Text>
              {getStatusIcon(req.requisition_status)}
            </View>
            <Text style={styles.requisitionDate}>
              Date: {new Date(req.requisition_date).toLocaleDateString()}
            </Text>
            <Text style={styles.requisitionDescription}>
              {req.requisition_desc}
            </Text>
            {req.requisition_status === null && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelRequest(req.requisition_id)}
              >
                <Text style={styles.cancelText}>Cancel Request</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

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
  requisitionsList: {
    gap: 12,
  },
  requisitionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  requisitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requisitionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  requisitionDate: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  requisitionDescription: {
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
});
