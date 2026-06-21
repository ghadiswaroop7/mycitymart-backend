import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HugeIcon } from '../components/HugeIcon';
import { ArrowLeft01Icon, UserIcon, MailIcon, CallIcon, LockIcon } from '@hugeicons/core-free-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  const handleSignup = () => {
    // For demo purposes, we will mock the sign-up
    if (name && phone.length === 10) {
      dispatch(setUser({ uid: 'mock-user-' + Date.now(), displayName: name, phoneNumber: '+91' + phone, email }));
      navigation.navigate('MainTabs');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <HugeIcon icon={ArrowLeft01Icon} size={28} color="#1C1C1C" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">Create Account</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-8" showsVerticalScrollIndicator={false}>
        <View className="mb-8">
          <Text className="text-[#1A1A1A] text-3xl font-extrabold mb-2">Join Jhat-Pat</Text>
          <Text className="text-[#757575] text-[15px]">Shop locally from your trusted stores</Text>
        </View>

        <View className="mb-6">
          <Text className="text-[#1A1A1A] font-bold text-sm mb-2 ml-1">Full Name</Text>
          <View className="flex-row h-14 bg-gray-50 border border-gray-200 rounded-xl px-4 items-center mb-4">
            <HugeIcon icon={UserIcon} size={20} color="#757575" />
            <TextInput
              className="flex-1 ml-3 text-[16px] text-gray-800 font-semibold"
              placeholder="Ramesh Kumar"
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text className="text-[#1A1A1A] font-bold text-sm mb-2 ml-1">Mobile Number</Text>
          <View className="flex-row h-14 bg-gray-50 border border-gray-200 rounded-xl px-4 items-center mb-4">
            <HugeIcon icon={CallIcon} size={20} color="#757575" />
            <Text className="ml-3 font-bold text-gray-800">+91</Text>
            <TextInput
              className="flex-1 ml-2 text-[16px] text-gray-800 font-semibold"
              placeholder="99999 99999"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <Text className="text-[#1A1A1A] font-bold text-sm mb-2 ml-1">Email (Optional)</Text>
          <View className="flex-row h-14 bg-gray-50 border border-gray-200 rounded-xl px-4 items-center mb-4">
            <HugeIcon icon={MailIcon} size={20} color="#757575" />
            <TextInput
              className="flex-1 ml-3 text-[16px] text-gray-800 font-semibold"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text className="text-[#1A1A1A] font-bold text-sm mb-2 ml-1">Password</Text>
          <View className="flex-row h-14 bg-gray-50 border border-gray-200 rounded-xl px-4 items-center mb-6">
            <HugeIcon icon={LockIcon} size={20} color="#757575" />
            <TextInput
              className="flex-1 ml-3 text-[16px] text-gray-800 font-semibold"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            onPress={handleSignup}
            className="w-full h-14 bg-[#008B45] rounded-xl items-center justify-center shadow-sm"
            activeOpacity={0.8}
          >
            <Text className="text-white font-extrabold text-lg">Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View className="items-center mt-2 mb-10">
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text className="text-gray-600 font-medium">Already have an account? <Text className="text-[#008B45] font-bold">Log In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
