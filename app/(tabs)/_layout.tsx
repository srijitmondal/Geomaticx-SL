import React, { ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Users, Leaf, ChartBar as BarChart3, Settings, ChartNoAxesCombined } from 'lucide-react-native';
// import Navbar from '../components/Navbar';
import Navbar from '../navbar';


// Platform-specific icon wrapper to prevent touch responder warnings on web
const IconWrapper = ({ children }: { children: ReactNode }) => {
  if (Platform.OS === 'web') {
    return children;
  }
  
  return (
    <View>
      {children}
    </View>
  );
};

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
    <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          left:0,
          zIndex: 100000,
        }}>
        {/* <Navbar /> */}

      </View>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <IconWrapper>
              <LayoutDashboard size={size} color={color} />
            </IconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => (
            <IconWrapper>
              <Users size={size} color={color} />
            </IconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <IconWrapper>
              <ChartNoAxesCombined size={size} color={color} />
            </IconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="leavedashboard"
        options={{
          title: 'Leaves',
          tabBarIcon: ({ color, size }) => (
            <IconWrapper>
              <Leaf size={size} color={color} />
            </IconWrapper>
          ),
        }}
      />
    </Tabs>
    </View>
  );
}