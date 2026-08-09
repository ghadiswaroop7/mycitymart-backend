import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { HugeIcon } from '../components/HugeIcon';
import { SettingsIcon, ChevronRightIcon, ShoppingCart01Icon, FavouriteIcon, StoreIcon, Location01Icon, BikeIcon, CalendarIcon, Notification02Icon, Message01Icon, WalletIcon, GiftIcon, TagIcon, HelpCircleIcon, StarIcon, InformationCircleIcon, Logout02Icon, PackageIcon, ClockIcon } from '@hugeicons/core-free-icons';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { subscribeToSavedShops } from '../services/firestoreService';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.profile.profile);
  const orders = useSelector((state: RootState) => state.order.orders);
  
  const uid = user?.uid || 'dummy-user-id';
  const [savedShopsCount, setSavedShopsCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToSavedShops(uid, (shops) => setSavedShopsCount(shops.length));
    return () => unsubscribe();
  }, [uid]);

  const totalOrders = orders.length;
  const totalSaved = orders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status?.toLowerCase()));
  const hasActiveOrders = activeOrders.length > 0;
  
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animation values
  const HEADER_MAX_HEIGHT = 280;
  const HEADER_MIN_HEIGHT = 56 + (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);
  const SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const avatarOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const avatarScale = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [80, 120],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <StatusBar barStyle="light-content" backgroundColor="#008B45" />

      {/* ─── ANIMATED HEADER ─── */}
      <Animated.View 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#008B45',
          height: headerHeight,
          zIndex: 100,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Top Navigation */}
          <View className="flex-row items-center justify-between px-4 mt-2">
            <TouchableOpacity className="p-2 -ml-2" onPress={() => navigation.goBack()}>
              <Text className="text-white text-2xl font-light">←</Text>
            </TouchableOpacity>
            
            <Animated.Text 
              style={{ opacity: titleOpacity }}
              className="text-white text-lg font-bold tracking-wide"
            >
              My Profile
            </Animated.Text>
            
            <TouchableOpacity className="p-2 -mr-2">
              <HugeIcon icon={SettingsIcon} color="#FFFFFF" size={24} />
            </TouchableOpacity>
          </View>

          {/* Expanded Profile Info */}
          <Animated.View 
            style={{ 
              opacity: avatarOpacity, 
              transform: [{ scale: avatarScale }],
              alignItems: 'center',
              marginTop: 10
            }}
          >
            <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-3 shadow-md border-2 border-white/20">
              <Text className="text-[#008B45] text-3xl font-extrabold">{profile?.displayName ? profile.displayName.substring(0,2).toUpperCase() : (user?.displayName ? user.displayName.substring(0,2).toUpperCase() : 'U')}</Text>
            </View>
            <Text className="text-white text-[20px] font-bold mb-1">{profile?.displayName || user?.displayName || 'Guest User'}</Text>
            <Text className="text-white/80 text-[14px] mb-3">{profile?.phoneNumber || user?.phoneNumber || user?.email || 'Please login'}</Text>
            
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} className="border border-white/40 px-4 py-1.5 rounded-full mb-4">
              <Text className="text-white text-[12px] font-semibold">Edit Profile</Text>
            </TouchableOpacity>

            <View className="flex-row items-center bg-black/20 px-3 py-1.5 rounded-full">
              <HugeIcon icon={Location01Icon} color="#FFFFFF" size={12} />
              <Text className="text-white text-[11px] font-semibold ml-1.5 tracking-wide">{profile?.city || 'Nagpur'}</Text>
            </View>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>

      {/* ─── MAIN CONTENT ─── */}
      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, paddingBottom: 40, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false } // height animation doesn't support native driver easily without transform
        )}
        scrollEventThrottle={16}
      >
        
        {/* ─── STATS ROW ─── */}
        <View className="bg-white rounded-xl shadow-sm flex-row py-4 mb-5 border border-gray-100">
          <View className="flex-1 items-center border-r border-gray-100">
            <Text className="text-[#1A1A1A] text-xl font-extrabold mb-0.5">{totalOrders}</Text>
            <Text className="text-[#757575] text-[11px] font-medium uppercase tracking-wide">Orders</Text>
          </View>
          <View className="flex-1 items-center border-r border-gray-100">
            <Text className="text-[#1A1A1A] text-xl font-extrabold mb-0.5">{savedShopsCount}</Text>
            <Text className="text-[#757575] text-[11px] font-medium uppercase tracking-wide">Saved Shops</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-[#2E7D32] text-xl font-extrabold mb-0.5">₹{totalSaved}</Text>
            <Text className="text-[#757575] text-[11px] font-medium uppercase tracking-wide">Saved</Text>
          </View>
        </View>

        {/* ─── MY ACTIVITY ─── */}
        <Text className="text-[12px] text-[#757575] font-bold uppercase tracking-wider mb-2 ml-1">My Activity</Text>
        <View className="bg-white rounded-xl shadow-sm border border-gray-100 mb-5 overflow-hidden">
          <MenuItem icon={<HugeIcon icon={ShoppingCart01Icon} size={20} color="#FF6B35" />} label="My Orders" badge="2" onPress={() => navigation.navigate('Orders')} />
          <Divider />
          <MenuItem icon={<HugeIcon icon={FavouriteIcon} size={20} color="#E91E63" />} label="Wishlist" onPress={() => navigation.navigate('Wishlist')} />
          <Divider />
          <MenuItem icon={<HugeIcon icon={StoreIcon} size={20} color="#2196F3" />} label="Saved Local Shops" onPress={() => navigation.navigate('SavedShops')} />
          <Divider />
          <MenuItem icon={<HugeIcon icon={Location01Icon} size={20} color="#4CAF50" />} label="My Addresses" onPress={() => navigation.navigate('Addresses')} />
        </View>

        {/* ─── LIVE DELIVERY & HYPERLOCAL FEATURES ─── */}
        {hasActiveOrders && (
          <>
            <Text className="text-[12px] text-[#757575] font-bold uppercase tracking-wider mb-2 ml-1">Live Delivery</Text>
            <TouchableOpacity 
              activeOpacity={0.9} 
              className="rounded-xl shadow-sm mb-4 overflow-hidden"
              onPress={() => navigation.navigate('DeliveryTracking')}
            >
              <LinearGradient
                colors={['#FF6B35', '#008B45']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-4 flex-row justify-between items-center"
              >
                <View className="flex-1 pr-4">
                  <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mb-3">
                    <HugeIcon icon={BikeIcon} size={22} color="#FFFFFF" />
                  </View>
                  <Text className="text-white text-[16px] font-bold mb-1">Live Delivery Tracking</Text>
                  <Text className="text-white/80 text-[12px] mb-3 leading-snug">Track your order in real-time</Text>
                  
                  <View className="flex-row items-center bg-black/20 self-start px-2 py-1 rounded-full">
                    <View className="w-2 h-2 rounded-full bg-green-400 mr-1.5" />
                    <Text className="text-white text-[10px] font-bold">{activeOrders.length} Active {activeOrders.length > 1 ? 'Deliveries' : 'Delivery'}</Text>
                  </View>
                </View>
                
                <View className="w-24 h-20 bg-black/10 border border-white/20 rounded-xl items-center justify-center relative overflow-hidden">
                  <View className="absolute w-32 h-32 bg-white/5 rounded-full" />
                  <HugeIcon icon={Location01Icon} size={24} color="#FFFFFF" />
                  <View className="absolute bottom-2 bg-[#008B45] px-2 py-0.5 rounded-full shadow-sm">
                    <Text className="text-white text-[8px] font-extrabold uppercase">Live</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* Delivery Sub-items */}
        <View className="bg-white rounded-xl shadow-sm border border-gray-100 mb-5 overflow-hidden">
          <MenuItem icon={<HugeIcon icon={PackageIcon} size={20} color="#795548" />} label="Delivery History" comingSoon={true} />
          
          {/* HIDDEN AS PER PROMPT A
          <Divider />
          <MenuItem icon={<HugeIcon icon={ClockIcon} size={20} color="#607D8B" />} label="Estimated Delivery Times" />
          <Divider />
          <MenuItem icon={<HugeIcon icon={CalendarIcon} size={20} color="#4CAF50" />} label="Schedule Delivery" highlight />
          <Divider />
          <MenuItem icon={<HugeIcon icon={Notification02Icon} size={20} color="#F44336" />} label="Shop Opening Alerts" />
          */}

          <Divider />
          <MenuItem icon={<HugeIcon icon={Message01Icon} size={20} color="#2196F3" />} label="Chat with Shopkeeper" comingSoon={true} />
        </View>

        {/* ─── OFFERS & WALLET ─── 
        <Text className="text-[12px] text-[#757575] font-bold uppercase tracking-wider mb-2 ml-1">Offers & Wallet</Text>
        <View className="bg-white rounded-xl shadow-sm border border-gray-100 mb-5 overflow-hidden">
          <MenuItem icon={<HugeIcon icon={WalletIcon} size={20} color="#9C27B0" />} label="BazarPeth Wallet" subLabel="Balance: ₹150" />
          <Divider />
          <MenuItem icon={<HugeIcon icon={GiftIcon} size={20} color="#FF5252" />} label="Referral & Rewards" />
          <Divider />
          <MenuItem icon={<HugeIcon icon={TagIcon} size={20} color="#FF9800" />} label="My Coupons" />
        </View>
        */}

        {/* ─── SUPPORT ─── */}
        <Text className="text-[12px] text-[#757575] font-bold uppercase tracking-wider mb-2 ml-1">Support</Text>
        <View className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <MenuItem icon={<HugeIcon icon={HelpCircleIcon} size={20} color="#607D8B" />} label="Help & Support" onPress={() => navigation.navigate('HelpSupport')} />
          <Divider />
          <MenuItem icon={<HugeIcon icon={StarIcon} size={20} color="#FFC107" />} label="Rate the App" />
          <Divider />
          <MenuItem icon={<HugeIcon icon={InformationCircleIcon} size={20} color="#9E9E9E" />} label="About Us" onPress={() => navigation.navigate('AboutUs')} />
        </View>

        {/* ─── LOGOUT BUTTON ─── */}
        <TouchableOpacity 
          onPress={async () => {
            try {
              await signOut(auth);
            } catch (e) {
              console.error('Logout error:', e);
            }
            dispatch(logout());
          }}
          className="border border-[#008B45] bg-green-50 rounded-xl h-[52px] flex-row items-center justify-center mb-6"
        >
          <HugeIcon icon={Logout02Icon} size={20} color="#008B45" />
          <Text className="text-[#008B45] font-bold text-[15px] ml-2">Logout</Text>
        </TouchableOpacity>
        
        <Text className="text-center text-[#757575] text-[10px] font-medium mb-4">
          App Version 1.0.4 (Build 42)
        </Text>
      </Animated.ScrollView>
    </View>
  );
}

// ─── REUSABLE COMPONENTS ───

const Divider = () => <View className="h-[1px] bg-gray-100 ml-[52px]" />;

const MenuItem = ({ icon, label, subLabel, badge, highlight, onPress, disabled, comingSoon }: any) => (
  <TouchableOpacity onPress={disabled || comingSoon ? undefined : onPress} activeOpacity={disabled || comingSoon ? 1 : 0.2} className="flex-row items-center justify-between px-4 h-[56px] bg-white active:bg-gray-50">
    <View className="flex-row items-center">
      <View className="w-[28px] items-center justify-center mr-3">
        {icon}
      </View>
      <View>
        <Text className={`font-semibold text-[15px] ${disabled || comingSoon ? 'text-gray-400' : 'text-[#1A1A1A]'}`}>{label}</Text>
        {subLabel ? (
          <Text className="text-[#2E7D32] text-[11px] font-bold mt-0.5">{subLabel}</Text>
        ) : null}
      </View>
    </View>
    <View className="flex-row items-center">
      {comingSoon ? (
        <View className="bg-zinc-200 px-2 py-[3px] rounded-full mr-2">
          <Text className="text-zinc-600 text-[10px] font-bold">Coming Soon</Text>
        </View>
      ) : null}
      {highlight ? (
        <View className="bg-red-100 px-1.5 py-0.5 rounded mr-2">
          <Text className="text-[#008B45] text-[8px] font-extrabold uppercase tracking-widest">New</Text>
        </View>
      ) : null}
      {badge ? (
        <View className="bg-[#008B45] w-5 h-5 rounded-full items-center justify-center mr-2">
          <Text className="text-white text-[10px] font-extrabold">{badge}</Text>
        </View>
      ) : null}
      <HugeIcon icon={ChevronRightIcon} size={20} color={disabled || comingSoon ? "#E5E7EB" : "#B0B0B0"} />
    </View>
  </TouchableOpacity>
);
