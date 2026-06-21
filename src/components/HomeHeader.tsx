import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { HugeIcon } from './HugeIcon';
import { Home02Icon, ChevronDownIcon, Search02Icon, Camera02Icon, QrCodeIcon } from '@hugeicons/core-free-icons';

export default function HomeHeader() {
  return (
    <View className="pt-2 pb-1 z-50">
      {/* Tier 1: Top Brand Hub */}
      <View className="flex-row justify-between items-center mb-5">
        <TouchableOpacity className="bg-yellow-400 rounded-2xl px-4 py-1.5 border-2 border-yellow-500 shadow-sm">
          <Text className="text-[#1C1C1C] font-extrabold text-xs">Jhat-Pat</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-white rounded-2xl px-4 py-1.5 shadow-sm">
          <Text className="text-[#1C1C1C] font-bold text-xs">Minutes</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-white rounded-2xl px-4 py-1.5 shadow-sm">
          <Text className="text-[#1C1C1C] font-bold text-xs">Grocery</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-white rounded-2xl px-4 py-1.5 shadow-sm">
          <Text className="text-[#1C1C1C] font-bold text-xs">Wholesale</Text>
        </TouchableOpacity>
      </View>

      {/* Tier 2: Location & Rewards Row */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center flex-1">
          <View className="bg-white/20 p-1.5 rounded-full mr-2">
            <HugeIcon icon={Home02Icon} size={16} color="#FFFFFF" />
          </View>
          <TouchableOpacity className="flex-row items-center">
            <Text className="text-white font-bold text-sm mr-1">Swaroop Nagar</Text>
            <HugeIcon icon={ChevronDownIcon} size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View className="bg-black/40 rounded-full px-3 py-1 flex-row items-center border border-white/10">
          <Text className="text-yellow-400 mr-1 text-xs">⚡</Text>
          <Text className="text-white font-bold text-xs">0</Text>
        </View>
      </View>

      {/* Tier 3: Unified Search & Smart Bar Scanner */}
      <View className="flex-row items-center mb-4 gap-3">
        <View className="flex-1 bg-white rounded-xl flex-row items-center px-4 h-12 shadow-sm">
          <HugeIcon icon={Search02Icon} size={18} color="#A1A1AA" />
          <TextInput
            className="flex-1 ml-2.5 text-sm text-[#1C1C1C] h-full"
            placeholder='Search "milk"'
            placeholderTextColor="#A1A1AA"
          />
          <TouchableOpacity className="border-l border-zinc-200 pl-3 py-1">
             <HugeIcon icon={Camera02Icon} size={18} color="#1C1C1C" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="bg-[#006633]/40 rounded-xl w-12 h-12 items-center justify-center border border-[#006633]">
          <HugeIcon icon={QrCodeIcon} size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

    </View>
  );
}
