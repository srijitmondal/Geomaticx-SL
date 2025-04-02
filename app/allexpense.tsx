import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Search, Filter } from 'lucide-react-native';

// Define status types
type ExpenseStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected';

// Interface for the raw API response
interface ApiExpenseResponse {
  expense_track_id: string;
  expense_track_title: string;
  expense_type_id: number;
  expense_total_amount: number;
  expense_track_status: number | null;
  expense_track_app_rej_remarks: string | null;
  expense_track_created_at: string;
  expense_track_created_by: number;
  expense_track_submitted_to: number | null;
  expense_track_approved_rejected_by: number | null;
  expense_track_approved_rejected_at: string | null;
  created_by_full_name: string;
}

// Interface for our transformed expense data
interface Expense {
  id: string;
  expense_id: string;
  employee: string;
  expense_title: string;
  expense_type: string;
  amount: number;
  date: string;
  status: ExpenseStatus;
  remarks: string | null;
}

export default function AllExpenses() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ExpenseStatus | 'All'>('All');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Helper function to format date
  const formatDate = useCallback((dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Helper function to map expense types
  const getExpenseType = useCallback((typeCode: number): string => {
    switch (typeCode) {
      case 0: return 'Travel';
      case 1: return 'Food';
      case 2: return 'Accommodation';
      case 3: return 'Office Supplies';
      default: return 'Other';
    }
  }, []);

  // Helper function to map status
  const getStatus = useCallback((statusCode: number | null): ExpenseStatus => {
    if (statusCode === null) return 'Draft';
    switch (statusCode) {
      case 0: return 'Rejected';
      case 1: return 'Approved';
      case 2: return 'Pending';
      default: return 'Draft';
    }
  }, []);

  // Data transformer function
  const transformExpenseData = useCallback((apiData: ApiExpenseResponse[]): Expense[] => {
    return apiData.map((item) => ({
      id: item.expense_track_id.toString(),
      expense_id: item.expense_track_id,
      employee: item.created_by_full_name,
      expense_title: item.expense_track_title,
      expense_type: getExpenseType(item.expense_type_id),
      amount: item.expense_total_amount,
      date: formatDate(item.expense_track_created_at),
      status: getStatus(item.expense_track_status),
      remarks: item.expense_track_app_rej_remarks,
    }));
  }, [formatDate, getExpenseType, getStatus]);

  // Fetch data from PHP endpoint
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost/all-expense.php', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON but got: ${text.substring(0, 50)}...`);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiData: ApiExpenseResponse[] = await response.json();
      const transformedData = transformExpenseData(apiData);
      setExpenses(transformedData);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch expenses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [transformExpenseData]);

  // Initial data fetch
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExpenses();
  }, [fetchExpenses]);

  // Filter expenses based on search and status
  const filteredExpenses = useCallback(() => {
    return expenses.filter((expense) => {
      const matchesSearch =
        expense.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.expense_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (expense.remarks && expense.remarks.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = selectedStatus === 'All' || expense.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [expenses, searchQuery, selectedStatus]);

  const getStatusColor = useCallback((status: ExpenseStatus) => {
    switch (status) {
      case 'Approved': return '#10b981';
      case 'Pending': return '#f59e0b';
      case 'Rejected': return '#ef4444';
      case 'Draft': return '#64748b';
      default: return '#64748b';
    }
  }, []);

  const renderExpenseItem = useCallback(({ item }: { item: Expense }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <Text style={styles.employeeName}>{item.employee}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.expenseDetails}>
        <Text style={styles.expenseTitle}>{item.expense_title}</Text>
        <Text style={styles.amount}>₹{item.amount.toFixed(2)}</Text>
      </View>
      <View style={styles.expenseDetails}>
        <Text style={styles.expenseType}>{item.expense_type}</Text>
        <Text style={styles.dates}>{item.date}</Text>
      </View>
      {item.remarks && (
        <Text style={styles.remarks}>Remarks: {item.remarks}</Text>
      )}
    </View>
  ), [getStatusColor]);

  const handleFilterSelect = (status: typeof selectedStatus) => {
    setSelectedStatus(status);
    setShowFilterDropdown(false);
  };

  if (loading && expenses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchExpenses}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!loading && expenses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No expenses found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchExpenses}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search expenses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterDropdown(!showFilterDropdown)}
        >
          <Filter size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Filter Dropdown */}
      {showFilterDropdown && (
        <View style={styles.dropdown}>
          <TouchableOpacity onPress={() => handleFilterSelect('All')} style={styles.dropdownItem}>
            <Text style={styles.dropdownText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleFilterSelect('Draft')} style={styles.dropdownItem}>
            <Text style={styles.dropdownText}>Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleFilterSelect('Pending')} style={styles.dropdownItem}>
            <Text style={styles.dropdownText}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleFilterSelect('Approved')} style={styles.dropdownItem}>
            <Text style={styles.dropdownText}>Approved</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleFilterSelect('Rejected')} style={styles.dropdownItem}>
            <Text style={styles.dropdownText}>Rejected</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredExpenses()}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366f1']}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#64748b',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: 70,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1f2937',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  expenseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  expenseTitle: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  expenseType: {
    fontSize: 16,
    color: '#64748b',
  },
  amount: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  dates: {
    fontSize: 16,
    color: '#64748b',
  },
  remarks: {
    fontSize: 14,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 8,
  },
});