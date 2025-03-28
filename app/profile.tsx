import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, ScrollView, Pressable, TextInput, ActivityIndicator } from "react-native";
import { Mail, Phone, MapPin, Briefcase, Clock, Calendar, Edit } from "lucide-react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  u_department: string;
  u_employment_type: string;
  u_join_date: string;
  u_pro_image: string | null;
  u_pro_img?: string;
}

const ProfileScreen = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

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
          setEmail(result.data.u_email || "");
          setPhone(result.data.u_phone || "");
          setLocation(result.data.u_location || "");
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

  const handleSave = () => {
    setIsEditing(false);
    console.log("Changes saved:", { email, phone, location });
    // Here you would typically send the updated data to your backend
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
        <Image
          source={
            userData.u_pro_img 
              ? { uri: userData.u_pro_img }
              : require('../assets/images/default_profile.png')
          }
          style={styles.avatar}
        />
        <Text style={styles.name}>
          {userData.u_fname} {userData.u_mname} {userData.u_lname}
        </Text>
        {/* <Text style={styles.role}>Software Engineer</Text> */}
        <Text style={styles.id}>USER ID: {userData.user_id}</Text>
      </View>

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
              <Text style={styles.infoText}>{email || "Not provided"}</Text>
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
              <Text style={styles.infoText}>{userData.u_mob || "Not provided"}</Text>
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
              <Text style={styles.infoText}>{userData.u_street_addr || "Not provided"}</Text>
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
          {/* <View style={styles.infoItem}>
            <Briefcase size={20} color="#64748b" />
            <Text style={styles.infoText}>{userData.u_department || "Engineering Department"}</Text>
          </View> */}
          {/* <View style={styles.infoItem}>
            <Clock size={20} color="#64748b" />
            <Text style={styles.infoText}>{userData.u_employment_type || "Full Time"}</Text>
          </View> */}
          <View style={styles.infoItem}>
            <Calendar size={20} color="#64748b" />
            <Text style={styles.infoText}>
              Joined: {userData.u_created_at ? new Date(userData.u_created_at).toLocaleDateString() : "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {isEditing && (
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
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f8fafc",
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    fontFamily: "Inter-Bold",
    fontSize: 24,
    color: "#0f172a",
    marginBottom: 4,
  },
  role: {
    fontFamily: "Inter-Medium",
    fontSize: 16,
    color: "#64748b",
    marginBottom: 8,
  },
  id: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#94a3b8",
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: "Inter-SemiBold",
    fontSize: 18,
    color: "#0f172a",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoText: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    color: "#0f172a",
    marginLeft: 12,
    flex: 1,
  },
  editInput: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    color: "#0f172a",
    marginLeft: 12,
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#64748b",
  },
  editIcon: {
    marginLeft: 12,
  },
  saveButton: {
    backgroundColor: "#0891b2",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 16,
    color: "#ffffff",
  },
});

export default ProfileScreen;