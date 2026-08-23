import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { HugeIcon } from '../components/HugeIcon';
import { ArrowLeft01Icon, RocketIcon, ShieldIcon } from '@hugeicons/core-free-icons';

export default function AboutUsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]" edges={['top']}>
      {/* Header */}
      <View className="px-5 py-4 flex-row items-center bg-white border-b border-zinc-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <HugeIcon icon={ArrowLeft01Icon} size={28} color="#1C1C1C" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-[#1C1C1C]">About Us</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        
        <View className="items-center mt-6 mb-8">
          <View className="w-24 h-24 rounded-3xl items-center justify-center shadow-lg mb-4 overflow-hidden border border-zinc-100 bg-white">
            <Image 
              source={require('../../assets/bazarpeth_app_icon_dark_1024x1024.png')} 
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
          <Text className="text-[#1C1C1C] text-2xl font-black">BazarPeth</Text>
          <Text className="text-zinc-500 font-bold tracking-widest mt-1">Version 1.0.0</Text>
        </View>

        <View className="bg-white p-5 rounded-xl shadow-sm border border-zinc-100 mb-6">
          <Text className="text-[#1C1C1C] text-base leading-6">
            BazarPeth is your one-stop solution for hyper-local delivery. We connect you with local street vendors (Feriwalas) and shops to bring you the best quality products right to your doorstep, within minutes!
          </Text>
        </View>

        <View className="flex-row justify-between mb-8">
          <View className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-zinc-100 mr-2 items-center">
            <HugeIcon icon={RocketIcon} size={32} color="#008B45" />
            <Text className="text-[#1C1C1C] font-bold mt-2">Fast Delivery</Text>
          </View>
          <View className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-zinc-100 ml-2 items-center">
            <HugeIcon icon={ShieldIcon} size={32} color="#2196F3" />
            <Text className="text-[#1C1C1C] font-bold mt-2">100% Secure</Text>
          </View>
        </View>

        <Text className="text-center text-zinc-400 font-medium text-xs mb-10">
          Made with ❤️ in India
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}
