import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useState } from 'react';
// import Navbar from '../components/Navbar';

// Define TypeScript types for requisitions
type Requisition = {
  id: string;
  user: string;
  request: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};

const requisitions: Requisition[] = [
  {
    id: '1',
    user: 'John Doe',
    request: 'Leave request for 5 days',
    status: 'Pending',
  },
  {
    id: '2',
    user: 'Jane Smith',
    request: 'Work from home for 3 days',
    status: 'Approved',
  },
  {
    id: '3',
    user: 'Mike Johnson',
    request: 'Project extension request',
    status: 'Rejected',
  },
];

export default function Requisitions() {
  const [updatedRequests, setUpdatedRequests] = useState(requisitions);

  const handleAction = (id: string, action: 'Approved' | 'Rejected') => {
    setUpdatedRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: action } : req))
    );
  };

  const statusStyles: Record<'Pending' | 'Approved' | 'Rejected', object> = {
    Pending: styles.pending,
    Approved: styles.approved,
    Rejected: styles.rejected,
  };

  const renderRequisition = ({ item }: { item: Requisition }) => (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        <Text style={styles.userName}>{item.user}</Text>
        <Text style={styles.request}>{item.request}</Text>
        <Text style={[styles.status, statusStyles[item.status]]}>{item.status}</Text>
      </View>
      {item.status === 'Pending' && (
        <View style={styles.actions}>
          <Pressable onPress={() => handleAction(item.id, 'Approved')} style={[styles.button, styles.approve]}>
            <Check color="white" size={20} />
            <Text style={styles.buttonText}>Approve</Text>
          </Pressable>
          <Pressable onPress={() => handleAction(item.id, 'Rejected')} style={[styles.button, styles.reject]}>
            <X color="white" size={20} />
            <Text style={styles.buttonText}>Reject</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View>
        {/* <Navbar/> */}
      </View>
      <Text style={styles.heading}>All Requests</Text>
      <FlatList
        data={updatedRequests}
        renderItem={renderRequisition}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 0,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
  },
  listContainer: {
    gap: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  infoContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  request: {
    fontSize: 16,
    color: '#475569',
    marginVertical: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  pending: {
    color: '#D97706',
  },
  approved: {
    color: '#16A34A',
  },
  rejected: {
    color: '#DC2626',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
  },
  approve: {
    backgroundColor: '#16A34A',
  },
  reject: {
    backgroundColor: '#DC2626',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});
