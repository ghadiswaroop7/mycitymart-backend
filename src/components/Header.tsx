import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { HugeIcon } from './HugeIcon';
import { ShoppingCart01Icon, Location01Icon, ChevronDownIcon, Search02Icon, UserIcon } from '@hugeicons/core-free-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export default function Header() {
  const [isFocused, setIsFocused] = useState(false);
  const totalItems = useSelector((state: RootState) => state.cart.count);

  return (
    <View className="bg-white px-4 pt-4 pb-4 shadow-card" style={{ elevation: 3 }}>
      {/* Top Row: Logo & Actions */}
      <View className="flex-row justify-between items-center mb-3">
        {/* MyCityMart Logo */}
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-xl bg-[#FF5200] items-center justify-center mr-2">
            <Text className="text-white text-base font-extrabold" style={{ fontWeight: '900' }}>M</Text>
          </View>
          <Text className="text-lg text-[#1C1C1C]" style={{ fontWeight: '900', fontSize: 18 }}>MyCityMart</Text>
        </View>

        {/* Right Actions */}
        <View className="flex-row items-center gap-3 relative">
          {/* Gradient User Avatar Profile Frame */}
          <TouchableOpacity className="p-0.5 rounded-full overflow-hidden">
            {/* expo-linear-gradient allows native gradient rendering */}
            <LinearGradient
              colors={['#FF5200', '#FF9A3C']}
              style={{ padding: 2, borderRadius: 9999 }}
            >
              <View className="bg-white p-1 rounded-full">
                <HugeIcon icon={UserIcon} size={18} color="#1C1C1C" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Absolute Dark Cart Pill Capsule */}
          <TouchableOpacity className="bg-zinc-950 flex-row items-center rounded-full px-3 py-2">
            <HugeIcon icon={ShoppingCart01Icon} size={18} color="#FFFFFF" />
            {totalItems > 0 ? (
              <View className="bg-red-500 rounded-full px-1.5 ml-2 min-w-[20px] items-center justify-center">
                <Text className="text-white text-[10px] font-extrabold">{totalItems}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Selector Row */}
      <TouchableOpacity className="flex-row items-center mb-3 self-start bg-[#FFF3EE] px-3 py-1.5 rounded-full">
        <HugeIcon icon={Location01Icon} size={14} color="#FF5200" />
        <Text className="text-[#1C1C1C] font-semibold ml-1.5 mr-1.5 text-xs">Swaroop Nagar, Thane</Text>
        <HugeIcon icon={ChevronDownIcon} size={14} color="#1C1C1C" />
      </TouchableOpacity>

      {/* Search Bar */}
      <View
        className={`flex-row items-center rounded-xl px-4 h-12 border ${
          isFocused ? 'border-[#FF5200] bg-white' : 'border-zinc-200 bg-zinc-50'
        }`}
      >
        <HugeIcon icon={Search02Icon} size={18} color={isFocused ? '#FF5200' : '#A1A1AA'} />
        <TextInput
          className="flex-1 ml-2.5 text-sm text-[#1C1C1C] h-full"
          placeholder="Search for groceries, fashion & more..."
          placeholderTextColor="#A1A1AA"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
    </View>
  );
}
