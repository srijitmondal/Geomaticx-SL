import React, { useState,useEffect } from 'react';
import {
  View,
  Switch,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  Image,
  Modal,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronLeft, ChevronRight, CreditCard as Edit2, Lock, Trash2, ArrowLeft, Plus, Upload, Check } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import moment from "moment";
import DropDownPicker from "react-native-dropdown-picker";
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';


interface RoleData {
  role_id: number;
  role_name: string;
  user_count: number;
}

interface UserDetails {
  u_id: string;
  user_id: string;
  u_fname: string;
  u_mname: string;
  u_lname: string;
  user: string;
  u_email: string;
  u_mob: string;
  u_city: string;
  u_state: string;
  u_country: string;
  u_organization: string;
  u_pro_img: string;
  u_cv: string;
  u_created_at: string;
  role_name: string;
  user_status: string;
}


type FormData = {
  userId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: 'male' | 'female';
  email: string;
  mobile: string;
  role_name: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  streetAddress: string;
  organization: string;
  password: string;
  profileImage: string; // Base64 or URL
  cv: string; // Base64 or URL
  active: boolean;
  isDeleted: boolean;
  created_at: string; 
  updated_at: string;
};


type FormRoleData = {
  role_id: number; 
  role_name: string; 
  role_parent: number; 
  created_at: string; 
  updated_at: string; 
  role_active: boolean; 
  role_is_del: boolean; 
};


export default function UsersScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isMobile = width < 640;
  const [MOCK_USERS, setMOCK_USERS] = useState<Record<string, UserDetails>>({});
  const [data, setData] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<UserDetails | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddUserRole, setShowAddUserRole] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<{ label: string; value: string }[]>([]);
  const [lastRoleId, setLastRoleId] = useState<number>(1);

  const [formData, setFormData] = useState<FormData>({
    userId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'male',
    email: '',
    mobile: '',
    city: '',
    role_name: '',
    state: '',
    country: '',
    zipCode: '',
    streetAddress: '',
    organization: '',
    password: '',
    profileImage: '',
    cv: '',
    active: false,
    isDeleted: false,
    created_at: '', 
    updated_at: '',
  });
  
  const [formRoleData, setFormRoleData] = useState<FormRoleData>({
    role_id: 0,
    role_name: '',
    role_parent: 0,
    created_at: '',
    updated_at: '',
    role_active: false,
    role_is_del: false,});
  const fetchData = async () => {
    try {
      const baseUrl = Platform.select({
        web: 'http://localhost:80',
        default: 'http://192.168.1.148:80',
      });

      const response = await fetch(`${baseUrl}/user_role.php`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Origin: Platform.OS === 'web' ? window.location.origin : 'http://localhost',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();

      if (!Array.isArray(jsonData)) {
        throw new Error('Data is not in the expected format');
      }

      setData(jsonData);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      if (err instanceof Error) {
        setError(`Error: ${err.message}`);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    if (data.length > 0) {
      const newItems = data.map((item) => ({ 
        label: item.role_name,  // Display name
        value: item.role_id.toString(),  // Actual value (ID)
      }));
      
      if (JSON.stringify(newItems) !== JSON.stringify(items)) {
        setItems(newItems);
      }
    }
  }, [data]);  
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [data]);

  useEffect(() => {
    if (showAddUserRole) { // Only update when modal is shown
      const currentTimestamp = moment().format("YYYY-MM-DD HH:mm:ss");
      setFormRoleData((prev) => ({ ...prev, created_at: currentTimestamp }));
    }
    if(showAddUser){
      const currentTimestamp = moment().format("YYYY-MM-DD HH:mm:ss");
      setFormData((prev) => ({ ...prev, created_at: currentTimestamp }));
    }
  }, [showAddUserRole||showAddUser]); 
  useEffect(() => {
    if (data.length > 0) {
      const maxRoleId = Math.max(...data.map(role => role.role_id));
      setLastRoleId(maxRoleId + 1);
    }
  }, [data]);  

  const filteredRoles = data.filter((role) =>
    role.role_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const ITEMS_PER_PAGE = 10;  // Ensure this is correctly defined
  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRoles = filteredRoles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  
  const fetchData1 = async () => {
    try {
      const baseUrl = Platform.select({
        web: 'http://localhost:80',
        default: 'http://192.168.1.148:80',
      });
      
      const response = await fetch(`${baseUrl}/userdetails.php`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();
      
      if (!Array.isArray(jsonData)) {
        throw new Error('Users data is not in the expected format');
      }
      
      const newusers: Record<string, UserDetails> = {};
      jsonData.forEach((user, index) => {
        newusers[String(index + 1)] = {
          u_id: user.u_id.toString(),
          user_id: user.user_id,
          u_fname: user.u_fname,
          u_mname: user.u_mname,
          u_lname: user.u_lname,
          user: user.user,
          u_email: user.u_email,
          u_mob: user.u_mob,
          u_city: user.u_city,
          u_state: user.u_state,
          u_country: user.u_country,
          u_organization: user.u_organization,
          u_pro_img: user.u_pro_img,
          u_cv: user.u_cv,
          u_created_at: user.u_created_at,
          role_name: user.role_name,
          user_status: "ACTIVE"
        };
      });

      setMOCK_USERS(newusers);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? `Error: ${err.message}` : 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData1();
  }, []);

  const onRefresh1 = () => {
    setRefreshing(true);
    fetchData1();
  };

  useEffect(() => {
    setCurrentPage(1); 
  }, [selectedRole]);

  const users = selectedRole
    ? Object.values(MOCK_USERS).filter(user => 
        user.role_name === selectedRole &&
        (user.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
         user.u_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
         user.u_email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];
  
  const totalPages1 = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE));
  const startIndex1 = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = users.slice(startIndex, startIndex + ITEMS_PER_PAGE);   
  
  const handleRoleChange = (value: string | null) => {
    // value is the role_id (as string)
    setSelectedRole(value);
    
    if (value) {
      setFormRoleData(prev => ({
        ...prev,
        role_parent: parseInt(value), // Convert to number for database
      }));
    } else {
      setFormRoleData(prev => ({
        ...prev,
        role_parent: 0, // Or whatever default value you want
      }));
    }
  };
  
  
  const handleDelete = (userId: string) => {
    setSelectedUser(userId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    setSelectedUser(null);
  };

  const handleViewProfile = (user: UserDetails) => {
    setEditedUser(user);
    setShowUserProfile(true);
  };

  const handleSave = () => {
    // Here you would typically make an API call to update the user
    setIsEditing(false);
  };

  const handleAddUser = () => {
    setShowAddUser(true);
  };
  const handleAddUserRole = () => {
    setShowAddUserRole(true);
  };
  const handleSubmitUser = async () => {
    const baseUrl = Platform.select({
      web: "http://localhost",
      default: "http://192.168.1.148:80",
    });
  
    const jsonData = {
      user_id: formData.userId || "",
      first_name: formData.firstName || "",
      middle_name: formData.middleName || "",
      last_name: formData.lastName || "",
      gender: formData.gender || "",
      email: formData.email || "",
      mobile: formData.mobile || "",
      city: formData.city || "",
      state: formData.state || "",
      country: formData.country || "",
      zip_code: formData.zipCode || "",
      role_name: formData.role_name || "",
      street_address: formData.streetAddress || "",
      organization: formData.organization || "",
      password: formData.password || "",
      createdAt: formData.created_at || "",
      updatedAt: formData.updated_at || "",
      profile_image: formData.profileImage || "",
      cv: formData.cv || "",
      active: formData.active ? 1 : 0,
      is_deleted: formData.isDeleted ? 1 : 0,
    };
  
    console.log("Submitting User Data:", jsonData);
  
    try {
      // Send request to the PHP backend
      const response = await fetch(`${baseUrl}/user_form.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonData),
      });
  
      // Ensure the response is valid JSON
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log("Server Response:", result);
  
      if (result.success) {
        alert("User added successfully!");
        setShowAddUser(false);
        setSelectedRole(null);
        setItems([]);
        fetchData1(); // Refresh user list
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      setShowAddUser(false);
      console.error("Error submitting user:", error);
      alert("Something went wrong while adding the user. Please try again!");
    }
  
    resetForm();
  };
    
  
  const handleSubmitUserRole = async () => {
    const roleDataToSend = {
      role_id: formRoleData.role_id,
      role_name: formRoleData.role_name,
      role_parent: formRoleData.role_parent, // This is now the ID (number)
      created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
      role_active: 1,
      role_is_del: 0,
    };
    console.log("Submitting Role Data:", roleDataToSend);
  
    const baseUrl = Platform.select({
      web: 'http://localhost',
      default: 'http://192.168.1.148'
    });
  
    try {
      const response = await fetch(`${baseUrl}/role_form.php`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roleDataToSend),
      });
  
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        fetchData(); // Refresh role list
        setShowAddUserRole(false);
        setSelectedRole(null); // Reset selectedRole to null to show all roles
      } else {
        alert("Error: " + result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong!");
    }
    resetFormRole();
  };
  const resetFormRole = () => {
    setFormRoleData({
      role_id: 0,
      role_name: '',
      role_parent: 0,
      created_at: '',
      updated_at: '',
      role_active: false,
      role_is_del: false,
    });
  };      
  const resetForm = () => {
    setFormData({
      userId: '',
      firstName: '',
      middleName: '',
      lastName: '',
      gender: 'male',
      email: '',
      mobile: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      role_name: '',
      streetAddress: '',
      organization: '',
      password: '',
      profileImage: '',
      cv: '',
      active: false,
      isDeleted: false,
      created_at: '',
      updated_at: '',
    });
  };

  
  useEffect(() => {
    if (showAddUserRole) {
      const maxRoleId = data.length > 0 ? Math.max(...data.map(role => role.role_id), 0) + 1 : 1;
      setLastRoleId(maxRoleId); 
      setFormRoleData(prev => ({ ...prev, role_id: maxRoleId })); // Auto-set role_id in the form
    }
  }, [showAddUserRole, data]);
  
  const renderRoleItem = ({ item }: { item: RoleData }, isDesktop: boolean, setSelectedRole: (role: string) => void) => (
    <TouchableOpacity onPress={() => setSelectedRole(item.role_name)}>
      <Animated.View
        entering={FadeIn}
        style={[
          styles.row,
          { backgroundColor: item.role_id % 2 === 0 ? '#f9fafb' : '#ffffff' }
        ]}
      >
        <Text style={[styles.cell, { flex: isDesktop ? 0.5 : 0.3 }]}>{item.role_id}</Text>
        <View style={[styles.roleCell, { flex: isDesktop ? 2 : 1.5 }]}>
          <Text style={[styles.cell, styles.roleText]}>{item.role_name}</Text>
        </View>
        <Text style={[styles.cell, styles.countText, { flex: isDesktop ? 1 : 0.5 }]}>{item.user_count}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
  
  const renderUserItem = ({ item }: { item: UserDetails }) => (
    <TouchableOpacity onPress={() => handleViewProfile(item)}>
      <Animated.View
        entering={FadeIn}
        style={[
          styles.userRow,
          { backgroundColor: users.indexOf(item) % 2 === 0 ? '#f9fafb' : '#ffffff' }
        ]}
      >
        <View style={[styles.userInfoContainer, { flex: isDesktop ? 2 : 1.5 }]}>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{item.user}</Text>
            <Text style={styles.userId}>{item.u_id}</Text>
          </View>
        </View>
        {!isMobile && (
          <>
            <Text style={[styles.email, { flex: isDesktop ? 2.2 : 1.5 }]} numberOfLines={1}>{item.u_email}</Text>
            <Text style={[styles.mobile, { flex: 1 }]} numberOfLines={1}>{item.u_mob}</Text>
          </>
        )}
        <View style={[styles.statusContainer, { flex: isDesktop ? 0.8 : 0.6 }]}>
          <View style={[
            styles.statusBadge,
            item.user_status === 'ACTIVE' ? styles.statusActive : styles.statusInactive
          ]}>
            <Text style={[
              styles.statusText,
              item.user_status === 'ACTIVE' ? styles.statusTextActive : styles.statusTextInactive
            ]}>
              {}
            </Text>
          </View>
        </View>
        <View style={[styles.actions, { flex: isDesktop ? 1 : 0.8 }]}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleViewProfile(item)}>
            <Edit2 size={16} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Lock size={16} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item.u_id)}
          >
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );

  const renderUserProfile = () => {
    if (!editedUser) return null;

    return (
      <Modal visible={showUserProfile} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => {
                setShowUserProfile(false);
                setIsEditing(false);
              }} 
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={[styles.title, { fontSize: isDesktop ? 28 : 20 }]}>User Profile</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => isEditing ? handleSave() : setIsEditing(true)}
            >
              {isEditing ? (
                <Check size={20} color="#ffffff" />
              ) : (
                <Edit2 size={20} color="#ffffff" />
              )}
              <Text style={styles.editButtonText}>
                {isEditing ? 'Save' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.container}>
            <View style={[styles.content, { flexDirection: isDesktop ? 'row' : 'column' }]}>
              {/* Left Column - Profile Image and Basic Info */}
              <View style={[styles.profileSection, isDesktop && styles.desktopProfileSection]}>
                <View style={styles.imageContainer}>
                  <Image source={{ uri: editedUser.u_pro_img || 'https://via.placeholder.com/200' }} style={styles.profileImage} />
                  {isEditing && (
                    <TouchableOpacity style={styles.uploadButton}>
                      <Upload size={20} color="#ffffff" />
                      <Text style={styles.uploadButtonText}>Update Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.basicInfo}>
                  {/* Non-editable Fields */}
                  <View style={styles.idFields}>
                    <Text style={styles.label}>User ID</Text>
                    <Text style={styles.idValue}>{editedUser.user_id}</Text>
                    
                    <Text style={styles.label}>System ID</Text>
                    <Text style={styles.idValue}>{editedUser.u_id}</Text>
                  </View>

                  {/* Status Badge */}
                  <View style={[
                    styles.statusBadge,
                    editedUser.user_status === 'ACTIVE' ? styles.statusActive : styles.statusInactive
                  ]}>
                    <Text style={[
                      styles.statusText,
                      editedUser.user_status === 'ACTIVE' ? styles.statusTextActive : styles.statusTextInactive
                    ]}>
                      {editedUser.user_status}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Right Column - User Details */}
              <View style={[styles.detailsSection, isDesktop && styles.desktopDetailsSection]}>
                {/* Personal Information */}
                <View style={styles.sectionGroup}>
                  <Text style={styles.sectionTitle}>Personal Information</Text>
                  
                  <View style={styles.detailGroup}>
                    <Text style={styles.label}>First Name</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.input}
                        value={editedUser.u_fname}
                        onChangeText={(text) => setEditedUser({ ...editedUser, u_fname: text })}
                        placeholder="Enter first name"
                      />
                    ) : (
                      <Text style={styles.value}>{editedUser.u_fname}</Text>
                    )}
                  </View>
                  <View style={styles.detailGroup}>
                    <Text style={styles.label}>Middle Name</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.input}
                        value={editedUser.u_mname}
                        onChangeText={(text) => setEditedUser({ ...editedUser, u_mname: text })}
                        placeholder="Enter middle name"
                      />
                    ) : (
                      <Text style={styles.value}>{editedUser.u_mname}</Text>
                    )}
                  </View>
                  <View style={styles.detailGroup}>
                    <Text style={styles.label}>Last Name</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.input}
                        value={editedUser.u_lname}
                        onChangeText={(text) => setEditedUser({ ...editedUser, u_lname: text })}
                        placeholder="Enter last name"
                      />
                    ) : (
                      <Text style={styles.value}>{editedUser.u_lname}</Text>
                    )}
                  </View>
                  <View style={styles.detailGroup}>
                    <Text style={styles.label}>Email</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.input}
                        value={editedUser.u_email}
                        onChangeText={(text) => setEditedUser({ ...editedUser, u_email: text })}
                        keyboardType="email-address"
                        placeholder="Enter email address"
                      />
                    ) : (
                      <Text style={styles.value}>{editedUser.u_email}</Text>
                    )}
                  </View>

                  <View style={styles.detailGroup}>
                    <Text style={styles.label}>Mobile</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.input}
                        value={editedUser.u_mob}
                        onChangeText={(text) => setEditedUser({ ...editedUser, u_mob: text })}
                        keyboardType="phone-pad"
                        placeholder="Enter mobile number"
                      />
                    ) : (
                      <Text style={styles.value}>{editedUser.u_mob}</Text>
                    )}
                  </View>
                </View>

                {/* Organization Details */}
                <View style={styles.sectionGroup}>
                  <Text style={styles.sectionTitle}>Organization Details</Text>
                  
                  <View style={styles.detailGroup}>
                    <Text style={styles.label}>Organization</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.input}
                        value={editedUser.u_organization}
                        onChangeText={(text) => setEditedUser({ ...editedUser, u_organization: text })}
                        placeholder="Enter organization name"
                      />
                    ) : (
                      <Text style={styles.value}>{editedUser.u_organization}</Text>
                    )}
                  </View>

                  <View style={styles.detailGroup}>
                    <Text style={styles.label}>Role</Text>
                    <Text style={styles.value}>{editedUser.role_name}</Text>
                  </View>
                </View>

                {/* Location Information */}
                <View style={styles.sectionGroup}>
                  <Text style={styles.sectionTitle}>Location</Text>
                  
                  <View style={styles.detailGroup}>
                    <Text style={styles.label}>City</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.input}
                        value={editedUser.u_city}
                        onChangeText={(text) => setEditedUser({ ...editedUser, u_city: text })}
                        placeholder="Enter city"
                      />
                    ) : (
                      <Text style={styles.value}>{editedUser.u_city}</Text>
                    )}
                  </View>

                  <View style={styles.detailGroup}>
                    <Text style={styles.label}>State</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.input}
                        value={editedUser.u_state}
                        onChangeText={(text) => setEditedUser({ ...editedUser, u_state: text })}
                        placeholder="Enter state"
                      />
                    ) : (
                      <Text style={styles.value}>{editedUser.u_state}</Text>
                    )}
                  </View>

                  <View style={styles.detailGroup}>
                    <Text style={styles.label}>Country</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.input}
                        value={editedUser.u_country}
                        onChangeText={(text) => setEditedUser({ ...editedUser, u_country: text })}
                        placeholder="Enter country"
                      />
                    ) : (
                      <Text style={styles.value}>{editedUser.u_country}</Text>
                    )}
                  </View>
                </View>

                {/* Documents */}
                <View style={styles.sectionGroup}>
                  <Text style={styles.sectionTitle}>Documents</Text>
                  
                  <View style={styles.detailGroup}>
                    <Text style={styles.label}>CV/Resume</Text>
                    {editedUser.u_cv ? (
                      <View style={styles.documentContainer}>
                        <Text style={styles.documentText} numberOfLines={1}>
                          {editedUser.u_cv.split('/').pop()}
                        </Text>
                        <TouchableOpacity style={styles.viewButton}>
                          <Text style={styles.viewButtonText}>View</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.noDocument}>No document uploaded</Text>
                    )}
                    {isEditing && (
                      <TouchableOpacity style={styles.uploadDocumentButton}>
                        <Upload size={16} color="#6366f1" />
                        <Text style={styles.uploadDocumentText}>
                          {editedUser.u_cv ? 'Update CV' : 'Upload CV'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Created At Information */}
                <View style={styles.sectionGroup}>
                  <Text style={styles.sectionTitle}>Additional Information</Text>
                  <View style={styles.detailGroup}>
                    <Text style={styles.label}>Created At</Text>
                    <Text style={styles.value}>
                      {new Date(editedUser.u_created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };
  const renderAddUserRoleForm = () => {
    return (
      <Modal visible={showAddUserRole} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => {
                setSelectedRole(null);
                resetFormRole();
                setItems([]);
                setOpen(false);
                setShowAddUserRole(false);
              }} 
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.title}>Add New Role</Text>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              {/* First Row */}
              <View style={styles.formRow}>
                <View style={styles.formColumn}>
                  <Text style={styles.label}>Role Id</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    inputMode="numeric"
                    value={String(formRoleData.role_id || lastRoleId)}
                    editable={false}
                    placeholder="Auto-Generated ID"
                  />
                </View>

                <View style={styles.formColumn}>
                  <Text style={styles.label}>Role Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formRoleData.role_name}
                    onChangeText={(text) => setFormRoleData({ ...formRoleData, role_name: text })}
                    placeholder="Enter Role Name"
                  />
                </View>
              </View>

              {/* Second Row */}
              <View style={styles.formRow}>
                <View style={styles.formColumn}>
                  <Text style={styles.label}>Created At</Text>
                  <TextInput
                    style={styles.input}
                    value={formRoleData.created_at}
                    editable={false}
                    placeholder="Created At"
                  />
                </View>

                <View style={styles.formColumn}>
                  <Text style={styles.label}>Parent Role</Text>
                  <DropDownPicker
                    open={open}
                    value={formRoleData.role_parent?.toString()}
                    items={items}
                    setOpen={setOpen}
                    setValue={(callback) => {
                      const newValue = typeof callback === "function" 
                        ? callback(formRoleData.role_parent?.toString()) 
                        : callback;
                      handleRoleChange(newValue);
                    }}
                    placeholder="Select Parent Role"
                    style={[styles.input, { minHeight: 40 }]}
                    dropDownContainerStyle={styles.dropdownList}
                    zIndex={3000}
                  />
                </View>
              </View>

              {/* Buttons Row */}
              <View style={[styles.buttonContainer, { marginTop: open ? 160 : 20 }]}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => {
                    setSelectedRole(null);
                    setItems([]);
                    setOpen(false);
                    resetFormRole();
                    setShowAddUserRole(false);
                  }
                  }
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.submitButton} 
                  onPress={handleSubmitUserRole}
                >
                  <Text style={styles.submitButtonText}>Add User Role</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderAddUserForm = () => {
    const handleProfileImageUpload = async () => {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images', //     'photo' for images, 'video' for videos, 'all' for both
          base64: true,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setFormData((prev) => ({
           ...prev,
            profileImage: result.assets[0].uri || '', // Ensure a string is always assigned
          }));
        }
      } catch (error) {
        console.error('Error picking image:', error);
      }
    };

  
    const handleCVUpload = async () => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/pdf',
        });

        if (result.assets && result.assets.length > 0) {
          setFormData((prev) => ({
            ...prev,
            cv: result.assets[0].uri || '', // Ensures a string is assigned
          }));
        }
      } catch (error) {
        console.error('Error picking document:', error);
      }
    };

  
    return (
      <Modal visible={showAddUser} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => {
              resetForm();
              setShowAddUser(false);  
              }} style={styles.backButton}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.title}>Add New User</Text>
          </View>
  
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile Details</Text>
  
              <TouchableOpacity style={styles.uploadContainer} onPress={handleProfileImageUpload}>
                <View style={styles.uploadCircle}>
                  <Upload size={24} color="#6366f1" />
                </View>
                <Text style={styles.uploadText}>Upload Profile Image</Text>
              </TouchableOpacity>
  
              <View style={styles.inputGroup}>
                <Text style={styles.label}>User ID</Text>
                <TextInput
                  style={styles.input}
                  value={formData.userId}
                  onChangeText={(text) => setFormData({ ...formData, userId: text })}
                  placeholder="Enter user ID"
                />
              </View>
  
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.firstName}
                    onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                    placeholder="Enter first name"
                  />
                </View>
  
                <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 8 }]}>
                  <Text style={styles.label}>Middle Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.middleName}
                    onChangeText={(text) => setFormData({ ...formData, middleName: text })}
                    placeholder="Enter middle name"
                  />
                </View>
  
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.lastName}
                    onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                    placeholder="Enter last name"
                  />
                </View>
              </View>
  
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
  
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.mobile}
                  onChangeText={(text) => setFormData({ ...formData, mobile: text })}
                  placeholder="Enter mobile number"
                  keyboardType="phone-pad"
                />
              </View>
  
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholder="Enter password"
                  secureTextEntry
                />
              </View>
  
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[styles.radioButton, formData.gender === 'male' && styles.radioButtonSelected]}
                    onPress={() => setFormData({ ...formData, gender: 'male' })}
                  >
                    <View style={[styles.radio, formData.gender === 'male' && styles.radioSelected]} />
                    <Text style={styles.radioLabel}>Male</Text>
                  </TouchableOpacity>
  
                  <TouchableOpacity
                    style={[styles.radioButton, formData.gender === 'female' && styles.radioButtonSelected]}
                    onPress={() => setFormData({ ...formData, gender: 'female' })}
                  >
                    <View style={[styles.radio, formData.gender === 'female' && styles.radioSelected]} />
                    <Text style={styles.radioLabel}>Female</Text>
                  </TouchableOpacity>
                </View>
              </View>
  
              <TouchableOpacity style={styles.uploadContainer} onPress={handleCVUpload}>
                <View style={styles.uploadCircle}>
                  <Upload size={24} color="#6366f1" />
                </View>
                <Text style={styles.uploadText}>Upload CV (PDF)</Text>
              </TouchableOpacity>
            </View>
  
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Organization Details</Text>
  
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Organization</Text>
                <TextInput
                  style={styles.input}
                  value={formData.organization}
                  onChangeText={(text) => setFormData({ ...formData, organization: text })}
                  placeholder="Enter organization name"
                />
              </View>
              <Text style={styles.label}>Role</Text>
              <TextInput
                  value={selectedRole || ""}
                  editable={false}  // Makes it read-only
                  style={[styles.input, { minHeight: 40, backgroundColor: "#f0f0f0" }]}
                />
  
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Street Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.streetAddress}
                  onChangeText={(text) => setFormData({ ...formData, streetAddress: text })}
                  placeholder="Enter street address"
                  multiline
                  numberOfLines={3}
                />
              </View>
  
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>State</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.state}
                    onChangeText={(text) => setFormData({ ...formData, state: text })}
                    placeholder="Enter state"
                  />
                </View>
  
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.city}
                    onChangeText={(text) => setFormData({ ...formData, city: text })}
                    placeholder="Enter city"
                  />
                </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Created At</Text>
                <TextInput
                    style={styles.input}
                    value={formData.created_at} // Pre-filled with timestamp
                    editable={false} // Makes the field uneditable
                    placeholder="Created At"
                  />
                </View>
            </View>
  
            <View style={styles.toggleContainer}>
              <Text style={styles.label}>Active</Text>
              <Switch value={formData.active} onValueChange={(value) => setFormData({ ...formData, active: value })} />
            </View>
  
            <View style={styles.toggleContainer}>
              <Text style={styles.label}>Deleted</Text>
              <Switch value={formData.isDeleted} onValueChange={(value) => setFormData({ ...formData, isDeleted: value })} />
            </View>
  
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitUser}>
                <Text style={styles.submitButtonText}>Add User</Text>
              </TouchableOpacity>
              
            </View>
            
            <View style={[styles.buttonContainer]}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => {
                    setSelectedRole(null);
                    setItems([]);
                    setOpen(false);
                    resetForm();
                    setShowAddUser(false);
                  }
                  }
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };
  

  return (
    <SafeAreaView style={styles.container}>
      {selectedRole ? (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSelectedRole(null)} style={styles.backButton}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={[styles.title, { fontSize: isDesktop ? 28 : 20 }]}>{selectedRole}</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddUser}
            >
              <Plus size={20} color="#ffffff" />
              {!isMobile && <Text style={styles.addButtonText}>Add User</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { fontSize: isDesktop ? 16 : 14 }]}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
  
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: isDesktop ? 2 : 1.5 }]}>USER</Text>
            {!isMobile && (
              <>
                <Text style={[styles.headerCell, { flex: isDesktop ? 2 : 1.5 }]}>EMAIL</Text>
                <Text style={[styles.headerCell, { flex: 0.5 }]}>MOBILE</Text>
              </>
            )}
            <Text style={[styles.headerCell, { flex: isDesktop ? 1 : 0.8 }]}>STATUS</Text>
            <Text style={[styles.headerCell, styles.actionsHeader, { flex: isDesktop ? 1 : 0.8 }]}>ACTIONS</Text>
          </View>
          <FlatList
            data={paginatedUsers}
            keyExtractor={(item) => item.u_id.toString()} 
            renderItem={renderUserItem}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.pagination}>
            <Text style={styles.paginationText}>
              Showing {startIndex1 + 1} to {Math.min(startIndex1 + ITEMS_PER_PAGE, users.length)} of{' '}
              {users.length} entries
            </Text>
            <View style={styles.paginationControls}>
              <TouchableOpacity
                style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={20} color={currentPage === 1 ? '#9ca3af' : '#6366f1'} />
              </TouchableOpacity>
              <View style={styles.pageNumbers}>
                <Text style={[styles.pageNumber, styles.currentPage]}>{currentPage}</Text>
                <Text style={styles.pageNumber}>of {totalPages1}</Text>
              </View>
              <TouchableOpacity
                style={[styles.pageButton, currentPage === totalPages1 && styles.pageButtonDisabled]}
                onPress={() => setCurrentPage(p => Math.min(totalPages1, p + 1))}
                disabled={currentPage === totalPages1}
              >
                <ChevronRight size={20} color={currentPage === totalPages1 ? '#9ca3af' : '#6366f1'} />
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={[styles.title, { fontSize: isDesktop ? 28 : 20 }]}>System Users</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddUserRole}
            >
              <Plus size={20} color="#ffffff" />
              {!isMobile && <Text style={styles.addButtonText}>Add User Role</Text>}
            </TouchableOpacity>
          </View>
          

          <View style={styles.searchContainer}>
            <Search size={20} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { fontSize: isDesktop ? 16 : 14 }]}
              placeholder="Search roles..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: isDesktop ? 0.5 : 0.3 }]}>ID</Text>
            <Text style={[styles.headerCell, { flex: isDesktop ? 2 : 1.5 }]}>USER ROLE</Text>
            <Text style={[styles.headerCell, { flex: isDesktop ? 1.1 : 0.8 }]}>TOTAL COUNT</Text>
          </View>

          <FlatList
            data={paginatedRoles}
            keyExtractor={(item) => item.role_id.toString()}
            renderItem={(props) => renderRoleItem(props, isDesktop, setSelectedRole)}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />


          <View style={styles.pagination}>
            <Text style={styles.paginationText}>
              Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredRoles.length)} of{' '}
              {filteredRoles.length} entries
            </Text>
            <View style={styles.paginationControls}>
              <TouchableOpacity
                style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={20} color={currentPage === 1 ? '#9ca3af' : '#6366f1'} />
              </TouchableOpacity>
              <View style={styles.pageNumbers}>
                <Text style={[styles.pageNumber, styles.currentPage]}>{currentPage}</Text>
                <Text style={styles.pageNumber}>of {totalPages}</Text>
              </View>
              <TouchableOpacity
                style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={20} color={currentPage === totalPages ? '#9ca3af' : '#6366f1'} />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.modalTitle}>Delete User</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete this user? This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={confirmDelete}
              >
                <Text style={[styles.modalButtonText, styles.modalDeleteText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {renderUserProfile()}
      {renderAddUserForm()}
      {renderAddUserRoleForm()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f4f4f5',
    borderRadius: 8,
    marginVertical: 8,
  },
  
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  dropdown: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  dropdownContainer: {
    borderColor: '#ccc',
    backgroundColor: '#fff',
    position: 'absolute', // Ensure dropdown is positioned absolutely
    width: '100%', // Match the width of the input
    top: 40, // Position below the input
    zIndex: 1000, // High z-index to appear above other elements
    elevation: 1000, // For Android
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  userRole: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  profileImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  uploadButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  desktopDetailsSection: {
    
  },
  uploadButtonText: {
    color: '#ffffff',
    marginLeft: 8,
    fontWeight: '500',
  },
  idFields: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  idValue: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
    marginBottom: 12,
  },
  sectionGroup: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  documentText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  viewButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 12,
  },
  viewButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  desktopdetailsSection: {
    
  },
  noDocument: {
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  uploadDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  uploadDocumentText: {
    color: '#6366f1',
    fontWeight: '500',
    marginLeft: 8,
  },
  content: {
    padding: 24,
    gap: 24,
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  desktopProfileSection: {
    flex: 1,
    marginRight: 24,
    alignSelf: 'flex-start',
  },
  detailsSection: {
    flex: 2,
  },
  value: {
    fontSize: 16,
    color: '#111827',
    marginTop: 4,
  },
  detailGroup: {
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#ffffff',
    marginLeft: 8,
    fontWeight: '500',
  },
  basicInfo: {
    width: '100%',
  },
  statusBadge: {
    width: 12,  // Increase if needed (e.g., 14 or 16)
    height: 12,
    borderRadius: 6,  // Perfect circle
    marginRight: 8,  // Space around it
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  
  statusActive: {
    backgroundColor: '#10b981', // Green for Active
    borderWidth: 1.5,
    borderColor: '#047857', // Darker Green Border
  },
  
  
  statusInactive: {
    backgroundColor: '#ef4444', // Red for Inactive
    borderWidth: 1.5,
    borderColor: '#991b1b', // Darker Red Border
  },  
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusTextActive: {
    color: '#166534',
  },
  statusTextInactive: {
    color: '#991b1b',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    flex: 1,
    fontWeight: '600',
    fontSize:20,
    color: '#111827',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    margin: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#374151',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  headerCell: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    paddingHorizontal: 8,

  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cell: {
    paddingHorizontal: 8,
    color: '#374151',
  },
  roleCell: {
    flex: 2,
  },
  roleText: {
    color: '#6366f1',
    fontWeight: '500',
  },
  countText: {
    textAlign: 'left',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userId: {
    fontSize: 12,
    color: '#6b7280',
  },
  email: {
    fontSize: 14,
    color: '#374151',
  },
  mobile: {
    fontSize: 14,
    color: '#374151',
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: 120,
    gap: 8,
  },
  actionsHeader: {
    flex: 1,
    textAlign: 'right',
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 16,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: 8,
  },
  pagination: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  paginationText: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 12,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  pageNumber: {
    color: '#374151',
    fontSize: 14,
    marginHorizontal: 4,
  },
  currentPage: {
    color: '#6366f1',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  confirmModal: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f3f4f6',
  },
  modalDeleteButton: {
    backgroundColor: '#ef4444',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  modalDeleteText: {
    color: '#ffffff',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 8,
    marginBottom: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  uploadContainer: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 8,
    marginBottom: 24,
  },
  uploadCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6366f1',
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 14,
    color: '#6b7280',
  },
  inputGroup: {
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#6366f1',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 8,
    padding: 2,
  },
  radioSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f1',
  },
  radioLabel: {
    fontSize: 16,
    color: '#374151',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    zIndex: 1,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 16,
  },
  
  formColumn: {
    flex: 1,
  },
  
  dropdownList: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    position: 'absolute',
    top: 0,
    zIndex: 3000,
  },
});