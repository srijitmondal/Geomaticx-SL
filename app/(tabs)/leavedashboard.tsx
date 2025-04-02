import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Plus } from 'lucide-react-native';
import Modal from 'react-native-modal';
import { TextInput } from 'react-native-gesture-handler';

type Holiday = {
  id: string;
  name: string;
  date: string;
  isSunday: boolean;
};

const HolidayCalendar = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [markedDates, setMarkedDates] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    name: '',
    date: '',
  });

  // Initial holidays data (West Bengal holidays for 2025-2026)
  const initialHolidays: Holiday[] = [
    { id: '1', name: 'Bengali New Year', date: '2025-04-15', isSunday: false },
    { id: '2', name: 'Good Friday', date: '2025-04-18', isSunday: false },
    { id: '3', name: 'May Day', date: '2025-05-01', isSunday: false },
    { id: '4', name: 'Independence Day / Janmashtami', date: '2025-08-15', isSunday: false },
    { id: '5', name: 'Maha Shasthi (Durgapuja)', date: '2025-09-28', isSunday: true },
    { id: '6', name: 'Maha Saptami (Durgapuja)', date: '2025-09-29', isSunday: false },
    { id: '7', name: 'Maha Ashtami (Durgapuja)', date: '2025-09-30', isSunday: false },
    { id: '8', name: 'Maha Navami (Durgapuja)', date: '2025-10-01', isSunday: false },
    { id: '9', name: 'Vijaya Dashami / Gandhi Jayanti', date: '2025-10-02', isSunday: false },
    { id: '10', name: 'Diwali / Kali Puja', date: '2025-10-20', isSunday: false },
    { id: '11', name: 'Bhatri Ditiya', date: '2025-10-23', isSunday: false },
    { id: '12', name: 'Christmas', date: '2025-12-25', isSunday: false },
    { id: '13', name: 'New Year Day', date: '2026-01-01', isSunday: false },
    { id: '14', name: 'Republic Day', date: '2026-01-26', isSunday: false },
    { id: '15', name: 'Dol Yatra', date: '2026-03-03', isSunday: false },
  ];

  // Initialize holidays and mark Sundays
  useEffect(() => {
    // Add Sundays to holidays
    const allHolidays = [...initialHolidays];
    const sundays = getSundaysBetween(new Date(2025, 0, 1), new Date(2026, 11, 31));
    
    sundays.forEach((sunday, index) => {
      const dateStr = formatDate(sunday);
      if (!allHolidays.some(h => h.date === dateStr)) {
        allHolidays.push({
          id: `sunday-${index}`,
          name: 'Sunday',
          date: dateStr,
          isSunday: true
        });
      }
    });

    setHolidays(allHolidays);
    updateMarkedDates(allHolidays);
  }, []);

  // Format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Get all Sundays between two dates
  const getSundaysBetween = (startDate: Date, endDate: Date): Date[] => {
    const sundays: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      if (currentDate.getDay() === 0) { // Sunday
        sundays.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return sundays;
  };

  // Update marked dates for calendar
  const updateMarkedDates = (holidayList: Holiday[]) => {
    const marked: any = {};
    
    holidayList.forEach(holiday => {
      marked[holiday.date] = {
        selected: true,
        selectedColor: holiday.isSunday ? '#3498db' : '#e74c3c',
        customStyles: {
          container: {
            borderRadius: 5,
          },
          text: {
            color: 'white',
            fontWeight: 'bold',
          }
        }
      };
    });
    
    setMarkedDates(marked);
  };

  // Add new holiday
  const handleAddHoliday = () => {
    if (newHoliday.name && newHoliday.date) {
      const newHolidayObj: Holiday = {
        id: Date.now().toString(),
        name: newHoliday.name,
        date: newHoliday.date,
        isSunday: false
      };
      
      setHolidays(prev => [...prev, newHolidayObj]);
      updateMarkedDates([...holidays, newHolidayObj]);
      setNewHoliday({ name: '', date: '' });
      setIsModalVisible(false);
    }
  };

  // Render holiday item
  const renderHolidayItem = ({ item }: { item: Holiday }) => (
    <View style={[
      styles.holidayItem,
      { backgroundColor: item.isSunday ? '#3498db' : '#e74c3c' }
    ]}>
      <Text style={styles.holidayDate}>{formatDisplayDate(item.date)}</Text>
      <Text style={styles.holidayName}>{item.name}</Text>
    </View>
  );

  // Format date for display (DD MMM YYYY)
  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        markingType={'custom'}
        theme={{
          calendarBackground: '#ffffff',
          todayTextColor: '#2d4150',
          dayTextColor: '#2d4150',
          monthTextColor: '#2d4150',
          textDisabledColor: '#d9d9d9',
          selectedDayBackgroundColor: '#e74c3c',
          selectedDayTextColor: '#ffffff',
        }}
      />

      <FlatList
        data={holidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
        renderItem={renderHolidayItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setIsModalVisible(true)}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>

      <Modal isVisible={isModalVisible}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Holiday</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Holiday Name"
            value={newHoliday.name}
            onChangeText={text => setNewHoliday({...newHoliday, name: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Date (YYYY-MM-DD)"
            value={newHoliday.date}
            onChangeText={text => setNewHoliday({...newHoliday, date: text})}
            keyboardType="numbers-and-punctuation"
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.addButtonModal]}
              onPress={handleAddHoliday}
            >
              <Text style={styles.buttonText}>Add Holiday</Text>
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
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  holidayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  holidayName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 2,
  },
  holidayDate: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  addButtonModal: {
    backgroundColor: '#2ecc71',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default HolidayCalendar;