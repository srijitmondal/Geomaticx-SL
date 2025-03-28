import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Modal } from 'react-native';
import { Search, FileText, Filter, X } from 'lucide-react-native';

const ExpenseDetails = () => {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedExpense, setSelectedExpense] = useState<{ title: string; dateSubmitted: string; location: string; type: string; amount: number; status?: string; createdBy?: string; approvedBy?: string } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterType, setFilterType] = useState('title'); // 'title', 'date', 'location'
  const [data, setData] = useState<{ title: string; dateSubmitted: string; location: string; type: string; amount: number; status?: string }[]>([]);
  const [filteredData, setFilteredData] = useState<{ title: string; dateSubmitted: string; location: string; type: string; amount: number; status?: string }[]>([]);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await fetch('http://192.168.1.118/server/server.php');
        const result = await response.json();
        setData(result);
        setFilteredData(result);
      } catch (error) {
        console.error("Error fetching expenses:", error);
      }
    };
    
    fetchExpenses();
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredData(data);
      return;
    }

    const searchLower = searchText.toLowerCase();
    const filtered = data.filter(expense => {
      switch (filterType) {
        case 'title':
          return expense.title.toLowerCase().includes(searchLower);
        case 'date':
          return expense.dateSubmitted.toLowerCase().includes(searchLower);
        case 'location':
          return expense.location.toLowerCase().includes(searchLower);
        default:
          return expense.title.toLowerCase().includes(searchLower);
      }
    });
    setFilteredData(filtered);
  }, [searchText, filterType, data]);

  const handleViewDetails = (expense: { title: string; dateSubmitted: string; location: string; type: string; amount: number; status?: string }) => {
    setSelectedExpense(expense);
    setModalVisible(true);
  };

  const handleFilterSelect = (type: string) => {
    setFilterType(type);
    setFilterModalVisible(false);
  };

  const renderItem = ({ item }: { item: { title: string; dateSubmitted: string; location: string; type: string; amount: number; status?: string } }) => {
    const status = item?.status || 'pending';

    return (
      <View style={styles.expenseCard}>
        <View style={styles.expenseHeader}>
          <Text style={styles.expenseTitle}>{item.title}</Text>
          <View style={[styles.statusBadge, getStatusStyle(status)]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>

        <View style={styles.expenseDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>{item.type}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>{item.amount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{item.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{item.dateSubmitted}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => handleViewDetails(item)}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getStatusStyle = (status: string = 'pending') => {
    if (!status) return {};
    switch (status.toLowerCase()) {
      case 'approved': return styles.statusApproved;
      case 'pending': return styles.statusPending;
      case 'rejected': return styles.statusRejected;
      default: return {};
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.welcomeBanner}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeText}>My Expenses</Text>
          <Text style={styles.nameText}>Expense History</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search by ${filterType}...`}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Filter size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FileText size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No expenses found</Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.filterModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter By</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.filterOption, filterType === 'type' && styles.filterOptionSelected]}
              onPress={() => handleFilterSelect('type')}
            >
              <Text style={[styles.filterOptionText, filterType === 'type' && styles.filterOptionTextSelected]}>
                Type
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterOption, filterType === 'date' && styles.filterOptionSelected]}
              onPress={() => handleFilterSelect('date')}
            >
              <Text style={[styles.filterOptionText, filterType === 'date' && styles.filterOptionTextSelected]}>
                Date
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterOption, filterType === 'location' && styles.filterOptionSelected]}
              onPress={() => handleFilterSelect('location')}
            >
              <Text style={[styles.filterOptionText, filterType === 'location' && styles.filterOptionTextSelected]}>
                Location
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Expense Details</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedExpense && (
              <View style={styles.modalBody}>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalLabel}>Title</Text>
                  <Text style={styles.modalValue}>{selectedExpense.title}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalLabel}>Type</Text>
                  <Text style={styles.modalValue}>{selectedExpense.type}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalLabel}>Amount</Text>
                  <Text style={styles.modalValue}>{selectedExpense.amount}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalLabel}>Location</Text>
                  <Text style={styles.modalValue}>{selectedExpense.location}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalLabel}>Created By</Text>
                  <Text style={styles.modalValue}>{selectedExpense.createdBy}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalLabel}>Date Submitted</Text>
                  <Text style={styles.modalValue}>{selectedExpense.dateSubmitted}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalLabel}>Approved By</Text>
                  <Text style={styles.modalValue}>{selectedExpense.approvedBy}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalLabel}>Status</Text>
                  <View style={[styles.statusBadge, getStatusStyle(selectedExpense.status)]}>
                    <Text style={styles.statusText}>{selectedExpense.status}</Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  welcomeBanner: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    margin: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  listContainer: {
    padding: 16,
  },
  expenseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
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
  expenseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusApproved: {
    backgroundColor: '#d1fae5',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusRejected: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  expenseDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 80,
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  viewButton: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  filterModalContent: {
    width: '80%',
    maxHeight: 'auto',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    gap: 16,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalLabel: {
    fontSize: 16,
    color: '#6b7280',
    flex: 1,
  },
  modalValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  closeModalButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  closeModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  filterOptionSelected: {
    backgroundColor: '#6366f1',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
  },
  filterOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default ExpenseDetails;