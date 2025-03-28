import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Pressable, Image, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { Search, Menu, Users, LogOut, User, MapPin, Calendar, FileText, DollarSign, FileCheck, ClipboardList, X } from 'lucide-react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserData {
  u_fname: string;
  u_mname: string;
  u_lname: string;
  u_pro_image: string | null;
  u_pro_img?: string;
}

const NotificationDropdown = ({ notifications, style }: { notifications: string[], style: any }) => (
  <Animated.View style={[styles.dropdown, style]}>
    {notifications.map((notification, index) => (
      <Text key={index} style={styles.dropdownItem}>{notification}</Text>
    ))}
  </Animated.View>
);

const ProfileDropdown = ({ style }: { style: any }) => {
  const navigation = useNavigation();

  const handleNavigation = (route: string) => {
    if (route === 'Profile') {
      router.push('/profile');
    } else if (route === 'Logout') {
      AsyncStorage.clear();
      router.push('/');
      console.log('Logging out...');
    }
  };

  return (
    <Animated.View style={[styles.dropdown, style]}>
      <Pressable
        style={styles.dropdownItemContainer}
        onPress={() => handleNavigation('Profile')}
      >
        <User size={20} color="#1f2937" style={styles.icon} />
        <Text style={styles.dropdownItem}>Profile</Text>
      </Pressable>

      <Pressable
        style={[styles.dropdownItemContainer, styles.logoutContainer]}
        onPress={() => handleNavigation('Logout')}
      >
        <LogOut size={20} color="#ef4444" style={styles.icon} />
        <Text style={[styles.dropdownItem, styles.logoutText]}>Logout</Text>
      </Pressable>
    </Animated.View>
  );
};

const Navbar = () => {
  const navigation = useNavigation();
  // const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const notificationAnimation = useRef(new Animated.Value(0)).current;
  const profileAnimation = useRef(new Animated.Value(0)).current;

  // const notifications = ['Notification 1', 'Notification 2', 'Notification 3'];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = await AsyncStorage.getItem('userid');
        if (!userId) {
          setError('No user ID found');
          return;
        }

        const response = await fetch('http://localhost/dashboard.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });

        const result = await response.json();
        console.log('API Response:', result);

        if (result.status === 'success') {
          setUserData(result.data);
        } else {
          setError(result.message || 'Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // const toggleNotifications = () => {
  //   if (showNotifications) {
  //     Animated.timing(notificationAnimation, {
  //       toValue: 0,
  //       duration: 200,
  //       useNativeDriver: false,
  //     }).start(() => setShowNotifications(false));
  //   } else {
  //     setShowNotifications(true);
  //     Animated.timing(notificationAnimation, {
  //       toValue: 1,
  //       duration: 200,
  //       useNativeDriver: false,
  //     }).start();
  //     setShowProfile(false);
  //   }
  // };

  const toggleProfile = () => {
    if (showProfile) {
      Animated.timing(profileAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setShowProfile(false));
    } else {
      setShowProfile(true);
      Animated.timing(profileAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      // setShowNotifications(false);
    }
  };

  // const notificationDropdownStyle = {
  //   height: notificationAnimation.interpolate({
  //     inputRange: [0, 1],
  //     outputRange: [0, 100],
  //   }),
  //   opacity: notificationAnimation,
  // };

  const profileDropdownStyle = {
    height: profileAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 100],
    }),
    opacity: profileAnimation,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.navbar}>
      <View style={styles.navLeft}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Text style={styles.menuButton}>☰</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navRight}>
        {/* <View style={styles.notificationContainer}>
          <Pressable style={styles.iconButton} onPress={toggleNotifications}>
            <Bell size={24} color="#1f2937" />
            <View style={styles.notificationBadge} />
          </Pressable>
          {showNotifications && (
            <NotificationDropdown notifications={notifications} style={notificationDropdownStyle} />
          )}
        </View> */}
        <View style={styles.profileContainer}>
          <Pressable style={styles.profileButton} onPress={toggleProfile}>
            {userData?.u_pro_img ? (
              <Image
                source={{ uri: userData.u_pro_img }}
                style={styles.profileImage}
              />
            ) : (
              <Image
                source={require('../assets/images/default_profile.png')}
                style={styles.profileImage}
              />
            )}
          </Pressable>
          {showProfile && <ProfileDropdown style={profileDropdownStyle} />}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#ffffff',
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    fontSize: 24,
    color: 'black',
    marginRight: 15,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // notificationContainer: {
  //   position: 'relative',
  //   marginRight: 20,
  // },
  iconButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
  },
  profileContainer: {
    position: 'relative',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    right: 0,
    width: 200,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1,
    overflow: 'hidden',
  },
  dropdownItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dropdownItem: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 10,
  },
  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
    paddingTop: 8,
  },
  logoutText: {
    color: '#ef4444',
  },
  icon: {
    marginRight: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#ffffff',
  },
});

export default Navbar;