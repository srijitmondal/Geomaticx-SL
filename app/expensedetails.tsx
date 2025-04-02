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
import { DollarSign, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Expense {
  expense_id: string;
  expense_title: string;
  expense_type: string;
  expense_amount: number;
  expense_status: 'Pending' | 'Approved' | 'Rejected';
  expense_date: string;
  expense_comment: string;
}

export default function MyExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [noRecords, setNoRecords] = useState(false);

  useEffect(() => {
    const fetchExpenses = async () => {
      const userId = await AsyncStorage.getItem('userid');
      if (!userId) {
        console.error('User ID not found in AsyncStorage');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost/my-expenses.php?userId=${userId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.status === 'error') {
          console.error('API Error:', data.message);
          setExpenses([]);
          setNoRecords(true);
        } else if (Array.isArray(data)) {
          setExpenses(data);
          setNoRecords(false);
        } else {
          console.error('Unexpected response format:', data);
        }
      } catch (error) {
        console.error('Error fetching expenses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle size={20} color="#10b981" />;
      case 'Pending':
        return <Clock size={20} color="#f59e0b" />;
      case 'Rejected':
        return <XCircle size={20} color="#ef4444" />;
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
        <Text style={styles.noRecordsText}>No expense records found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>My Expense Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <DollarSign size={24} color="#6366f1" />
            <Text style={styles.statCount}>{expenses.length}</Text>
            <Text style={styles.statLabel}>Total Expenses</Text>
          </View>
          <View style={styles.statItem}>
            <CheckCircle size={24} color="#10b981" />
            <Text style={styles.statCount}>
              {expenses.filter(expense => expense.expense_status === 'Approved').length}
            </Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statItem}>
            <Clock size={24} color="#f59e0b" />
            <Text style={styles.statCount}>
              {expenses.filter(expense => expense.expense_status === 'Pending').length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <XCircle size={24} color="#ef4444" />
            <Text style={styles.statCount}>
              {expenses.filter(expense => expense.expense_status === 'Rejected').length}
            </Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
        </View>
      </View>

      <View style={styles.expensesList}>
        {expenses.map(expense => (
          <View key={expense.expense_id} style={styles.expenseCard}>
            <View style={styles.expenseHeader}>
              <Text style={styles.expenseTitle}>{expense.expense_title}</Text>
              {getStatusIcon(expense.expense_status)}
            </View>
            <Text style={styles.expenseType}>Type: {expense.expense_type}</Text>
            <Text style={styles.expenseAmount}>Amount: ${expense.expense_amount}</Text>
            <Text style={styles.expenseDate}>Date: {expense.expense_date}</Text>
            <Text style={styles.expenseComment}>Comment: {expense.expense_comment}</Text>
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
  expensesList: {
    gap: 12,
  },
  expenseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 12,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  expenseType: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  expenseAmount: {
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  expenseComment: {
    fontSize: 14,
    color: '#64748b',
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