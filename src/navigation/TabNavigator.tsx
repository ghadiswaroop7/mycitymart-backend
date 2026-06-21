import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HugeIcon } from '../components/HugeIcon';
import { Home02Icon, DashboardSquare02Icon, StoreIcon, ShoppingCart01Icon, UserIcon } from '@hugeicons/core-free-icons';

import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import FeriwalaScreen from '../screens/FeriwalaScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
const Tab = createBottomTabNavigator();

function CartTabIcon({ color, size }: { color: string; size: number }) {
  const count = useSelector((state: RootState) => state.cart.count);

  return (
    <View>
      <HugeIcon icon={ShoppingCart01Icon} color={color} size={size} />
      {count > 0 ? (
        <View
          className="absolute -top-1 -right-2 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-1"
        >
          <Text className="text-white text-[9px] font-extrabold">{count > 99 ? '99+' : count}</Text>
        </View>
      ) : null}
    </View>
  );
}

// Custom prominent center button for Feriwala
const CustomCenterButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={{
      top: -20,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#FF5200',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    }}
    onPress={onPress}
  >
    <View
      style={{
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#FF5200',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
      }}
    >
      {children}
    </View>
  </TouchableOpacity>
);

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF5200',
        tabBarInactiveTintColor: '#A1A1AA',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: -4,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 12,
          paddingTop: 8,
          // Floating shadow
          elevation: 20,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <HugeIcon icon={Home02Icon} color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <HugeIcon icon={DashboardSquare02Icon} color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="LocalShops"
        component={FeriwalaScreen}
        options={{
          // tabBarLabel: 'Local Shops',
          tabBarIcon: ({ size }) => <HugeIcon icon={StoreIcon} color="#FFFFFF" size={size + 4} />,
          tabBarButton: (props) => <CustomCenterButton {...props} />,
          tabBarLabel: () => null, // Hide label to make it purely a floating button
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({ color, size }) => <CartTabIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <HugeIcon icon={UserIcon} color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
