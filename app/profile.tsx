import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Briefcase,
  Camera,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

interface UserData {
  u_created_at: string | number | Date;
  u_street_addr: string;
  u_mob: string;
  user_id: string;
  u_fname: string;
  u_mname: string;
  u_lname: string;
  u_email: string;
  u_phone: string;
  u_location: string;
  u_pro_img?: string;
}

const ProfileScreen = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null); // State for user role
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isImageChanged, setIsImageChanged] = useState(false); // State for image change

  // Form fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = await AsyncStorage.getItem('userid');
        if (!userId) {
          setError('No user ID found');
          return;
        }

        // Fetch user data
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
          setEmail(result.data.u_email || '');
          setPhone(result.data.u_phone || '');
          setLocation(result.data.u_location || '');

          // Fetch user role
          fetchUserRole(userId);
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

    const fetchUserRole = async (userId: string) => {
      try {
        const response = await fetch('http://localhost/user_role_fetcher.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: parseInt(userId, 10) }),
        });

        const result = await response.json();
        if (result.role_name) {
          setUserRole(result.role_name);
        } else {
          setUserRole('Not assigned');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('Failed to fetch role');
      }
    };

    fetchUserData();
  }, []);

  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        alert('Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
        setIsImageChanged(true); // Set this flag when image is changed
        setShowImageOptions(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image');
    }
  };

  const handleSave = async () => {
    try {
      const userId = await AsyncStorage.getItem('userid');

      if (isImageChanged && profileImage) {
        // Create form data for image upload
        const formData = new FormData();
        const imageBlob = await (await fetch(profileImage)).blob();
        formData.append('image', imageBlob, 'profile.jpg');
        if (userId) {
          formData.append('userId', userId);
        } else {
          throw new Error('User ID is null');
        }

        // Upload image to server
        const response = await fetch(
          'http://localhost/upload_profile_image.php',
          {
            method: 'POST',
            body: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        const result = await response.json();
        if (result.status === 'success') {
          setIsImageChanged(false);
        } else {
          alert('Failed to upload image');
        }
      }

      // Handle other field changes
      if (isEditing) {
        // Your existing save logic for other fields
        setIsEditing(false);
      }

      console.log('Changes saved:', { email, phone, location, profileImage });
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0891b2" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No user data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.avatarContainer}
          onPress={() => setShowImageOptions(true)}
        >
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : userData.u_pro_img
                ? { uri: userData.u_pro_img }
                : require('../assets/images/default_profile.png')
            }
            style={styles.avatar}
          />
          <View style={styles.cameraIconContainer}>
            <Camera size={20} color="#ffffff" />
          </View>
        </Pressable>
        <Text style={styles.name}>
          {`${userData.u_fname}${
            userData.u_mname ? ` ${userData.u_mname} ` : ' '
          }${userData.u_lname}`}
        </Text>
        <Text style={styles.id}>USER ID: {userData.user_id}</Text>
      </View>

      {/* Add the image options modal */}
      {showImageOptions && (
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowImageOptions(false)}
        >
          <View style={styles.imageOptionsCard}>
            <Pressable style={styles.imageOption} onPress={pickImage}>
              <Text style={styles.imageOptionText}>Choose from Gallery</Text>
            </Pressable>
            <Pressable
              style={[styles.imageOption, styles.cancelOption]}
              onPress={() => setShowImageOptions(false)}
            >
              <Text style={[styles.imageOptionText, styles.cancelText]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.infoCard}>
          {/* Email */}
          <View style={styles.infoItem}>
            <Mail size={20} color="#64748b" />
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
              />
            ) : (
              <Text style={styles.infoText}>{email || 'Not provided'}</Text>
            )}
            <Pressable onPress={() => setIsEditing(!isEditing)}>
              <Edit size={20} color="#64748b" style={styles.editIcon} />
            </Pressable>
          </View>

          {/* Phone */}
          <View style={styles.infoItem}>
            <Phone size={20} color="#64748b" />
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
              />
            ) : (
              <Text style={styles.infoText}>
                {userData.u_mob || 'Not provided'}
              </Text>
            )}
            <Pressable onPress={() => setIsEditing(!isEditing)}>
              <Edit size={20} color="#64748b" style={styles.editIcon} />
            </Pressable>
          </View>

          {/* Location */}
          <View style={styles.infoItem}>
            <MapPin size={20} color="#64748b" />
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={location}
                onChangeText={setLocation}
                placeholder="Enter location"
              />
            ) : (
              <Text style={styles.infoText}>
                {userData.u_street_addr || 'Not provided'}
              </Text>
            )}
            <Pressable onPress={() => setIsEditing(!isEditing)}>
              <Edit size={20} color="#64748b" style={styles.editIcon} />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Work Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Briefcase size={20} color="#64748b" />
            <Text style={styles.infoText}>{userRole || 'Not assigned'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Calendar size={20} color="#64748b" />
            <Text style={styles.infoText}>
              Joined:{' '}
              {userData.u_created_at
                ? new Date(userData.u_created_at).toLocaleDateString()
                : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Show save button if either editing mode is on or image is changed */}
      {(isEditing || isImageChanged) && (
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </Pressable>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0891b2',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  name: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#0f172a',
    marginBottom: 4,
  },
  id: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#94a3b8',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  imageOptionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 300,
  },
  imageOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginBottom: 8,
  },
  imageOptionText: {
    fontSize: 16,
    color: '#0f172a',
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  cancelOption: {
    backgroundColor: '#fee2e2',
  },
  cancelText: {
    color: '#ef4444',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 12,
    flex: 1,
  },
  editInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 12,
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#64748b',
  },
  editIcon: {
    marginLeft: 12,
  },
  saveButton: {
    backgroundColor: '#0891b2',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
});

export default ProfileScreen;
