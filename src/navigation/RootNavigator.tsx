import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { View, ActivityIndicator } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { setUser, logout } from '../store/slices/authSlice';
import { fetchUserProfile, clearProfile } from '../store/slices/profileSlice';
import { RootState } from '../store';

import TabNavigator from './TabNavigator';
import ProductDetailScreen from '../screens/ProductDetailScreen';
// Live tracking for delivery agent position
import DeliveryTrackingScreen from '../screens/DeliveryTrackingScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ShopDetailScreen from '../screens/ShopDetailScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import AboutUsScreen from '../screens/AboutUsScreen';
import CategoryProductsScreen from '../screens/CategoryProductsScreen';

import SearchScreen from '../screens/SearchScreen';
import WishlistScreen from '../screens/WishlistScreen';
import SavedShopsScreen from '../screens/SavedShopsScreen';
import AddressesScreen from '../screens/AddressesScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';

import { registerForPushNotificationsAsync, setupOrderStatusNotificationListener } from '../services/notificationService';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const dispatch = useDispatch();
  const authLoading = useSelector((state: RootState) => state.auth.isLoading);
  const profileLoading = useSelector((state: RootState) => state.profile.isLoading);
  const profile = useSelector((state: RootState) => state.profile.profile);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};
    let unsubscribeOrders = () => {};
    
    const timer = setTimeout(() => {
      setIsAuthReady(true);
      setIsTimeout(true);
    }, 4000);
    
    try {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        try {
          if (firebaseUser) {
            dispatch(setUser({
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
            }));
            dispatch(fetchUserProfile(firebaseUser.uid) as any);

            // Register push notifications & start real-time order update listener
            registerForPushNotificationsAsync(firebaseUser.uid);
            unsubscribeOrders = setupOrderStatusNotificationListener(firebaseUser.uid);
          } else {
            dispatch(logout());
            dispatch(clearProfile());
          }
        } catch (innerError) {
          console.error('Auth handler error:', innerError);
        } finally {
          setIsAuthReady(true);
        }
      });
    } catch (outerError) {
      console.error('onAuthStateChanged registration failed:', outerError);
      setIsAuthReady(true);
    }

    return () => { 
      unsubscribe(); 
      unsubscribeOrders();
      clearTimeout(timer); 
    };
  }, [dispatch]);

  const showLoader = (!isAuthReady || authLoading || (isAuthenticated && (profileLoading || !profile))) && !isTimeout;

  if (showLoader) {
    return (
      <View style={{ flex: 1, backgroundColor: '#008B45', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
          <Stack.Screen name="Wishlist" component={WishlistScreen} />
          <Stack.Screen name="SavedShops" component={SavedShopsScreen} />
          <Stack.Screen name="Addresses" component={AddressesScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen 
            name="ProductDetail" 
            component={ProductDetailScreen} 
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="DeliveryTracking" component={DeliveryTrackingScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
          <Stack.Screen name="Orders" component={OrdersScreen} />
          <Stack.Screen name="ShopDetail" component={ShopDetailScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          <Stack.Screen name="AboutUs" component={AboutUsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
