import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, Text as RNText, StyleSheet } from 'react-native';

// Screen imports
import TagManagementScreen from '../screens/TagManagementScreen';
import PrinterScreen from '../screens/PrinterScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';

// Icons (we'll use simple text for now, can be replaced with proper icon library later)
const TabIcon = ({ label, focused }: { label: string; focused: boolean }) => (
  <RNText style={[
    styles.tabIcon,
    { color: focused ? '#ea338d' : '#999' },
  ]}>
    {label}
  </RNText>
);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main tab navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#2d2d2d',
          borderTopColor: '#404040',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarActiveTintColor: '#ea338d',
        tabBarInactiveTintColor: '#999',
        headerStyle: {
          backgroundColor: '#2d2d2d',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontFamily: 'Orbitron-Regular',
        },
      }}
    >
      <Tab.Screen
        name="Tags"
        component={TagManagementScreen}
        options={{
          title: 'NFC Tags',
          tabBarIcon: ({ focused }) => <TabIcon label="📱" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Printer"
        component={PrinterScreen}
        options={{
          title: 'Printer Control',
          tabBarIcon: ({ focused }) => <TabIcon label="🖨️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon label="⚙️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: 'About',
          tabBarIcon: ({ focused }) => <TabIcon label="ℹ️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

// Root stack navigator for modals and other screens
const AppNavigator = () => {
  return (
    <>
      <StatusBar backgroundColor="#1a1a1a" barStyle="light-content" />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: '#ea338d',
            background: '#1a1a1a',
            card: '#2d2d2d',
            text: '#ffffff',
            border: '#404040',
            notification: '#ea338d',
          },
          fonts: {
            regular: {
              fontFamily: 'System',
              fontWeight: 'normal',
            },
            medium: {
              fontFamily: 'System',
              fontWeight: '500',
            },
            bold: {
              fontFamily: 'System',
              fontWeight: 'bold',
            },
            heavy: {
              fontFamily: 'System',
              fontWeight: '700',
            },
          },
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="MainTabs" component={TabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 20,
  },
});

export default AppNavigator;